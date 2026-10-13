import { useGameManager } from '../hooks/useGameManager';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ResourceBar } from '../components/ResourceBar';
import { LogPanel } from '../components/LogPanel';
import { ActionButton } from '../components/ActionButton';
import { Modal } from '../components/Modal';
import {
  BuildingId, BuildingState, PositionSlot, EquipmentSlot, EquipmentRecipe, Mercenary, MercenaryGrade, EquipmentItem, EnchantOption, GameResources, Skill, SkillBookItem, CampBanterResult, TavernCandidate, Quest, ExpeditionReturnReport
} from '../types/game';
import { CHARACTER_CLASSES, getClassEmoji } from '../data/classes';
import { CustomAssetService } from '../services/CustomAssetService';
import { ALL_SKILL_BOOKS, ALL_SKILLS_MAP, getSkillBookRarity, GRIMOIRE_RARITY_META, getMasteryGainPerBook, getSkillAffinityMeta, checkSkillAffinityMatch, SKILL_AFFINITY_META, findMonsterOriginForBook } from '../data/skillBooks';
import { 
  EQUIPMENT_RECIPES, 
  PREFIX_ENCHANT_OPTIONS, 
  SUFFIX_ENCHANT_OPTIONS,
  getEnchantSuccessRate,
  getEnchantStoneCost,
  getEnchantResourceCosts,
  getEnchantCandidates,
  recalculateEquipmentStats,
  getWeaponTrait,
  WEAPON_TRAITS,
  getEquipmentTemplateId,
  getForgeRarityRates,
  rollForgeItemRarity,
  getEquipmentTier,
  detectWeaponType
} from '../data/equipment';
import { SoundManager } from '../managers/SoundManager';
import { HERO_TRAITS, GameManager } from '../managers/GameManager';
import { SynergyGuideModal } from '../components/SynergyGuideModal';
import { getRarityBorderStyle } from '../utils/rarity';
import { PartySynergyPanel } from '../components/PartySynergyPanel';
import { EpicQuestDialogueModal } from '../components/EpicQuestDialogueModal';
import { IntroStoryModal } from '../components/IntroStoryModal';
import { CemeteryDrawer } from '../components/CemeteryDrawer';
import { CodexModal } from '../components/CodexModal';
import { GrimoireEnhanceModal } from '../components/GrimoireEnhanceModal';
import { getSkillTags, getTriggerableCombos, getTagMeta, SkillTag, ComboRule } from '../utils/skillComboUtils';
import { GrimoireRecipe, GRIMOIRE_CRAFT_RECIPES, GRIMOIRE_CRAFT_SUCCESS_RATES, GRIMOIRE_RARITY_REQ_ALCHEMIST_LV } from '../data/classSkillRecipes';
import { useCustomAssetVersion } from '../hooks/useCustomAssetVersion';
import { GoogleAdService } from '../services/GoogleAdService';
import { GameIcon } from '../components/GameIcon';
import { CraftProgressModal } from '../components/CraftProgressModal';
import { useI18n } from '../hooks/useI18n';
import { I18nService } from '../i18n/I18nService';
import { getLocalizedBuildingName, getLocalizedClassName, getLocalizedResourceName } from '../i18n/dataLocales';
import { EncyclopediaBadge } from '../components/EncyclopediaBadge';
import { triggerHaptic } from '../utils/haptics';
import { calculatePartySynergies } from '../data/synergies';

// ─────────────────────────────────────────────────────────────
//  휠 내비게이션 & 시설 매핑
// ─────────────────────────────────────────────────────────────

const DRAWER_TO_BUILDING_ID: Record<string, BuildingId> = {
  tavern: 'tavern',
  forge: 'blacksmith',
  storage: 'storage',
  infirmary: 'infirmary',
  market: 'market',
  alchemy: 'alchemy',
  arena: 'arenaGate',
};

const BUILDING_TO_DRAWER_KEY: Partial<Record<BuildingId, string>> = {
  tavern: 'tavern',
  blacksmith: 'forge',
  storage: 'storage',
  infirmary: 'infirmary',
  market: 'market',
  alchemy: 'alchemy',
  arenaGate: 'arena',
};

const DRAWER_ART_META: Record<string, { img: string; title: string; subtitle: string; icon: string }> = {
  citadel:   { img: 'assets/citadel_bonfire.jpg', title: '방주 성채 (Ark Citadel)', subtitle: '심연의 어둠 속 최후의 부유 요새 & 영지 시설 관리', icon: '🏰' },
  barracks:  { img: 'assets/menu_barracks.jpg',    title: '원정단 병영 & 전략 작전실', subtitle: '대원 진형 편성, 전직 각성 및 마도 비전서 스킬 전수', icon: '⚔️' },
  quests:    { img: 'assets/menu_quests.jpg',      title: '지휘관 퀘스트 & 작전 지도', subtitle: '메인 스토리 임무 완수 및 단계별 시설 연계', icon: '📜' },
  explore:   { img: 'assets/menu_explore.jpg',     title: '심연 강하 차원 관문', subtitle: '침묵의 회랑 5층 탐험 채비 및 전술 보급품 편성', icon: '🌌' },
  tavern:    { img: 'assets/menu_tavern.jpg',      title: '방랑자의 라운지 (Wanderer\'s Lounge)', subtitle: '실력파 용병 모집 및 방랑 모험가 계약 영입', icon: '🍸' },
  forge:     { img: 'assets/menu_forge.jpg',       title: '심연의 병기창 (Abyssal Armory)', subtitle: '에테르 룬 장비 단조, 강화 및 접두/접미 인챈트', icon: '⚒️' },
  alchemy:   { img: 'assets/citadel_bonfire.jpg',  title: '에테르 연금 공방 (Aether Alchemy Workshop)', subtitle: '마도서 제작 및 최고 10레벨 비전 마도 강화', icon: '🧪' },
  storage:   { img: 'assets/menu_storage.jpg',     title: '방주 중앙 병참고 (Ark Central Logistics)', subtitle: '16종 군수 물자 적재 용량 관리 및 증축 (유지비 면제)', icon: '📦' },
  infirmary: { img: 'assets/menu_infirmary.jpg',   title: '생체 복원 병동 (Bio-Restoration Ward)', subtitle: '전투 부상자 치료, 출혈 정화 및 빠른 생체 회복', icon: '💉' },
  market:    { img: 'assets/menu_market.jpg',      title: '황혼의 블랙 마켓 (Twilight Black Market)', subtitle: '17종 군수 물자 및 암시장 자원 거래', icon: '🕶️' },
};

const WHEEL_ITEMS = [
  { key: 'citadel',  label: '방주 영지',     sub: '건설 & 자원 관리',         icon: '🏰', color: '#ff7b25' },
  { key: 'barracks', label: '원정단 편성',   sub: '진형 & 전직 & 장비 관리',  icon: '⚔️', color: '#00d2ff' },
  { key: 'quests',   label: '퀘스트 & 연계', sub: '메인 스토리 & 시설',       icon: '📜', color: '#38ef7d' },
  { key: 'explore',  label: '심연 탐험',     sub: 'MUD 던전 5층',             icon: '🌌', color: '#5c6bc0' },
  { key: 'arena',    label: '차원 게이트',   sub: '차원 아레나 & 네메시스',   icon: '🏆', color: '#ff416c' },
];

const RES_NAMES_AND_ICONS: Record<string, { label: string; icon: string }> = {
  wood: { label: '목재', icon: '🪵' },
  stone: { label: '석재', icon: '🪨' },
  iron: { label: '철광석', icon: '⚙️' },
  gold: { label: '골드', icon: '🪙' },
  food: { label: '식량', icon: '🍖' },
  ether: { label: '에테르', icon: '✨' },
  herb: { label: '약초', icon: '🌿' },
  bone: { label: '짐승 뼈', icon: '🦴' },
  void_shard: { label: '공허파편', icon: '🌌' },
  dark_essence: { label: '암흑정수', icon: '🌑' },
  leather: { label: '가죽', icon: '🥋' },
  coal: { label: '석탄', icon: '⬛' },
  silk: { label: '실크', icon: '🧵' },
  crystal: { label: '마력수정', icon: '💎' },
  prefix_stone: { label: '접두석', icon: '⭐' },
  suffix_stone: { label: '접미석', icon: '🔮' },
  pure_prefix_stone: { label: '순수접두석', icon: '🌟' },
  pure_suffix_stone: { label: '순수접미석', icon: '🪐' },
};

function renderCostBadges(cost: Partial<GameResources> | Record<string, number>, resState: GameResources, isMax: boolean) {
  if (isMax) return <span className="text-[#ffd54f] font-mono text-xs font-bold">★ 최고 레벨 도달</span>;
  const entries = Object.entries(cost).filter(([, amt]) => (amt || 0) > 0);
  if (entries.length === 0) return <span className="text-[#38ef7d] font-mono text-xs font-bold">무료</span>;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {entries.map(([res, reqAmt]) => {
        const curAmt = (resState as unknown as Record<string, number>)[res] || 0;
        const isEnough = curAmt >= (reqAmt as number);
        const gmMeta = GameManager.getResourceMeta(res);
        const meta = RES_NAMES_AND_ICONS[res] || (gmMeta?.name ? { label: gmMeta.name, icon: gmMeta.icon } : { label: res, icon: '📦' });
        return (
          <span
            key={res}
            className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 border transition-all ${
              isEnough
                ? 'text-[#38ef7d] bg-[#38ef7d15] border-[#38ef7d33]' : 'text-[#ef5350] bg-[#ef535018] border-[#ef535055] animate-pulse'
            }`}
          >
            <GameIcon name={res} icon={meta.icon} size={15} />
            <span>{meta.label}</span>
            <span>{curAmt}/{reqAmt}</span>
          </span>
        );
      })}
    </div>
  );
}

function formatCost(costObj: Record<string, number>): string {
  const names: Record<string, string> = {
    wood: '목재', stone: '석재', iron: '철광', gold: '골드', ether: '에테르',
    herb: '약초', bone: '짐승 뼈', void_shard: '공허파편', leather: '가죽', coal: '석탄',
  };
  return Object.entries(costObj)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${names[k] || k} ${v}`)
    .join(', ');
}

// ─────────────────────────────────────────────────────────────
//  장비 선택 오버레이
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  장비 스탯 & 인챈트 상세 헬퍼
// ─────────────────────────────────────────────────────────────
const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'rare': return '#42a5f5';
    case 'unique': return '#ab47bc';
    case 'epic': return '#ce93d8';
    case 'legendary':
    case 'legend': return '#ffd54f';
    default: return '#90a4ae';
  }
};

const getRarityLabel = (rarity?: string, lang?: 'ko' | 'en' | 'ja') => {
  const currentLang = lang || I18nService.getInstance().getLanguage();
  if (currentLang === 'en') {
    switch (rarity) {
      case 'rare': return 'Rare';
      case 'unique': return 'Unique';
      case 'epic': return 'Epic';
      case 'legendary':
      case 'legend': return 'Legend';
      default: return 'Common';
    }
  } else if (currentLang === 'ja') {
    switch (rarity) {
      case 'rare': return '希少';
      case 'unique': return '固有';
      case 'epic': return '英雄';
      case 'legendary':
      case 'legend': return '伝説';
      default: return '一般';
    }
  }
  switch (rarity) {
    case 'rare': return '희귀';
    case 'unique': return '고유';
    case 'epic': return '영웅';
    case 'legendary':
    case 'legend': return '전설';
    default: return '일반';
  }
};

const formatEnchantStatList = (stats?: EnchantOption['stats']) => {
  if (!stats) return [];
  const list: { label: string; value: string; color?: string }[] = [];
  if (stats.atk) list.push({ label: '⚔️공격력', value: `+${stats.atk}`, color: '#ff8a65' });
  if (stats.def) list.push({ label: '🛡️방어력', value: `+${stats.def}`, color: '#4fc3f7' });
  if (stats.hp) list.push({ label: '❤️HP', value: `+${stats.hp}`, color: '#81c784' });
  if (stats.mp) list.push({ label: '💧MP', value: `+${stats.mp}`, color: '#64b5f6' });
  if (stats.spd) list.push({ label: '⚡속도', value: `+${stats.spd}`, color: '#ffd54f' });
  if (stats.luck) list.push({ label: '🍀행운', value: `+${stats.luck}`, color: '#a7ffeb' });
  if (stats.crit) list.push({ label: '💥치명타', value: `+${stats.crit}%`, color: '#ffb74d' });
  if (stats.damageBonus) list.push({ label: '⚔️피해증폭', value: `+${stats.damageBonus}%`, color: '#ff5252' });
  if (stats.defPenetration) list.push({ label: '🗡️방어관통', value: `+${stats.defPenetration}%`, color: '#e040fb' });
  if (stats.drainPercent) list.push({ label: '🩸흡혈', value: `+${stats.drainPercent}%`, color: '#ff4081' });
  return list;
};

const renderTotalStats = (stats: EquipmentItem['stats']) => {
  const list: { label: string; value: string; color: string }[] = [];
  if (stats.atk) list.push({ label: '⚔️ ATK', value: `+${stats.atk}`, color: '#ff8a65' });
  if (stats.def) list.push({ label: '🛡️ DEF', value: `+${stats.def}`, color: '#4fc3f7' });
  if (stats.hp) list.push({ label: '❤️ HP', value: `+${stats.hp}`, color: '#81c784' });
  if (stats.mp) list.push({ label: '💧 MP', value: `+${stats.mp}`, color: '#64b5f6' });
  if (stats.spd) list.push({ label: '⚡ SPD', value: `+${stats.spd}`, color: '#ffd54f' });
  if (stats.luck) list.push({ label: '🍀 LUK', value: `+${stats.luck}`, color: '#a7ffeb' });
  if (stats.crit) list.push({ label: '💥 CRIT', value: `+${stats.crit}%`, color: '#ffb74d' });

  if (list.length === 0) return <div className="text-xs text-[#8b9bb4]">스탯 없음</div>;

  return (
    <div className="flex flex-wrap gap-1.5 my-1">
      {list.map((item, idx) => (
        <span key={idx} className="text-xs px-2 py-0.5 rounded bg-[#101726] border border-[#1f2b40] font-mono font-bold" style={{ color: item.color }}>
          {item.label} {item.value}
        </span>
      ))}
    </div>
  );
};

const renderEnchantBadge = (enchant: EnchantOption, slot?: EquipmentSlot) => {
  const isPrefix = enchant.type === 'prefix';
  const rarityCol = getRarityColor(enchant.rarity);
  const rarityLbl = getRarityLabel(enchant.rarity);
  const statItems = formatEnchantStatList(enchant.stats);
  const showSkill = enchant.grantedSkill && isPrefix && (!slot || slot === 'weapon');
  const cleanDesc = (slot && slot !== 'weapon' && isPrefix && enchant.description)
    ? enchant.description
        .replace(', 고유스킬 [작열탄] 부여 (기본 공격 대체)', '')
        .replace(', 고유스킬 [동결 타격] 부여 (기본 공격 대체)', '')
        .replace(', 고유스킬 [신성 심판] 부여 (기본 공격 대체)', '')
        .replace(', 고유스킬 [파멸 강타] 부여 (기본 공격 대체)', '')
    : enchant.description;

  return (
    <div className="mt-1.5 p-2 rounded-lg bg-[#0b0f19] border border-[#222f46] text-xs flex flex-col gap-1">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={{ backgroundColor: `${rarityCol}22`, color: rarityCol, border: `1px solid ${rarityCol}44` }}
          >
            {isPrefix ? '✨ [접두]' : '🔮 [접미]'} {enchant.name}
          </span>
          <span className="text-[9px] text-[#8b9bb4]">[{rarityLbl}]</span>
        </div>
        {cleanDesc && (
          <span className="text-[10px] text-[#90a4ae] italic">{cleanDesc}</span>
        )}
      </div>

      {statItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {statItems.map((st, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#162032] border border-[#263750] font-mono font-semibold"
              style={{ color: st.color || '#00e5ff' }}
            >
              {st.label} <span className="font-bold">{st.value}</span>
            </span>
          ))}
        </div>
      )}

      {showSkill && enchant.grantedSkill && (
        <div className="mt-1 p-1.5 rounded bg-[#1f1929] border border-[#ab47bc44] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GameIcon name={enchant.grantedSkill.id} icon={enchant.grantedSkill.icon || '🌟'} size={16} />
            <span className="text-[10px] font-bold text-[#ce93d8]">부여 스킬: {enchant.grantedSkill.name}</span>
            <span className="text-[9px] text-[#8b9bb4]">({enchant.grantedSkill.description})</span>
          </div>
          <span className="text-[9px] text-[#64b5f6] font-mono">{enchant.grantedSkill.manaCost} MP</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ⚡ 장비 강화 상세 비교 모달 (EquipmentEnhanceModal)
// ─────────────────────────────────────────────────────────────
function calculateSimulatedStats(item: EquipmentItem, targetLevel: number, gm: GameManager): Record<string, number> {
  return recalculateEquipmentStats(item, targetLevel, gm.getForgeRecipes());
}

interface EquipmentEnhanceModalProps {
  item: EquipmentItem;
  onClose: () => void;
  gm: GameManager;
  resources: GameResources;
  discountPct: number;
  mult: number;
}

const EquipmentEnhanceModal: React.FC<EquipmentEnhanceModalProps> = ({
  item,
  onClose,
  gm,
  resources,
  discountPct,
  mult,
}) => {
    const isMax = item.level >= 10;
  const forgeLv = gm.buildings['blacksmith']?.level || 0;
  const maxAllowed = GameManager.getForgeMaxEnhanceLevel(forgeLv);
  const isBuildingLvTooLow = !isMax && item.level >= maxAllowed;
  const cost = GameManager.getEquipmentEnhanceCost(item, mult);
  const canEnhance = !isMax && !isBuildingLvTooLow && Object.entries(cost).every(
    ([resKey, reqAmt]) => ((resources as unknown as Record<string, number>)[resKey] || 0) >= (reqAmt as number)
  );
  const rateInfo = GameManager.getEnhanceRateInfo(item.level);
  const wearer = item.equippedHeroId ? (gm.barracks || []).find(h => h.id === item.equippedHeroId) : null;

  const locItem = item;
  const itemName = locItem?.name || item.name;

  const currentStats: Record<string, number | undefined> = useMemo(() => {
    return recalculateEquipmentStats(item, item.level, gm.getForgeRecipes());
  }, [item, gm]);

  const nextStats: Record<string, number | undefined> = useMemo(() => {
    if (isMax) return currentStats;
    return calculateSimulatedStats(item, item.level + 1, gm);
  }, [item, isMax, currentStats, gm]);

  const statKeys = ['atk', 'def', 'hp', 'mp', 'spd', 'luck'];
  const relevantStats = statKeys.filter(k => (currentStats[k] !== undefined && currentStats[k]! > 0) || (nextStats[k] !== undefined && nextStats[k]! > 0));

  const statLabels: Record<string, { label: string; icon: string }> = {
    atk: { label: '공격력 (ATK)', icon: '⚔️' },
    def: { label: '방어력 (DEF)', icon: '🛡️' },
    hp: { label: '최대 체력 (HP)', icon: '❤️' },
    mp: { label: '최대 마나 (MP)', icon: '💧' },
    spd: { label: '행동 속도 (SPD)', icon: '⚡' },
    luck: { label: '치명/행운 (LUCK)', icon: '🍀' },
  };

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<'success' | 'keep' | 'drop' | undefined>(undefined);
  const [lastEnhanceResult, setLastEnhanceResult] = useState<{
    success: boolean;
    result: 'success' | 'keep' | 'drop' | 'error';
    prevLevel: number;
    newLevel: number;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const targetEnhanceLv = item.level + 1;
  // ⏳ 장비 강화 단계별 점진적 소요 시간 (1~3강: 1.5초, 4~6강: 2.2초, 7~9강: 3.2초, 10강: 4.2초)
  const enhanceDurationMs = targetEnhanceLv <= 3 ? 1500 : (targetEnhanceLv <= 6 ? 2200 : (targetEnhanceLv <= 9 ? 3200 : 4200));

  const handleStartEnhance = () => {
    if (isMax || isBuildingLvTooLow || !canEnhance) return;
    const rate = GameManager.getEnhanceRateInfo(item.level);
    const roll = Math.random() * 100;
    const outcome: 'success' | 'keep' | 'drop' = roll < rate.successRate
      ? 'success'
      : (roll < rate.successRate + rate.failKeepRate ? 'keep' : 'drop');
    setPendingOutcome(outcome);
    setIsEnhancing(true);
  };

  const handleEnhanceComplete = () => {
    setIsEnhancing(false);
    const res = gm.enhanceEquipment(item.id, pendingOutcome);
    setLastEnhanceResult(res);
    setPendingOutcome(undefined);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const isUnique = item.rarity === 'unique' || item.id.startsWith('boss_') || item.id.includes('unique');
  const currentAwk = item.awakeningLevel || 0;
  const isMaxAwakening = currentAwk >= 3;
  const canAwaken = isMax && forgeLv >= 10 && !isMaxAwakening;

  const handleAwaken = () => {
    if (!canAwaken) return;
    const targetAwk = currentAwk + 1;
    const confirmMsg = `⚠️ [장비 각성 경고 - 영구 파괴 위험]\n\n각성 실패 시 [${itemName}]이(가) 완전히 파괴되어 영구 소멸합니다!\n\n• 성공 확률: 20%\n• 성공 시: 현재 +10강의 모든 능력치를 영구 보존하고 +0강으로 초기화 (최대 3각성까지 누적 강화)\n• 실패 시: 장비 영구 소멸 (복구 불가)\n\n정말로 [★${targetAwk}단계 각성]을 감행하시겠습니까?`;
    
    if (!window.confirm(confirmMsg)) return;

    const res = gm.awakenEquipment(item.id);
    if (res.success) {
      SoundManager.getInstance().play('item_upgrade');
      alert(`🎉 [장비 각성 대성공!]\n[${itemName}]이(가) ★${res.newAwakeningLevel || targetAwk}단계 각성에 도달했습니다!\n현재 누적 스탯이 영구 보존되고 +0강으로 초기화되었습니다.`);
      onClose();
    } else {
      SoundManager.getInstance().play('heavy_hit');
      alert(`💥 [장비 각성 실패 - 무기 파괴]\n마력 폭주를 견디지 못하고 [${itemName}]이(가) 완전히 파괴되었습니다...`);
      onClose();
    }
  };

  const rarityMeta = {
    common:    { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' },
    rare:      { label: '희귀', color: '#42a5f5', bg: '#42a5f522' },
    epic:      { label: '에픽', color: '#ce93d8', bg: '#ce93d822' },
    unique:    { label: '고유', color: '#ffb74d', bg: '#ff980022' },
    legendary: { label: '전설', color: '#ffd54f', bg: '#ffd54f22' },
  }[item.rarity || 'common'] || { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' };

  const slotLabel = item.slot === 'weapon'
    ? ('🗡️ 주무기')
    : item.slot === 'armor'
    ? ('🛡️ 방어구')
    : ('💍 장신구');

  const modalTitle = '⚡ 마도 장비 강화 공방';

  return (
    <Modal title={modalTitle} open={true} onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        {/* 아이템 기본 정보 헤더 */}
        <div className="p-3 bg-[#131926] border border-[#222d42] rounded-xl flex items-center gap-3">
          <span className="p-2 rounded-xl bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-lg">
            <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={48} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-white">{itemName}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
                style={{
                  color: isUnique ? '#ffb74d' : rarityMeta.color,
                  backgroundColor: isUnique ? '#ff980022' : rarityMeta.bg,
                  borderColor: isUnique ? '#ff980055' : `${rarityMeta.color}44`
                }}
              >
                {isUnique ? ('👑 고유/보스') : `[${rarityMeta.label}]`}
              </span>
              {wearer ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                  👤 {wearer.name} {'착용중'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                  {'보관함'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8b9bb4] mt-0.5">
              {slotLabel} | {'현재 강화 단계'}: <span className="text-[#ffd54f] font-bold font-mono">+{item.level}</span> / 10
            </div>
          </div>
        </div>

        {/* 강화 단계 비교 배너 */}
        <div className="p-3 bg-[#181528] border border-[#ffd54f44] rounded-xl flex items-center justify-between text-center">
          <div className="flex-1">
            <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">{'현재 강화 단계'}</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">+{item.level}</div>
          </div>
          <div className="text-2xl text-[#ffd54f] font-bold animate-pulse px-2">➔</div>
          <div className="flex-1">
            <div className="text-[10px] text-[#38ef7d] uppercase tracking-wider font-bold">{'강화 후 단계'}</div>
            <div className="text-xl font-bold font-mono text-[#38ef7d] mt-0.5">{isMax ? ('★ 최고 레벨') : `+${item.level + 1}`}</div>
          </div>
        </div>

        {/* 스탯 변화 상세 비교 그리드 */}
        <div className="p-3 bg-[#0d121c] border border-[#1f2738] rounded-xl">
          <div className="text-xs font-bold text-[#00d2ff] mb-2 flex items-center justify-between">
            <span>{'📊 장비 기본 스탯 강화 상세 비교'}</span>
            {item.level + 1 === 3 && <span className="text-[10px] text-[#ffd54f] font-bold">{'✨ 3강 달성 시 접두 인챈트 해금!'}</span>}
            {item.level + 1 === 7 && <span className="text-[10px] text-[#00d2ff] font-bold">{'🔮 7강 달성 시 접미 인챈트 해금!'}</span>}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {relevantStats.length === 0 ? (
              <div className="text-xs text-[#8b9bb4] text-center py-2">{'표시할 기본 스탯이 없습니다.'}</div>
            ) : (
              relevantStats.map(statKey => {
                const curVal = currentStats[statKey] || 0;
                const nextVal = nextStats[statKey] || 0;
                const diff = nextVal - curVal;
                const meta = statLabels[statKey] || { label: statKey.toUpperCase(), icon: '📈' };

                return (
                  <div key={statKey} className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-[#141a27] border border-[#232f46] text-xs">
                    <span className="flex items-center gap-1.5 text-[#cfd8e8] font-medium">
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[#8b9bb4]">{curVal}</span>
                      <span className="text-[#ffd54f]">➔</span>
                      <span className="text-[#38ef7d] font-bold">{isMax ? curVal : nextVal}</span>
                      {!isMax && diff > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                          +{diff}
                        </span>
                      ) : !isMax && diff === 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#8b9bb422] text-[#8b9bb4] font-medium border border-[#8b9bb433]">
                          {'고정'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 부여된 접두사 및 접미사 인챈트 속성 영역 (고정 수치 전용) */}
        {(item.prefix || item.suffix) && (() => {
          const locPre = item.prefix;
          const locSuf = item.suffix;
          const preName = locPre?.name || item.prefix?.name;
          const preDesc = locPre?.description || item.prefix?.description;
          const sufName = locSuf?.name || item.suffix?.name;
          const sufDesc = locSuf?.description || item.suffix?.description;

          return (
            <div className="p-3 bg-[#111622] border border-[#232d42] rounded-xl flex flex-col gap-2">
              <div className="text-xs font-bold text-[#ffd54f] flex items-center justify-between">
                <span>{'✨ 부여된 마도 인챈트 속성'}</span>
                <span className="text-[10px] text-[#8b9bb4] font-normal">{'강화 미적용 고정 옵션'}</span>
              </div>

              {item.prefix && (
                <div className="p-2 rounded-lg bg-[#182030] border border-[#2a3854] text-xs flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ffd54f]">✨ [{'접두사'}] {preName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] font-bold">
                      {'고정 수치 (강화불가)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#cfd8e8]">{preDesc}</div>
                </div>
              )}

              {item.suffix && (
                <div className="p-2 rounded-lg bg-[#182030] border border-[#2a3854] text-xs flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#00d2ff]">🔮 [{'접미사'}] {sufName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] font-bold">
                      {'고정 수치 (강화불가)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#cfd8e8]">{sufDesc}</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 강화 확률 상세 비교 게이지 & 안내 */}
        {!isMax && (
          <div className="p-3 bg-[#131926] border border-[#222d42] rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">{'🎲 강화 확률 분석'}</span>
              <span className="text-[10px] text-[#8b9bb4]">
                {item.level < 3
                  ? ('🟢 100% 안전 강화')
                  : item.level < 6
                  ? ('🟡 실패 시 유지')
                  : ('🔴 실패 시 하락 위험')}
              </span>
            </div>

            {/* 확률 프로그레스 바 (성공 / 유지 / 하락) */}
            <div className="h-3.5 w-full bg-[#1e2738] rounded-full overflow-hidden flex border border-[#2a374e]">
              {rateInfo.successRate > 0 && (
                <div
                  className="h-full bg-[#38ef7d] transition-all flex items-center justify-center text-[9px] font-bold text-black"
                  style={{ width: `${rateInfo.successRate}%` }}
                  title={`${'성공'}: ${rateInfo.successRate}%`}
                >
                  {rateInfo.successRate >= 15 ? `${rateInfo.successRate}%` : ''}
                </div>
              )}
              {rateInfo.failKeepRate > 0 && (
                <div
                  className="h-full bg-[#ffd54f] transition-all flex items-center justify-center text-[9px] font-bold text-black"
                  style={{ width: `${rateInfo.failKeepRate}%` }}
                  title={`${'실패 시 유지'}: ${rateInfo.failKeepRate}%`}
                >
                  {rateInfo.failKeepRate >= 15 ? `${rateInfo.failKeepRate}%` : ''}
                </div>
              )}
              {rateInfo.failDropRate > 0 && (
                <div
                  className="h-full bg-[#ef5350] transition-all flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${rateInfo.failDropRate}%` }}
                  title={`${'실패 시 하락'}: ${rateInfo.failDropRate}%`}
                >
                  {rateInfo.failDropRate >= 15 ? `${rateInfo.failDropRate}%` : ''}
                </div>
              )}
            </div>

            {/* 확률 뱃지 수치 */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono mt-0.5">
              <div className="p-1.5 rounded-lg bg-[#38ef7d15] border border-[#38ef7d33]">
                <div className="text-[10px] text-[#38ef7d] font-bold">{'✨ 성공 확률'}</div>
                <div className="text-sm font-bold text-[#38ef7d]">{rateInfo.successRate}%</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#ffd54f15] border border-[#ffd54f33]">
                <div className="text-[10px] text-[#ffd54f] font-bold">{'🛡️ 실패(유지)'}</div>
                <div className="text-sm font-bold text-[#ffd54f]">{rateInfo.failKeepRate}%</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#ef535015] border border-[#ef535033]">
                <div className="text-[10px] text-[#ef5350] font-bold">{'💥 실패(하락)'}</div>
                <div className="text-sm font-bold text-[#ef5350]">{rateInfo.failDropRate}%</div>
              </div>
            </div>

            <div className="text-[10px] text-[#8b9bb4] leading-relaxed mt-0.5 bg-[#0b0e17] p-2 rounded-lg border border-[#1a2333]">
              💡 <span className="text-white font-semibold">'강화 규칙:'</span> {'인챈트 속성은 강화되지 않습니다.'}
            </div>
          </div>
        )}

        {/* 소모 재료 목록 */}
        {!isMax && (
          <div className="p-3 bg-[#0d121c] border border-[#1f2738] rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#cfd8e8]">
                📦 {'필요 소모 재료'} ({'대장간'} -{discountPct}%)
              </span>
              <span className={`text-[10px] font-bold ${canEnhance ? 'text-[#38ef7d]' : 'text-[#ef5350]'}`}>
                {canEnhance
                  ? ('✅ 준비 완료')
                  : ('❌ 재료 부족')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {renderCostBadges(cost, resources, isMax)}
            </div>
          </div>
        )}

        {/* 🎉/⚠️ 강화 결과 알림 배너 */}
        {lastEnhanceResult && (
          <div
            className={`p-3 rounded-xl border flex flex-col gap-1.5 animate-fade-in ${
              lastEnhanceResult.result === 'success'
                ? 'bg-[#18281d] border-[#38ef7d66] text-[#38ef7d]'
                : lastEnhanceResult.result === 'keep'
                ? 'bg-[#292212] border-[#ffd54f66] text-[#ffd54f]'
                : 'bg-[#2b1214] border-[#ef535066] text-[#ef5350]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span>{lastEnhanceResult.result === 'success' ? '✨' : (lastEnhanceResult.result === 'keep' ? '⚠️' : '💥')}</span>
                <span>
                  {lastEnhanceResult.result === 'success'
                    ? `강화 성공! (+${lastEnhanceResult.prevLevel} ➔ +${lastEnhanceResult.newLevel})`
                    : lastEnhanceResult.result === 'keep'
                    ? `강화 실패 (현재 수치 +${lastEnhanceResult.newLevel} 유지)`
                    : `강화 대실패! 단계 하락 (+${lastEnhanceResult.prevLevel} ➔ +${lastEnhanceResult.newLevel})`}
                </span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-black/40 border border-current">
                {lastEnhanceResult.result.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-[#cfd8e8] leading-tight">
              {lastEnhanceResult.result === 'success'
                ? `장비의 기본 스탯이 성공적으로 강화되었습니다! (새 강화 수치: +${lastEnhanceResult.newLevel})`
                : lastEnhanceResult.result === 'keep'
                ? '마력 저항으로 인해 강화에 실패했습니다. 장비 수치는 유지되며 재료만 소모되었습니다.'
                : '마력 역류 충격으로 인해 강화 단계가 1단계 하락했습니다.'}
            </div>
          </div>
        )}

        {/* 🌟 10강 장비 각성 (Awakening) 패널 🌟 */}
        {isMax && (
          canAwaken ? (
            <div className="p-3 rounded-xl border border-[#ffd54f88] bg-gradient-to-r from-[#1f132e] to-[#2a1b10] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1.5">
                  <span>✨</span>
                  <span>장비 각성 (Awakening) - ★{currentAwk}/3단계</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                  병기창 Lv.10 전용
                </span>
              </div>
              <div className="text-[11px] text-[#cfd8e8] leading-relaxed">
                성공 시 현재 +10강의 모든 능력치를 <strong className="text-[#38ef7d]">영구 기본 스탯</strong>으로 흡수 보존하고, <strong className="text-[#00d2ff]">강화 단계를 +0강으로 초기화</strong>하여 10강까지 재강화가 가능해집니다! (최대 3단계 누적)
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-1.5 rounded-lg bg-[#38ef7d15] border border-[#38ef7d33]">
                  <div className="text-[10px] text-[#38ef7d] font-bold">✨ 각성 성공 확률</div>
                  <div className="text-sm font-bold text-[#38ef7d]">20%</div>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ef535015] border border-[#ef535033]">
                  <div className="text-[10px] text-[#ef5350] font-bold">💥 실패 시 페널티</div>
                  <div className="text-sm font-bold text-[#ef5350]">무기 파괴 (영구 소멸)</div>
                </div>
              </div>
            </div>
          ) : isMaxAwakening ? (
            <div className="p-3 rounded-xl border border-[#ffd54f66] bg-[#1a1528] text-center text-xs text-[#ffd54f] font-bold">
              👑 ★ 3단계 최종 각성 달성 (신화 초월의 경지에 오른 무기입니다)
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-[#2a3854] bg-[#101522] text-center text-xs text-[#8b9bb4]">
              🔒 병기창 Lv.10 도달 시 [장비 각성] 단계가 해금됩니다. (현재 병기창 Lv.{forgeLv})
            </div>
          )
        )}

        {/* 모달 하단 버튼 */}
        <div className="flex items-center gap-2 pt-1">
          {canAwaken ? (
            <ActionButton
              label={`✨ ★${currentAwk + 1}단계 각성 시도 (성공 20% / 실패 시 파괴)`}
              variant="danger"
              className="flex-1 py-2 font-bold shadow-lg border border-[#ffd54f88] text-white hover:brightness-110 animate-pulse"
              onClick={handleAwaken}
            />
          ) : (
            <ActionButton
              label={
                isMax
                  ? (isMaxAwakening ? '★ 3단계 각성 완료 (+10)' : '★ 최고 레벨 (+10)')
                  : isBuildingLvTooLow
                  ? (`병기창 증축 필요 (최대 +${maxAllowed}강)`)
                  : canEnhance
                  ? (`⚡ +${item.level + 1}강 강화 시도`)
                  : ('재료 부족으로 강화 불가')
              }
              variant={isMax || isBuildingLvTooLow ? 'ghost' : canEnhance ? 'primary' : 'ghost'}
              className="flex-1 py-2 font-bold shadow-lg"
              disabled={isMax || isBuildingLvTooLow || !canEnhance}
              onClick={handleStartEnhance}
            />
          )}
          <button
            className="btn btn-ghost px-4 py-2 text-xs hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center gap-1"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onClose}
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            <span style={{ color: '#c56060' }}>닫기</span>
          </button>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* 🌟 장비 강화 연출 모달 🌟 */}
      <CraftProgressModal
        open={isEnhancing}
        type="enhance_equipment"
        title="마도 장비 강화"
        itemName={itemName}
        itemIcon={item.icon || '⚔️'}
        itemSub={`+${targetEnhanceLv}강 시도`}
        durationMs={enhanceDurationMs}
        outcome={pendingOutcome}
        onComplete={handleEnhanceComplete}
      />
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
//  장비 선택 오버레이
// ─────────────────────────────────────────────────────────────
const EquipmentOverlay: React.FC<{
  hero: Mercenary;
  slot?: EquipmentSlot | 'all';
  inventory: EquipmentItem[];
  onEquip: (id: string) => void;
  onUnequip: (targetSlot?: EquipmentSlot) => void;
  onClose: () => void;
}> = ({ hero, slot = 'weapon', onEquip, onUnequip, onClose }) => {
  const { state, gm } = useGameManager();
  const currentHero = state.barracks.find(h => h.id === hero.id) || hero;

  // 1. 카테고리(슬롯) 필터 ('all' | 'weapon' | 'armor' | 'accessory')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>(
    slot === 'all' ? 'all' : (slot || 'weapon')
  );
  // 2. 티어 필터 ('all' | 1~10)
  const [tierFilter, setTierFilter] = useState<'all' | number>('all');
  // 3. 등급(희귀도) 필터 ('all' | 'common' | 'rare' | 'unique' | 'epic' | 'legendary')
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'unique' | 'epic' | 'legendary'>('all');

  // 4. 일괄 판매(다중 선택) 모드 상태
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedEquipIds, setSelectedEquipIds] = useState<Set<string>>(new Set());
  const [confirmBatchModal, setConfirmBatchModal] = useState(false);

  // 모달 상태 관리: 아이템 상세 및 액션 팝업, 강화 모달
  const [selectedDetailItem, setSelectedDetailItem] = useState<EquipmentItem | null>(null);
  const [selectedEnhanceItemId, setSelectedEnhanceItemId] = useState<string | null>(null);

  // 대장간 할인율 및 기능 해금 상태 계산
  const forgeLv = state.buildings['blacksmith']?.level || 1;
  const unlocks = gm.getForgeFeatureUnlocks();
  const isEnhanceUnlocked = unlocks.enhance.unlocked;
  const discountPct = Math.min(25, (forgeLv - 1) * 2.5);
  const mult = 1 - discountPct / 100;

  // 장비 착용 여부 판별 헬퍼 (누군가 착용 중이면 판매 보호)
  const isItemEquipped = useCallback((item: EquipmentItem) => {
    if (item.equippedHeroId) return true;
    if (currentHero.equipment?.weapon?.id === item.id) return true;
    if (currentHero.equipment?.armor?.id === item.id) return true;
    if (currentHero.equipment?.accessory?.id === item.id) return true;
    return false;
  }, [currentHero]);

  // 카테고리별/티어별/등급별 개수 계산
  const counts = useMemo(() => {
    const raw = state.equipmentInventory || [];
    const catCounts = { all: raw.length, weapon: 0, armor: 0, accessory: 0 };
    const tierCounts: Record<number, number> = {};
    const rarityCounts: Record<string, number> = { common: 0, rare: 0, unique: 0, epic: 0, legendary: 0 };

    raw.forEach(item => {
      if (item.slot) catCounts[item.slot] = (catCounts[item.slot] || 0) + 1;
      const t = getEquipmentTier(item);
      tierCounts[t] = (tierCounts[t] || 0) + 1;
      if (item.rarity) rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
    });

    return { catCounts, tierCounts, rarityCounts };
  }, [state.equipmentInventory]);

  // 📦 필터링된 장비 목록 (카테고리 + 티어 + 등급)
  const available = useMemo(() => {
    const seen = new Set<string>();
    const list = (state.equipmentInventory || []).filter(e => {
      if (!e || !e.id) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);

      // 카테고리(슬롯) 필터
      if (categoryFilter !== 'all' && e.slot !== categoryFilter) return false;

      // 단일 슬롯 뷰일 때, 현재 착용 중인 장비는 상단 카드에 표출되므로 목록에서 제외
      if (categoryFilter !== 'all') {
        const cur = currentHero.equipment?.[categoryFilter];
        if (cur && e.id === cur.id) return false;
      }

      // 티어 필터
      if (tierFilter !== 'all') {
        const t = getEquipmentTier(e);
        if (t !== tierFilter) return false;
      }

      // 등급 필터
      if (rarityFilter !== 'all' && e.rarity !== rarityFilter) return false;

      return true;
    });

    const invOrderMap = new Map<string, number>();
    (state.equipmentInventory || []).forEach((item, idx) => {
      if (item?.id) invOrderMap.set(item.id, idx);
    });

    return list.sort((a, b) => {
      const aEquipped = Boolean(isItemEquipped(a));
      const bEquipped = Boolean(isItemEquipped(b));
      if (aEquipped !== bEquipped) {
        return aEquipped ? -1 : 1; // 장착된 장비가 최상단
      }
      const tA = getEquipmentTier(a);
      const tB = getEquipmentTier(b);
      if (tA !== tB) return tB - tA; // 높은 티어 우선
      return (invOrderMap.get(a.id) ?? 0) - (invOrderMap.get(b.id) ?? 0);
    });
  }, [state.equipmentInventory, categoryFilter, tierFilter, rarityFilter, currentHero, isItemEquipped]);

  // 판매 가격 계산 헬퍼
  const getSellPrice = useCallback((item: EquipmentItem) => {
    const basePriceMap: Record<string, number> = {
      common: 50,
      rare: 150,
      unique: 400,
      epic: 400,
      legendary: 1000,
    };
    const basePrice = basePriceMap[item.rarity] || 50;
    const levelMultiplier = 1 + (item.level || 0) * 0.35;
    const enchantBonus = (item.prefix ? 50 : 0) + (item.suffix ? 50 : 0);
    return Math.max(10, Math.floor(basePrice * levelMultiplier + enchantBonus));
  }, []);

  // 판매 가능한(미착용) 현재 필터 아이템 목록
  const sellableVisibleItems = useMemo(() => {
    return available.filter(item => !isItemEquipped(item));
  }, [available, isItemEquipped]);

  // 전체 선택 (현재 필터 내 미착용 아이템 모두 선택)
  const handleSelectAll = () => {
    const next = new Set<string>();
    sellableVisibleItems.forEach(item => next.add(item.id));
    setSelectedEquipIds(next);
  };

  // 전체 해제
  const handleDeselectAll = () => {
    setSelectedEquipIds(new Set());
  };

  // 일반 + 희귀 등급 일괄 선택 (잡템 원클릭 선택)
  const handleSelectCommonAndRare = () => {
    const next = new Set<string>();
    sellableVisibleItems.forEach(item => {
      if (item.rarity === 'common' || item.rarity === 'rare') {
        next.add(item.id);
      }
    });
    setSelectedEquipIds(next);
  };

  // 체크박스 토글
  const handleToggleSelect = (itemId: string) => {
    const next = new Set(selectedEquipIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedEquipIds(next);
  };

  // 선택된 장비들의 총 판매 대금
  const batchTotalGold = useMemo(() => {
    let sum = 0;
    const inv = state.equipmentInventory || [];
    selectedEquipIds.forEach(id => {
      const it = inv.find(e => e.id === id);
      if (it && !isItemEquipped(it)) sum += getSellPrice(it);
    });
    return sum;
  }, [selectedEquipIds, state.equipmentInventory, isItemEquipped, getSellPrice]);

  // 일괄 판매 실행
  const handleExecuteBatchSale = () => {
    const ids = Array.from(selectedEquipIds);
    if (ids.length === 0) return;
    const res = gm.sellEquipmentBatch(ids);
    SoundManager.getInstance().play('coin');
    gm.addLog(`🪙 [장비 일괄 매각] ${res.count}개의 장비를 매각하여 총 🪙 ${res.totalGold.toLocaleString()} G를 획득했습니다.`, 'reward');
    setSelectedEquipIds(new Set());
    setConfirmBatchModal(false);
    setIsBatchMode(false);
  };

  // 최신 상태의 상세 대상 아이템 동기화
  const curEquipForCategory = categoryFilter !== 'all' ? currentHero.equipment?.[categoryFilter] : undefined;
  const activeDetailItem = useMemo(() => {
    if (!selectedDetailItem) return null;
    return state.equipmentInventory.find(e => e.id === selectedDetailItem.id)
      || (curEquipForCategory?.id === selectedDetailItem.id ? curEquipForCategory : null)
      || selectedDetailItem;
  }, [selectedDetailItem, state.equipmentInventory, curEquipForCategory]);
  const curEquip = activeDetailItem ? currentHero.equipment?.[activeDetailItem.slot] : curEquipForCategory;

  // 최신 상태의 강화 대상 아이템 동기화
  const enhanceTargetItem = useMemo(() => {
    if (!selectedEnhanceItemId) return null;
    return state.equipmentInventory.find(e => e.id === selectedEnhanceItemId)
      || (curEquipForCategory?.id === selectedEnhanceItemId ? curEquipForCategory : null)
      || null;
  }, [selectedEnhanceItemId, state.equipmentInventory, curEquipForCategory]);

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
      {/* ── 상단 고정 헤더 바 ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f2738] bg-[#0c1220] shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-[#00d2ff] truncate">
            🛡️ [{categoryFilter === 'all' ? '전체 장비' : { weapon: '무기', armor: '방어구', accessory: '장신구' }[categoryFilter]} 관리] — {hero.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#8b9bb4] shrink-0">
            보유 {available.length}개
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 일괄 판매 모드 토글 버튼 */}
          <button
            className={`btn text-xs px-2.5 py-1 font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isBatchMode
                ? 'btn-danger shadow-md shadow-[#ef535033]'
                : 'btn-ghost border border-[#ef535055] text-[#ff80ab] hover:bg-[#ef535022]'
            }`}
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              if (isBatchMode) setSelectedEquipIds(new Set());
            }}
            title="여러 장비를 한 번에 선택하여 일괄 판매(매각)합니다"
          >
            <span>🗑️</span>
            <span>{isBatchMode ? '선택 종료' : '일괄 판매'}</span>
            {selectedEquipIds.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-black text-[9px] font-black">
                {selectedEquipIds.size}
              </span>
            )}
          </button>
          <button
            className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onClose}
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            <span style={{ color: '#c56060' }}>닫기</span>
          </button>
        </div>
      </div>

      {/* ── 상단 고정 영역: 현재 착용 중인 아이템 ── */}
      <div className="p-2.5 bg-[#0d1522] border-b border-[#1f2b3e] shrink-0 shadow-md">
        {categoryFilter === 'all' ? (
          <div>
            <div className="text-[10px] text-[#8b9bb4] font-bold mb-1.5 flex items-center justify-between">
              <span className="text-[#38ef7d] flex items-center gap-1">
                <span>★</span> 현재 {hero.name}의 장착 슬롯 (슬롯 클릭 시 카테고리 전환 / 관리)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['weapon', 'armor', 'accessory'] as EquipmentSlot[]).map(s => {
                const eq = currentHero.equipment?.[s];
                const sName = { weapon: '무기', armor: '방어구', accessory: '장신구' }[s];
                const sIcon = { weapon: '⚔️', armor: '🛡️', accessory: '💍' }[s];
                return (
                  <div
                    key={s}
                    className="p-2 flex flex-col justify-between gap-1 rounded-lg cursor-pointer transition-all"
                    style={{
                      border: eq ? '1.5px solid #38ef7d88' : '1.5px solid #222d42',
                      backgroundColor: eq ? '#0d2018' : '#101624'
                    }}
                    onClick={() => {
                      if (eq) setSelectedDetailItem(eq);
                      else setCategoryFilter(s);
                    }}
                    title={eq ? `${eq.name} (클릭 시 상세 관리)` : `${sName} 비어있음 (클릭 시 ${sName} 필터로 전환)`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#8b9bb4] flex items-center gap-1">
                        <span>{sIcon}</span>
                        <span>{sName}</span>
                      </span>
                      {eq && <span className="text-[#ffd54f] font-mono">+{eq.level}강</span>}
                    </div>
                    {eq ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 flex items-center justify-center">
                          <GameIcon name={eq.templateId || getEquipmentTemplateId(eq) || eq.id} icon={eq.icon} size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#38ef7d] truncate">{eq.name}</div>
                          <div className="text-[9px] font-bold" style={{ color: getRarityColor(eq.rarity) }}>
                            [{getRarityLabel(eq.rarity)}]
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#607d8b] text-center py-1">비어있음</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] text-[#8b9bb4] font-bold mb-1 flex items-center justify-between">
              <span className="text-[#38ef7d] flex items-center gap-1 font-bold">
                <span>★</span> 현재 착용 중인 {{ weapon: '무기', armor: '방어구', accessory: '장신구' }[categoryFilter]}
              </span>
              {curEquipForCategory && (
                <span className="text-[10px] text-[#8b9bb4]">
                  (클릭 시 상세 정보 / 강화 / 해제)
                </span>
              )}
            </div>

            {curEquipForCategory ? (
              <div
                className="p-2 rounded-xl cursor-pointer transition-all flex flex-col gap-1"
                style={{ border: '2px solid #38ef7d88', backgroundColor: '#0d2018' }}
                onClick={() => setSelectedDetailItem(curEquipForCategory)}
                title="클릭하여 상세 정보 및 강화/해제 관리"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="shrink-0 flex items-center justify-center">
                      <GameIcon name={curEquipForCategory.templateId || getEquipmentTemplateId(curEquipForCategory) || curEquipForCategory.id} icon={curEquipForCategory.icon} size={22} />
                    </span>
                    <span
                      className={`font-bold ${curEquipForCategory.name.length >= 15 ? 'text-xs' : 'text-sm'} text-[#38ef7d] truncate max-w-[180px] sm:max-w-[240px]`}
                      title={curEquipForCategory.name}
                    >
                      {curEquipForCategory.name}
                    </span>
                    <span className="text-xs text-[#ffd54f] font-mono shrink-0">(+{curEquipForCategory.level}강)</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${getRarityColor(curEquipForCategory.rarity)}22`,
                        color: getRarityColor(curEquipForCategory.rarity),
                        border: `1px solid ${getRarityColor(curEquipForCategory.rarity)}44`
                      }}
                    >
                      [{getRarityLabel(curEquipForCategory.rarity)}]
                    </span>
                    {!gm.isEquipmentCompatible(hero.classId, curEquipForCategory) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535044]">
                        ⚠️ 비호환(-50%)
                      </span>
                    )}
                  </div>

                  <button
                    className="btn btn-ghost text-[11px] px-2 py-0.5 text-[#38ef7d] border border-[#38ef7d44] hover:bg-[#38ef7d22] shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailItem(curEquipForCategory);
                    }}
                  >
                    🔍 관리
                  </button>
                </div>
                <div className="pt-0.5">
                  {renderTotalStats(curEquipForCategory.stats)}
                </div>
              </div>
            ) : (
              <div className="panel p-2 text-center text-xs text-[#8b9bb4] bg-[#111622] border-dashed border-[#243048]">
                현재 착용 중인 {{ weapon: '무기', armor: '방어구', accessory: '장신구' }[categoryFilter]}가 없습니다. 아래 목록에서 장비를 선택해 장착하세요.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 필터 바 (카테고리 / 티어 / 등급) ── */}
      <div className="flex flex-col gap-1.5 px-3 py-2 bg-[#0b0f1a] border-b border-[#1b263b] shrink-0 text-xs">
        {/* 1. 카테고리 (슬롯) 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold text-[#8b9bb4] shrink-0 mr-1">슬롯:</span>
          {[
            { key: 'all', label: '전체', icon: '📦', count: counts.catCounts.all },
            { key: 'weapon', label: '무기', icon: '⚔️', count: counts.catCounts.weapon },
            { key: 'armor', label: '방어구', icon: '🛡️', count: counts.catCounts.armor },
            { key: 'accessory', label: '장신구', icon: '💍', count: counts.catCounts.accessory },
          ].map(c => (
            <button
              key={c.key}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                categoryFilter === c.key
                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff88] shadow-xs'
                  : 'bg-[#131a29] text-[#8b9bb4] border border-[#212c40] hover:text-white'
              }`}
              onClick={() => setCategoryFilter(c.key as any)}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="text-[9px] font-mono opacity-75">({c.count})</span>
            </button>
          ))}
        </div>

        {/* 2. 티어 (1T ~ 10T) 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold text-[#8b9bb4] shrink-0 mr-1">티어:</span>
          <button
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'all'
                ? 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f88]'
                : 'bg-[#131a29] text-[#8b9bb4] border border-[#212c40] hover:text-white'
            }`}
            onClick={() => setTierFilter('all')}
          >
            전체
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => {
            const hasItems = (counts.tierCounts[t] || 0) > 0;
            return (
              <button
                key={t}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                  tierFilter === t
                    ? 'bg-[#ffd54f] text-black border border-[#ffd54f] shadow-xs'
                    : hasItems
                    ? 'bg-[#182032] text-[#ffd54f] border border-[#2e3e5c] hover:bg-[#202c45]'
                    : 'bg-[#101522] text-[#556987] border border-[#1a2335] opacity-50'
                }`}
                onClick={() => setTierFilter(tierFilter === t ? 'all' : t)}
                title={`${t}티어 장비 (${counts.tierCounts[t] || 0}개 보유)`}
              >
                {t}T{counts.tierCounts[t] ? `(${counts.tierCounts[t]})` : ''}
              </button>
            );
          })}
        </div>

        {/* 3. 등급 (Rarity) 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] font-bold text-[#8b9bb4] shrink-0 mr-1">등급:</span>
          <button
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
              rarityFilter === 'all'
                ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff88]'
                : 'bg-[#131a29] text-[#8b9bb4] border border-[#212c40] hover:text-white'
            }`}
            onClick={() => setRarityFilter('all')}
          >
            전체
          </button>
          {[
            { key: 'common', label: '일반', color: '#9e9e9e' },
            { key: 'rare', label: '희귀', color: '#42a5f5' },
            { key: 'unique', label: '유니크', color: '#ab47bc' },
            { key: 'epic', label: '에픽', color: '#ce93d8' },
            { key: 'legendary', label: '전설', color: '#ffd54f' },
          ].map(r => (
            <button
              key={r.key}
              className="px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer border"
              style={{
                color: r.color,
                backgroundColor: rarityFilter === r.key ? `${r.color}33` : '#131a29',
                borderColor: rarityFilter === r.key ? r.color : '#212c40',
              }}
              onClick={() => setRarityFilter(rarityFilter === r.key ? 'all' : r.key as any)}
            >
              {r.label} ({counts.rarityCounts[r.key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* ── 일괄 판매 제어 툴바 ── */}
      {isBatchMode && (
        <div className="px-3 py-1.5 bg-[#201018] border-b border-[#ef535044] flex items-center justify-between gap-1.5 flex-wrap text-xs shrink-0 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#ff80ab] flex items-center gap-1">
              <span>🗑️</span>
              <span>일괄 판매 모드</span>
            </span>
            <span className="text-[10px] text-[#8b9bb4]">
              (미착용 장비만 선택 가능 / 착용 장비 보호)
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              className="btn btn-ghost text-[10px] px-2 py-0.5 border border-[#38ef7d44] text-[#38ef7d] hover:bg-[#38ef7d22] font-bold cursor-pointer"
              onClick={handleSelectAll}
            >
              전체 선택 ({sellableVisibleItems.length})
            </button>
            <button
              className="btn btn-ghost text-[10px] px-2 py-0.5 border border-[#ffd54f44] text-[#ffd54f] hover:bg-[#ffd54f22] font-bold cursor-pointer"
              onClick={handleSelectCommonAndRare}
              title="일반 및 희귀 등급 장비만 원클릭 선택"
            >
              일반/희귀 선택
            </button>
            <button
              className="btn btn-ghost text-[10px] px-2 py-0.5 border border-[#8b9bb444] text-[#8b9bb4] hover:bg-[#8b9bb422] cursor-pointer"
              onClick={handleDeselectAll}
            >
              선택 해제
            </button>
            <button
              className="btn btn-ghost text-[10px] px-2 py-0.5 text-[#ef5350] hover:bg-[#ef535022] font-bold cursor-pointer"
              onClick={() => {
                setIsBatchMode(false);
                setSelectedEquipIds(new Set());
              }}
            >
              모드 종료
            </button>
          </div>
        </div>
      )}

      {/* ── 하단 스크롤 영역: 교체 가능한 장비 목록 ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#ffd54f] font-bold">
            📦 필터링된 장비 ({available.length}개)
          </span>
          <span className="text-[10px] text-[#8b9bb4]">
            {isBatchMode ? '판매할 장비를 탭하여 선택/해제' : '클릭 시 상세 정보 및 강화/장착'}
          </span>
        </div>

        {available.length === 0 && (
          <div className="panel p-6 text-center text-sm text-[#8b9bb4]">
            조건에 부합하는 장비가 없습니다.<br />
            <span className="text-xs text-[#607d8b] mt-1 block">필터 조건을 완화하거나 병기창(대장간)에서 새 장비를 단조하세요.</span>
          </div>
        )}

        {available.map(eq => {
          const isComp = gm.isEquipmentCompatible(hero.classId, eq);
          const wearer = eq.equippedHeroId ? state.barracks.find(h => h.id === eq.equippedHeroId) : null;
          const isEquipped = isItemEquipped(eq);
          const isSelected = selectedEquipIds.has(eq.id);
          const eqTier = getEquipmentTier(eq);

          // 👑 [골드 테마 기반 장비 카드 테두리 & 배경 스타일링 (모바일 최적화 & 두께 2px 적용)]
          // 1. 장착된 장비: 비호환 여부와 무관하게 명도를 낮춘 차분한 딥 앤티크 골드 (#b28c29) 테두리로 통일
          // 2. 비장착 장비: 호환 장비(다크 브론즈 골드 #826738) vs 비호환 장비(경고 버건디 레드 #b34444)로 명확히 색상 분리
          // 3. 테두리 폭 0.5px 조절 (2px solid)로 슬림하고 정돈된 카드 외곽선 유지
          let cardStyle: React.CSSProperties;
          if (isSelected) {
            cardStyle = {
              border: '2.5px solid #ef5350',
              backgroundColor: '#2a1218',
              boxShadow: '0 2px 8px rgba(239, 83, 80, 0.25)',
            };
          } else if (isEquipped) {
            // 장착 장비 (명도를 살짝 낮춘 차분하고 기품 있는 딥 앤티크 골드)
            cardStyle = {
              border: '2px solid #b28c29',
              backgroundColor: '#151a26',
              boxShadow: '0 1px 4px rgba(178, 140, 41, 0.12)',
            };
          } else if (!isComp) {
            // 비장착 + 비호환 장비 (골드/브론즈와 확연히 분간되는 경고 버건디 레드)
            cardStyle = {
              border: '2px solid #b34444',
              backgroundColor: '#161013',
            };
          } else {
            // 비장착 + 호환 장비 (차분하고 묵직한 다크 브론즈 골드)
            cardStyle = {
              border: '2px solid #826738',
              backgroundColor: '#10141f',
            };
          }

          return (
            <div
              key={eq.id}
              className="p-2.5 flex items-center gap-2 cursor-pointer rounded-xl transition-all"
              style={cardStyle}
              onClick={() => {
                if (isBatchMode) {
                  if (!isEquipped) handleToggleSelect(eq.id);
                } else {
                  setSelectedDetailItem(eq);
                }
              }}
            >
              {/* 일괄 판매 체크박스 */}
              {isBatchMode && (
                <div className="shrink-0 flex items-center justify-center pr-1" onClick={(e) => e.stopPropagation()}>
                  {isEquipped ? (
                    <span className="text-xs text-[#607d8b]" title="착용 중인 장비는 판매할 수 없습니다">🔒</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(eq.id)}
                      className="w-4 h-4 cursor-pointer accent-[#ef5350]"
                    />
                  )}
                </div>
              )}

              {/* 장비 본문 */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {/* 1행: 아이콘 + 이름 + 티어 + 등급 + 착용자 + 적합성 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="shrink-0 flex items-center justify-center">
                      <GameIcon name={eq.templateId || getEquipmentTemplateId(eq) || eq.id} icon={eq.icon} size={22} />
                    </span>
                    <span
                      className={`font-bold ${eq.name.length >= 15 ? 'text-xs' : 'text-sm'} text-white truncate max-w-[150px] sm:max-w-[200px]`}
                      title={eq.name}
                    >
                      {eq.name}
                    </span>
                    <span className="text-xs text-[#ffd54f] font-mono shrink-0">(+{eq.level}강)</span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33]">
                      {eqTier}T
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${getRarityColor(eq.rarity)}22`,
                        color: getRarityColor(eq.rarity),
                        border: `1px solid ${getRarityColor(eq.rarity)}44`
                      }}
                    >
                      [{getRarityLabel(eq.rarity)}]
                    </span>
                    {(eq.isCorrupted || eq.isUnpurified || eq.name.startsWith('[침식된]')) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#ef535022] text-[#ef5350] border border-[#ef535055]">
                        💀 침식됨
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {wearer ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                        👤 {wearer.name}
                      </span>
                    ) : isEquipped ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                        ✓ 장착중
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                        보관함
                      </span>
                    )}
                    {eq.slot === 'accessory' ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#38ef7d15] text-[#38ef7d]">공용</span>
                    ) : isComp ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#38ef7d15] text-[#38ef7d]">적합</span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#ef535015] text-[#ef5350]">비호환</span>
                    )}
                    {isBatchMode && !isEquipped && (
                      <span className="text-[10px] text-[#ffd54f] font-mono font-bold ml-1">
                        🪙 {getSellPrice(eq).toLocaleString()}G
                      </span>
                    )}
                  </div>
                </div>

                {/* 2행: 스탯 요약 수치 */}
                <div className="pt-0.5">
                  {renderTotalStats(eq.stats)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 일괄 판매 하단 고정 바 ── */}
      {isBatchMode && (
        <div className="p-3 bg-[#110c14] border-t border-[#ef535055] flex items-center justify-between gap-2 shadow-2xl shrink-0 animate-fade-in">
          <div className="flex flex-col">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>선택된 장비:</span>
              <span className="font-mono text-[#ff80ab] text-sm font-bold">{selectedEquipIds.size}개</span>
              {selectedEquipIds.size > 0 && (
                <button
                  className="text-[10px] text-[#8b9bb4] underline hover:text-white ml-1 cursor-pointer"
                  onClick={handleDeselectAll}
                >
                  선택 취소
                </button>
              )}
            </div>
            <div className="text-[11px] text-[#ffd54f] font-mono">
              총 판매 대금: <strong>🪙 {batchTotalGold.toLocaleString()} G</strong>
            </div>
          </div>
          <button
            className={`btn py-2 px-4 text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all ${
              selectedEquipIds.size > 0
                ? 'btn-danger shadow-[#ef535033] cursor-pointer'
                : 'btn-ghost opacity-40 cursor-not-allowed border border-[#3b2028]'
            }`}
            disabled={selectedEquipIds.size === 0}
            onClick={() => setConfirmBatchModal(true)}
          >
            <span>🗑️</span>
            <span>일괄 판매 ({selectedEquipIds.size}개)</span>
          </button>
        </div>
      )}


      {/* ── 🔍 아이템 클릭 시 상세 정보 및 액션 모달 ── */}
      {activeDetailItem && (
        <Modal
          title={`🛡️ 장비 상세 정보 — ${activeDetailItem.name}`}
          open={true}
          onClose={() => setSelectedDetailItem(null)}
        >
          <div className="flex flex-col gap-3">
            {/* 기본 정보 */}
            <div className="p-3 bg-[#131926] border border-[#222d42] rounded-xl flex items-center gap-3">
              <span 
                className="p-2 rounded-xl bg-[#323d4e] border shrink-0 flex items-center justify-center shadow-lg transition-all"
                style={getRarityBorderStyle(activeDetailItem.rarity)}
              >
                <GameIcon name={activeDetailItem.templateId || getEquipmentTemplateId(activeDetailItem) || activeDetailItem.id} icon={activeDetailItem.icon} size={48} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white">{activeDetailItem.name}</span>
                  <span className="text-xs text-[#ffd54f] font-mono font-bold">(+{activeDetailItem.level}강)</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${getRarityColor(activeDetailItem.rarity)}22`,
                      color: getRarityColor(activeDetailItem.rarity),
                      border: `1px solid ${getRarityColor(activeDetailItem.rarity)}44`
                    }}
                  >
                    [{getRarityLabel(activeDetailItem.rarity)}]
                  </span>
                  {curEquip?.id === activeDetailItem.id ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                      ★ 현재 장착중
                    </span>
                  ) : activeDetailItem.equippedHeroId ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                      👤 {state.barracks.find(h => h.id === activeDetailItem.equippedHeroId)?.name || '다른 용병'} 착용중
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                      보관함 (미착용)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#8b9bb4] mt-0.5">
                  {{ weapon: '무기', armor: '방어구', accessory: '장신구' }[activeDetailItem.slot] || '장비'} | 강화 레벨: <span className="text-[#ffd54f] font-bold">+{activeDetailItem.level}강</span> / 10강
                </div>
              </div>
            </div>

            {/* 종합 스탯 */}
            <div className="p-2.5 bg-[#0d121c] border border-[#1f2738] rounded-xl">
              <div className="text-[11px] text-[#8b9bb4] font-bold mb-1">📊 전체 종합 능력치:</div>
              {renderTotalStats(activeDetailItem.stats)}
            </div>

            {/* 인챈트 상세 */}
            {(activeDetailItem.prefix || activeDetailItem.suffix) && (
              <div className="flex flex-col gap-1.5">
                {activeDetailItem.prefix && renderEnchantBadge(activeDetailItem.prefix, activeDetailItem.slot)}
                {activeDetailItem.suffix && renderEnchantBadge(activeDetailItem.suffix, activeDetailItem.slot)}
              </div>
            )}

            {/* 인챈트 없을 때 안내 */}
            {!activeDetailItem.prefix && !activeDetailItem.suffix && (
              <div className="text-[10px] text-[#607d8b] px-1">
                💡 대장간에서 [접두사] 및 [접미사] 인챈트를 부여해 추가 스탯과 고유 스킬을 획득할 수 있습니다.
              </div>
            )}

            {/* 심연의 저주 */}
            {/* 👑 보스 고유 세트 보너스 정보 */}
            {activeDetailItem.setId && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#201608] to-[#121927] border border-[#ffd54f55] flex flex-col gap-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#ffd54f]">
                    <span>👑</span>
                    <span>{activeDetailItem.setName || '보스 고유 세트'}</span>
                  </div>
                  {(() => {
                    const heroEquips = Object.values(hero.equipment || {}).filter(Boolean);
                    const matchingCount = heroEquips.filter(e => e?.setId === activeDetailItem.setId).length;
                    const isFull = matchingCount >= (activeDetailItem.setRequiredCount || 3);
                    return (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isFull ? 'bg-[#ffd54f33] text-[#ffd54f] border border-[#ffd54f88]' : 'bg-[#37474f44] text-[#90a4ae]'}`}>
                        {isFull ? '✨ 3/3 풀세트 완성!' : `(${matchingCount}/3 세트 장착 중)`}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-[11px] text-[#ffecb3] leading-relaxed">
                  {activeDetailItem.setBonusDesc || '무기/방어구/장신구 3세트 착용 시 특별한 보스 세트 보너스가 발현됩니다.'}
                </div>
              </div>
            )}

            {(activeDetailItem.isCorrupted || activeDetailItem.isUnpurified || activeDetailItem.isCursed || activeDetailItem.name.startsWith('[침식된]')) && (
              <div className="p-2.5 rounded-lg bg-[#2a0f14] border border-[#ef535088] text-xs flex flex-col gap-1">
                <span className="font-bold text-[#ef5350] flex items-center gap-1">
                  <span>💀</span>
                  <span>[심연에 침식된 장비]</span>
                </span>
                <span className="text-[11px] text-[#ffcdd2] leading-relaxed">
                  사악한 침식 마기에 오염되어 착용할 수 없습니다. 병기창(대장간) 정화 제단에서 정화한 후 순정 장비로 복원하여 착용하세요.
                </span>
              </div>
            )}

            {/* 클래스 적합성 안내 */}
            <div className="px-1">
              {slot === 'accessory' ? (
                <span className="text-[11px] text-[#38ef7d]">✨ [공용 장신구] 누구나 100% 효과를 발휘합니다.</span>
              ) : gm.isEquipmentCompatible(hero.classId, activeDetailItem) ? (
                <span className="text-[11px] text-[#38ef7d] font-bold">✅ [클래스 적합] 이 영웅의 클래스에 완벽히 호환됩니다.</span>
              ) : (
                <span className="text-[11px] text-[#ef5350] font-bold">⚠️ [비호환 페널티] 스탯 50% 반감 & SPD -3 페널티가 적용됩니다.</span>
              )}
            </div>

            {/* 액션 버튼 그룹 */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#1f2738]">
              {/* 강화 버튼: 병기창 Lv.3 이상 해금 시에만 활성화, 미달 시 잠김 처리 */}
              {isEnhanceUnlocked ? (
                <button
                  className="btn btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#00d2ff22]"
                  onClick={() => {
                    setSelectedEnhanceItemId(activeDetailItem.id);
                  }}
                >
                  <span>⚡ 마도 강화 ({activeDetailItem.level < 10 ? `+${activeDetailItem.level + 1}강 시도` : '최고레벨'})</span>
                </button>
              ) : (
                <button
                  className="btn btn-ghost py-2 text-xs font-bold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed border border-[#2c384d] text-[#8b9bb4]"
                  disabled={true}
                  title="병기창(대장간)을 Lv.3 이상으로 증축해야 장비 강화 공방이 해금됩니다."
                >
                  <span>🔒 마도 강화 (병기창 Lv.3 필요)</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {/* 장착 / 해제 / 교체 / 인계 버튼 */}
                {(activeDetailItem.isCorrupted || activeDetailItem.isUnpurified || activeDetailItem.isCursed || activeDetailItem.name.startsWith('[침식된]')) ? (
                  <button
                    className="btn btn-ghost flex-1 py-2 text-xs font-bold opacity-60 cursor-not-allowed border border-[#ef535066] text-[#ef5350]"
                    disabled={true}
                    title="침식된 장비는 병기창 정화 시설에서 정화하기 전까지 착용할 수 없습니다."
                  >
                    ⚠️ 착용 불가 (정화 필요)
                  </button>
                ) : curEquip?.id === activeDetailItem.id ? (
                  <button
                    className="btn btn-danger flex-1 py-2 text-xs font-bold"
                    onClick={() => {
                      onUnequip(activeDetailItem.slot);
                      setSelectedDetailItem(null);
                    }}
                  >
                    🛡️ 장비 해제
                  </button>
                ) : activeDetailItem.equippedHeroId ? (
                  <button
                    className="btn btn-primary flex-1 py-2 text-xs font-bold"
                    onClick={() => {
                      onEquip(activeDetailItem.id);
                      setSelectedDetailItem(null);
                    }}
                  >
                    🔄 {state.barracks.find(h => h.id === activeDetailItem.equippedHeroId)?.name || '용병'} 장비 인계 장착
                  </button>
                ) : (
                  <button
                    className="btn btn-primary flex-1 py-2 text-xs font-bold"
                    onClick={() => {
                      onEquip(activeDetailItem.id);
                      setSelectedDetailItem(null);
                    }}
                  >
                    {curEquip ? '🔄 교체 장착' : '🛡️ 장착'}
                  </button>
                )}

                {/* 판매 버튼 (미착용/보관함 장비일 경우에만 활성화) */}
                {!activeDetailItem.equippedHeroId && curEquip?.id !== activeDetailItem.id && (
                  <button
                    className="btn btn-ghost text-xs px-3 py-2 font-bold shrink-0 hover:bg-[#c560601f]"
                    style={{ borderColor: '#c56060', borderWidth: '1px', borderStyle: 'solid', color: '#c56060' }}
                    onClick={() => {
                      const price = getSellPrice(activeDetailItem);
                      if (window.confirm(`[${activeDetailItem.name}]을(를) 골드 🪙 ${price.toLocaleString()} G에 매각하시겠습니까?`)) {
                        gm.modifyResource('gold', price);
                        gm.removeEquipmentItem(activeDetailItem.id);
                        SoundManager.getInstance().play('coin');
                        gm.addLog(`🪙 [장비 매각] [${activeDetailItem.name}]을(를) 판매하여 🪙 ${price.toLocaleString()} G를 획득했습니다.`, 'reward');
                        setSelectedDetailItem(null);
                      }
                    }}
                  >
                    🪙 판매 (🪙{getSellPrice(activeDetailItem).toLocaleString()}G)
                  </button>
                )}
              </div>

              <button
                className="btn btn-ghost text-xs py-1.5 hover:bg-[#c560601f] font-bold rounded-lg px-3 flex items-center justify-center gap-1"
                style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
                onClick={() => setSelectedDetailItem(null)}
              >
                <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
                <span style={{ color: '#c56060' }}>닫기</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ⚡ 병기창 강화 상세 UI 모달 연동 ── */}
      {enhanceTargetItem && (
        <EquipmentEnhanceModal
          item={enhanceTargetItem}
          onClose={() => setSelectedEnhanceItemId(null)}
          gm={gm}
          resources={state.resources}
          discountPct={discountPct}
          mult={mult}
        />
      )}

      {/* ── 🗑️ 선택 장비 일괄 판매 확인 모달 ── */}
      {confirmBatchModal && (
        <Modal
          title="⚠️ 선택 장비 일괄 판매 확인"
          open={true}
          onClose={() => setConfirmBatchModal(false)}
          footer={
            <>
              <ActionButton label="취소" variant="ghost" onClick={() => setConfirmBatchModal(false)} />
              <ActionButton
                label={`일괄 판매 실행 (+🪙${batchTotalGold.toLocaleString()}G)`}
                variant="danger"
                onClick={handleExecuteBatchSale}
              />
            </>
          }
        >
          <div className="flex flex-col gap-3 text-left">
            <div className="p-3 rounded-xl bg-[#2a1017] border border-[#ef535055] text-xs leading-relaxed text-[#ffcdd2]">
              선택하신 <strong className="text-white text-sm font-bold">{selectedEquipIds.size}개</strong>의 미착용 장비를 일괄 매각하여<br />
              총 <strong className="text-[#ffd54f] text-sm font-mono font-bold">🪙 {batchTotalGold.toLocaleString()} G</strong>를 획득하시겠습니까?
            </div>
            <div className="text-[11px] text-[#8b9bb4]">
              ※ 매각된 장비는 즉시 인벤토리에서 영구 삭제되며 복구할 수 없습니다.<br />
              ※ 용병들이 착용 중인 장비는 안전하게 보호되어 매각 대상에서 제외됩니다.
            </div>
            {/* 선택 목록 간략 프리뷰 */}
            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 p-2 bg-[#0c0f17] rounded-lg border border-[#1e2638]">
              {Array.from(selectedEquipIds).map(id => {
                const item = state.equipmentInventory.find(e => e.id === id);
                if (!item) return null;
                const t = getEquipmentTier(item);
                return (
                  <div key={id} className="flex items-center justify-between text-[11px] py-1 border-b border-[#1b2230] last:border-0">
                    <span className="flex items-center gap-1.5 text-white truncate max-w-[210px]">
                      <span>{item.icon}</span>
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[9px] text-[#ffd54f] font-mono">+{item.level}강</span>
                      <span className="text-[9px] text-[#8b9bb4] font-mono">({t}T)</span>
                    </span>
                    <span className="text-[10px] text-[#ffd54f] font-mono shrink-0 font-bold">
                      🪙 {getSellPrice(item).toLocaleString()}G
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  🏰 방주 영지 건물별 세계관 서사 및 배경 (Lore)
// ─────────────────────────────────────────────────────────────

function getBuildingLore(id: BuildingId, level: number): string {
  const safeLevel = Math.max(0, Math.min(10, level));
  const LORE_MAP: Record<BuildingId, string[]> = {
    bonfire: [
      '심연의 혹한과 암흑 속에서 아직 불씨를 지피지 못한 거점의 중심 제단입니다.',
      '생존의 불씨를 지핀 기초 성화. 거친 바람을 겨우 막아내는 작은 불꽃이지만, 방주 전역에 생명의 온기를 전파하고 지친 용병들에게 희망을 비춥니다.',
      '화덕을 내화 석재로 보강하고 통풍 구조를 개량하여, 적은 영목으로도 성화의 화력을 더욱 길고 안정적으로 유지합니다.',
      '영목의 심층 수지를 온전히 연소시키는 특수 송풍 장치를 장착하여 불꽃의 열효율을 비약적으로 끌어올렸습니다.',
      '성화대 주변으로 방열 마도 도관을 매설하여, 거점 전역에 온화한 회복의 파동을 일정하게 분출합니다.',
      '신성한 불꽃으로 성채 외곽에 보이지 않는 방호 결계를 형성하여, 혹한과 외부 심연 기운에 의한 온기 소진을 방어합니다.',
      '에테르 기류를 성화 불길과 직접 융합시켜 푸른빛 신성 화염을 일으키며, 방주 거주민의 기력을 빠르게 회복시킵니다.',
      '태고의 원초적 불꽃 심지를 점화하여, 심연 가장 깊은 곳에서 불어오는 절대 영도의 혹한마저 완전히 녹여냅니다.',
      '영구적으로 타오르는 마도 불꽃 심장을 구축하여, 불씨가 꺼지지 않는 불멸의 거점 중심핵을 완성했습니다.',
      '신화 속 정화의 불꽃을 현현시켜, 거점 내부로 침투하려는 모든 심연의 침식과 부패를 원천 차단합니다.',
      '태양의 파편이라 불리는 불멸의 태양 성화. 영구적인 신성 결계가 거점 전체를 감싸며 암흑의 바다 속에서 영원히 꺼지지 않는 구원의 등대가 됩니다.'
    ],
    cabin: [
      '심연의 황야에서 구출된 피난민들이 머물 임시 거처가 아직 마련되지 않았습니다.',
      '구출된 피난민들을 위한 기초 목조 주거 구역. 거친 비바람을 피할 수 있게 되면서 방주에 정착한 주민들이 감사의 뜻으로 소액의 세금을 납부하기 시작합니다.',
      '몰려드는 생존자들을 위해 복층 주거 시설을 증축하고, 공동 취사장과 위생 시설을 정비하여 정주 환경을 개선했습니다.',
      '심연의 한기를 차단하는 단열재와 방한 방풍 벽을 시공하여 주민들의 생활 안정도를 크게 높였습니다.',
      '주민 자치회가 조직되어 질서 있는 자원 배급과 세금 징수 체계가 확립되었으며, 안정적인 식량 공급을 기반으로 거점이 번영하기 시작합니다.',
      '방주 중심부까지 주거 구역을 대대적으로 확장하여 대규모 정주 인구를 수용하고 정기적인 세수 기반을 탄탄히 다졌습니다.',
      '주거와 소규모 공방이 결합된 상업 거주 복합 단지를 조성하여, 거점 내부 경제 순환의 중대한 전환점을 마련했습니다.',
      '체계적인 도시 구획과 상업 지구 활성화로 주민들의 소득이 급증하며, 레벨당 30% 복리 증산 특화가 가동되어 막대한 세수가 쏟아집니다.',
      '고층 석조 주택과 상업 가로수가 늘어서며 방주의 핵심 신도시로 급부상하고, 대규모 주민 세수가 거점 금고를 가득 채웁니다.',
      '에테르 난방 도관과 마도 편의 시설이 완비된 중핵 메트로폴리스로 진화하여, 수많은 생존자들이 선망하는 최고의 안식처가 되었습니다.',
      '심연의 한복판에 우뚝 솟은 기적의 최고 번영도시. 완벽한 자치 행정과 풍요로운 상업망을 바탕으로 방주 최대의 골드 세금을 창출합니다.'
    ],
    lumberCamp: [
      '방주 주변에 자생하는 고대 영목을 벌채할 시설이 아직 마련되지 않았습니다.',
      '거점 외곽에 고대 영목 벌채 시설을 재건했습니다. 단단하고 마력을 머금은 영목을 정기적으로 수확하여 시설 건설과 성화의 땔감으로 공급합니다.',
      '강화 강철 도끼와 견인 수송로를 정비하여 거친 삼림 지대에서의 목재 운반 효율을 비약적으로 개선했습니다.',
      '뿌리 깊은 고목이 밀집된 심층 벌목 구역을 개방하여 고품질의 두꺼운 마도 영목을 대량으로 수확하기 시작합니다.',
      '증기 구동식 자동 제재 기계를 도입하여 벌채된 통나무를 규격화된 건축 자재로 신속하게 가공합니다.',
      '마력 온실에서 영목 묘목을 집중 증식하는 순환 조림 시스템을 가동하여, 자체 자립도가 상승하고 골드 유지비가 7% 감면됩니다.',
      '수백 년간 심연의 기운을 견뎌낸 고대 거목 제재 공정을 확립하여 목재 생산 효율을 극대화하고 유지비를 14% 감면합니다.',
      '증기 궤도 운반차와 고속 톱날 기구를 전면 도입하여 벌목부터 제재까지의 전 공정을 기계화하고 유지비를 21% 절감합니다.',
      '심연의 침식에 완벽한 내성을 지닌 특수 암흑 영목 수림을 개척하여 극상의 내구도를 자랑하는 자재를 수급하고 유지비를 28% 절감합니다.',
      '에테르 마도 공학이 융합된 자동 벌채 골렘 시스템을 배치하여 인력 소모 없이 목재를 쏟아내고 유지비를 35% 절감합니다.',
      '신성한 마력이 샘솟는 방주 최대의 영목 삼림원을 완성했습니다. 영구적인 목재 최대 생산과 함께 42%의 최대 유지비 감면을 달성합니다.'
    ],
    quarry: [
      '부유성 지반 깊숙한 곳의 에테르 석재 광맥을 시추할 시설이 없습니다.',
      '방주 지반에 채굴 시추탑을 설치했습니다. 견고한 건축용 석재를 지상으로 끌어올려 방주 기반 시설 확장의 토대를 마련합니다.',
      '합금 시추 드릴을 보강하고 유압식 암반 파쇄기를 장착하여 단단한 심층 지반을 거침없이 뚫고 들어갑니다.',
      '지반 심층부에서 룬 마력이 깃든 고순도 철광맥을 발견하여, 석재와 함께 귀중한 룬 철광석을 동시 채굴하기 시작합니다.',
      '고압 증기 파쇄 드릴을 가동하여 거대한 암반을 신속히 부수고 광석 채굴량을 한 단계 끌어올립니다.',
      '채굴된 원석에서 철광석을 고속으로 자동 선별하는 비중 분리기를 증설하여 자립도를 높이고 유지비를 7% 감면합니다.',
      '풍부한 룬 철광맥의 본류에 도달하여 철광석 생산량을 대폭 증산하고 설비 최적화로 유지비를 14% 감면합니다.',
      '마도 지반 고주파 굴착 진동파 시스템을 도입하여 단단한 금강 암반도 모래처럼 분쇄하며 유지비를 21% 감면합니다.',
      '심연 밑바닥까지 직통으로 뚫린 수직 채굴 터널을 완공하여 희귀 광맥을 직통 수송하고 유지비를 28% 감면합니다.',
      '고밀도 룬 철광석 층을 집중 타격하여 철광석 생산량을 극대화하고 자동 채굴 라인으로 유지비를 35% 감면합니다.',
      '방주 지반 전체의 광맥을 장악한 전설적인 에테르 대광맥 시추소. 막대한 석재와 철광을 쏟아내며 42%의 최대 유지비 감면을 달성합니다.'
    ],
    butchery: [
      '토벌한 심연 마물의 사체에서 식량과 생체 재료를 가공할 시설이 없습니다.',
      '원정대가 토벌한 마물의 사체를 정제하는 기초 해체 시설. 독소를 걸러내어 방주 거주민과 원정대를 위한 보급 식량을 생산합니다.',
      '생체 독소와 잔류 마기를 완벽히 중화하는 다단계 여과 필터를 장착하여 안전하고 영양가 높은 식량 생산을 보장합니다.',
      '마수의 질긴 가죽을 손상 없이 벗겨내어 방어구 및 고급 자재로 가공하는 전문 무두질 공정을 해금했습니다.',
      '대형 증기 훈제실과 보존 처리 라인을 도입하여 대량의 마물 고기를 신속하게 장기 보존 식량으로 가공합니다.',
      '혁신적인 [대량 배급제] 시스템을 확립하여 방주 전역 시설의 식량 유지비를 30% 영구 감면하고 식량 생산량을 80% 대폭 증산합니다.',
      '전문 무두질 장인들을 배치하여 가죽 생산량을 늘리고 식량 가공 라인을 2배로 확장했습니다.',
      '마수의 순수 생체 에너지만을 추출하여 농축 캡슐로 제조하는 첨단 라인을 신설해 고밀도 영양을 보급합니다.',
      '전 거주민을 아우르는 고농축 영양 배급제를 완벽히 정착시켜 방주의 만성적인 식량 불안을 종식시켰습니다.',
      '최상급 마수의 가죽을 완벽한 가공품으로 전환하는 극대화 라인을 가동하여 전략 군수 가죽을 대량 공급합니다.',
      '심연의 생명 에너지를 완벽한 자원으로 전환하는 궁극의 생체 정제 플랜트. 최대치의 식량과 가죽을 영구히 쏟아냅니다.'
    ],
    tavern: [
      '방랑하는 용병들과 정보원들이 모여들 따뜻한 휴식처가 없습니다.',
      '따뜻한 모닥불과 독한 술이 있는 방랑 주점을 개방했습니다. 새로운 용병 후보 3명을 영입할 수 있으며 의뢰 게시판이 활성화됩니다.',
      '안락한 주점 분위기가 입소문을 타며 각지의 실력자들이 모여들고, 서브 퀘스트의 의뢰 보상이 더욱 풍성해집니다.',
      '심연 각지의 정보원 네트워크와 직통으로 연결되어 고난도 고급 비밀 의뢰와 값진 보상을 접수하기 시작합니다.',
      '라운지 좌석을 확충하여 대기 용병 풀을 4명으로 늘리고, 실전 경험이 풍부한 [V] 베테랑 등급 용병이 출현하기 시작합니다.',
      '자체 주방과 농장 네트워크를 통한 식량 자체 조달을 가동하여 주점 자체에서 15초마다 식량을 생산하기 시작합니다.',
      '명성이 드높아지며 용병 풀이 5명으로 확장되고, 뛰어난 무용을 지닌 [H] 히어로 등급 용병이 계약을 위해 찾아옵니다.',
      '주점 식당을 증축하여 식량 생산량을 늘리고, 매일 1회 무료로 용병 명단을 갱신하는 특권을 해금했습니다.',
      '전설적인 영웅들이 모여드는 명소가 되어 용병 풀이 6명으로 늘어나고, 일기당천의 [E] 에픽 등급 용병이 출현합니다.',
      '주점 자체 식량 수급을 극대화하고 강력한 교섭력을 바탕으로 전 용병의 고용 계약금을 안정화했습니다.',
      '차원 전체에 이름을 떨치는 최고 명성의 라운지. 명성이 극에 달하여 전 용병 계약 비용이 영구적으로 20% 할인됩니다.'
    ],
    blacksmith: [
      '마도 장비를 단조하고 무구를 강화할 모루와 화덕이 없습니다.',
      '심연 대장간을 재건했습니다. 원정대의 기본 생존을 책임지는 1티어 순수 기본 장비 단조와 기초 +3강 강화를 지원합니다.',
      '특수 담금질 공정을 도입하여 2티어 단련된 강철 장비를 단조하고, +5강 한계 돌파와 함께 단조 비용 10% 할인을 적용합니다.',
      '마도 룬 각인 기술을 완성하여 3티어 희귀 장비를 단조하고, +7강 강화와 함께 장비에 특별한 힘을 부여하는 [접두어 인챈트] 슬롯을 개방합니다.',
      '심연 흑요석 정련로를 증설하여 견고한 4티어 정예 흑요석 장비를 단조하고 제작 비용을 추가로 절감합니다.',
      '상급 에픽 단조 레시피를 해금하여 5티어 심연 파멸 장비를 제작하고, 강력한 특수 능력을 부여하는 [접미어 인챈트] 슬롯을 개방합니다.',
      '진홍 혈염의 화덕을 완성하여 6티어 결전 장비를 단조하고, 정밀 마도 계측을 통해 강화 성공률을 보정합니다.',
      '신화적 명장의 경지에 도달하여 7티어 망각 사신 장비를 제작하고, +10강 최고 강화와 [순수 마도석] 인챈트 슬롯을 전면 해금합니다.',
      '성스러운 맹세의 기운이 깃든 8티어 단죄의 장비를 단조하며, 공방 설비 최적화로 전 제작/강화 비용을 16% 영구 감면합니다.',
      '시공간의 환영을 담은 9티어 만화경 장비를 단조하며, 전 제작/강화 비용을 18% 영구 감면합니다.',
      '신화의 정점에 도달한 최고 명장의 병기창. 10티어 종말 신화 장비를 단조하며 전 단조 및 강화 비용 20% 영구 할인을 제공합니다.'
    ],
    sanctuary: [
      '용병의 영혼을 인도하고 상위 클래스로 승격시킬 신성한 제단이 없습니다.',
      '영혼의 제단을 개방했습니다. 용병들이 영혼의 벽을 깨고 성기사, 암살자, 대마도사 등 1차 상위 클래스로 전직할 수 있는 성소가 마련됩니다.',
      '영혼의 파동을 조율하여 기본 클래스 경험치 획득량을 +20% 상시 증폭시키고, 전직 시 등급 승격 확률을 6% 부여합니다.',
      '성스러운 마나의 샘을 연결하여 기본 클래스 경험치 획득량을 +30%로 강화하고 전직 등급 승격률을 9%로 높입니다.',
      '영혼 각성 의식을 고도화하여 기본 클래스 경험치 획득량을 +40%로 끌어올리고 전직 등급 승격률을 12%로 높입니다.',
      '심연의 심연을 꿰뚫는 2차 심연 승격을 해금하고, 기본 클래스 EXP를 최대 +50%까지 증폭시키며 등급 승격률을 15%로 확장합니다.',
      '초월적 깨달음의 불꽃을 밝혀 1차 각성 클래스의 경험치 획득량을 +10% 추가 증폭시키기 시작합니다.',
      '신성한 영혼 공명을 심화하여 1차 각성 클래스의 경험치 획득량을 +20%로 증폭시키고 등급 승격률을 21%로 높입니다.',
      '고대 영웅들의 영혼 기억을 전수하여 1차 각성 클래스의 경험치 획득량을 +30%로 증폭시키고 등급 승격률을 24%로 높입니다.',
      '영혼 승격의 정점에 도달하여 1차 각성 클래스 경험치 증폭을 최대 +40%까지 달성하고 등급 승격률을 27%로 높입니다.',
      '완전한 신성 각성의 전당. 모든 파티원의 올스탯을 상시 +10% 증가시키는 영구 축복을 내리며 전직 등급 승격률을 +30%로 완성합니다.'
    ],
    alchemy: [
      '대기 중의 희박한 마나 기류를 포집하여 에테르를 응축할 연금 장치가 없습니다.',
      '기초 에테르 증류 장치를 가동했습니다. 마도 시설과 영혼 승격에 필수적인 마나의 결정체 "에테르"를 60% 증산하여 안정적으로 정제합니다.',
      '다단계 정제 증류관을 개량하여 대기 중의 에테르 기류를 더욱 높은 밀도로 압축하고 순도를 높였습니다.',
      '마나 촉매 반응로를 설치하여 원석과 대기 마나의 합성 반응을 촉진하고 정제 속도를 끌어올렸습니다.',
      '고압 에테르 추출 챔버를 도입하여 미세한 마나 손실 없이 고순도 에테르 액적을 고속으로 추출합니다.',
      '에테르 기화 촉매 공정을 완성하여 생산량을 60% 추가 증산하며, 틱당 막대한 양의 에테르를 쏟아냅니다.',
      '혁신적인 [에테르 환류관]을 연결하여 병기창, 제단, 게이트 등 모든 마도 시설의 에테르 유지비를 25% 영구 감면합니다.',
      '순수 마나 환류 챔버를 가동하여 정제 중 손실되는 마나를 100% 재순환시키며 에테르 생산량을 한 단계 높입니다.',
      '초전도 에테르 유로를 매설하여 방주 전체의 마도 네트워크와 직결하고 정제 효율을 극대화했습니다.',
      '시공간 왜곡을 이용한 에테르 응축기를 설치하여 주변 차원의 순수 에테르를 빨아들여 고밀도로 정제합니다.',
      '에테르의 무한 순환을 이룩한 전설의 무한 에테르 코어. 거대한 마나 기둥을 형성하며 방주 최강의 에테르 생산력을 영구 공급합니다.'
    ],
    arenaGate: [
      '다른 차원의 방주 원정대와 연결되는 시공간 앵커 관문이 닫혀 있습니다.',
      '차원 균열을 안정화하여 비동기 PVP 결투장을 개방했습니다. 다른 지휘관의 원정대와 무용을 겨루고 명예 상점 1단계에서 보급품을 교환합니다.',
      '차원 앵커의 주파수를 정밀 동기화하여 PVP 연승 보상을 강화하고 명예 상점 2단계에서 인챈트 마도석을 개방합니다.',
      '차원 너머 거대한 공포가 도사리는 [차원 네메시스 월드 레이드] 관문을 개방하고, 전 대원의 PVE 공격력 +5% 특권을 획득합니다.',
      '네메시스 기여도 보상을 확대하고 명예 상점 4단계에서 고급 영웅 장신구 [투사의 용맹 목걸이]를 해금합니다.',
      '차원 공명을 강화하여 명예 암시장 5단계를 개방하고 전설 영웅 장신구 [투사의 영광 반지]와 PVE 올스탯 +5%를 부여합니다.',
      '차원 도약 터널을 열어 5인 정예 부대로 타 영지를 습격해 자원을 약탈하는 [차원 영지 침공]을 해금하고 PVE 치명타율 +5%를 획득합니다.',
      '차원 격리 결계를 강화하여 명예 상점 7단계를 개방하고 신화 전설 성유물 상자와 PVE 피해량 +8% 특권을 해금합니다.',
      '랭커 전용 차원 버프를 강화하여 명예 상점 8단계에서 [궁극의 마도석]을 해금하고 PVE 피해량을 +12%로 끌어올립니다.',
      '차원의 벽을 자유자재로 넘나들며 명예 상점 9단계에서 [초월의 전직 비전서]를 해금하고 PVE 피해량을 +15%로 증폭합니다.',
      '차원 전체의 지배자로 군림하는 패왕의 관문. 명예 상점 10단계 [차원 패왕의 보관함]을 개방하며 모든 PVE 랭커 버프를 50% 영구 증폭합니다.'
    ],
    storage: [
      '방주의 군수 물자를 보관할 체계적인 물류 창고가 없습니다.',
      '기초 군수 보관 창고를 가동했습니다. 27종의 전 자원을 안전하게 보관하며 유지비가 전혀 들지 않는 영구 안전 인프라입니다.',
      '고층 적재 랙을 전면 증설하여 기초 생산물, 파밍 재료, 심연 희귀품의 모든 보관 상한을 2배로 확장했습니다.',
      '물류 구획을 체계적으로 분할하여 기초 원자재와 파밍 재료의 적재 한도를 1,000개까지 대폭 확대했습니다.',
      '마도 항온 격납고를 완공하여 변질되기 쉬운 에테르와 목재, 식량 등 영지 생산품의 적재량을 2,000개로 늘렸습니다.',
      '카테고리별 전문 수납 시스템을 구축하여 보관이 까다로운 심연 희귀 유물과 인챈트석을 500개까지 안전하게 격리 보관합니다.',
      '강화 합금 대용량 격벽 창고를 증축하여 영지 생산물의 보관 한도를 6,000개로 비약적으로 확장했습니다.',
      '중앙 집중식 자동 승강 물류 타워를 가동하여 던전 파밍 재료의 적재 한도를 3,200개로 넓혔습니다.',
      '고대 유물의 잔류 마기를 차단하는 차원 격리 금고를 완공하여 심연 희귀품 보관 한도를 800개로 늘렸습니다.',
      '대규모 군수 창고군을 확충하여 영지 생산품 16,000개, 파밍 재료 4,400개의 거대한 보관 능력을 확보했습니다.',
      '방주 최대 규모의 중앙 병참고를 완전 증축했습니다. 기초 20,000개, 파밍 5,000개, 심연 1,000개, 골드 1억의 궁극의 적재 한도를 달성합니다.'
    ],
    infirmary: [
      '전투에서 중상을 입고 쓰러진 용병들을 치료할 의료 시설이 없습니다.',
      '생체 복원 병동을 개설했습니다. 병상 2개를 가동하여 부상당한 대원들의 체력을 5초마다 +5씩 안정적으로 치료합니다.',
      '약초 농축 추출기와 소독 설비를 개선하여 치료 주기를 10% 단축하고 4초마다 HP +5를 회복시킵니다.',
      '병상을 3개로 증설하고 신체 재생 촉진제를 투여하여 여러 대원을 동시에 안정적으로 치료합니다.',
      '에테르 생체 캡슐을 장착하여 고갈된 마나(MP)를 5초마다 +4씩 충전하는 [MP 회복 시스템]을 전면 해금했습니다.',
      '병상을 4개로 증설하고 MP 충전 주기를 4초로 단축하여 마법 대원들의 전선 복귀를 가속화합니다.',
      '병상을 5개로 증설하고 고농축 에테르 생체액을 순환시켜 원정대 대다수를 동시에 집중 치료합니다.',
      '병상을 6개로 증설하고 HP 치료 주기를 2초, MP 충전 주기를 3초로 대폭 단축하여 치명상도 순식간에 복원합니다.',
      'MP 충전 주기를 2초로 단축하여 마나를 소진한 용병들을 즉시 완충 상태로 되돌립니다.',
      '병상을 7개로 증설하여 원정대 전원을 동시 수용하고, 1초마다 HP +5를 회복시키는 초고속 치료를 가동합니다.',
      '기적의 생체 재생 기술이 집약된 궁극의 생체 챔버. 7개 병상에서 1초마다 HP +5와 MP +4를 동시 회복시켜 즉시 전선으로 복귀시킵니다.'
    ],
    market: [
      '암시장의 밀무역 상인들과 비밀 비전서를 거래할 교역소가 없습니다.',
      '암시장 교역소를 개설했습니다. 17종 자원의 자유로운 환전과 함께 15초마다 2골드를 수급하고, 유지비 지불 주기를 21초로 연장합니다.',
      '거래 한도를 확장하고 비밀 유통망을 정비하여 유지비 지불 주기를 22초로 연장하고 골드 수입을 늘립니다.',
      '거래 수수료를 10% 인하하고 용병들의 잠재력을 깨우는 1티어 전술 비전서를 정기 입고하기 시작합니다.',
      '1티어 전술 비전서의 품목을 클래스별로 다양화하고 유지비 지불 주기를 24초로 연장합니다.',
      '혁신적인 [상업 네트워크]를 가동하여 방주 전체의 골드 유지비를 25% 영구 감면하고 2티어 고급 비전서를 입고합니다.',
      '인챈트 마도석의 암시장 재고를 대폭 확충하고 유지비 지불 주기를 26초로 연장합니다.',
      '희귀 파밍 재료와 상급 마도석의 직통 공급선을 확보하여 거점 경제의 자립도를 한층 끌어올립니다.',
      '대규모 교역으로 환율 우대율을 추가 상향하고 유지비 지불 주기를 28초로 연장합니다.',
      '거래 수수료를 추가 인하하여 자원 환전 손실을 최소화하고 유지비 주기를 29초로 늘립니다.',
      '황혼의 상권을 장악한 완전한 암시장. 최상위 비급서 출현과 함께 전 품목 20% 특별 할인을 제공하며 유지비 주기를 30초로 최대 연장합니다.'
    ]
  };

  return LORE_MAP[id]?.[safeLevel] || '방주의 주요 거점 시설입니다.';
}

// ─────────────────────────────────────────────────────────────
//  🏰 방주 영지 건물별 실시간 가동 효과 및 승급 정보
// ─────────────────────────────────────────────────────────────

function getBuildingStatusInfo(id: BuildingId, level: number, hasWarmth: boolean): { currentText: string; nextText: string; badge?: string } {
  const warmthMult = hasWarmth ? 1.15 : 1.0;
  switch (id) {
    case 'cabin': {
      const baseGold = GameManager.getCabinBaseProduction(level);
      const nextLevel = level + 1;
      const nextGold = GameManager.getCabinBaseProduction(nextLevel);
      const cur = Math.ceil(baseGold * warmthMult);
      const diff = nextGold - baseGold;
      return {
        badge: level > 0 ? `🪙 +${cur}/13초` : undefined,
        currentText: level > 0 
          ? `골드 세금 🪙 +${cur}/13초 자동 수급${hasWarmth ? ' (온기+15%)' : ''}` 
          : '골드 세금 정기 징수 (미건설)',
        nextText: level < 10 ? `➔ 다음 Lv.${nextLevel}: 🪙 +${nextGold}/13초 (+${diff}G)` : '★ 최고 레벨 도달'
      };
    }
    case 'lumberCamp': {
      const baseWood = Math.max(1, Math.round(level * 2 * 0.9));
      const cur = Math.ceil(baseWood * warmthMult);
      const next = Math.max(1, Math.round((level + 1) * 2 * 0.9));
      return {
        badge: level > 0 ? `🪵 +${cur}/9초` : undefined,
        currentText: level > 0 
          ? `영목 벌목 🪵 +${cur}/9초 생산${hasWarmth ? ' (온기+15%)' : ''}` 
          : '방주 고대 영목 벌채 및 목재 수급 (미건설)',
        nextText: level < 10 ? `➔ 다음 Lv.${level + 1}: 🪵 +${next}/9초 (+${next - baseWood})` : '★ 최고 레벨 도달'
      };
    }
    case 'quarry': {
      const baseStone = Math.max(1, Math.round(level * 2 * 0.9));
      const curStone = Math.ceil(baseStone * warmthMult);
      const curIron = level >= 3 ? Math.ceil(Math.floor(level / 3) * warmthMult) : 0;
      const nextStone = Math.max(1, Math.round((level + 1) * 2 * 0.9));
      let badge = '';
      if (level > 0) {
        badge = curIron > 0 ? `🪨+${curStone}/11초, ⚙️+${curIron}/11초` : `🪨+${curStone}/11초`;
      }
      let nextDesc = `➔ 다음 Lv.${level + 1}: 🪨 +${nextStone}/11초`;
      if (level === 2) nextDesc = `➔ 다음 Lv.3: ⚙️ 철광석 동시 채굴 해금 (🪨+${nextStone}, ⚙️+1/11초)`;
      else if (level === 5) nextDesc = `➔ 다음 Lv.6: ⚙️ 철광석 증산 (🪨+${nextStone}, ⚙️+2/11초)`;
      else if (level === 8) nextDesc = `➔ 다음 Lv.9: ⚙️ 철광석 증산 (🪨+${nextStone}, ⚙️+3/11초)`;

      return {
        badge: badge || undefined,
        currentText: level > 0 
          ? (curIron > 0 ? `석재 🪨 +${curStone}, 철광석 ⚙️ +${curIron}/11초 채굴${hasWarmth ? ' (온기+15%)' : ''}` : `석재 🪨 +${curStone}/11초 채굴${hasWarmth ? ' (온기+15%)' : ''}`)
          : '지반 심층 에테르 석재 및 룬 철광 시추 (미건설)',
        nextText: level < 10 ? nextDesc : '★ 최고 레벨 도달'
      };
    }
    case 'butchery': {
      const baseFood = GameManager.getButcheryBaseProduction(level);
      const curFood = Math.ceil(baseFood * warmthMult);
      const curLeather = level >= 3 ? Math.ceil(Math.floor(level / 3) * warmthMult) : 0;
      const nextBaseFood = GameManager.getButcheryBaseProduction(level + 1);
      const nextFood = nextBaseFood;
      let badge = '';
      if (level > 0) {
        badge = curLeather > 0 ? `🍖+${curFood}/13초, 🥋+${curLeather}/13초` : `🍖+${curFood}/13초`;
      }
      let nextDesc = `➔ 다음 Lv.${level + 1}: 🍖 +${nextFood}/13초`;
      if (level === 2) nextDesc = `➔ 다음 Lv.3: 🥋 가죽 무두질 공정 해금 (🍖+${nextFood}, 🥋+1/13초)`;
      else if (level === 4) nextDesc = `➔ 다음 Lv.5: ★[대량 배급제] 해금 & 식량 대폭 증산 (🍖+${nextFood}/13초)`;
      else if (level === 5) nextDesc = `➔ 다음 Lv.6: 🥋 가죽 및 식량 증산 (🍖+${nextFood}, 🥋+2/13초)`;

      return {
        badge: badge || undefined,
        currentText: level > 0 
          ? (curLeather > 0 ? `보급 식량 🍖 +${curFood}, 가죽 🥋 +${curLeather}/13초 생산` : `보급 식량 🍖 +${curFood}/13초 생산`)
          : '심연 마물 사체 정제 및 보급 식량/가죽 가공 (미건설)',
        nextText: level < 10 ? nextDesc : '★ 최고 레벨 도달'
      };
    }
    case 'alchemy': {
      const baseEther = GameManager.getAlchemyBaseProduction(level);
      const nextBaseEther = GameManager.getAlchemyBaseProduction(level + 1);
      const cur = Math.ceil(baseEther * warmthMult);
      const next = nextBaseEther;
      return {
        badge: level > 0 ? `✨ +${cur}/15초` : undefined,
        currentText: level > 0 
          ? `에테르 정제 ✨ +${cur}/15초 생산${hasWarmth ? ' (온기+15%)' : ''}` 
          : '에테르 기류 정제 및 마도 촉매 합성 (미건설)',
        nextText: level === 4
          ? `➔ 다음 Lv.5: ★ 에테르 증산 가속 (✨+${next}/15초)`
          : (level === 5
            ? `➔ 다음 Lv.6: ★[에테르 환류관] 마도 에테르 유지비 감면 해금 (✨+${next}/15초)`
            : (level < 10 ? `➔ 다음 Lv.${level + 1}: ✨ +${next}/15초` : '★ 최고 레벨 도달'))
      };
    }
    case 'storage': {
      const curBasic = GameManager.STORAGE_CAPACITIES_BASIC[Math.min(10, Math.max(0, level))] || 250;
      const curFarm = GameManager.STORAGE_CAPACITIES_FARMING[Math.min(10, Math.max(0, level))] || 250;
      const curRare = GameManager.STORAGE_CAPACITIES_RARE[Math.min(10, Math.max(0, level))] || 50;

      const nextBasic = GameManager.STORAGE_CAPACITIES_BASIC[Math.min(10, Math.max(0, level + 1))] || 250;
      const nextFarm = GameManager.STORAGE_CAPACITIES_FARMING[Math.min(10, Math.max(0, level + 1))] || 250;
      const nextRare = GameManager.STORAGE_CAPACITIES_RARE[Math.min(10, Math.max(0, level + 1))] || 50;

      return {
        badge: level > 0 ? `📦 🏰${curBasic.toLocaleString()} 🌿${curFarm.toLocaleString()} 🔮${curRare.toLocaleString()}` : undefined,
        currentText: level > 0 
          ? `적재 한도: 🏰영지 생산물 ${curBasic.toLocaleString()}개 | 🌿던전 파밍 ${curFarm.toLocaleString()}개 | 🔮심연 희귀품 ${curRare.toLocaleString()}개` 
          : '27종 전략 군수 물자 보관 및 적재 한도 확장 (미건설)',
        nextText: level < 10 
          ? `➔ 다음 Lv.${level + 1}: 🏰영지 ${nextBasic.toLocaleString()}개, 🌿파밍 ${nextFarm.toLocaleString()}개, 🔮심연 ${nextRare.toLocaleString()}개로 확장` 
          : '★ 최고 레벨 도달'
      };
    }
    case 'blacksmith': {
      const perks = [
        '전술 장비 단조 및 강화 병기창 (미건설)',
        '1티어 순수 기본 장비 단조 해금 (강화 탭 미해금)',
        '2티어 단련된 강철 단조 & 단조 비용 10% 할인 (강화 탭 미해금)',
        '★ [장비 강화] 탭 해금 & 최대 +5강 돌파 & [접두어 인챈트] 슬롯 해금 (3티어 마도 룬 각인)',
        '4티어 흑요석 정예 단조 & 단조 비용 12% 할인 (최대 +5강 유지)',
        '★ 최대 +8강 강화 한계 돌파 & [접미어 인챈트] 슬롯 해금 (5티어 심연 파멸 에픽)',
        '★ [강화 보급품 7종] 전면 대체 생산 해금 (일반 보급품 ➔ 에테르 횃불, 던전 도시락 등 전면 대체) & 6티어 진홍 혈염 단조',
        '★ 최대 +10강 최고 강화 돌파 & [순수 마도석] 인챈트 슬롯 해금 (7티어 망각 사신)',
        '8티어 단죄의 맹세 단조 & 전 제작/강화 비용 16% 영구 할인',
        '9티어 만화경 환영 단조 & 전 제작/강화 비용 18% 영구 할인',
        '★ [장비 각성] 시스템 해금 (+10강 각성 20% 성공 시 스탯 영구 보존 + 0강 초기화, 최대 3각성, 실패 시 파괴) & 전 비용 20% 할인 & 10티어 종말 신화'
      ];
      const nextPerks = [
        '➔ 건설 시: 1티어 순수 기본 장비 단조 해금 (강화 탭 미해금)',
        '➔ 다음 Lv.2: 2티어 단련된 강철 단조 & 단조 10% 할인',
        '➔ 다음 Lv.3: ★ [장비 강화] 탭 해금 & 최대 +5강 돌파 & [접두어 인챈트] 해금',
        '➔ 다음 Lv.4: 4티어 흑요석 정예 장비 단조 & 12% 할인',
        '➔ 다음 Lv.5: ★ 최대 +8강 강화 한계 돌파 & [접미어 인챈트] 해금 (5티어)',
        '➔ 다음 Lv.6: ★ [강화 보급품 7종] 전면 대체 생산 해금 (일반 보급품 ➔ 에테르 횃불 등 대체)',
        '➔ 다음 Lv.7: ★ 최대 +10강 최고 강화 돌파 & [순수 마도석] 인챈트 해금 (7티어)',
        '➔ 다음 Lv.8: 전 제작/강화 비용 16% 영구 할인 & 8티어 단조',
        '➔ 다음 Lv.9: 전 제작/강화 비용 18% 영구 할인 & 9티어 단조',
        '➔ 다음 Lv.10: ★ [장비 각성] 해금 (20% 성공 시 스탯 보존 + 0강 초기화, 실패 시 파괴) & 전 비용 -20% 할인'
      ];
      return {
        badge: level > 0 ? (level >= 10 ? '⚒️ 장비 각성' : level >= 7 ? '⚒️ +10강/순수석' : level >= 6 ? '⚒️ 강화보급품' : level >= 5 ? '⚒️ +8강/접미어' : level >= 3 ? '⚒️ +5강/강화해금' : '⚒️ 단조') : undefined,
        currentText: perks[level] || '마도 장비 단조/강화',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'tavern': {
      const poolSizes = [0, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6];
      const curFood = Math.ceil(GameManager.getTavernBaseFoodProduction(level) * warmthMult);
      const nextFood = GameManager.getTavernBaseFoodProduction(level + 1);
      const perks = [
        '방랑 용병 계약 영입 및 서브 퀘스트 게시판 (미건설)',
        '용병 후보 3명 풀 & 서브 퀘스트 의뢰 게시판 개방',
        '서브 퀘스트 보상 강화 (입소문 확산)',
        '고급 서브 퀘스트 의뢰 접수 개방',
        '용병 풀 4명 증설 & [V] 베테랑 등급 용병 출현 해금',
        '★ 식량 자체 조달 🍖+3/15초 생산 가동',
        '용병 풀 5명 증설 & [H] 히어로 등급 용병 출현 해금 & 🍖+3/15초',
        '★ 식량 증산 🍖+7/15초 & 일일 무료 새로고침 1회 해금',
        '용병 풀 6명 증설 & [E] 에픽 등급 용병 출현 해금 & 🍖+7/15초',
        '★ 식량 증산 🍖+10/15초 & 용병 고용 계약금 안정화',
        '★ 전 용병 영입 비용 -20% 영구 할인 & 🍖+10/15초'
      ];
      const nextPerks = [
        '➔ 건설 시: 방랑 주점 개방 & 용병 후보 3명 풀 & 서브 퀘스트 해금',
        '➔ 다음 Lv.2: 서브 퀘스트 보상 강화 (입소문 확산)',
        '➔ 다음 Lv.3: 고급 서브 퀘스트 의뢰 접수 개방',
        '➔ 다음 Lv.4: 용병 풀 4명 & [V] 베테랑 등급 출현 해금!',
        '➔ 다음 Lv.5: ★ 식량 자체 조달(🍖+3/15초) 생산 가동!',
        '➔ 다음 Lv.6: 용병 풀 5명 & [H] 히어로 등급 출현 해금!',
        '➔ 다음 Lv.7: ★ 식량 증산(🍖+7/15초) & 일일 무료 새로고침 해금!',
        '➔ 다음 Lv.8: 용병 풀 6명 & [E] 에픽 등급 출현 해금!',
        '➔ 다음 Lv.9: ★ 식량 증산(🍖+10/15초) & 영입 비용 안정화',
        '➔ 다음 Lv.10: ★ 전 용병 영입 비용 -20% 영구 할인 & 최고 명성'
      ];
      return {
        badge: level > 0
          ? (curFood > 0 ? `🍺 후보 ${poolSizes[level]}명 (🍖+${curFood}/15s)` : `🍺 후보 ${poolSizes[level]}명`)
          : undefined,
        currentText: perks[level] || '용병 영입 & 식량 조달',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'sanctuary': {
      const basicExpBonus = level >= 2 ? Math.min(50, level * 10) : 0;
      const tier1ExpBonus = level >= 6 ? Math.min(40, (level - 5) * 10) : 0;
      const perks = [
        '클래스 승격 및 영혼 한계 돌파 제단 (미건설)',
        '1차 상위 클래스 전직 해금 (성기사, 암살자, 대마도사 등)',
        '★ 기본 클래스 경험치 +20% 상시 증폭 (전직 등급 상승 확률 +6%)',
        '기본 클래스 경험치 +30% 증폭 (전직 등급 상승 확률 +9%)',
        '기본 클래스 경험치 +40% 증폭 (전직 등급 상승 확률 +12%)',
        '★ 2차 심연 승격 해금 & 기본 클래스 EXP +50% (최대) (등급 상승 확률 +15%)',
        '2차 승격 & 기본 EXP +50% & ★ 1차 각성 클래스 EXP +10% 가동 (등급 상승 +18%)',
        '2차 승격 & 기본 EXP +50% & 1차 각성 클래스 EXP +20% 증폭 (등급 상승 +21%)',
        '2차 승격 & 기본 EXP +50% & 1차 각성 클래스 EXP +30% 증폭 (등급 상승 +24%)',
        '2차 승격 & 기본 EXP +50% & 1차 각성 클래스 EXP +40% 최대 (등급 상승 +27%)',
        '★ [완전 각성]: 전 파티원 올스탯 +10% 상시 버프 & 등급 상승 확률 +30%'
      ];
      const nextPerks = [
        '➔ 건설 시: 1차 상위 클래스 전직 해금',
        '➔ 다음 Lv.2: ★ 기본 클래스 경험치 +20% 상시 증폭! (등급상승 6%)',
        '➔ 다음 Lv.3: 기본 클래스 경험치 +30% 강화 (등급상승 9%)',
        '➔ 다음 Lv.4: 기본 클래스 경험치 +40% 강화 (등급상승 12%)',
        '➔ 다음 Lv.5: ★ 2차 심연 승격 해금! & 기본 EXP +50% (등급상승 15%)',
        '➔ 다음 Lv.6: ★ 1차 각성 클래스 경험치 +10% 가동! (등급상승 18%)',
        '➔ 다음 Lv.7: ★ 1차 각성 EXP +20% 증폭 (등급상승 21%)',
        '➔ 다음 Lv.8: ★ 1차 각성 EXP +30% 증폭 (등급상승 24%)',
        '➔ 다음 Lv.9: ★ 1차 각성 EXP +40% 최대 (등급상승 27%)',
        '➔ 다음 Lv.10: ★ [완전 각성]: 전 파티원 올스탯 +10% 버프 (등급상승 30%)'
      ];
      let badge = undefined;
      if (level > 0) {
        if (tier1ExpBonus > 0) badge = `✨ 2차승격 (1차EXP+${tier1ExpBonus}%)`;
        else if (basicExpBonus > 0) badge = level >= 5 ? `✨ 2차승격 (기본EXP+${basicExpBonus}%)` : `✨ 1차전직 (기본EXP+${basicExpBonus}%)`;
        else badge = '✨ 1차 전직';
      }
      return {
        badge,
        currentText: perks[level] || '용병 각성 및 전직',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'infirmary': {
      const beds = [0, 2, 2, 3, 3, 4, 5, 6, 6, 7, 7];
      const perks = [
        '부상 대원 집중 생체 복원 병동 (미건설)',
        '병상 2개 가동 · 5초마다 HP +5 치료 (인당 틱당 🍖식량 2 소모)',
        '치료 주기 10% 단축 · 4초마다 HP +5 치료 (인당 틱당 🍖식량 2 소모)',
        '병상 3개 증설 가동 · 4초마다 HP +5 치료 (인당 틱당 🍖식량 2 소모)',
        '★ MP 충전 캡슐 가동 · 3초마다 HP +5 / 5초마다 MP +4 충전 (에테르 1 소모)',
        '병상 4개 증설 가동 · 3초마다 HP +5 / 4초마다 MP +4 충전',
        '병상 5개 증설 가동 · 3초마다 HP +5 / 4초마다 MP +4 충전',
        '병상 6개 증설 가동 · 2초마다 HP +5 / 3초마다 MP +4 충전',
        'MP 충전 주기 단축 · 2초마다 HP +5 / 2초마다 MP +4 충전',
        '★ 병상 7개 증설 · 1초마다 HP +5 초고속 치료 / 2초마다 MP +4 충전',
        '★ 궁극의 생체 챔버: 병상 7개 전원 수용 · 1초마다 HP +5 및 MP +4 동시 초고속 완치'
      ];
      const nextPerks = [
        '➔ 건설 시: 병상 2개 해금 & HP 치료(+5/5초, 식량2 소모)',
        '➔ 다음 Lv.2: 치료 주기 10% 단축 (4초당 HP +5 회복)',
        '➔ 다음 Lv.3: 병상 3개 증설 & 신체 재생 안정화',
        '➔ 다음 Lv.4: ★ MP 충전 캡슐 해금! (5초당 MP +4, 에테르1 소모)',
        '➔ 다음 Lv.5: 병상 4개 증설 & MP 충전 주기 단축 (4초당 MP +4)',
        '➔ 다음 Lv.6: 병상 5개 증설 & 에테르 생체 캡슐 가속',
        '➔ 다음 Lv.7: 병상 6개 증설 & HP(2초)/MP(3초) 치료 가속',
        '➔ 다음 Lv.8: MP 충전 주기 단축 (2초당 MP +4)',
        '➔ 다음 Lv.9: ★ 병상 7개 & HP 1초 초고속 회복!',
        '➔ 다음 Lv.10: ★ 궁극 생체 챔버: 1초당 HP+5/MP+4 초고속 완치'
      ];
      return {
        badge: level > 0 ? `🏥 병상 ${beds[level]}개` : undefined,
        currentText: perks[level] || '부상 대원 체력/마나 복원',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'market': {
      const curGold = Math.ceil(GameManager.getMarketBaseProduction(level) * warmthMult);
      const nextGold = GameManager.getMarketBaseProduction(level + 1);
      const perks = [
        '황혼의 암시장 거래소 및 비전서 서고 (미건설)',
        '17종 자원 환전 & 🪙 +2G/15초 골드 수급 & 유지비 지불 주기 21초 (+1초)',
        '거래 한도 확장 & 🪙 +3G/15초 골드 수급 & 유지비 지불 주기 22초 (+2초)',
        '거래 수수료 -10% & 1티어 비전서 입고 & 🪙 +5G/15초 & 주기 23초',
        '1티어 전술 비전서 품목 다양화 & 🪙 +7G/15초 & 유지비 주기 24초',
        '★ [상업 네트워크] 해금 (전 골드 유지비 -25%) & 🪙 +9G/15초 & 주기 25초',
        '인챈트 마도석 재고 확대 & 🪙 +10G/15초 & 유지비 주기 26초',
        '희귀 재료 및 마도석 공급선 확대 & 🪙 +12G/15초 & 유지비 주기 27초',
        '환율 우대율 추가 상향 & 🪙 +14G/15초 & 유지비 주기 28초',
        '거래 수수료 추가 인하 & 🪙 +15G/15초 & 유지비 주기 29초',
        '★ 황혼 암시장 완성: 최상위 비급서 & 전 품목 -20% 특별할인 & 🪙 +17G/15초 & 주기 30초'
      ];
      const nextPerks = [
        '➔ 건설 시: 17종 자원 환전 & 골드 🪙+2/15초 & 유지비 주기 21초',
        '➔ 다음 Lv.2: 거래 한도 확장 & 골드 🪙+3/15초 & 유지비 주기 22초',
        '➔ 다음 Lv.3: 거래 수수료 -10% & 1티어 비전서 & 🪙+5/15초 & 주기 23초',
        '➔ 다음 Lv.4: 1티어 비전서 품목 다양화 & 골드 🪙+7/15초 & 주기 24초',
        '➔ 다음 Lv.5: 2티어 스킬북 & ★[상업 네트워크] 전 골드 유지비 -25% 감면 해금! (🪙+9/15초)',
        '➔ 다음 Lv.6: 마도석 재고 확대 & 골드 🪙+10/15초 & 유지비 주기 26초',
        '➔ 다음 Lv.7: 마도석 재고 확대 & 골드 🪙+12/15초 & 유지비 주기 27초',
        '➔ 다음 Lv.8: 환율 우대 & 골드 🪙+14/15초 & 유지비 주기 28초',
        '➔ 다음 Lv.9: 거래 수수료 추가 인하 & 골드 🪙+15/15초 & 주기 29초',
        '➔ 다음 Lv.10: 최상위 비급서 출현 & 전 품목 20% 특별 할인 & 골드 🪙+17/15초 & 주기 30초'
      ];
      return {
        badge: level > 0 ? `🪙+${curGold}/15초 (${20 + level}s)` : undefined,
        currentText: perks[level] || '암시장 거래 및 비전서 서고',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'arenaGate': {
      const perks = [
        '시공간 비동기 PVP 결투장 및 차원 원정 관문 (미건설)',
        '실시간 비동기 PVP 결투 개방 & 명예 상점 1단계 (기초 보급품)',
        'PVP 연승 보너스 강화 & 명예 상점 2단계 (인챈트 마도석)',
        '★ 🌌 [차원 네메시스 월드 레이드] 관문 개방 & 명예 상점 3단계 & PVE 공격력 +5%',
        '명예 상점 4단계 ([투사의 용맹 목걸이]) & PVE 방어력 +5%',
        '명예 암시장 5단계 ([투사의 영광 반지]) & PVE 올스탯 +5%',
        '★ ⚔️ [차원 영지 침공] 해금 (5인 원정대 약탈전) & 명예 상점 6단계 & PVE 치명타율 +5%',
        '명예 상점 7단계 (신화 전설 성유물 상자) & PVE 피해량 +8%',
        '명예 상점 8단계 (궁극의 마도석) & PVE 피해량 +12%',
        '명예 상점 9단계 (초월의 전직 비전서) & PVE 피해량 +15%',
        '★ 👑 랭커 PVE 특권 버프 +50% 궁극 증폭 & 명예 상점 10단계 ([차원 패왕의 보관함])'
      ];
      const nextPerks = [
        '➔ 건설 시: 실시간 비동기 PVP 매칭 & 명예 상점 1단계(보급/기초) 해금',
        '➔ 다음 Lv.2: 명예 상점 2단계(인챈트 마도석) & 매칭 보상 증가',
        '➔ 다음 Lv.3: 🌌 [차원 네메시스 월드 레이드] 관문 개방 & 명예 상점 3단계 해금',
        '➔ 다음 Lv.4: 명예 상점 4단계(고급 장신구 [투사의 용맹 목걸이]) 해금',
        '➔ 다음 Lv.5: 명예 암시장 5단계(전설 장신구 [투사의 영광 반지]) 해금',
        '➔ 다음 Lv.6: 명예 상점 6단계(순수 마도석 & 고대 비전서팩) 해금',
        '➔ 다음 Lv.7: 명예 상점 7단계(신화 전설 성유물 상자) 해금',
        '➔ 다음 Lv.8: 랭커 PVE 버프 강화 & 8단계(궁극의 마도석) 해금',
        '➔ 다음 Lv.9: 랭커 PVE 버프 강화 & 9단계(초월의 전직 비전서) 해금',
        '➔ 다음 Lv.10: 랭커 달성 PVE 특권 버프 50% 증폭 & 10단계(차원 패왕의 보관함) 해금'
      ];
      return {
        badge: level >= 3 ? `🌌 네메시스 개방 Lv.${level}` : level > 0 ? `🏆 명예 상점 Lv.${level}` : undefined,
        currentText: perks[level] || 'PVP 결투 및 차원 원정',
        nextText: level < 10 ? nextPerks[level] : '★ 최고 레벨 도달'
      };
    }
    case 'bonfire': {
      const perks = [
        '방주 중심 성화 (미점화)',
        '생존 화톳불 개방 (목재 공헌 시 생산 +15%, 전투 EXP +20%, 6초당 HP/MP +1 재생 온기 활성화)',
        '성화 화력 유지력 증강 (온기 지속 효율 보전)',
        '영목 연소 효율 안정화 (성화 화력 지속)',
        '성화 열기 확산 (거점 전역 용병 회복 파동 안정화)',
        '신성 화염 결계 강화 (부재 중 성화 온기 소진 완화)',
        '에테르 불꽃 융합 (방주 거점 회복 가속)',
        '태고의 불꽃 점화 (한기 저항력 극대화)',
        '영구 불꽃 심장 형성 (성화 코어 안정)',
        '신화의 성화 개방 (심연 침식 차단)',
        '★ 불멸의 태양 성화 (영구 신성 결계 완성)'
      ];
      return {
        badge: level > 0 ? `🔥 Lv.${level} 온기` : undefined,
        currentText: perks[level] || '방주의 성화',
        nextText: level < 10 ? `➔ 다음 Lv.${level + 1}: ${(level + 1) === 2 ? '횃불 그물망 설치 (조명 범위 확대)' : (level + 1) === 3 ? '★ 온기 버프 해금! (전 자원 시설 +15% 증산)' : (level + 1) === 4 ? '에테르 화로 도입 (온기 지속 시간 증대)' : (level + 1) === 5 ? '★ 전투 후 HP 자동회복 해금! (+3%/틱)' : (level + 1) === 6 ? '파수대 확장 (방어 세력권 증대)' : (level + 1) === 7 ? '★ 이동속도 +10% & HP 자동회복 +5%/틱' : (level + 1) === 8 ? '마도 보호막 발생 장치 (야간 방어 강화)' : (level + 1) === 9 ? '★ HP 자동회복 +8%/틱 & 이동속도 +15%' : '★ 영원의 불꽃: 온기 버프 +20% & 자동회복 +10%/틱'}` : '★ 최고 레벨 도달'
      };
    }
    default:
      return { currentText: '영지 시설', nextText: '' };
  }
}

const CitadelDrawer: React.FC<{
  onClose: () => void;
  onEnterDrawer: (key: string) => void;
  highlightedBuildingId?: string | null;
  onClearHighlight?: () => void;
}> = ({ onClose, onEnterDrawer, highlightedBuildingId, onClearHighlight }) => {
  const { state, gm, navigateTo } = useGameManager();
  const { lang, dict } = useI18n();
  const [detailBuildingId, setDetailBuildingId] = useState<BuildingId | null>(null);
  const [pausedNoticeBuilding, setPausedNoticeBuilding] = useState<BuildingState | null>(null);

  useEffect(() => {
    if (highlightedBuildingId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`building-card-${highlightedBuildingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [highlightedBuildingId]);

  // ⏳ 건물 건설 및 증축 실시간 카운트다운 타이머 (0.5초 주기 화면 리프레시)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const buildingsList: { id: BuildingId; drawerKey?: string }[] = [
    { id: 'butchery' },
    { id: 'cabin' },
    { id: 'lumberCamp' },
    { id: 'quarry' },
    { id: 'storage',     drawerKey: 'storage' },
    { id: 'tavern',      drawerKey: 'tavern' },
    { id: 'blacksmith',  drawerKey: 'forge' },
    { id: 'alchemy',     drawerKey: 'alchemy' },
    { id: 'infirmary',   drawerKey: 'infirmary' },
    { id: 'market',      drawerKey: 'market' },
    { id: 'sanctuary' },
    { id: 'arenaGate',   drawerKey: 'arena' },
  ];
  const hasWarmth = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
  const warmthLabel = gm.bonfireWarmthTime > 0
    ? `🔥 온기 ${Math.floor(gm.bonfireWarmthTime / 60)}분 ${String(gm.bonfireWarmthTime % 60).padStart(2, '0')}초 남음 (생산량 +15%)`
    : (gm.bonfireStacks > 0 ? `🔥 점화 중: ${gm.bonfireStacks}/5 스택` : '성화 꺼짐');

  const selectedBuildingData = detailBuildingId ? state.buildings[detailBuildingId] : null;
  const selectedBuildingItem = detailBuildingId ? buildingsList.find(b => b.id === detailBuildingId) : null;
  const selectedCost = detailBuildingId && selectedBuildingData ? gm.getBuildingUpgradeCost(detailBuildingId, selectedBuildingData.level) : {};
  const selectedCanAfford = selectedBuildingData ? Object.entries(selectedCost).every(
    ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
  ) : false;
  const selectedIsMax = selectedBuildingData ? selectedBuildingData.level >= 10 : false;
  const selectedStatusInfo = detailBuildingId && selectedBuildingData ? getBuildingStatusInfo(detailBuildingId, selectedBuildingData.level, hasWarmth) : null;
  const selectedPrereq = detailBuildingId && selectedBuildingData ? gm.checkBuildingPrerequisites(detailBuildingId, selectedBuildingData.level + 1) : { allowed: true };
  const claimableQuestCount = state.quests.filter(q => q.status === 'active' && q.objectives.every(o => o.isCompleted)).length;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f2738] shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[#ff7b25]">{'영지 시설 관리'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
            {'시설 보유 현황'}
          </span>
          {claimableQuestCount > 0 && (
            <button
              className="px-2 py-0.5 rounded-full bg-[#423219] hover:bg-[#5c4524] text-[#f3e5c8] border border-[#876739] text-[10px] font-bold shadow-md flex items-center gap-1 animate-pulse active:scale-95 cursor-pointer"
              onClick={() => onEnterDrawer('quests')}
              title="달성된 퀘스트 보상을 수령하세요!"
            >
              <span>📜</span>
              <span>보상 수령 ({claimableQuestCount})</span>
            </button>
          )}
          <EncyclopediaBadge tab="buildings" label="영지 백과" />
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onClose}
          aria-label="영지 메뉴 닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {/* 방주의 성화 */}
        {(() => {
          const reqWood = gm.getRequiredStokeWood();
          const isFullyLit = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
          return (
            <div id="building-card-bonfire" className="panel p-3 bg-[#131926] border border-[#222d42] flex flex-col gap-2 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#ffb347] font-bold flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <span className="text-white font-bold">{'성화'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff7b2522] text-[#ff7b25] font-mono">
                    {isFullyLit ? '최대 활성화' : `${gm.bonfireStacks}/5`}
                  </span>
                  <EncyclopediaBadge query="성화" tab="starter" label="성화 백과" compact />
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${hasWarmth ? 'bg-[#ff7b2522] text-[#ff7b25] border border-[#ff7b2544] animate-pulse' : 'bg-[#222d42] text-[#8b9bb4]'}`}>
                  {warmthLabel}
                </span>
              </div>
              <div className="text-[11px] text-[#cfd8e8] leading-relaxed">
                {isFullyLit ? (
                  <span className="text-[#38ef7d]">
                    ✨ 성화 가동 중: 영지 생산 +15%, 전투 EXP +20%, 영지 용병 지속 회복
                  </span>
                ) : (
                  <span>
                    영목을 단계별로 바쳐 성화를 완충하면 5분간 온기 버프가 지속됩니다.
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <ActionButton label={'🪵 영목 줍기'} variant="ghost" size="sm" className="flex-1 font-bold" onClick={() => gm.gatherWood()} />
                {isFullyLit ? (
                  // 🔥 완전 점화된 상태: 추가 목재 투입으로 불을 꺼뜨리지 않는 한 횟수 차감 없이 무제한 연장 가능!
                  <ActionButton
                    label={`🔥 성화 온기 연장 (-${reqWood} 목재)`}
                    variant="ghost"
                    size="sm"
                    className="flex-1 font-bold text-[#ff7b25] border-[#ff7b2566] hover:bg-[#ff7b2522]"
                    disabled={state.resources.wood < reqWood}
                    onClick={() => gm.stokeFire()}
                  />
                ) : (state.bonfireStacks < 4 || (gm.bonfireAdCharges ?? 5) > 0) ? (
                  // 불씨 스택 쌓기(1~4단계) 또는 잔여 점화 횟수가 남아있는 경우
                  <ActionButton
                    label={state.bonfireStacks === 4 
                      ? `🔥 성화 완전 점화 (-${reqWood} 목재) [점화권 ${gm.bonfireAdCharges ?? 5}/5회]` 
                      : `🔥 불씨 지피기 (-${reqWood} 목재) [${state.bonfireStacks}/5]`}
                    variant="ghost"
                    size="sm"
                    className="flex-1 font-bold text-[#ff7b25] border-[#ff7b2566] hover:bg-[#ff7b2522]"
                    disabled={state.resources.wood < reqWood}
                    onClick={() => gm.stokeFire()}
                  />
                ) : (
                  // 4스택에서 완전 점화해야 하는데 오늘의 점화 횟수가 0인 경우 ➔ 광고 충전 버튼 노출
                  <button
                    type="button"
                    className="flex-1 btn btn-primary text-xs py-1 px-2 font-bold bg-gradient-to-r from-[#ff7b25] to-[#ff5722] hover:brightness-110 text-white rounded-lg flex items-center justify-center gap-1 shadow-md cursor-pointer"
                    onClick={async () => {
                      const res = await GoogleAdService.getInstance().showRewardedAd({
                        placement: 'bonfire',
                        title: '신성한 성화 점화 5회 충전',
                        description: '광고를 시청하여 신성한 성화 점화 5회를 재충전합니다.',
                        rewardText: '성화 점화 5회 & 심연 촉매 슬롯 개방',
                      });
                      if (res.rewarded) {
                        gm.refillBonfireCharges();
                      }
                    }}
                  >
                    <span>🎬</span>
                    <span>광고 보고 점화 5회 충전 (+촉매)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* 🏛️ 방주 3대 핵심 인프라 시너지 현황 위젯 */}
        {(() => {
          const syn = gm.getInfraSynergies();
          const butcheryLv = state.buildings['butchery']?.level || 0;
          const marketLv = state.buildings['market']?.level || 0;
          const alchemyLv = state.buildings['alchemy']?.level || 0;

          return (
            <div className="panel p-2.5 bg-[#0e1422] border border-[#202c42] rounded-xl flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#00d2ff] font-bold flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>핵심 인프라 테크 시너지</span>
                  <EncyclopediaBadge query="인프라" tab="systems" label="시너지 백과" compact />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {/* 🥩 대량 배급제 */}
                <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                  syn.foodSynergy
                    ? 'bg-[#1b2b22] border-[#38ef7d66] text-[#38ef7d]' : 'bg-[#141822] border-[#222b3d] text-[#8b9bb4] opacity-70'
                }`}>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>🥩</span>
                    <span>대량 배급제</span>
                  </div>
                  <div className="text-[9px] mt-0.5">
                    {syn.foodSynergy ? '식량 유지비 -30%' : `정제소 Lv.5 필요 (${butcheryLv}/5)`}
                  </div>
                  <div className="text-[8px] font-mono mt-0.5 font-bold">
                    {syn.foodSynergy ? '● 활성화됨' : '○ 미달성'}
                  </div>
                </div>

                {/* ⚖️ 상업 네트워크 */}
                <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                  syn.goldSynergy
                    ? 'bg-[#2b2716] border-[#ffd54f66] text-[#ffd54f]' : 'bg-[#141822] border-[#222b3d] text-[#8b9bb4] opacity-70'
                }`}>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>⚖️</span>
                    <span>상업 네트워크</span>
                  </div>
                  <div className="text-[9px] mt-0.5">
                    {syn.goldSynergy ? '골드 유지비 -25%' : `블랙마켓 Lv.5 필요 (${marketLv}/5)`}
                  </div>
                  <div className="text-[8px] font-mono mt-0.5 font-bold">
                    {syn.goldSynergy ? '● 활성화됨' : '○ 미달성'}
                  </div>
                </div>

                {/* 🧪 에테르 환류관 */}
                <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                  syn.etherSynergy
                    ? 'bg-[#1b2535] border-[#00d2ff66] text-[#00d2ff]' : 'bg-[#141822] border-[#222b3d] text-[#8b9bb4] opacity-70'
                }`}>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>🧪</span>
                    <span>에테르 환류관</span>
                  </div>
                  <div className="text-[9px] mt-0.5">
                    {syn.etherSynergy ? '마도 에테르 -25%' : `연금공방 Lv.6 필요 (${alchemyLv}/6)`}
                  </div>
                  <div className="text-[8px] font-mono mt-0.5 font-bold">
                    {syn.etherSynergy ? '● 활성화됨' : '○ 미달성'}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 건물 목록 */}
        {buildingsList.map(item => {
          const b = state.buildings[item.id];
          if (!b) return null;
          const isUnlocked = b.unlocked;
          const isBuilt = b.level > 0;
          const permanentLv = b.maxLevel || b.level;
          const isMax = permanentLv >= 10;
          const isConstructing = !!b.construction;
          const remainSec = isConstructing ? Math.max(1, Math.ceil((b.construction!.startedAt + b.construction!.durationMs - now) / 1000)) : 0;
          const progressPct = isConstructing ? Math.min(100, Math.max(0, Math.floor(((now - b.construction!.startedAt) / b.construction!.durationMs) * 100))) : 0;
          const cost = gm.getBuildingUpgradeCost(item.id, permanentLv);
          const canAfford = Object.entries(cost).every(
            ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
          );
          
          const prereq = gm.checkBuildingPrerequisites(item.id, permanentLv + 1);
          const statusInfo = getBuildingStatusInfo(item.id, b.level, hasWarmth);
          const themeHex = `#${b.themeColor.toString(16).padStart(6, '0')}88`;

          const bLocalized = getLocalizedBuildingName(b.id, lang);
          const bName = (lang !== 'ko' && bLocalized.name) ? bLocalized.name : b.name;

          // 🔒 미해금 시설: 음영 처리 및 실루엣 연출
          if (!isUnlocked) {
            return (
              <div
                key={item.id}
                id={`building-card-${item.id}`}
                className="panel p-3 flex items-center gap-2.5 bg-[#090c12] border border-dashed border-[#1f2738] opacity-50 transition-all select-none"
              >
                <div className="text-xl shrink-0 w-8 h-8 rounded-lg bg-[#141a29] flex items-center justify-center text-[#505c73] border border-[#1f2738]">
                  🔒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#78889e]">🔒 {bName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#182030] text-[#607d8b]">
                      {lang === 'en' ? 'Locked' : lang === 'ja' ? '施錠' : '잠김'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#505c73] mt-0.5">
                    {lang === 'en' ? 'Prerequisite quest completion required' : lang === 'ja' ? '前提クエストの完了が必要' : '해금 조건: 선행 연계 퀘스트 수행 필요'}
                  </div>
                </div>
                <span className="text-[10px] text-[#505c73] px-2 py-1 border border-[#1b2334] rounded bg-[#0d121c]">
                  {lang === 'en' ? 'Locked' : lang === 'ja' ? '未開放' : '미해금'}
                </span>
              </div>
            );
          }

          // ✅ 해금된 시설: 클릭 시 상세 설명 모달 오픈 + 자원별 녹색/적색 뱃지
          const isHighlighted = highlightedBuildingId === item.id;
          return (
            <div
              key={item.id}
              id={`building-card-${item.id}`}
              className={`panel p-3 flex flex-col gap-1.5 border transition-all rounded-xl cursor-pointer bg-[#111724] hover:border-[#00d2ff88] hover:bg-[#141c2c] ${
                isHighlighted ? 'ring-2 ring-[#ffd700] shadow-[0_0_35px_rgba(255,215,0,0.5)] !border-[#ffd700]' : ''
              }`}
              style={{ borderColor: isHighlighted ? '#ffd700' : (isBuilt ? themeHex : '#2c384d') }}
              onClick={() => setDetailBuildingId(item.id)}
            >
              {/* 상단 헤더 줄: 아이콘, 이름, 레벨 뱃지, 실시간 수급 뱃지, 액션 버튼 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl w-9 h-9 rounded-xl flex items-center justify-center bg-[#151c2c] border border-[#2b3b57] shadow-inner shrink-0" style={{ borderColor: isBuilt ? `${themeHex}66` : '#2b3b57', background: isBuilt ? `${themeHex}18` : '#151c2c' }}>
                    <GameIcon name={b.id} icon={b.icon} size={24} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white hover:text-[#00d2ff]">{bName}</span>
                      {isBuilt ? (
                        b.maxLevel && b.level < b.maxLevel ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff980022] text-[#ffb74d] font-bold border border-[#ff980066]" title={`유지비 미납으로 일시 하향됨 (원래 Lv.${b.maxLevel}, 유지비 지불 시 자동 복구)`}>
                            Lv.{b.level} <span className="text-[9px] text-[#ff8a80]">(원래 Lv.${b.maxLevel})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff44]">
                            Lv.{b.level}
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff980022] text-[#ff9800] font-bold border border-[#ff980044]">
                          {lang === 'en' ? 'Unbuilt' : lang === 'ja' ? '未建設' : '미건설'}
                        </span>
                      )}
                      {statusInfo.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d15] text-[#38ef7d] font-mono font-bold border border-[#38ef7d33]">
                          {statusInfo.badge}
                        </span>
                      )}
                      {(() => {
                        const upkeep = gm.getBuildingUpkeep(item.id, b.level);
                        if (upkeep.amount > 0 || (upkeep.secondaryAmount && upkeep.secondaryAmount > 0)) {
                          const upkeepSec = gm.getUpkeepIntervalSeconds();
                          const parts = [];
                          if (upkeep.amount > 0) {
                            parts.push(`${upkeep.resIcon} -${upkeep.amount}`);
                          }
                          if (upkeep.secondaryAmount && upkeep.secondaryAmount > 0) {
                            parts.push(`${upkeep.secondaryIcon} -${upkeep.secondaryAmount}`);
                          }
                          return (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                              upkeep.isDiscounted 
                                ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d44]' : 'bg-[#ff8a8015] text-[#ff8a80] border-[#ff8a8033]'
                            }`}>
                              {parts.join(', ')}/{upkeepSec}초{upkeep.isDiscounted ? ' (할인)' : ''}
                            </span>
                          );
                        } else if (b.level > 0 && upkeep.amount === 0) {
                          return (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono border border-[#00d2ff33]">
                              {item.id === 'bonfire' ? '유지비 면제' : '무료 유지'}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <span className="text-[9px] text-[#8b9bb4] underline hover:text-[#00d2ff]">
                        ℹ️ 상세
                      </span>
                    </div>
                  </div>
                </div>

                {/* 버튼 그룹 (클릭 이벤트 버블링 방지) */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  {item.drawerKey && isBuilt && (
                    <ActionButton
                      label="입장"
                      variant="success"
                      size="sm"
                      className="px-2.5 font-bold"
                      onClick={() => {
                        if (item.id === 'arenaGate') navigateTo('arena');
                        else onEnterDrawer(item.drawerKey!);
                      }}
                    />
                  )}
                  <ActionButton
                    label={isConstructing ? `🔨 ${remainSec}초` : (isMax ? 'MAX' : (!prereq.allowed ? '선행 필요' : (isBuilt ? '강화' : '건설')))}
                    variant={isConstructing ? 'ghost' : (canAfford && !isMax && prereq.allowed ? 'primary' : 'ghost')}
                    size="sm"
                    className={`px-3 font-bold transition-all ${
                      isHighlighted
                        ? 'ring-4 ring-[#ffd700] ring-offset-2 ring-offset-[#0e1422] border-2 border-white shadow-[0_0_25px_rgba(255,215,0,0.95)] !bg-gradient-to-r !from-[#ffe082] !to-[#ffd54f] !text-black font-extrabold scale-110 animate-pulse'
                        : ''
                    } ${isConstructing ? '!text-[#00d2ff] !border-[#00d2ff88] !bg-[#00d2ff1a] animate-pulse' : ''}`}
                    disabled={isConstructing || isMax || (prereq.allowed && !canAfford)}
                    onClick={() => {
                      if (onClearHighlight) onClearHighlight();
                      if (isConstructing || isMax) return;
                      if (!prereq.allowed) {
                        setDetailBuildingId(item.id);
                        return;
                      }
                      gm.buildBuilding(item.id);
                    }}
                  />
                </div>
              </div>

              {/* 🔨 공사 진행 중 실시간 진행률 바 */}
              {isConstructing && (
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#0a121f] border border-[#00d2ff44] my-0.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#00d2ff]">
                    <span className="flex items-center gap-1">
                      <span className="animate-spin inline-block text-xs">⚙️</span>
                      <span>Lv.{b.construction!.targetLevel} 증축 공사 진행 중...</span>
                    </span>
                    <span className="font-mono text-[9px] text-[#80deea]">{remainSec}초 ({progressPct}%)</span>
                  </div>
                  <div className="w-full bg-[#050811] rounded-full h-1.5 overflow-hidden border border-[#00d2ff33]">
                    <div
                      className="bg-gradient-to-r from-[#00b4d8] to-[#00f2fe] h-full transition-all duration-300 shadow-[0_0_8px_#00d2ff]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 미건설 시설인 경우만 기본 설명 노출 */}
              {!isBuilt && b.description && (
                <div className="text-[11px] text-[#8b9bb4] leading-tight">
                  {b.description}
                </div>
              )}

              {/* 하단: 다음 단계 미리보기 & 재료별 색상 구분 뱃지 */}
              <div className="pt-1.5 border-t border-[#1c2638] flex flex-col gap-1 text-[10px]">
                <div className="flex items-center justify-between text-[#ffd54f] font-medium">
                  <span className="truncate">{statusInfo.nextText}</span>
                  {!isMax && <span className="text-[9px] text-[#8b9bb4] shrink-0 ml-1">필요 자원:</span>}
                </div>
                {!isMax && (
                  <div className="flex items-center justify-end">
                    {renderCostBadges(cost, state.resources, isMax)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 🔍 건물 상세 정보 모달 (카드 클릭 시 팝업) ── */}
      {selectedBuildingData && selectedBuildingItem && selectedStatusInfo && (() => {
        const selectedIsConstructing = !!selectedBuildingData.construction;
        const selectedRemainSec = selectedIsConstructing ? Math.max(1, Math.ceil((selectedBuildingData.construction!.startedAt + selectedBuildingData.construction!.durationMs - now) / 1000)) : 0;
        const selectedProgressPct = selectedIsConstructing ? Math.min(100, Math.max(0, Math.floor(((now - selectedBuildingData.construction!.startedAt) / selectedBuildingData.construction!.durationMs) * 100))) : 0;

        return (
          <Modal
            open={!!detailBuildingId}
            onClose={() => setDetailBuildingId(null)}
            title={`${selectedBuildingData.icon} ${selectedBuildingData.name} (Lv.${selectedBuildingData.level}/10)`}
            footer={
              <div className="flex items-center justify-between w-full">
                {selectedBuildingItem.drawerKey && selectedBuildingData.level > 0 ? (
                  <button
                    className="btn btn-success text-xs px-3 py-1.5 font-bold flex items-center gap-1"
                    onClick={() => {
                      setDetailBuildingId(null);
                      if (selectedBuildingItem.id === 'arenaGate') navigateTo('arena');
                      else onEnterDrawer(selectedBuildingItem.drawerKey!);
                    }}
                  >
                    <span>🚪</span>
                    <span>시설 바로 입장</span>
                  </button>
                ) : <div />}
                
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost text-xs px-3 py-1.5 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1"
                    style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
                    onClick={() => setDetailBuildingId(null)}
                  >
                    <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
                    <span style={{ color: '#c56060' }}>닫기</span>
                  </button>
                  {selectedIsConstructing ? (
                    <button
                      className="btn btn-ghost text-xs px-4 py-1.5 font-bold opacity-75 cursor-not-allowed !text-[#00d2ff] !border-[#00d2ff88] !bg-[#00d2ff1a] animate-pulse"
                      disabled
                    >
                      🔨 공사 진행 중 ({selectedRemainSec}초)
                    </button>
                  ) : (
                    <button
                      className={`btn text-xs px-4 py-1.5 font-bold ${
                        selectedCanAfford && !selectedIsMax && selectedPrereq.allowed ? 'btn-primary' : 'btn-ghost opacity-40'
                      }`}
                      disabled={!selectedCanAfford || selectedIsMax || !selectedPrereq.allowed}
                      onClick={() => {
                        if (!selectedIsMax && selectedPrereq.allowed && gm.buildBuilding(selectedBuildingItem.id)) {
                          setDetailBuildingId(null);
                        }
                      }}
                    >
                      {selectedIsMax ? '★ 최고 레벨' : (!selectedPrereq.allowed ? '선행 조건 필요' : (selectedBuildingData.level > 0 ? '⚡ 레벨업 공사 시작' : '🔨 건설 시작'))}
                    </button>
                  )}
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-3 text-xs">
              {/* 🔨 공사 진행 중 안내 배너 */}
              {selectedIsConstructing && (
                <div className="p-3 rounded-xl bg-[#0a1424] border border-[#00d2ff66] flex flex-col gap-2 shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-[#00d2ff]">
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin">⚙️</span>
                      <span>Lv.{selectedBuildingData.construction!.targetLevel} 증축 공사 진행 중...</span>
                    </span>
                    <span className="font-mono">{selectedRemainSec}초 남음 ({selectedProgressPct}%)</span>
                  </div>
                  <div className="w-full bg-[#050c18] rounded-full h-2 overflow-hidden border border-[#00d2ff33]">
                    <div
                      className="bg-gradient-to-r from-[#00b4d8] to-[#00f2fe] h-full transition-all duration-300 shadow-[0_0_8px_#00d2ff]"
                      style={{ width: `${selectedProgressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 테크트리 선행 미달 경고 배너 */}
              {!selectedPrereq.allowed && !selectedIsMax && (
              <div className="p-2.5 rounded-xl bg-[#2a1412] border border-[#ef535066] text-xs text-[#ff8a80] flex items-center gap-2 shadow-sm">
                <span className="text-lg">🔒</span>
                <div>
                  <div className="font-bold text-[#ef5350]">테크트리 선행 조건 미달</div>
                  <div className="text-[11px] text-[#cfd8dc] mt-0.5">{selectedPrereq.reason}</div>
                </div>
              </div>
            )}

            {/* 상단: 배경 설명 및 로어 */}
            <div className="panel p-3 bg-[#131926] border border-[#27354d] rounded-xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#00d2ff] font-bold">📜 시설 서사 및 배경</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff]">
                  {selectedBuildingData.level > 0 ? `현재 Lv.${selectedBuildingData.level}` : '미건설 시설'}
                </span>
              </div>
              <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                {getBuildingLore(selectedBuildingItem.id, selectedBuildingData.level)}
              </div>
            </div>

            {/* 중단 1: 현재 가동 효과 */}
            <div className="panel p-3 bg-[#0d1522] border border-[#1e2a3e] rounded-xl flex flex-col gap-1">
              <div className="flex items-center justify-between text-[#38ef7d] font-bold text-xs">
                <span>✨ 현재 가동 효과 (Lv.{selectedBuildingData.level})</span>
                {selectedStatusInfo.badge && (
                  <span className="font-mono text-[10px] text-[#38ef7d]">{selectedStatusInfo.badge}</span>
                )}
              </div>
              <div className="text-[11px] text-[#e0e6ed] mt-0.5 font-medium leading-relaxed">
                {selectedStatusInfo.currentText}
              </div>
            </div>

            {/* 중단 2: 다음 단계 승급 프리뷰 & 간략 유지비 표기 */}
            {(() => {
              const nextLevel = Math.min(10, selectedBuildingData.level + 1);
              const nextUpkeep = gm.getBuildingUpkeep(selectedBuildingItem.id, nextLevel);
              const upkeepSec = gm.getUpkeepIntervalSeconds();
              return (
                <div className="panel p-3 bg-[#181326] border border-[#2d2244] rounded-xl flex flex-col gap-1">
                  <div className="text-[#ffd54f] font-bold text-xs flex items-center justify-between">
                    <span>🔮 다음 레벨 특전 (Lv.{nextLevel})</span>
                    {selectedIsMax ? (
                      <span className="text-[10px] text-[#8b9bb4]">MAX</span>
                    ) : (nextUpkeep.amount > 0 || (nextUpkeep.secondaryAmount && nextUpkeep.secondaryAmount > 0)) ? (
                      <span className="text-[10px] font-mono text-[#ff8a80]">
                        ({[
                          nextUpkeep.amount > 0 ? `${nextUpkeep.resIcon} -${nextUpkeep.amount}` : '',
                          nextUpkeep.secondaryAmount && nextUpkeep.secondaryAmount > 0 ? `${nextUpkeep.secondaryIcon} -${nextUpkeep.secondaryAmount}` : ''
                        ].filter(Boolean).join(', ')}/{upkeepSec}초)
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-[#ffd54f] mt-0.5 leading-relaxed font-medium">
                    {selectedStatusInfo.nextText}
                    {!selectedIsMax && nextUpkeep.amount > 0 && selectedBuildingData.level < 4 && (
                      <span className="text-[10px] text-[#ff8a80] block mt-0.5">
                        * 4레벨부터 {upkeepSec}초마다 {nextUpkeep.resIcon} {nextUpkeep.resName} {nextUpkeep.amount}개 유지비 소모 (Lv.1~3 무료 유지)
                      </span>
                    )}
                    {!selectedIsMax && (selectedBuildingItem.id === 'lumberCamp' || selectedBuildingItem.id === 'quarry') && nextLevel >= 5 && (
                      <span className="text-[10px] text-[#00d2ff] block mt-0.5 font-mono">
                        ⚙️ 시설 특화: 골드 유지비 -{Math.min(42, (nextLevel - 4) * 7)}% 고유 감면 적용{selectedBuildingItem.id === 'quarry' && nextLevel >= 7 ? ' (30% 식량 분담)' : ''}
                      </span>
                    )}
                    {!selectedIsMax && nextUpkeep.isDiscounted && (
                      <span className="text-[10px] text-[#38ef7d] block mt-0.5">
                        ✓ 인프라 시너지 감면 적용 중 (정가: {nextUpkeep.originalAmount} ➔ 할인가: {nextUpkeep.amount})
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 하단: 강화 소모 자원 (충족: 녹색 / 부족: 적색) */}
            {!selectedIsMax && (
              <div className="panel p-3 bg-[#0c0f17] border border-[#222d42] rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {selectedBuildingData.level > 0 ? '⚡ 강화 필요 자원' : '🔨 건설 필요 자원'}
                  </span>
                  <span className={selectedCanAfford ? 'text-[10px] text-[#38ef7d] font-bold' : 'text-[10px] text-[#ef5350] font-bold animate-pulse'}>
                    {selectedCanAfford ? '✅ 모든 재료 보유' : '⚠️ 일부 자원 부족'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {renderCostBadges(selectedCost, state.resources, selectedIsMax)}
                </div>
              </div>
            )}
          </div>
        </Modal>
        );
      })()}

      {/* ── ⏸️ 시설 가동 중지 알림 모달 (CitadelDrawer 내부) ── */}
      {pausedNoticeBuilding && (
        <Modal
          open={!!pausedNoticeBuilding}
          onClose={() => setPausedNoticeBuilding(null)}
          title={`⏸️ ${pausedNoticeBuilding.name} 가동 중지 안내`}
          footer={
            <div className="flex gap-2 justify-end w-full">
              <button
                className="btn btn-ghost text-xs px-3 py-1.5"
                onClick={() => setPausedNoticeBuilding(null)}
              >
                닫기
              </button>
              <button
                className="btn btn-success text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                onClick={() => {
                  const bId = pausedNoticeBuilding.id;
                  gm.toggleBuildingPause(bId);
                  setPausedNoticeBuilding(null);
                  const drawerKey = BUILDING_TO_DRAWER_KEY[bId];
                  if (drawerKey) {
                    if (bId === 'arenaGate') navigateTo('arena');
                    else onEnterDrawer(drawerKey);
                  }
                }}
              >
                <span>▶️</span>
                <span>가동 재개 및 입장</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-[#2a1d12] border border-[#ff980066] flex items-center gap-3 shadow-lg">
              <span className="text-3xl p-2 rounded-xl bg-[#ff980022] border border-[#ff980044]">
                {pausedNoticeBuilding.icon}
              </span>
              <div>
                <div className="text-sm font-bold text-[#ffb74d] flex items-center gap-1.5">
                  <span>해당 건물은 중지중입니다.</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff980033] text-[#ffcc80] font-mono">
                    PAUSED
                  </span>
                </div>
                <div className="text-xs text-[#cfd8dc] mt-1 leading-relaxed">
                  현재 <strong>[{pausedNoticeBuilding.name}]</strong> 시설의 가동이 일시 정지되어 있어 입장할 수 없습니다.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#111724] border border-[#1e2a3e] text-xs text-[#8b9bb4] leading-relaxed flex flex-col gap-1.5">
              <div className="text-[#00d2ff] font-bold flex items-center gap-1">
                <span>ℹ️</span>
                <span>시설 이용 안내</span>
              </div>
              <div>
                시설을 정상적으로 이용하시려면 <strong className="text-white">[▶️ 가동 재개 및 입장]</strong> 버튼을 누르거나, 상단의 시설 상세에서 가동을 재개해주세요.
              </div>
              <div className="text-[10px] text-[#ff8a80] mt-1">
                ※ 가동을 재개하면 시설의 고유 기능이 활성화되고 기본 운영 유지비 소모 및 자원 생산이 다시 시작됩니다.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
const TavernDrawer: React.FC<{ onBack: () => void; onNavigateDrawer?: (key: string) => void }> = ({ onBack, onNavigateDrawer }) => {
  const { state, gm } = useGameManager();
  const { tr } = useI18n();
  useCustomAssetVersion();
  const [detailCandidate, setDetailCandidate] = useState<TavernCandidate | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [showAdConfirm, setShowAdConfirm] = useState(false);
  const tavernLv = state.buildings['tavern']?.level || 1;
  const sanctuaryLv = state.buildings['sanctuary']?.level || 0;
  const isFull = state.barracks.length >= 7;

  const handleConfirmWatchAd = async () => {
    setShowAdConfirm(false);
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      const res = await GoogleAdService.getInstance().showRewardedAd({
        placement: 'tavern',
        title: tr('방랑 모험가 즉시 도착'),
        description: tr('광고를 시청하여 모험가 도착 쿨타임과 골드 갱신 비용을 즉시 초기화하고 새로운 모험가를 맞이합니다.'),
        rewardText: tr('모험가 즉시 도착 & 갱신 비용 100G 초기화'),
      });
      if (res.rewarded) {
        gm.resetTavernCooldownWithAd();
      }
    } finally {
      setIsAdLoading(false);
    }
  };

  // 🎒 연계 퀘스트 (Q_MAIN_02): 용병 영입 완료 후 침식 회랑 1층 강하(채비실) 준비 단계인지 확인
  const qMain02 = state.quests.find(q => q.id === 'Q_MAIN_02');
  const isReadyForExpedition = (qMain02 && qMain02.status === 'active' && qMain02.objectives[1]?.isCompleted && !qMain02.objectives[2]?.isCompleted)
    || (state.barracks.length >= 3 && !gm.hasEnteredDungeon);

  const GRADE_META: Record<string, { label: string; tag: string; color: string }> = {
    rookie:  { label: 'N', tag: 'N', color: '#9e9e9e' },
    veteran: { label: 'V', tag: 'V', color: '#66bb6a' },
    hero:    { label: 'H', tag: 'H', color: '#00d2ff' },
    elite:   { label: 'H', tag: 'H', color: '#00d2ff' },
    epic:    { label: 'E', tag: 'E', color: '#ce93d8' },
    legend:  { label: 'E', tag: 'E', color: '#ce93d8' },
  };

  const mins = Math.floor((state.tavernArrivalSecondsLeft || 0) / 60);
  const secs = (state.tavernArrivalSecondsLeft || 0) % 60;
  const timerText = `${mins}분 ${String(secs).padStart(2, '0')}초`;
  const refreshCost = state.tavernRefreshCost ?? 100;
  const refreshStage = (state.tavernRefreshCount || 0) + 1;

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🍺</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-[#ffb74d]">{'방랑자의 라운지'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff44]">
              Lv.{tavernLv}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffb74d22] text-[#ffb74d] font-bold">
              {`대원 ${state.barracks.length}/7명`}
            </span>
            <EncyclopediaBadge query="고용" tab="all" label="주점 백과" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            label={`🔄 갱신 (🪙${refreshCost}G)`}
            size="sm"
            variant="ghost"
            className="border-[#ffd54f66] text-[#ffd54f] hover:bg-[#ffd54f15]"
            disabled={state.resources.gold < refreshCost}
            onClick={() => gm.manualRefreshTavern()}
          />
          <button
            className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onBack}
            aria-label="닫기"
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>
      </div>

      {/* 🎒 [연계 퀘스트 바로가기] 용병 영입 완료 시 편성화면(인원 부족 시) 또는 심연 채비실로 이동 배너 */}
      {isReadyForExpedition && (
        <div className="bg-gradient-to-r from-[#0d1e33] via-[#122e4c] to-[#0d1e33] border-b border-[#00d2ff88] px-4 py-2.5 flex items-center justify-between gap-2 shadow-lg shrink-0 animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{state.party.length < 3 ? '⚔️' : '🎒'}</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#b8e2ff] flex items-center gap-1.5 flex-wrap">
                <span>용병 영입 완료!</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff33] text-[#00d2ff] font-extrabold border border-[#00d2ff55]">연계 퀘스트</span>
              </div>
              <div className="text-[11px] text-[#80d8ff] truncate mt-0.5">
                {state.party.length < 3
                  ? '영입한 용병을 [원정단 편성]에서 출전시켜 3인 원정대를 완성하세요!'
                  : '원정대 3인 편성 완료! 채비실에서 보급품을 챙기고 침식 회랑 1층 강하를 시작하세요!'}
              </div>
            </div>
          </div>
          <button
            className={`text-xs px-3 py-1.5 rounded-lg font-bold shrink-0 active:scale-95 shadow-md flex items-center gap-1 cursor-pointer transition-all ${
              state.party.length < 3
                ? 'bg-[#0088cc] hover:bg-[#00a2f5] text-white border border-[#00d2ff]'
                : 'bg-[#5c2b8a] hover:bg-[#7236aa] text-white border border-[#9c4dcc]'
            }`}
            onClick={() => {
              if (onNavigateDrawer) {
                if (state.party.length < 3) {
                  onNavigateDrawer('barracks');
                } else {
                  onNavigateDrawer('explore');
                }
              } else {
                onBack();
              }
            }}
          >
            <span>{state.party.length < 3 ? '원정단 편성 이동' : '채비실 이동'}</span>
            <span>▶</span>
          </button>
        </div>
      )}

      {/* ⏳ 10분 모험가 자동 도착 및 새로고침 비용 초기화 정보 바 */}
      <div className="bg-[#101726] border-b border-[#1f2d42] px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#ffd54f] font-medium flex items-center gap-1">
            <span>⏳</span>
            <span>{tr('다음 모험가 도착:')}</span>
          </span>
          <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-[#0b101c] border border-[#233552] text-xs">
            {timerText}
          </span>
          <button
            type="button"
            disabled={isAdLoading}
            onClick={() => setShowAdConfirm(true)}
            className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#ffd54f22] to-[#ffb30033] hover:from-[#ffd54f33] hover:to-[#ffb30044] border border-[#ffd54f66] text-[#ffd54f] hover:text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title={tr('광고 시청 후 대기 시간 및 갱신 비용 즉시 초기화')}
          >
            <span>📺</span>
            <span>{isAdLoading ? tr('광고 준비 중...') : tr('광고 시청 후 초기화')}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#8b9bb4]">
          <span>{tr('현재 갱신비:')}</span>
          <span className={`font-mono font-bold ${refreshStage === 1 ? 'text-[#66bb6a]' : refreshStage === 2 ? 'text-[#ffd54f]' : 'text-[#ff7043]'}`}>
            {refreshStage === 1 ? '1단계 100G' : refreshStage === 2 ? '2단계 400G' : `${refreshStage}단계 ${refreshCost.toLocaleString()}G`}
          </span>
        </div>
      </div>

      {isFull && (
        <div className="bg-[#ef535015] border-b border-[#ef535033] px-3 py-1.5 text-center text-xs text-[#ef5350] font-bold shrink-0">
          ⚠️ 용병단 정원 초과 (7/7명). 새 용병을 영입하려면 기존 용병을 해고해야 합니다.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {state.tavernCandidates.length === 0 && (
          <div className="panel p-8 text-center text-[#8b9bb4] text-sm">
            주점에 용병이 없습니다. [갱신] 버튼을 눌러보세요.
          </div>
        )}
        {state.tavernCandidates.map(cand => {
          const cls = CHARACTER_CLASSES[cand.classId];
          if (!cls) return null;
          const canAfford = state.resources.gold >= cand.hiringCost;
          const gMeta = GRADE_META[cand.grade] || GRADE_META.rookie;
          const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(cand.classId)
            || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
            || CustomAssetService.getInstance().getMercenaryOverride(cand.id)
            || CustomAssetService.getInstance().getMercenaryOverride(cand.name);

          return (
            <div
              key={cand.id}
              className="panel p-3 bg-[#131926] border border-[#222d42] hover:border-[#00d2ff55] rounded-xl flex flex-col gap-2.5 transition-all cursor-pointer"
              onClick={() => setDetailCandidate(cand)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-xl bg-[#1a2234] border border-[#2b3952] shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                    {customPortrait ? (
                      <img
                        src={customPortrait}
                        alt={cand.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-2xl">
                        {cls.skills[0]?.icon ?? '⚔️'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">{cand.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                        style={{ color: gMeta.color, background: `${gMeta.color}22`, border: `1px solid ${gMeta.color}44` }}
                      >
                        [{gMeta.tag}]
                      </span>
                      <span className="text-xs text-[#00d2ff] font-medium">{cls.name}</span>
                      {cand.trait && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] font-bold">
                          ✨ {cand.trait}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#cfd8dc] mt-0.5">
                      고유기: <strong className="text-[#ffd54f]">[{cls.specialSkill.name}]</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <ActionButton
                    label="🔍 상세"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailCandidate(cand)}
                  />
                  <ActionButton
                    label={isFull ? '정원 초과' : canAfford ? `🤝 고용 (🪙${cand.hiringCost}G)` : '골드 부족'}
                    variant={isFull ? 'ghost' : canAfford ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={isFull || !canAfford}
                    onClick={() => gm.hireMercenary(cand.id)}
                  />
                </div>
              </div>

              {/* 표준 RPG 이니셜 기반 스탯 바 */}
              <div className="pt-2 border-t border-[#1f2738] grid grid-cols-6 gap-1 text-center font-mono">
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#ef5350] block font-bold">HP</span>
                  <span className="text-xs text-white font-bold">{cand.stats.hp}</span>
                </div>
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#42a5f5] block font-bold">MP</span>
                  <span className="text-xs text-white font-bold">{cand.stats.mp}</span>
                </div>
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#ff7043] block font-bold">ATK</span>
                  <span className="text-xs text-white font-bold">{cand.stats.atk}</span>
                </div>
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#66bb6a] block font-bold">DEF</span>
                  <span className="text-xs text-white font-bold">{cand.stats.def}</span>
                </div>
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#ffd54f] block font-bold">SPD</span>
                  <span className="text-xs text-white font-bold">{cand.stats.spd}</span>
                </div>
                <div className="bg-[#0b101c] p-1 rounded border border-[#1e293b]">
                  <span className="text-[9px] text-[#ce93d8] block font-bold">LUK</span>
                  <span className="text-xs text-white font-bold">{cand.stats.luck}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 📜 용병 영입 상세 계약서 & 스탯 모달 ── */}
      {detailCandidate && (() => {
        const cls = CHARACTER_CLASSES[detailCandidate.classId];
        const canAfford = state.resources.gold >= detailCandidate.hiringCost;
        const gMeta = GRADE_META[detailCandidate.grade] || GRADE_META.rookie;
        if (!cls) return null;
        const detailPortrait = CustomAssetService.getInstance().getMercenaryOverride(detailCandidate.classId)
          || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
          || CustomAssetService.getInstance().getMercenaryOverride(detailCandidate.id)
          || CustomAssetService.getInstance().getMercenaryOverride(detailCandidate.name);

        return (
          <Modal
            title={`📜 용병 영입 계약서 — [${detailCandidate.name}]`}
            open={!!detailCandidate}
            onClose={() => setDetailCandidate(null)}
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="text-xs font-mono">
                  <span className="text-[#8b9bb4]">보유 골드: </span>
                  <span className={canAfford ? 'text-[#38ef7d] font-bold' : 'text-[#ef5350] font-bold'}>
                    🪙 {state.resources.gold}G
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={() => setDetailCandidate(null)}>
                    취소
                  </button>
                  <ActionButton
                    label={isFull ? '정원 초과' : canAfford ? `🤝 고용 체결 (🪙${detailCandidate.hiringCost}G)` : '골드 부족'}
                    variant={isFull ? 'ghost' : canAfford ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={isFull || !canAfford}
                    onClick={() => {
                      gm.hireMercenary(detailCandidate.id);
                      setDetailCandidate(null);
                    }}
                  />
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-3 text-xs">
              {/* 상단: 기본 인적 사항 & 클래스 배경 */}
              <div className="panel p-3 bg-[#131926] border border-[#27354d] rounded-xl flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#1a2234] border border-[#2b3952] shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                  {detailPortrait ? (
                    <img
                      src={detailPortrait}
                      alt={detailCandidate.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-3xl">
                      {cls.skills[0]?.icon ?? '⚔️'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-base text-white">{detailCandidate.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                      style={{ color: gMeta.color, background: `${gMeta.color}22`, border: `1px solid ${gMeta.color}44` }}
                    >
                      [{gMeta.tag}]
                    </span>
                    <span className="text-xs text-[#00d2ff] font-bold">{cls.name}</span>
                  </div>
                  {detailCandidate.trait && (() => {
                    const tInfo = HERO_TRAITS[detailCandidate.trait];
                    return (
                      <div className="mt-2 p-2.5 rounded-lg bg-[#ffd54f10] border border-[#ffd54f33] flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                            <span>✨ 개인 성향:</span>
                            <span className="text-white font-mono">[{detailCandidate.trait}]</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                            스탯 영구 반영
                          </span>
                        </div>
                        {tInfo && (
                          <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                            💡 <strong className="text-[#ffd54f]">효과:</strong> {tInfo.desc}
                          </div>
                        )}
                        <div className="text-[10px] text-[#8b9bb4]">
                          * 위 성향 효과는 고용 시 용병의 기본 능력치에 영구 합산되어 적용됩니다.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 중단: 스탯 종합 분석 (RPG Initials) */}
              <div className="panel p-3 bg-[#0d1424] border border-[#1e293b] rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-[#00d2ff]">📊 개별 능력치 (RPG Stat Profile)</span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#ef5350] font-bold">HP (생명력)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.hp}</span>
                  </div>
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#42a5f5] font-bold">MP (마나)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.mp}</span>
                  </div>
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#ff7043] font-bold">ATK (공격력)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.atk}</span>
                  </div>
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#66bb6a] font-bold">DEF (방어력)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.def}</span>
                  </div>
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#ffd54f] font-bold">SPD (행동속도)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.spd}</span>
                  </div>
                  <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f] flex flex-col items-center">
                    <span className="text-[10px] text-[#ce93d8] font-bold">LUK (행운)</span>
                    <span className="text-sm font-bold text-white mt-0.5">{detailCandidate.stats.luck}</span>
                  </div>
                </div>
              </div>

              {/* 하단: 보유 전투 기술 (고유기 + 기본 스킬 2종) */}
              <div className="panel p-3 bg-[#0c101c] border border-[#1f2b40] rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-[#ffd54f]">⚔️ 습득 전투 스킬</span>
                
                {/* 고유기 */}
                <div className="p-2 rounded-lg bg-[#1a1711] border border-[#ffd54f44] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GameIcon name={cls.specialSkill.id} icon={cls.specialSkill.icon} size={24} />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold">고유기</span>
                        <span className="font-bold text-xs text-white">{cls.specialSkill.name}</span>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] mt-0.5">{cls.specialSkill.description}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#64b5f6] font-mono shrink-0 ml-1">{cls.specialSkill.manaCost}MP</span>
                </div>

                {/* 기본기 2종 */}
                {cls.skills.slice(0, 2).map(sk => (
                  <div key={sk.id} className="p-2 rounded-lg bg-[#111726] border border-[#1f2b40] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GameIcon name={sk.id} icon={sk.icon} size={24} />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">기본기</span>
                          <span className="font-bold text-xs text-white">{sk.name}</span>
                        </div>
                        <div className="text-[10px] text-[#8b9bb4] mt-0.5">{sk.description}</div>
                      </div>
                    </div>
                    <span className="text-xs text-[#64b5f6] font-mono shrink-0 ml-1">{sk.manaCost}MP</span>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* 📺 광고 시청 확인 모달 */}
      {showAdConfirm && (
        <Modal
          title={`🍺 ${tr('방랑 모험가 즉시 도착 안내')}`}
          open={showAdConfirm}
          onClose={() => setShowAdConfirm(false)}
          footer={
            <div className="flex gap-2 w-full justify-end">
              <ActionButton
                label={tr('취소')}
                variant="ghost"
                onClick={() => setShowAdConfirm(false)}
              />
              <button
                type="button"
                onClick={handleConfirmWatchAd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd54f] to-[#ffb300] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#ffd54f33] cursor-pointer active:scale-95 transition-transform"
              >
                <span>📺</span>
                <span>{tr('광고 시청 후 즉시 도착')}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 py-1 text-xs">
            <div className="p-3 rounded-xl bg-[#1a2333] border border-[#2d3a4f] text-[#cfd8e8] leading-relaxed flex items-start gap-2.5">
              <span className="text-2xl shrink-0">🍺</span>
              <div>
                <p className="font-bold text-[#ffd54f] mb-1">
                  {tr('모험가 도착 쿨타임 및 갱신 비용 즉시 초기화')}
                </p>
                <p className="text-[#8b9bb4]">
                  {tr('광고를 시청하시면 남은 대기 시간(')}
                  <span className="text-white font-mono font-bold">{timerText}</span>
                  {tr(')이 즉시 초기화되며, 새로운 방랑 모험가 후보가 라운지에 즉시 도착합니다.')}
                </p>
                <p className="text-[11px] text-[#00d2ff] mt-1.5 flex items-center gap-1">
                  <span>✨</span>
                  <span>{tr('골드 새로고침 비용도 1단계(100G)로 함께 초기화됩니다.')}</span>
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
//  ⚔️ 원정단 편성 (장비 + 스킬북 전수 및 2개 스킬 슬롯 관리)
// ─────────────────────────────────────────────────────────────
const PROMOTE_MAP: Record<string, { id: string; name: string; desc: string }[]> = {
  squire:    [{ id: 'paladin', name: '⭐ 성기사', desc: '신성 방벽 & 아군 치유' }, { id: 'guardian', name: '🛡️ 중장 보병', desc: '철벽 방어 & 기절 강타' }],
  rogue:     [{ id: 'assassin', name: '⭐ 암살자', desc: '치명 처형 & 맹독' }, { id: 'duelist', name: '🗡️ 그림자 결투사', desc: '회피 반격 & 질풍 난무' }],
  vanguard:  [{ id: 'berserker', name: '⭐ 광전사', desc: '혈풍참 & 피의 폭주' }, { id: 'warlord', name: '🚩 전술 지휘관', desc: '진격 함성 & 전열 파쇄' }],
  gunner:    [{ id: 'tactical_gunner', name: '⭐ 전술 포수', desc: '레일건 관통 & 드론 폭격' }, { id: 'sharpshooter', name: '🎯 심연의 저격수', desc: '단일 헤드샷 & 치명 암살' }],
  apprentice:[{ id: 'elementalist', name: '⭐ 대마도사', desc: '원소 결합 & 연쇄 번개' }, { id: 'arcane_scholar', name: '📚 비전 학자', desc: '중력장 & 시공 왜곡' }],
  acolyte:   [{ id: 'bishop', name: '⭐ 주교', desc: '광역 정화 & 방어 버프' }, { id: 'war_priest', name: '⚔️ 전투 사제', desc: '신성 강타 & 성지 결계' }],
  paladin:   [{ id: 'aegis_valkyrie', name: '👑 발키리', desc: '완전 무적 결계 & 불멸의 수호' }],
  guardian:  [{ id: 'fortress', name: '🏰 포트리스', desc: '절대 요새의 성역 & 지진 분쇄타' }],
  assassin:  [{ id: 'shadow_phantom', name: '👤 그림자 망령', desc: '6연속 난무 & 방어무시 극딜' }],
  duelist:   [{ id: 'blade_dancer', name: '⚔️ 환영의 검성', desc: '만화경 환영검무 & 천영 질풍참' }],
  berserker: [{ id: 'valhalla_blade', name: '💥 발할라 블레이드', desc: '체력 비례 600% 극딜 & 불멸 포효' }],
  warlord:   [{ id: 'iron_marshal', name: '🚩 철혈의 패황', desc: '군단 총진격 & 총공격 진격령' }],
  tactical_gunner:[{ id: 'aether_gun_meister', name: '🛰️ 하이퍼 레인저', desc: '위성 궤도포 관통 240% 폭격' }],
  sharpshooter:[{ id: 'ghost_sniper', name: '🎯 사신 저격수', desc: '종말의 탄환 갓 킬러 & 사형 선고' }],
  elementalist:[{ id: 'calamity_mage', name: '☄️ 아크 메이지', desc: '종말의 메테오 & 공허 특이점' }],
  arcane_scholar:[{ id: 'chronomancer', name: '⏳ 시공의 조율사', desc: '시공 정지 & 쿨다운 완전 초기화' }],
  bishop:    [{ id: 'high_saintess', name: '🌈 성령의 구원자', desc: '부활 성가 & 전체 완전 치유' }],
  war_priest:[{ id: 'crusader_lord', name: '⚖️ 성전의 심판관', desc: '신벌의 심판추 & 최후의 성전' }],
};

const SKILL_RANK_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  basic:    { label: '기본', color: '#9e9e9e', bg: '#9e9e9e22' },
  enhanced: { label: '강화', color: '#66bb6a', bg: '#66bb6a22' },
  rare:     { label: '희귀', color: '#00d2ff', bg: '#00d2ff22' },
  epic:     { label: '에픽', color: '#ce93d8', bg: '#ce93d822' },
  mythic:   { label: '신화', color: '#ffd54f', bg: '#ffd54f22' },
};

const BarracksDrawer: React.FC<{
  onClose: () => void;
  onNavigateDrawer?: (drawerKey: string) => void;
  initialCategory?: 'dungeon' | 'dimensional';
}> = ({ onClose, onNavigateDrawer, initialCategory = 'dungeon' }) => {
  const { state, gm } = useGameManager();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [equipOverlay, setEquipOverlay] = useState<{ hero: Mercenary; slot: EquipmentSlot | 'all' } | null>(null);
  const [skillOverlayHero, setSkillOverlayHero] = useState<Mercenary | null>(null);
  const [dismissConfirmHero, setDismissConfirmHero] = useState<Mercenary | null>(null);
  const [previewClassTarget, setPreviewClassTarget] = useState<{ targetHero: Mercenary; classId: string } | null>(null);
  const [selectedBonusStat, setSelectedBonusStat] = useState<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>('atk');
  const [awakeningTargetHero, setAwakeningTargetHero] = useState<Mercenary | null>(null);
  const [selectedAwakenStat, setSelectedAwakenStat] = useState<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>('atk');
  const [showBondModal, setShowBondModal] = useState(false);
  const [showSynergyModal, setShowSynergyModal] = useState(false);

  const [barracksCategory, setBarracksCategory] = useState<'dungeon' | 'dimensional'>(initialCategory);
  useEffect(() => {
    setBarracksCategory(initialCategory);
  }, [initialCategory]);
  const [selectedDimRole, setSelectedDimRole] = useState<'main_0' | 'main_1' | 'main_2' | 'leader' | 'supporter' | null>(null);
  const [showDimTacticsGuide, setShowDimTacticsGuide] = useState(false);

  const isAnchorUnlocked = gm.isMasterAccount || (state.buildings['arenaGate']?.level || 0) > 0;
  const dimDeckData = gm.getDimensionalDeck();
  const { mainHeroes, leaderHero, supporterHero } = dimDeckData;
  const dimSquad = gm.getInvasionSquad();
  const mainSynergies = calculatePartySynergies(mainHeroes);
  const leaderBlessing = leaderHero ? gm.getLeaderBlessing(leaderHero) : null;

  // ⚡ 5인 차원 부대 (3선발 + 1리더 + 1서포터) 최적 자동 편성
  const handleAutoAssignDimSquad = () => {
    const ok = gm.autoAssignDimensionalDeck();
    if (ok) {
      SoundManager.getInstance().play('equip');
    } else {
      SoundManager.getInstance().play('debuff');
      alert('보유 용병이 5명 미만입니다! 주점에서 용병을 5명 이상 고용해주세요.');
    }
  };

  // 슬롯에 용병 배치 / 스왑
  const handleAssignHeroToDimSlot = (heroId: string) => {
    const currentDeck = { ...dimDeckData.deck };
    if (!selectedDimRole) {
      // 자동 빈 자리 배치
      if (!currentDeck.mainHeroIds.includes(heroId) && currentDeck.leaderHeroId !== heroId && currentDeck.supporterHeroId !== heroId) {
        if (currentDeck.mainHeroIds.length < 3) {
          currentDeck.mainHeroIds.push(heroId);
        } else if (!currentDeck.leaderHeroId) {
          currentDeck.leaderHeroId = heroId;
        } else if (!currentDeck.supporterHeroId) {
          currentDeck.supporterHeroId = heroId;
        } else {
          currentDeck.mainHeroIds[0] = heroId;
        }
        gm.setDimensionalDeck(currentDeck);
      }
      SoundManager.getInstance().play('click');
      return;
    }

    // 특정 역할 슬롯 선택 시
    const prevMain = [...currentDeck.mainHeroIds];
    let prevLeader = currentDeck.leaderHeroId;
    let prevSupporter = currentDeck.supporterHeroId;

    if (selectedDimRole.startsWith('main_')) {
      const idx = parseInt(selectedDimRole.split('_')[1], 10);
      // 기존에 다른 슬롯에 들어가 있던 영웅인지 확인하여 스왑
      if (prevLeader === heroId) prevLeader = prevMain[idx] || '';
      else if (prevSupporter === heroId) prevSupporter = prevMain[idx] || '';
      else {
        const otherMainIdx = prevMain.indexOf(heroId);
        if (otherMainIdx !== -1) prevMain[otherMainIdx] = prevMain[idx];
      }
      prevMain[idx] = heroId;
    } else if (selectedDimRole === 'leader') {
      if (prevSupporter === heroId) prevSupporter = prevLeader;
      else {
        const mainIdx = prevMain.indexOf(heroId);
        if (mainIdx !== -1) prevMain[mainIdx] = prevLeader;
      }
      prevLeader = heroId;
    } else if (selectedDimRole === 'supporter') {
      if (prevLeader === heroId) prevLeader = prevSupporter;
      else {
        const mainIdx = prevMain.indexOf(heroId);
        if (mainIdx !== -1) prevMain[mainIdx] = prevSupporter;
      }
      prevSupporter = heroId;
    }

    gm.setDimensionalDeck({
      mainHeroIds: prevMain.filter(Boolean),
      leaderHeroId: prevLeader,
      supporterHeroId: prevSupporter,
    });
    setSelectedDimRole(null);
    SoundManager.getInstance().play('click');
  };

  // 슬롯에서 용병 제거
  const handleRemoveFromDimRole = (role: 'main_0' | 'main_1' | 'main_2' | 'leader' | 'supporter') => {
    const currentDeck = { ...dimDeckData.deck };
    if (role.startsWith('main_')) {
      const idx = parseInt(role.split('_')[1], 10);
      currentDeck.mainHeroIds = currentDeck.mainHeroIds.filter((_, i) => i !== idx);
    } else if (role === 'leader') {
      currentDeck.leaderHeroId = '';
    } else if (role === 'supporter') {
      currentDeck.supporterHeroId = '';
    }
    gm.setDimensionalDeck(currentDeck);
    SoundManager.getInstance().play('click');
  };

  const safeIdx = Math.min(selectedIdx, Math.max(0, state.barracks.length - 1));
  const hero = state.barracks[safeIdx];
  const cls = hero ? CHARACTER_CLASSES[hero.classId] : null;
  const synergies = gm.getActiveSynergies();

  const GRADE_META: Record<string, { label: string; tag: string; color: string }> = {
    rookie:  { label: 'N', tag: 'N', color: '#9e9e9e' },
    veteran: { label: 'V', tag: 'V', color: '#66bb6a' },
    hero:    { label: 'H', tag: 'H', color: '#00d2ff' },
    elite:   { label: 'H', tag: 'H', color: '#00d2ff' },
    epic:    { label: 'E', tag: 'E', color: '#ce93d8' },
    legend:  { label: 'E', tag: 'E', color: '#ce93d8' },
  };

  const EQ_SLOTS: { slot: EquipmentSlot; label: string; icon: string }[] = [
    { slot: 'weapon', label: '무기', icon: '⚔️' },
    { slot: 'armor', label: '방어구', icon: '🛡️' },
    { slot: 'accessory', label: '장신구', icon: '💍' },
  ];

  // 영웅이 장착 중인 2개 스킬 데이터 조회
  const equippedSkill1 = hero && hero.equippedSkills?.[0] ? gm.resolveSkillData(hero.equippedSkills[0]) : null;
  const equippedSkill2 = hero && hero.equippedSkills?.[1] ? gm.resolveSkillData(hero.equippedSkills[1]) : null;
  const learnedCount = hero?.learnedSkills?.length || 0;

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">⚔️</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#00d2ff]">{'병영'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
              {`보유 ${state.barracks.length}/7명`}
            </span>
            <EncyclopediaBadge tab="classes" label="병영 백과" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="text-[10px] px-2 py-1 rounded-lg bg-[#ff416c18] text-[#ff416c] border border-[#ff416c33] font-bold hover:bg-[#ff416c28] transition-all cursor-pointer shrink-0"
            onClick={() => setShowBondModal(true)}
          >
            💞 유대 관계도
          </button>
          <button
            className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>
      </div>

      {/* ── ⚔️ / 🌌 카테고리 탭 (3인 던전 원정대 vs 5인 차원 부대) ── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0d16] border-b border-[#1f2738] shrink-0">
        <button
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            barracksCategory === 'dungeon'
              ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff66] shadow-sm'
              : 'bg-[#121724] text-[#8b9bb4] border border-[#20293d] hover:text-white'
          }`}
          onClick={() => setBarracksCategory('dungeon')}
        >
          <span>⚔️</span>
          <span>던전 원정대 (3인)</span>
          <span className="text-[10px] font-mono text-[#38ef7d]">({state.party.length}/3)</span>
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            barracksCategory === 'dimensional'
              ? 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c66] shadow-sm'
              : 'bg-[#121724] text-[#8b9bb4] border border-[#20293d] hover:text-white'
          }`}
          onClick={() => setBarracksCategory('dimensional')}
        >
          <span>{isAnchorUnlocked ? '🌌' : '🔒'}</span>
          <span>차원 부대 (5인)</span>
          {isAnchorUnlocked ? (
            <span className="text-[10px] font-mono text-[#ffd54f]">({dimSquad.length}/5)</span>
          ) : (
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">앵커 필요</span>
          )}
        </button>
      </div>

      {barracksCategory === 'dimensional' ? (
        // ── 🌌 5인 차원 부대 관리 뷰 ──
        !isAnchorUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="text-4xl p-4 bg-[#ff416c15] border border-[#ff416c33] rounded-2xl text-[#ff416c] animate-pulse">
              🔒
            </div>
            <h3 className="text-base font-extrabold text-white">차원 부대 편성 잠김</h3>
            <p className="text-xs text-[#8b9bb4] max-w-sm leading-relaxed">
              차원 부대 편성은 영지 내 <strong className="text-[#00d2ff]">[차원 앵커 게이트]</strong>를 건설해야 해금되는 특수 부대 관리 기능입니다.<br />
              차원 앵커를 완공하면 5인의 정예 용병을 편성하여 차원 아레나, 시공 침식 네메시스 레이드 및 영지 침공에 출전시킬 수 있습니다.
            </p>
            <button
              className="btn btn-primary text-xs px-4 py-2 mt-2"
              onClick={onClose}
            >
              🏛️ 영지로 돌아가 건물 건설하기
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 animate-fade-in">
            {/* 상단 안내 & 5인 최적 자동 편성 버튼 */}
            <div className="bg-[#0b101c] p-3 rounded-xl border border-[#1b263b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
              <div>
                <div className="font-extrabold text-white flex items-center gap-2 flex-wrap">
                  <span>🌌 3+1+1 차원 전술 덱 편성</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]">
                    총 전투력: ⚡ {Math.round(dimSquad.reduce((sum, h) => sum + (h.stats.atk * 3 + h.stats.def * 2 + h.maxHp / 5), 0)).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDimTacticsGuide(v => !v)}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f18] hover:bg-[#ffd54f33] text-[#ffd54f] border border-[#ffd54f44] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <span>ℹ️</span>
                    <span>전술 가이드</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8b9bb4] mt-0.5 leading-relaxed">
                  필드 3인 선발 전투 + 1인 리더(영령 가호 및 피버 궁극기) + 1인 서포터(원호 방어 50% & 공격/치유 지원)
                </p>
              </div>
              <button
                className="btn btn-primary text-xs px-3.5 py-1.5 font-bold flex items-center gap-1 shrink-0"
                onClick={handleAutoAssignDimSquad}
              >
                <span>⚡</span>
                <span>최적 3+1+1 자동 편성</span>
              </button>
            </div>

            {/* 📖 전술 가이드 상세 패널 */}
            {showDimTacticsGuide && (
              <div className="bg-[#0f172a] p-3 rounded-xl border border-[#00d2ff66] shadow-lg flex flex-col gap-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
                  <span className="font-bold text-[#00d2ff] flex items-center gap-1.5 text-xs">
                    <span>📖</span>
                    <span>차원 부대(5인) 전술 포지션 & 서포터 시스템 가이드</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDimTacticsGuide(false)}
                    className="text-[#8b9bb4] hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#cfd8e8]">
                  <div className="p-2 rounded-lg bg-[#141e30] border border-[#233554] space-y-1">
                    <div className="font-bold text-[#80deea] flex items-center gap-1">
                      <span>🛡️</span>
                      <span>차원 서포터 시스템</span>
                    </div>
                    <ul className="list-disc list-inside text-[#94a3b8] space-y-0.5 leading-relaxed">
                      <li><strong className="text-white">원호 방어 (Assist Guard):</strong> 아군 피격 시(치명타 피격 또는 확률 발동) 받는 피해를 50%로 분담/경감하여 아군의 급사를 방지합니다.</li>
                      <li><strong className="text-white">원호 지원 (Assist Action):</strong> 아군 공격 시 40% 확률로 후방에서 추가타(딜러/탱커) 또는 아군 치유(힐러)를 지원합니다.</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141e30] border border-[#233554] space-y-1">
                    <div className="font-bold text-[#ffd54f] flex items-center gap-1">
                      <span>👑</span>
                      <span>차원 리더 시스템</span>
                    </div>
                    <p className="text-[#94a3b8] leading-relaxed">
                      전 부대에 상시 적용되는 <strong className="text-[#ffd54f]">영령의 가호</strong> 버프를 부여하며, 전투 중 피버 게이지 100% 충전 시 강력한 전황 역전용 피버 궁극기를 발동합니다.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1e293b] text-[10px]">
                  <div className="p-1.5 rounded bg-[#2a1215] border border-[#ff525244] text-[#ff8a80]">
                    <span className="font-bold text-[#ff5252]">🔴 전열:</span> 선봉 방어 및 돌파. 전열 피격 분담 및 어그로 집중.
                  </div>
                  <div className="p-1.5 rounded bg-[#281708] border border-[#ff980044] text-[#ffb74d]">
                    <span className="font-bold text-[#ff9800]">🟡 중열:</span> 전열 엄호 및 안정적 화력 투사, 스킬 콤보 연계.
                  </div>
                  <div className="p-1.5 rounded bg-[#0a2416] border border-[#00e67644] text-[#69f0ae]">
                    <span className="font-bold text-[#00e676]">🟢 후열:</span> 후방에서 안전하게 광역 마법, 치유, 원거리 저격 수행.
                  </div>
                </div>
              </div>
            )}

            {/* 👑 리더 (1인) & 🛡️ 서포터 (1인) 특수 슬롯 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 리더 슬롯 */}
              <div
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[110px] ${
                  selectedDimRole === 'leader'
                    ? 'bg-[#2a1a08] border-[#ffd54f] shadow-[0_0_12px_rgba(255,213,79,0.4)]'
                    : leaderHero
                    ? 'bg-[#18140c] border-[#ffb30044] hover:border-[#ffd54f88]'
                    : 'bg-[#100c06] border-[#3d2c0b] border-dashed hover:border-[#ffb30088]'
                }`}
                onClick={() => setSelectedDimRole(selectedDimRole === 'leader' ? null : 'leader')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#ffd54f] flex items-center gap-1">
                    <span>👑</span>
                    <span>차원 리더 (가호/궁극기)</span>
                  </span>
                  {leaderHero && (
                    <button
                      className="text-[#ff416c] hover:text-white px-1 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromDimRole('leader');
                      }}
                      title="리더 해제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {leaderHero ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl p-1.5 bg-[#090e18] rounded-lg border border-[#ffd54f44] shrink-0">
                      {CHARACTER_CLASSES[leaderHero.classId]?.skills[0]?.icon || '👑'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">{leaderHero.name}</div>
                      <div className="text-[9px] text-[#ffd54f]">
                        {CHARACTER_CLASSES[leaderHero.classId]?.name} Lv.{leaderHero.level}
                      </div>
                      <div className="text-[9px] text-[#ffecb3] truncate mt-0.5">
                        ✨ {leaderBlessing ? leaderBlessing.name : '영령의 가호 발동'} (피버 궁극기 준비)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-2 text-center text-[#8d6e63]">
                    <span className="text-base font-bold">+ 리더 지정</span>
                    <span className="text-[9px]">영령 가호 및 피버 궁극기 전담</span>
                  </div>
                )}
              </div>

              {/* 서포터 슬롯 */}
              <div
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[110px] ${
                  selectedDimRole === 'supporter'
                    ? 'bg-[#14233c] border-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                    : supporterHero
                    ? 'bg-[#0f1726] border-[#00d2ff44] hover:border-[#00d2ff88]'
                    : 'bg-[#090e18] border-[#1b2a40] border-dashed hover:border-[#00d2ff66]'
                }`}
                onClick={() => setSelectedDimRole(selectedDimRole === 'supporter' ? null : 'supporter')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#00d2ff] flex items-center gap-1">
                    <span>🛡️</span>
                    <span>차원 서포터 (원호 지원/방어)</span>
                  </span>
                  {supporterHero && (
                    <button
                      className="text-[#ff416c] hover:text-white px-1 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromDimRole('supporter');
                      }}
                      title="서포터 해제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {supporterHero ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl p-1.5 bg-[#090e18] rounded-lg border border-[#00d2ff44] shrink-0">
                      {CHARACTER_CLASSES[supporterHero.classId]?.skills[0]?.icon || '🛡️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">{supporterHero.name}</div>
                      <div className="text-[9px] text-[#00d2ff]">
                        {CHARACTER_CLASSES[supporterHero.classId]?.name} Lv.{supporterHero.level}
                      </div>
                      <div className="text-[9px] text-[#80deea] truncate mt-0.5">
                        🛡️ 원호 방어(피해 50% 분담) & ⚔️ 원호 지원(공격/치유)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-2 text-center text-[#546e7a]">
                    <span className="text-base font-bold">+ 서포터 지정</span>
                    <span className="text-[9px]">아군 피격 시 50% 원호 방어 및 공격 시 원호 지원</span>
                  </div>
                )}
              </div>
            </div>

            {/* ⚔️ 3인 선발 필드 전투원 슬롯 & 실시간 시너지 */}
            <div className="panel p-2.5 bg-[#0a0f1b] border border-[#1b263b] rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <span>⚔️</span>
                  <span>선발 3인 필드 전투원 (던전 진형 시너지 적용)</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {mainHeroes.length}/3명 배치됨
                </span>
              </div>

              {/* 활성 시너지 태그 바 */}
              <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
                {mainSynergies.length > 0 ? (
                  mainSynergies.map(syn => (
                    <span
                      key={syn.id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d2ff18] text-[#00d2ff] border border-[#00d2ff44] font-bold flex items-center gap-1"
                      title={syn.description}
                    >
                      <span>{syn.icon}</span>
                      <span>{syn.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#607d8b]">선발 3인의 직업 조합에 따라 진형 시너지가 발동합니다.</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    name: '전열',
                    icon: '🔴',
                    role: '방어 / 돌파',
                    color: '#ff5252',
                    selectedStyle: 'bg-[#2a1215] border-[#ff5252] shadow-[0_0_14px_rgba(255,82,82,0.5)]',
                    normalStyle: 'bg-[#140e11] border-[#ff525244] hover:border-[#ff525288]',
                    emptyStyle: 'bg-[#0f0a0d] border-[#ff525233] border-dashed hover:border-[#ff525266]',
                    badgeClass: 'text-[#ff5252] bg-[#ff525218] border-[#ff525244]',
                    emptyTextClass: 'text-[#ff8a80]',
                  },
                  {
                    name: '중열',
                    icon: '🟡',
                    role: '연계 / 화력',
                    color: '#ff9800',
                    selectedStyle: 'bg-[#281708] border-[#ff9800] shadow-[0_0_14px_rgba(255,152,0,0.5)]',
                    normalStyle: 'bg-[#151008] border-[#ff980044] hover:border-[#ff980088]',
                    emptyStyle: 'bg-[#100c06] border-[#ff980033] border-dashed hover:border-[#ff980066]',
                    badgeClass: 'text-[#ff9800] bg-[#ff980018] border-[#ff980044]',
                    emptyTextClass: 'text-[#ffb74d]',
                  },
                  {
                    name: '후열',
                    icon: '🟢',
                    role: '지원 / 원거리',
                    color: '#00e676',
                    selectedStyle: 'bg-[#0a2416] border-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.5)]',
                    normalStyle: 'bg-[#091510] border-[#00e67644] hover:border-[#00e67688]',
                    emptyStyle: 'bg-[#06100c] border-[#00e67633] border-dashed hover:border-[#00e67666]',
                    badgeClass: 'text-[#00e676] bg-[#00e67618] border-[#00e67644]',
                    emptyTextClass: 'text-[#69f0ae]',
                  },
                ].map((posTheme, idx) => {
                  const h = mainHeroes[idx];
                  const roleKey = (`main_${idx}` as 'main_0' | 'main_1' | 'main_2');
                  const isSelected = selectedDimRole === roleKey;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex flex-col justify-between gap-1 min-h-[120px] transition-all cursor-pointer relative ${
                        isSelected
                          ? posTheme.selectedStyle
                          : h
                          ? posTheme.normalStyle
                          : posTheme.emptyStyle
                      }`}
                      onClick={() => setSelectedDimRole(isSelected ? null : roleKey)}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded border text-[9px] ${posTheme.badgeClass}`}>
                          {posTheme.icon} {posTheme.name} ({idx + 1})
                        </span>
                        {h && (
                          <button
                            className="text-[#ff416c] hover:text-white px-1 text-xs font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromDimRole(roleKey);
                            }}
                            title="선발 해제"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {h ? (
                        <div className="flex flex-col items-center text-center gap-0.5">
                          <span className="text-2xl p-1 bg-[#090e18] rounded-lg border border-[#1b263b]">
                            {CHARACTER_CLASSES[h.classId]?.skills[0]?.icon || '⚔️'}
                          </span>
                          <div className="font-bold text-xs text-white truncate w-full">{h.name}</div>
                          <div className="text-[9px] font-bold" style={{ color: posTheme.color }}>
                            {CHARACTER_CLASSES[h.classId]?.name} Lv.{h.level}
                          </div>
                          <div className="text-[9px] text-[#ffd54f] font-mono">
                            ⚔️{h.stats.atk} 🛡️{h.stats.def}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center">
                          <span className="text-xl mb-0.5" style={{ color: posTheme.color }}>+</span>
                          <span className={`text-[9px] font-bold ${posTheme.emptyTextClass}`}>
                            {posTheme.name} 선택
                          </span>
                          <span className="text-[8px] text-[#8b9bb4] mt-0.5">
                            {posTheme.role}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단: 보유 용병 선택 리스트 */}
            <div className="panel p-3 bg-[#0c111e] border border-[#1b263c] rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#cfd8e8] flex items-center gap-1.5">
                  <span>👥</span>
                  <span>
                    {selectedDimRole
                      ? selectedDimRole === 'main_0'
                        ? '[선발 전열 (🔴 방어/돌파)]에 배치할 용병을 탭하세요'
                        : selectedDimRole === 'main_1'
                        ? '[선발 중열 (🟡 연계/화력)]에 배치할 용병을 탭하세요'
                        : selectedDimRole === 'main_2'
                        ? '[선발 후열 (🟢 지원/원거리)]에 배치할 용병을 탭하세요'
                        : selectedDimRole === 'leader'
                        ? '[차원 리더 (👑 가호/궁극기)]로 지정할 용병을 탭하세요'
                        : '[차원 서포터 (🛡️ 원호 지원/방어)]로 지정할 용병을 탭하세요'
                      : '보유 용병 선택 (슬롯을 먼저 선택하거나 탭하여 바로 배치)'}
                  </span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">{state.barracks.length}명 보유</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {state.barracks.map(bHero => {
                  const mainIdx = mainHeroes.findIndex(h => h.id === bHero.id);
                  const isLeader = leaderHero?.id === bHero.id;
                  const isSupporter = supporterHero?.id === bHero.id;
                  const isAssigned = mainIdx !== -1 || isLeader || isSupporter;
                  const gMeta = GRADE_META[bHero.grade] || GRADE_META.rookie;
                  const bCls = CHARACTER_CLASSES[bHero.classId];

                  let assignedLabel = '대기';
                  let badgeStyle = '';
                  let cardBgStyle = 'bg-[#121927] border-[#1d273a] hover:border-[#00d2ff44]';

                  if (mainIdx === 0) {
                    assignedLabel = '🔴 선발 전열';
                    badgeStyle = 'bg-[#ff525222] text-[#ff5252] border-[#ff525255]';
                    cardBgStyle = 'bg-[#1a0e10] border-[#ff525244]';
                  } else if (mainIdx === 1) {
                    assignedLabel = '🟡 선발 중열';
                    badgeStyle = 'bg-[#ff980022] text-[#ff9800] border-[#ff980055]';
                    cardBgStyle = 'bg-[#1a1208] border-[#ff980044]';
                  } else if (mainIdx === 2) {
                    assignedLabel = '🟢 선발 후열';
                    badgeStyle = 'bg-[#00e67622] text-[#00e676] border-[#00e67655]';
                    cardBgStyle = 'bg-[#0a1810] border-[#00e67644]';
                  } else if (isLeader) {
                    assignedLabel = '👑 리더';
                    badgeStyle = 'bg-[#ffd54f22] text-[#ffd54f] border-[#ffd54f44]';
                    cardBgStyle = 'bg-[#1e170b] border-[#ffd54f55]';
                  } else if (isSupporter) {
                    assignedLabel = '🛡️ 서포터';
                    badgeStyle = 'bg-[#00d2ff22] text-[#00d2ff] border-[#00d2ff44]';
                    cardBgStyle = 'bg-[#101c2b] border-[#00d2ff55]';
                  }

                  return (
                    <div
                      key={bHero.id}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${cardBgStyle}`}
                      onClick={() => handleAssignHeroToDimSlot(bHero.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{bCls?.skills[0]?.icon || '⚔️'}</span>
                        {isAssigned ? (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${badgeStyle}`}>
                            {assignedLabel}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold" style={{ color: gMeta.color, background: `${gMeta.color}15` }}>
                            대기
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-white truncate">{bHero.name}</div>
                      <div className="text-[10px] text-[#8b9bb4]">
                        {bCls?.name} Lv.{bHero.level}
                      </div>
                      <div className="text-[9px] text-[#ffd54f] font-mono flex items-center justify-between">
                        <span>ATK {bHero.stats.atk}</span>
                        <span>DEF {bHero.stats.def}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── ⚔️ 기존 3인 던전 원정대 관리 뷰 ── */
        state.barracks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#8b9bb4]">
            보관소에 용병이 없습니다. 주점에서 새 용병을 영입하세요.
          </div>
        ) : (
          <>
            {/* 상단 용병 선택 탭 바 */}
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 bg-[#0e121d] border-b border-[#1f2738]">
            {state.barracks.map((h, i) => {
              const inParty = state.party.some(p => p.id === h.id);
              const isAdmitted = state.infirmaryPatients.includes(h.id);
              const gMeta = GRADE_META[h.grade] || GRADE_META.rookie;
              const isSelected = safeIdx === i;

              const hCls = CHARACTER_CLASSES[h.classId];
              const hTier = hCls?.tier || 0;
              const hReqLv = hTier === 0 ? 10 : 30;
              const canPromoteHero = h.level >= hReqLv && (PROMOTE_MAP[h.classId]?.length || 0) > 0;
              const canAwakenHero = hTier === 2 && h.level >= (30 + ((h.awakeningCount || 0) + 1) * 10);

              return (
                <button
                  key={h.id}
                  className={`btn min-w-[80px] text-xs py-1.5 flex-col transition-all rounded-lg relative ${
                    isSelected ? 'btn-primary shadow-md' : 'btn-ghost border border-[#222d42]'
                  }`}
                  onClick={() => setSelectedIdx(i)}
                >
                  {canPromoteHero && (
                    <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.2 rounded-full bg-[#ffd54f] text-black font-bold animate-pulse shadow-sm shadow-[#ffd54f]">
                      ✨전직
                    </span>
                  )}
                  {canAwakenHero && (
                    <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.2 rounded-full bg-[#00d2ff] text-black font-bold animate-pulse shadow-sm shadow-[#00d2ff]">
                      🔮각성
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-bold truncate max-w-[48px]">{h.name}</span>
                    <span className="text-[9px] font-bold font-mono text-[#ffd54f]">
                      Lv.{h.level}
                    </span>
                  </div>
                  <div className={`text-[10px] font-bold mt-0.5 ${isAdmitted ? 'text-[#ff7043]' : canAwakenHero ? 'text-[#00d2ff]' : canPromoteHero ? 'text-[#ffd54f]' : inParty ? 'text-[#38ef7d]' : 'text-[#8b9bb4]'}`}>
                    {isAdmitted ? '🏥입원중' : canAwakenHero ? '🔮각성가능' : canPromoteHero ? '✨전직가능' : inParty ? '★ 파티원' : '대기중'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 선택된 용병 상세 정보 */}
          {hero && cls && (
            <div className="flex-1 overflow-y-auto p-3 relative flex flex-col gap-2.5">
              {/* 용병 기본 상태 카드 */}
              {(() => {
                const gMeta = GRADE_META[hero.grade] || GRADE_META.rookie;
                const inParty = state.party.some(p => p.id === hero.id);

                return (
                  <div className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-base text-white">{hero.name}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                          style={{ color: gMeta.color, background: `${gMeta.color}22`, border: `1px solid ${gMeta.color}44` }}
                        >
                          [{gMeta.tag}]
                        </span>
                        <span className="text-xs text-[#00d2ff] font-medium">{cls.name}</span>
                        <span className="text-xs font-bold font-mono text-[#ffd54f] bg-[#ffd54f18] px-2 py-0.5 rounded border border-[#ffd54f44] shadow-sm">
                          Lv.{hero.level}
                        </span>
                      </div>
                      {(() => {
                        const isAdmitted = state.infirmaryPatients.includes(hero.id);
                        if (isAdmitted) {
                          return (
                            <button
                              className="text-[10px] px-2 py-0.5 rounded bg-[#ff704322] hover:bg-[#ff70433d] text-[#ff7043] font-bold border border-[#ff704355] hover:border-[#ff7043aa] flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                              onClick={() => onNavigateDrawer?.('infirmary')}
                              title="생체 복원 병동으로 즉시 이동"
                            >
                              <span>🏥 입원 중</span>
                            </button>
                          );
                        }
                        if (inParty) {
                          return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                              ★ 출전 중
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b9bb422] text-[#8b9bb4]">
                            대기중
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const traitKey = hero.trait || hero.title || '';
                      const traitInfo = HERO_TRAITS[traitKey];
                      if (!traitInfo) return null;
                      return (
                        <div className="mt-1 px-2.5 py-1 rounded-lg bg-[#ffd54f10] border border-[#ffd54f28] text-[11px] flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                            ✨ {traitInfo.name}
                          </span>
                          <span className="text-[#cfd8dc] font-mono text-[10px]">{traitInfo.desc}</span>
                        </div>
                      );
                    })()}

                    {(() => {
                      const eff = gm.getHeroEffectiveStats(hero);
                      return (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2 text-xs font-mono">
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#ef5350] font-bold">HP</span>
                            <span className="font-bold text-white">{Math.round(hero.currentHp)}/{Math.round(eff.maxHp)}</span>
                          </div>
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#42a5f5] font-bold">MP</span>
                            <span className="font-bold text-white">{hero.currentMp}/{eff.maxMp}</span>
                          </div>
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#ff7043] font-bold">ATK</span>
                            <span className="font-bold text-white">{eff.atk}</span>
                          </div>
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#66bb6a] font-bold">DEF</span>
                            <span className="font-bold text-white">{eff.def}</span>
                          </div>
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#ffd54f] font-bold">SPD</span>
                            <span className="font-bold text-white">{eff.spd}</span>
                          </div>
                          <div className="flex flex-col items-center bg-[#0d1424] p-1.5 rounded-lg border border-[#1f2b40]">
                            <span className="text-[10px] text-[#ce93d8] font-bold">LUK</span>
                            <span className="font-bold text-white">{eff.luck}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* 🛡️ 장착 장비 슬롯 */}
              <div className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl">
                <div className="text-xs text-[#38ef7d] font-bold mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🛡️ 장착 장비</span>
                    <button
                      type="button"
                      onClick={() => setEquipOverlay({ hero, slot: 'all' })}
                      className="px-2 py-0.5 text-[11px] bg-[#00d2ff1a] hover:bg-[#00d2ff33] text-[#00d2ff] border border-[#00d2ff44] rounded transition-colors font-medium flex items-center gap-1 cursor-pointer"
                      title="전체 장비 보관함 열기 및 필터/일괄 판매 관리"
                    >
                      <span>🎒 전체 장비 관리 / 일괄 판매</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-[#8b9bb4]">탭하여 장착/해제</span>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {EQ_SLOTS.map(({ slot, label, icon }) => {
                    const eq = hero.equipment?.[slot];
                    const hasPrefix = !!eq?.prefix;
                    const hasSuffix = !!eq?.suffix;
                    const nameLen = eq ? eq.name.length : label.length;
                    // 이름 길이에 따른 단계적 폰트 축소 (긴 이름 깨짐 방지)
                    const nameFontSizeClass = nameLen >= 15
                      ? 'text-[8px] tracking-tighter'
                      : nameLen >= 10
                      ? 'text-[8px] tracking-tight' : 'text-[10px]';

                    return (
                      <button
                        key={slot}
                        className="w-full min-w-0 overflow-hidden panel p-2 text-center flex flex-col items-center justify-between gap-1 rounded-lg transition-all hover:border-[#00d2ff66] select-none cursor-pointer"
                        style={{ borderColor: eq ? '#38ef7d' : '#222d42', background: eq ? '#0d1f18' : '#141a29', minHeight: '84px' }}
                        onClick={() => setEquipOverlay({ hero, slot })}
                        title={eq ? `${eq.name} (+${eq.level}강)` : `[${label}] 슬롯 (미장착)`}
                      >
                        {/* 아이콘 및 인챈트 인디케이터 */}
                        <div className="text-xl flex items-center justify-center gap-0.5 shrink-0">
                          {eq ? (
                            <span 
                              className="p-1 rounded-md bg-[#1e2738] border shrink-0 flex items-center justify-center transition-all"
                              style={getRarityBorderStyle(eq.rarity)}
                            >
                              <GameIcon name={eq.templateId || getEquipmentTemplateId(eq) || eq.id || eq.baseName} icon={eq.icon} size={22} />
                            </span>
                          ) : (
                            <span>{icon}</span>
                          )}
                          {(hasPrefix || hasSuffix) && (
                            <span className="text-[10px] flex gap-0.5 ml-0.5">
                              {hasPrefix && <span title={`접두사: ${eq.prefix?.name}`}>✨</span>}
                              {hasSuffix && <span title={`접미사: ${eq.suffix?.name}`}>🔮</span>}
                            </span>
                          )}
                        </div>

                        {/* 장비 이름: 고정 폭 내에서 길이에 따른 폰트 축소 및 말줄임표(...) 생략 */}
                        <div className="w-full min-w-0 px-0.5">
                          <div
                            className={`w-full min-w-0 font-bold truncate text-center text-white ${nameFontSizeClass}`}
                            title={eq ? eq.name : `[${label}]`}
                          >
                            {eq ? eq.name : `[${label}]`}
                          </div>
                        </div>

                        {/* 강화 수치 및 등급 배지 (고정 높이로 버튼 정렬 유지) */}
                        <div className="w-full min-w-0 flex items-center justify-center gap-1 shrink-0 h-3.5">
                          {eq ? (
                            <>
                              <span className="text-[9px] text-[#ffd54f] font-mono shrink-0">+{eq.level}강</span>
                              <span className="text-[8px] font-bold truncate shrink-0" style={{ color: getRarityColor(eq.rarity) }}>
                                [{getRarityLabel(eq.rarity)}]
                              </span>
                            </>
                          ) : (
                            <span className="text-[9px] text-[#607d8b]">비어있음</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📖 전술 스킬 슬롯 (고유기 + 장착 스킬 2개) */}
              <div className="panel p-3 bg-[#131926] border border-[#00d2ff44] rounded-xl">
                <div className="text-xs text-[#00d2ff] font-bold mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>📖</span>
                    <span>전투 스킬 슬롯 (고유기 1 + 장착 2)</span>
                  </span>
                  <button
                    className="text-[10px] px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] font-bold hover:bg-[#00d2ff33]"
                    onClick={() => setSkillOverlayHero(hero)}
                  >
                    ⚙️ 스킬 관리 (습득: {learnedCount}/4)
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {/* 고유기 (고정) */}
                  <div className="p-2 rounded-lg bg-[#1a1711] border border-[#ffd54f44] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GameIcon name={cls.specialSkill.id} icon={cls.specialSkill.icon} size={24} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                            {cls.specialSkill.name.includes('[궁극기]') ? '궁극기' : '고유기'}
                          </span>
                          <span className="font-bold text-xs text-white">{cls.specialSkill.name}</span>
                        </div>
                        <div className="text-[10px] text-[#8b9bb4] mt-0.5">{cls.specialSkill.description}</div>
                      </div>
                    </div>
                    <span className="text-xs text-[#64b5f6] font-mono shrink-0 ml-1">{cls.specialSkill.manaCost}MP</span>
                  </div>

                  {/* 장착 전술 스킬 슬롯 1 & 2 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* 슬롯 1 */}
                    <button
                      className="p-2 rounded-lg bg-[#141a29] border border-[#26334a] hover:border-[#00d2ff66] text-left flex flex-col justify-between transition-all"
                      onClick={() => setSkillOverlayHero(hero)}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[9px] text-[#00d2ff] font-bold">전술 스킬 1</span>
                        {equippedSkill1 && <span className="text-[9px] text-[#64b5f6] font-mono">{equippedSkill1.manaCost}MP</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {equippedSkill1 ? (
                          <GameIcon name={equippedSkill1.id} icon={equippedSkill1.icon} size={20} />
                        ) : (
                          <span className="text-lg">➕</span>
                        )}
                        <span className="font-bold text-xs text-white truncate">
                          {equippedSkill1 ? equippedSkill1.name : '스킬 장착'}
                        </span>
                      </div>
                    </button>

                    {/* 슬롯 2 */}
                    <button
                      className="p-2 rounded-lg bg-[#141a29] border border-[#26334a] hover:border-[#00d2ff66] text-left flex flex-col justify-between transition-all"
                      onClick={() => setSkillOverlayHero(hero)}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[9px] text-[#00d2ff] font-bold">전술 스킬 2</span>
                        {equippedSkill2 && <span className="text-[9px] text-[#64b5f6] font-mono">{equippedSkill2.manaCost}MP</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {equippedSkill2 ? (
                          <GameIcon name={equippedSkill2.id} icon={equippedSkill2.icon} size={20} />
                        ) : (
                          <span className="text-lg">➕</span>
                        )}
                        <span className="font-bold text-xs text-white truncate">
                          {equippedSkill2 ? equippedSkill2.name : '스킬 장착'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 파티 출전 / 제외 토글 & 용병 해고 버튼 */}
              {(() => {
                const isAdmitted = state.infirmaryPatients.includes(hero.id);
                const inParty = state.party.some(p => p.id === hero.id);

                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <ActionButton
                        label={isAdmitted ? '🏥 입원 중' : inParty ? `🔄 파티에서 제외` : `⚔️ 파티에 출전`}
                        variant={isAdmitted ? 'danger' : inParty ? 'danger' : 'primary'}
                        disabled={false}
                        className={`flex-1 font-bold ${isAdmitted ? 'bg-[#ff704325] border border-[#ff704388] text-[#ff7043] hover:bg-[#ff704344] hover:text-white cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isAdmitted) {
                            onNavigateDrawer?.('infirmary');
                          } else {
                            gm.togglePartyMember(hero.id);
                          }
                        }}
                      />
                      <button
                        className="btn btn-ghost text-xs px-3 hover:bg-[#c560601f] disabled:opacity-30 disabled:border-[#1f2738] disabled:text-[#607d8b]"
                        style={{ borderColor: '#c56060', borderWidth: '1px', borderStyle: 'solid', color: '#c56060' }}
                        disabled={state.barracks.length <= 3 || isAdmitted}
                        title={state.barracks.length <= 3 ? '파티 유지를 위해 최소 3명의 용병이 필요합니다' : isAdmitted ? '입원 중인 용병은 해고할 수 없습니다' : '용병 해고'}
                        onClick={() => setDismissConfirmHero(hero)}
                      >
                        {state.barracks.length <= 3 ? '🔒 해고(최소 3명)' : '👋 해고'}
                      </button>
                    </div>
                    {isAdmitted && (
                      <div
                        className="text-[10px] text-[#ff7043] bg-[#ff704312] border border-[#ff704333] hover:bg-[#ff704322] px-2.5 py-1 rounded flex items-center gap-1.5 leading-tight cursor-pointer transition-all"
                        onClick={() => onNavigateDrawer?.('infirmary')}
                        title="생체 복원 병동으로 즉시 이동"
                      >
                        <span>🏥</span>
                        <span>생체 복원 병동에서 집중 치료 중입니다. 완치 후 퇴원하거나 병동에서 수동 퇴원시켜야 파티 편성이 가능합니다. (클릭하여 병동으로 바로가기 ▶)</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 🔮 전직 섹션 (상시 표시하여 요구 조건 및 분기 안내) */}
              {(() => {
                const branches = PROMOTE_MAP[hero.classId] || [];
                if (branches.length === 0) return null;
                const targetTier = (cls.tier || 0) + 1;
                const reqLevel = cls.tier === 0 ? 10 : 30;
                const meetsLevel = hero.level >= reqLevel;
                const sanctuaryLv = state.buildings['sanctuary']?.level || 0;
                const reqSanct = cls.tier === 0 ? 1 : 5;
                const hasSanctuary = sanctuaryLv >= reqSanct;
                const canPromote = meetsLevel && hasSanctuary;

                return (
                  <div className={`panel p-3 rounded-xl mt-1 border transition-all ${
                    canPromote
                      ? 'border-[#ffd54f] bg-[#1c160e] shadow-lg shadow-[#ffd54f15]' : 'border-[#26334a] bg-[#10141f]'
                  }`}>
                    {/* 상단: 타이틀 + 상태 뱃지 + 등급 승급 확률 */}
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <div className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                        <span className="text-base">{canPromote ? '✨' : '🔮'}</span>
                        <span>{targetTier}차 상위 직업 각성 승급 (전직)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                          🎲 등급 승격률: {Math.min(100, (sanctuaryLv || 1) * 3)}% (제단 Lv당 +3%)
                        </span>
                        {canPromote ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44] animate-pulse">
                            ✨ 전직 가능
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535033]">
                            🔒 전직 조건 확인
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 전직 조건 체크리스트 (레벨 + 제단) */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-[#090c14] border border-[#1b2334] mb-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span>{meetsLevel ? '✅' : '⏳'}</span>
                        <span className={meetsLevel ? 'text-[#38ef7d] font-bold' : 'text-[#8b9bb4]'}>
                          용병 Lv.{reqLevel} ({hero.level}/{reqLevel})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{hasSanctuary ? '✅' : '🔒'}</span>
                        <span className={hasSanctuary ? 'text-[#38ef7d] font-bold' : 'text-[#ff8a80]'}>
                          영혼 승격 제단 Lv.{reqSanct} ({sanctuaryLv}/{reqSanct})
                        </span>
                      </div>
                    </div>

                    {/* 제단 미건설 시 친절한 안내 */}
                    {!hasSanctuary && (
                      <div className="p-2 rounded bg-[#24131b] border border-[#e040fb44] text-[10px] text-[#ff80ab] mb-2 leading-relaxed flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>영지에서 <strong>[영혼의 제단]</strong>을 건설(Lv.{reqSanct})해야 전직 의식을 거행할 수 있습니다.</span>
                      </div>
                    )}

                    {/* 전직 분기 목록 (탭하여 상세 정보 확인) */}
                    <div className="flex flex-col gap-1.5">
                      {branches.map(br => {
                        const etherCost = cls.tier === 0 ? 20 : 100;
                        const goldCost = cls.tier === 0 ? 500 : 3000;
                        const canAfford = state.resources.ether >= etherCost && state.resources.gold >= goldCost;
                        const isButtonActive = canPromote && canAfford;

                        return (
                          <div
                            key={br.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                              canPromote
                                ? 'bg-[#241a0d] border-[#ffd54f44] hover:border-[#ffd54f] hover:bg-[#2e2110]' : 'bg-[#141a29] border-[#1e293b] hover:border-[#00d2ff44] opacity-90'
                            }`}
                            onClick={() => setPreviewClassTarget({ targetHero: hero, classId: br.id })}
                          >
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-[#ffd54f]">{br.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff18] text-[#00d2ff] font-bold border border-[#00d2ff33]">
                                  🔍 상세 정보
                                </span>
                              </div>
                              <div className="text-[10px] text-[#cfd8dc] mt-0.5 leading-relaxed">{br.desc}</div>
                              <div className="text-[10px] font-mono mt-1 flex items-center gap-2">
                                <span className={state.resources.ether >= etherCost ? 'text-[#00d2ff]' : 'text-[#ef5350]'}>
                                  ✨ 에테르 {etherCost}
                                </span>
                                <span className={state.resources.gold >= goldCost ? 'text-[#ffd54f]' : 'text-[#ef5350]'}>
                                  🪙 골드 {goldCost}G
                                </span>
                              </div>
                            </div>

                            <button
                              className={`btn text-xs px-3 py-1.5 font-bold transition-all shrink-0 ${
                                isButtonActive
                                  ? 'btn-primary shadow-md shadow-[#ffd54f22] animate-bounce' : 'btn-ghost opacity-60'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewClassTarget({ targetHero: hero, classId: br.id });
                              }}
                            >
                              {isButtonActive ? '✨ 전직/상세' : '🔍 상세 보기'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 🔮 2차 전직 이후 10레벨마다 거행하는 초월 각성 섹션 */}
              {cls.tier === 2 && (() => {
                const currentCount = hero.awakeningCount || 0;
                const targetStep = currentCount + 1;
                const reqLevel = 30 + targetStep * 10;
                const meetsLevel = hero.level >= reqLevel;
                const sanctuaryLv = state.buildings['sanctuary']?.level || 0;
                const reqSanct = 5;
                const hasSanctuary = sanctuaryLv >= reqSanct;

                const etherCost = 50 + currentCount * 25;
                const goldCost = 1500 + currentCount * 1000;
                const canAfford = state.resources.ether >= etherCost && state.resources.gold >= goldCost;
                const canAwaken = meetsLevel && hasSanctuary && canAfford;

                const stepBonus = targetStep * 10;
                const upgradeChance = Math.min(100, (sanctuaryLv * 3) + stepBonus);
                const GRADE_ORDER: MercenaryGrade[] = ['rookie', 'veteran', 'hero', 'epic', 'legend'];
                const GRADE_NAMES: Record<string, string> = {
                  rookie: '노비스(N)', veteran: '베테랑(V)', hero: '히어로(H)', elite: '히어로(H)', epic: '에픽(E)', legend: '레전드(L)'
                };
                const curGradeIdx = GRADE_ORDER.indexOf(hero.grade === 'elite' ? 'hero' : hero.grade);
                const nextGrade = curGradeIdx !== -1 && curGradeIdx < GRADE_ORDER.length - 1 ? GRADE_ORDER[curGradeIdx + 1] : null;

                return (
                  <div className={`panel p-3 rounded-xl mt-1 border transition-all ${
                    canAwaken
                      ? 'border-[#00d2ff] bg-[#0c1829] shadow-lg shadow-[#00d2ff22]' : 'border-[#26334a] bg-[#10141f]'
                  }`}>
                    {/* 상단 헤더: 타이틀 + 각성 차수 + 등급 진화 확률 */}
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <div className="text-xs font-bold text-[#00d2ff] flex items-center gap-1.5">
                        <span className="text-base">{canAwaken ? '🔮' : '🔒'}</span>
                        <span>초월 각성 ({currentCount > 0 ? `${currentCount}단계 완료` : '미각성'})</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-mono font-bold">
                          {targetStep}단계 의식
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                          🎲 등급 진화율: {upgradeChance}% (제단+{sanctuaryLv * 3}%, {targetStep}단계+{stepBonus}%)
                        </span>
                        {canAwaken ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44] animate-pulse">
                            ✨ 각성 가능
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535033]">
                            🔒 각성 조건 확인
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#cfd8dc] mb-2 leading-relaxed">
                      2차 전직 이후 10레벨마다 영혼을 초월하여 <strong>스탯 1종 +15% 추가 영구 상향</strong> 및 <strong>상위 등급({nextGrade ? GRADE_NAMES[nextGrade] : '최고등급'})으로 진화</strong>할 수 있습니다.
                    </div>

                    {/* 조건 체크리스트 */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-[#090c14] border border-[#1b2334] mb-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span>{meetsLevel ? '✅' : '⏳'}</span>
                        <span className={meetsLevel ? 'text-[#38ef7d] font-bold' : 'text-[#8b9bb4]'}>
                          용병 Lv.{reqLevel} ({hero.level}/{reqLevel})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{hasSanctuary ? '✅' : '🔒'}</span>
                        <span className={hasSanctuary ? 'text-[#38ef7d] font-bold' : 'text-[#ff8a80]'}>
                          영혼 승격 제단 Lv.{reqSanct} ({sanctuaryLv}/{reqSanct})
                        </span>
                      </div>
                    </div>

                    {/* 비용 및 각성 실행 버튼 */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#1e293b] bg-[#141a29]">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className={state.resources.ether >= etherCost ? 'text-[#00d2ff]' : 'text-[#ef5350]'}>
                          ✨ 에테르 {etherCost}
                        </span>
                        <span className={state.resources.gold >= goldCost ? 'text-[#ffd54f]' : 'text-[#ef5350]'}>
                          🪙 골드 {goldCost}G
                        </span>
                      </div>
                      <button
                        className={`btn text-xs px-3.5 py-1.5 font-bold transition-all ${
                          canAwaken
                            ? 'btn-primary shadow-md shadow-[#00d2ff33] animate-bounce' : 'btn-ghost opacity-60'
                        }`}
                        onClick={() => {
                          setSelectedAwakenStat('atk');
                          setAwakeningTargetHero(hero);
                        }}
                      >
                        {canAwaken ? `🔮 ${targetStep}단계 초월 각성 거행` : '🔍 각성 상세 정보'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 🛡️ 장비 선택 오버레이 ── */}
          {equipOverlay && (
            <EquipmentOverlay
              hero={equipOverlay.hero}
              slot={equipOverlay.slot}
              inventory={state.equipmentInventory}
              onEquip={(itemId) => {
                gm.equipItem(equipOverlay.hero.id, itemId);
                setEquipOverlay(null);
              }}
              onUnequip={(targetSlot) => {
                const s = targetSlot || (equipOverlay.slot !== 'all' ? equipOverlay.slot : undefined);
                if (s) {
                  gm.unequipItem(equipOverlay.hero.id, s);
                }
                setEquipOverlay(null);
              }}
              onClose={() => setEquipOverlay(null)}
            />
          )}

          {/* ── 📖 스킬북 전수 & 스킬 슬롯 관리 오버레이 ── */}
          {skillOverlayHero && (
            <SkillManagerOverlay
              hero={skillOverlayHero}
              skillBooks={state.skillBookInventory || []}
              onClose={() => setSkillOverlayHero(null)}
            />
          )}

          {/* ── 🔮 전직 클래스 상세 정보 및 스킬 프리뷰 모달 ── */}
          {previewClassTarget && (() => {
            const targetHero = previewClassTarget.targetHero;
            const targetClass = CHARACTER_CLASSES[previewClassTarget.classId];
            if (!targetClass) return null;

            const curClass = CHARACTER_CLASSES[targetHero.classId];
            const targetTier = targetClass.tier;
            const reqLevel = targetTier === 1 ? 10 : 30;
            const meetsLevel = targetHero.level >= reqLevel;
            const sanctuaryLv = state.buildings['sanctuary']?.level || 0;
            const reqSanct = targetTier === 1 ? 1 : 5;
            const hasSanctuary = sanctuaryLv >= reqSanct;

            const etherCost = targetTier === 1 ? 20 : 100;
            const goldCost = targetTier === 1 ? 500 : 3000;
            const canAfford = state.resources.ether >= etherCost && state.resources.gold >= goldCost;
            const canPromote = meetsLevel && hasSanctuary && canAfford;
            const upgradeChance = Math.min(100, Math.max(1, sanctuaryLv) * 3);

            const STAT_LABEL_MAP: Record<string, string> = {
              hp: '체력(HP)', mp: '마나(MP)', atk: '공격력(ATK)', def: '방어력(DEF)', spd: '행동속도(SPD)', luck: '행운(LUK)'
            };

            const currentBase = GameManager.calcHeroStatsForClassAndLevel(
              targetHero.classId,
              targetHero.level,
              targetHero.grade,
              targetHero.trait || targetHero.title,
              targetHero.promotionBonuses,
              targetHero.awakeningBonuses
            );

            const prospectiveBonuses = [...(targetHero.promotionBonuses || []), selectedBonusStat];
            const computed = GameManager.calcHeroStatsForClassAndLevel(
              targetClass.id,
              targetHero.level,
              targetHero.grade,
              targetHero.trait || targetHero.title,
              prospectiveBonuses,
              targetHero.awakeningBonuses
            );

            return (
              <Modal
                title={`🔮 [전직 클래스 각성] — ${targetClass.name}`}
                open={true}
                onClose={() => setPreviewClassTarget(null)}
                footer={
                  <div className="flex items-center justify-between w-full">
                    <button
                      className="btn btn-ghost text-xs px-3 py-1.5 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1"
                      style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
                      onClick={() => setPreviewClassTarget(null)}
                    >
                      <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
                      <span style={{ color: '#c56060' }}>닫기</span>
                    </button>
                    <button
                      className={`btn text-xs px-4 py-2 font-bold ${
                        canPromote
                          ? 'btn-primary shadow-lg shadow-[#ffd54f33] animate-pulse' : 'btn-ghost opacity-50'
                      }`}
                      disabled={!canPromote}
                      onClick={() => {
                        gm.promoteHero(targetHero.id, targetClass.id, selectedBonusStat);
                        setPreviewClassTarget(null);
                      }}
                    >
                      {canPromote
                        ? `✨ [${STAT_LABEL_MAP[selectedBonusStat]} +30%] 특화로 [${targetClass.name}] 전직 확정`
                        : !meetsLevel
                        ? `용병 Lv.${reqLevel} 필요`
                        : !hasSanctuary
                        ? `제단 Lv.${reqSanct} 필요`
                        : '자원 부족'}
                    </button>
                  </div>
                }
              >
                <div className="flex flex-col gap-3 text-xs leading-relaxed">
                  {/* 상단: 클래스 헤더 및 테마 */}
                  <div className="panel p-3 bg-[#131926] border border-[#ffd54f55] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#ffd54f]">{targetClass.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                          {targetTier === 1 ? '1차 상위 클래스' : '2차 전설 클래스'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                          {targetClass.role === 'tank' ? '🛡️ 방어 수호자' : targetClass.role === 'dealer_phy' ? '⚔️ 물리 딜러' : targetClass.role === 'dealer_mag' ? '🔮 마법 딜러' : targetClass.role === 'healer' ? '✨ 신성 치유사' : '🔫 원거리 사격수'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#cfd8dc] mt-1 leading-relaxed">
                        {curClass?.name || '기본 직업'}에서 각성하여 상위 영혼의 전투 기술을 발현합니다.
                      </div>
                    </div>
                  </div>

                  {/* 🌟 전직 특화 스탯 1종 선택 (+30% 집중 상승) */}
                  <div className="panel p-3 bg-[#131b2e] border border-[#00d2ff66] rounded-xl flex flex-col gap-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00d2ff]">
                        <span>✨</span>
                        <span>전직 각성 특화 스탯 선택 (1종 +30% 집중 강화)</span>
                      </div>
                      <span className="text-[10px] text-[#ffd54f] font-mono font-bold">1개 선택 필수</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc]">
                      전직 시 선택한 1가지 핵심 능력치가 <strong className="text-[#38ef7d] font-bold">+30%</strong> 영구 증폭됩니다. (용병 순수 기본 스탯 기준이며, 장비 스탯은 전직 후에도 그대로 가산 유지됩니다.)
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[
                        { key: 'hp',   label: '체력 (HP)',   icon: '💖', color: '#ef5350', cur: currentBase.maxHp,       exp: computed.maxHp },
                        { key: 'mp',   label: '마나 (MP)',   icon: '🔷', color: '#42a5f5', cur: currentBase.maxMp,       exp: computed.maxMp },
                        { key: 'atk',  label: '공격력 (ATK)', icon: '⚔️', color: '#ff7043', cur: currentBase.stats.atk,   exp: computed.stats.atk },
                        { key: 'def',  label: '방어력 (DEF)', icon: '🛡️', color: '#66bb6a', cur: currentBase.stats.def,   exp: computed.stats.def },
                        { key: 'spd',  label: '속도 (SPD)',   icon: '⚡', color: '#ffd54f', cur: currentBase.stats.spd,   exp: computed.stats.spd },
                        { key: 'luck', label: '행운 (LUK)',   icon: '🍀', color: '#ce93d8', cur: currentBase.stats.luck,  exp: computed.stats.luck },
                      ].map(s => {
                        const isSelected = selectedBonusStat === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#00d2ff22] border-[#00d2ff] shadow-md shadow-[#00d2ff33] ring-1 ring-[#00d2ff]' : 'bg-[#0d1424] border-[#1e2b40] hover:border-[#2f4260] opacity-85 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedBonusStat(s.key as any)}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-base">{s.icon}</span>
                              <span className="text-xs font-bold" style={{ color: isSelected ? '#00d2ff' : s.color }}>
                                {s.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
                              <span className="text-[#8b9bb4]">{s.cur}</span>
                              <span className="text-[#607d8b]">➔</span>
                              <span className={`font-bold ${isSelected ? 'text-[#38ef7d]' : 'text-white'}`}>
                                {s.exp}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold mt-1.5 border border-[#38ef7d44]">
                                ✓ 선택됨 (+30%)
                              </span>
                            ) : (
                              <span className="text-[9px] text-[#607d8b] mt-1.5">
                                +30% 강화
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 고유 각성기 */}
                  <div className="panel p-3 bg-[#1a150e] border border-[#ffd54f55] rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                      <span>🌟</span>
                      <span>{targetClass.specialSkill.name.includes('[궁극기]') ? '전직 궁극기' : '전직 고유기'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#241a0d] border border-[#ffd54f33] flex items-start gap-2">
                      <span className="shrink-0 p-1 rounded bg-[#161008] flex items-center justify-center">
                        <GameIcon name={targetClass.specialSkill.id} icon={targetClass.specialSkill.icon} size={28} />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#ffd54f]">{targetClass.specialSkill.name}</span>
                          <span className="text-[11px] text-[#64b5f6] font-mono">{targetClass.specialSkill.manaCost} MP / 쿨 {targetClass.specialSkill.cooldown}턴</span>
                        </div>
                        <div className="text-[11px] text-[#cfd8dc] mt-1 leading-relaxed">
                          {targetClass.specialSkill.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 기본 습득 전술 스킬 2종 */}
                  <div className="panel p-3 bg-[#0d1424] border border-[#1e293b] rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00d2ff]">
                      <span>⚔️ 전용 전술 스킬 (기본 2종 자동 습득)</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {targetClass.skills.slice(0, 2).map((sk, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#111726] border border-[#1f2b40] flex items-start gap-2">
                          <span className="shrink-0 p-1 rounded bg-[#090d17] flex items-center justify-center">
                            <GameIcon name={sk.id} icon={sk.icon} size={22} />
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white">{sk.name}</span>
                              <span className="text-[10px] text-[#64b5f6] font-mono">{sk.manaCost} MP</span>
                            </div>
                            <div className="text-[10px] text-[#8b9bb4] mt-0.5 leading-relaxed">
                              {sk.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 패시브 특성 */}
                  <div className="panel p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl flex items-center gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                      <div className="text-[10px] text-[#38ef7d] font-bold">클래스 고유 패시브</div>
                      <div className="text-[11px] text-[#cfd8dc] mt-0.5">{targetClass.passiveDesc}</div>
                    </div>
                  </div>

                  {/* 전직 비용 및 요구 조건 안내 바 */}
                  <div className="p-2.5 rounded-xl bg-[#090c14] border border-[#1f2738] flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className={state.resources.ether >= etherCost ? 'text-[#00d2ff]' : 'text-[#ef5350]'}>
                        ✨ 에테르 {etherCost} ({state.resources.ether}/{etherCost})
                      </span>
                      <span className={state.resources.gold >= goldCost ? 'text-[#ffd54f]' : 'text-[#ef5350]'}>
                        🪙 골드 {goldCost}G ({state.resources.gold}/{goldCost})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#ffd54f] font-bold">
                      🎲 승격 확률: {upgradeChance}%
                    </div>
                  </div>
                </div>
              </Modal>
            );
          })()}

          {/* ── 🔮 2차 전직 이후 초월 각성 모달 ── */}
          {awakeningTargetHero && (() => {
            const targetHero = state.barracks.find(h => h.id === awakeningTargetHero.id) || awakeningTargetHero;
            const cClass = CHARACTER_CLASSES[targetHero.classId];
            if (!cClass) return null;

            const currentCount = targetHero.awakeningCount || 0;
            const targetStep = currentCount + 1;
            const reqLevel = 30 + targetStep * 10;
            const meetsLevel = targetHero.level >= reqLevel;
            const sanctuaryLv = state.buildings['sanctuary']?.level || 0;
            const reqSanct = 5;
            const hasSanctuary = sanctuaryLv >= reqSanct;

            const etherCost = 50 + currentCount * 25;
            const goldCost = 1500 + currentCount * 1000;
            const canAfford = state.resources.ether >= etherCost && state.resources.gold >= goldCost;
            const canAwaken = meetsLevel && hasSanctuary && canAfford;

            const stepBonus = targetStep * 10;
            const upgradeChance = Math.min(100, (sanctuaryLv * 3) + stepBonus);
            const GRADE_ORDER: MercenaryGrade[] = ['rookie', 'veteran', 'hero', 'epic', 'legend'];
            const GRADE_NAMES: Record<string, string> = {
              rookie: '노비스(N)', veteran: '베테랑(V)', hero: '히어로(H)', elite: '히어로(H)', epic: '에픽(E)', legend: '레전드(L)'
            };
            const curGradeIdx = GRADE_ORDER.indexOf(targetHero.grade === 'elite' ? 'hero' : targetHero.grade);
            const nextGrade = curGradeIdx !== -1 && curGradeIdx < GRADE_ORDER.length - 1 ? GRADE_ORDER[curGradeIdx + 1] : null;

            const STAT_LABEL_MAP: Record<string, string> = {
              hp: '체력(HP)', mp: '마나(MP)', atk: '공격력(ATK)', def: '방어력(DEF)', spd: '행동속도(SPD)', luck: '행운(LUK)'
            };

            const currentBase = GameManager.calcHeroStatsForClassAndLevel(
              targetHero.classId,
              targetHero.level,
              targetHero.grade,
              targetHero.trait || targetHero.title,
              targetHero.promotionBonuses,
              targetHero.awakeningBonuses
            );

            const prospectiveAwakenBonuses = [...(targetHero.awakeningBonuses || []), selectedAwakenStat];
            const computed = GameManager.calcHeroStatsForClassAndLevel(
              targetHero.classId,
              targetHero.level,
              targetHero.grade,
              targetHero.trait || targetHero.title,
              targetHero.promotionBonuses,
              prospectiveAwakenBonuses
            );

            return (
              <Modal
                title={`🔮 [초월 각성 ${targetStep}단계] — ${targetHero.name}`}
                open={true}
                onClose={() => setAwakeningTargetHero(null)}
                footer={
                  <div className="flex items-center justify-between w-full">
                    <button
                      className="btn btn-ghost text-xs px-3 py-1.5 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1"
                      style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
                      onClick={() => setAwakeningTargetHero(null)}
                    >
                      <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
                      <span style={{ color: '#c56060' }}>닫기</span>
                    </button>
                    <button
                      className={`btn text-xs px-4 py-2 font-bold ${
                        canAwaken
                          ? 'btn-primary shadow-lg shadow-[#00d2ff33] animate-pulse' : 'btn-ghost opacity-50'
                      }`}
                      disabled={!canAwaken}
                      onClick={() => {
                        gm.awakenHero(targetHero.id, selectedAwakenStat);
                        setAwakeningTargetHero(null);
                      }}
                    >
                      {canAwaken
                        ? `✨ [${STAT_LABEL_MAP[selectedAwakenStat]} +15%] 초월 각성 확정`
                        : !meetsLevel
                        ? `용병 Lv.${reqLevel} 필요 (${targetHero.level}/${reqLevel})`
                        : !hasSanctuary
                        ? `제단 Lv.${reqSanct} 필요`
                        : '자원 부족'}
                    </button>
                  </div>
                }
              >
                <div className="flex flex-col gap-3 text-xs leading-relaxed">
                  {/* 상단 안내 & 등급 진화율 */}
                  <div className="panel p-3 bg-[#0f172a] border border-[#00d2ff55] rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#00d2ff]">🔮 {targetStep}단계 초월 각성 의식</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                          {cClass.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                        🎲 진화율 {upgradeChance}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                      원하는 핵심 스탯 1종을 선택하여 <strong className="text-[#38ef7d] font-bold">+15% 영구 증폭</strong>시키고, 영혼의 제단과 각성 공명을 통해 상위 등급으로 진화시킵니다.
                    </div>
                    {/* 등급 진화 프리뷰 */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#080d1a] border border-[#1e293b]">
                      <span className="text-[10px] text-[#8b9bb4]">용병 등급 승격 진화:</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-white">{GRADE_NAMES[targetHero.grade] || targetHero.grade}</span>
                        {nextGrade ? (
                          <>
                            <span className="text-[#00d2ff]">➔</span>
                            <span className="text-[#ffd54f] animate-pulse">{GRADE_NAMES[nextGrade]}</span>
                            <span className="text-[9px] text-[#38ef7d] font-mono">({upgradeChance}% 확률)</span>
                          </>
                        ) : (
                          <span className="text-[#ffd54f]">★ 최고 등급 도달</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 각성 특화 스탯 1종 선택 (+15% 집중 상승) */}
                  <div className="panel p-3 bg-[#131b2e] border border-[#00d2ff66] rounded-xl flex flex-col gap-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00d2ff]">
                        <span>✨</span>
                        <span>각성 특화 스탯 선택 (1종 +15% 영구 증폭)</span>
                      </div>
                      <span className="text-[10px] text-[#ffd54f] font-mono font-bold">1개 선택</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc]">
                      각성 시 선택한 핵심 능력치가 <strong className="text-[#38ef7d] font-bold">+15%</strong> 영구 증폭됩니다. (용병 순수 기본 스탯 기준이며, 장비 스탯은 각성 후에도 그대로 가산 유지됩니다.)
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[
                        { key: 'hp',   label: '체력 (HP)',   icon: '💖', color: '#ef5350', cur: currentBase.maxHp,       exp: computed.maxHp },
                        { key: 'mp',   label: '마나 (MP)',   icon: '🔷', color: '#42a5f5', cur: currentBase.maxMp,       exp: computed.maxMp },
                        { key: 'atk',  label: '공격력 (ATK)', icon: '⚔️', color: '#ff7043', cur: currentBase.stats.atk,   exp: computed.stats.atk },
                        { key: 'def',  label: '방어력 (DEF)', icon: '🛡️', color: '#66bb6a', cur: currentBase.stats.def,   exp: computed.stats.def },
                        { key: 'spd',  label: '속도 (SPD)',   icon: '⚡', color: '#ffd54f', cur: currentBase.stats.spd,   exp: computed.stats.spd },
                        { key: 'luck', label: '행운 (LUK)',   icon: '🍀', color: '#ce93d8', cur: currentBase.stats.luck,  exp: computed.stats.luck },
                      ].map(s => {
                        const isSelected = selectedAwakenStat === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#00d2ff22] border-[#00d2ff] shadow-md shadow-[#00d2ff33] ring-1 ring-[#00d2ff]' : 'bg-[#0d1424] border-[#1e2b40] hover:border-[#2f4260] opacity-85 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedAwakenStat(s.key as any)}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-base">{s.icon}</span>
                              <span className="text-xs font-bold" style={{ color: isSelected ? '#00d2ff' : s.color }}>
                                {s.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
                              <span className="text-[#8b9bb4]">{s.cur}</span>
                              <span className="text-[#607d8b]">➔</span>
                              <span className={`font-bold ${isSelected ? 'text-[#38ef7d]' : 'text-white'}`}>
                                {s.exp}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold mt-1.5 border border-[#38ef7d44]">
                                ✓ 선택됨 (+15%)
                              </span>
                            ) : (
                              <span className="text-[9px] text-[#607d8b] mt-1.5">
                                +15% 증폭
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 요구 자원 안내 */}
                  <div className="p-2 rounded-lg bg-[#090c14] border border-[#1b2334] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#8b9bb4]">소모 재화:</span>
                    <div className="flex items-center gap-2">
                      <span className={state.resources.ether >= etherCost ? 'text-[#00d2ff]' : 'text-[#ef5350]'}>
                        ✨ 에테르 {etherCost} ({state.resources.ether}/{etherCost})
                      </span>
                      <span className={state.resources.gold >= goldCost ? 'text-[#ffd54f]' : 'text-[#ef5350]'}>
                        🪙 골드 {goldCost}G ({state.resources.gold}/{goldCost})
                      </span>
                    </div>
                  </div>
                </div>
              </Modal>
            );
          })()}

          {/* ── 👋 용병 해고 확인 모달 ── */}
          {dismissConfirmHero && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
              <div className="panel p-4 max-w-[320px] w-full bg-[#14121a] border border-[#ef535066] rounded-xl flex flex-col gap-3">
                <div className="text-sm font-bold text-[#ef5350] flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>용병 계약 해지</span>
                </div>
                <div className="text-xs text-[#cfd8dc] leading-relaxed">
                  정말로 <span className="text-white font-bold">[{dismissConfirmHero.name}]</span> 용병을 해고하시겠습니까?<br />
                  <span className="text-[11px] text-[#8b9bb4] mt-1 block">
                    (착용 중인 무기, 방어구, 장신구는 모두 영지 보관함으로 자동 회수됩니다.)
                  </span>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-[#222d42]">
                  <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={() => setDismissConfirmHero(null)}>
                    취소
                  </button>
                  <button
                    className="btn btn-danger text-xs px-4 py-1.5 font-bold"
                    onClick={() => {
                      gm.dismissMercenary(dismissConfirmHero.id);
                      setDismissConfirmHero(null);
                    }}
                  >
                    해고하기
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ── 💞 선택한 용병 중심 유대 관계도 모달 (수치 은닉 & 정성적 단계 표시) ── */}
          <Modal
            title={`💞 [${hero ? hero.name : '선택된 용병'}] 중심 유대 관계도`}
            open={showBondModal}
            onClose={() => setShowBondModal(false)}
            footer={
              <ActionButton
                label="확인 및 닫기"
                variant="primary"
                className="w-full"
                onClick={() => setShowBondModal(false)}
              />
            }
          >
            <div className="flex flex-col gap-2 py-1">
              <div className="text-[11px] text-[#8b9bb4] leading-relaxed">
                <strong className="text-white">[{hero?.name}]</strong> 대원을 중심으로 형성된 관계도입니다. 함께 출진하고 <span className="text-[#ffd54f] font-bold">심연 던전에서 야영</span>을 나눌수록 유대가 깊어집니다.
              </div>

              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                {(() => {
                  if (!hero) return null;
                  // 선택된 용병을 제외하고, 유대 점수가 10점 이상이거나 관계가 있는 다른 용병들만 필터링
                  const otherHeroes = state.barracks.filter(h => h.id !== hero.id);
                  const validBonds = otherHeroes.map(other => {
                    const bondVal = gm.getBond(hero.id, other.id);
                    const bInfo = gm.getBondLevel(bondVal);
                    return { other, bondVal, bInfo };
                  }).filter(item => item.bondVal > 10 || item.bInfo.level > 0);

                  if (validBonds.length === 0) {
                    return (
                      <div className="panel p-3.5 text-center text-xs text-[#8b9bb4] bg-[#0c101a] rounded-xl border border-[#1f2738]">
                        <span className="text-lg block mb-1">💭</span>
                        아직 <strong>[{hero.name}]</strong> 대원과 깊은 교감을 나눈 동료가 없습니다.<br />
                        <span className="text-[9.5px] text-[#607d8b] mt-0.5 block">함께 파티를 맺고 심연 던전에서 모닥불 담소를 나눠보세요.</span>
                      </div>
                    );
                  }

                  const getHeartIcons = (lvl: number) => {
                    switch (lvl) {
                      case 5: return '💖💖💖 (영혼의 결속)';
                      case 4: return '💖💖 (사선의 맹세)';
                      case 3: return '💖 (굳건한 신뢰)';
                      case 2: return '💞 (전술적 호흡)';
                      case 1: return '💗 (동료애)';
                      default: return '🤍 (알아가는 단계)';
                    }
                  };

                  return validBonds.map(({ other, bInfo, bondVal }) => (
                    <div key={other.id} className="panel p-2.5 bg-[#111726] border border-[#1f2b40] rounded-xl flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px] text-white">{hero.name}</span>
                          <span className="text-[10px] text-[#ff416c] animate-pulse">🤝</span>
                          <span className="font-bold text-[11px] text-[#00d2ff]">{other.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#ffd54f]">
                          {getHeartIcons(bInfo.level)}
                        </span>
                      </div>

                      {/* 수치는 숨기고 부드러운 정성적 결속 게이지 바만 노출 */}
                      <div className="w-full h-1.5 bg-[#090d18] rounded-full overflow-hidden border border-[#1f2738] p-0.2">
                        <div
                          className="h-full bg-gradient-to-r from-[#ff416c] via-[#ff7043] to-[#ffd54f] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(12, Math.min(100, bondVal))}%` }}
                        />
                      </div>

                      <div className="text-[9.5px] text-[#38ef7d] font-medium flex items-center justify-between">
                        <span>✨ 단계 효과: {bInfo.perk}</span>
                        <span className="text-[9px] text-[#8b9bb4]">Lv.{bInfo.level} [{bInfo.title}]</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </Modal>

          {/* ── ✨ 원정대 시너지 도감 모달 ── */}
          <SynergyGuideModal
            open={showSynergyModal}
            onClose={() => setShowSynergyModal(false)}
            party={state.party}
          />
        </>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  📖 스킬북 전수 & 스킬 슬롯 관리 오버레이 모달
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  🔍 스킬북 서고: 마도서 상세 정보 모달 (SkillBookDetailModal)
// ─────────────────────────────────────────────────────────────
interface SkillBookDetailModalProps {
  hero: Mercenary;
  detail: {
    skill: Skill;
    bookItem?: SkillBookItem;
    isLearned: boolean;
    slotIndex: number;
    bookLv: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  isFullLearned: boolean;
  onClose: () => void;
  onOpenEnhance?: (skill: Skill) => void;
  onUnlearn?: (skill: Skill) => void;
  onAbandon?: (skill: Skill, mastery: number) => void;
  gm: ReturnType<typeof useGameManager>['gm'];
}

const SkillBookDetailModal: React.FC<SkillBookDetailModalProps> = ({
  hero,
  detail,
  isFullLearned,
  onClose,
  onOpenEnhance,
  onUnlearn,
  onAbandon,
  gm
}) => {
  const { skill: rawSkill, bookItem, isLearned, slotIndex, bookLv, rarity } = detail;
  const currentHero = gm.barracks.find(h => h.id === hero.id) || gm.party.find(h => h.id === hero.id) || hero;
  const currentLv = currentHero.skillLevels?.[rawSkill.id] || bookLv || 1;
  const skill = gm.resolveSkillData(rawSkill.id, currentHero) || (currentLv > 1 ? gm.resolveSkillData(rawSkill.id, currentLv) : null) || rawSkill;
  const baseSkill = gm.resolveSkillData(rawSkill.id, 1) || rawSkill;
  const basePowerPct = Math.round((baseSkill.power || 1.0) * 100);
  const currentPowerPct = Math.round((skill.power || 1.0) * 100);
  const rMeta = GRIMOIRE_RARITY_META[rarity] || GRIMOIRE_RARITY_META.common;
  const canLearn = !isFullLearned && !isLearned && !!bookItem;

  const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === skill.id || b.id === skill.id);
  const skillAffinity = bookItem?.affinity || bookDef?.affinity || skill.affinity;
  const affMeta = getSkillAffinityMeta(skillAffinity);
  const heroRole = CHARACTER_CLASSES[hero.classId]?.role;
  const isMatch = checkSkillAffinityMatch(skillAffinity, heroRole, hero.classId);
  const heroClassName = CHARACTER_CLASSES[hero.classId]?.name || heroRole || '현재 직업';

  const currentMastery = hero.skillMastery?.[skill.id] ?? (isLearned ? 100 : 0);
  const gainPerBook = getMasteryGainPerBook(rarity);
  const bookCount = bookItem?.count || 1;
  const tags = getSkillTags(skill);
  const combos = getTriggerableCombos(skill);

  const dropOrigin = findMonsterOriginForBook({
    originMonsterName: bookItem?.originMonsterName,
    bookId: bookItem?.bookId || bookItem?.id || bookDef?.id,
    skillId: skill.id,
    bookName: bookItem?.name || bookDef?.name,
    skillName: skill.name,
  });

  const targetLabel = skill.targetType === 'all_enemies' ? '대상 파티 (적 전체)'
    : skill.targetType === 'all_allies' ? '아군 파티 (전체)'
    : skill.targetType === 'single_ally' ? '단일 아군'
    : skill.targetType === 'self' ? '자신 (시전자)'
    : '단일 적';

  const posLabel = skill.positionBonus === 'front' ? '전열 특화' : skill.positionBonus === 'back' ? '후열 저격' : skill.positionBonus === 'any' ? '전/후열 대응' : null;
  const posColor = skill.positionBonus === 'front' ? '#ef5350' : skill.positionBonus === 'back' ? '#42a5f5' : '#ab47bc';

  const effectLabelMap: Record<string, string> = {
    damage: '물리/마법 피해',
    heal: '생명력 치유',
    shield: '보호막 방벽',
    buff: '능력치 강화 버프',
    debuff: '능력치 약화 디버프',
    bleed: '지속 출혈 피해',
    poison: '맹독 누적 피해',
    stun: '행동 불능 기절',
    drain: '생명력/마나 흡수'
  };
  const effectText = effectLabelMap[skill.effectType || 'damage'] || '전투 마도 효과';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pt-[48px] pb-3 px-3 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] max-h-full bg-[#0b0f19] border rounded-2xl shadow-2xl flex flex-col text-left animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: `${rMeta.color}88` }}
      >
        {/* 헤더: 아이콘 + 이름 + 등급/레벨 뱃지 + 스택 권수 + 닫기 (상단 고정) */}
        <div className="shrink-0 p-3.5 pb-2.5 border-b border-[#1b263b] flex items-start justify-between gap-2 bg-[#0c101c]">
          <div className="flex items-center gap-2.5">
            <span
              className="text-3xl p-2 rounded-xl bg-[#141d2f] border flex items-center justify-center shadow-md shrink-0"
              style={{ borderColor: `${rMeta.color}55` }}
            >
              <GameIcon name={bookItem?.bookId || bookItem?.id || skill.id} icon={bookItem?.icon || skill.icon || '📖'} size={32} />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-white">{bookItem?.name || skill.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                >
                  {rMeta.label} 등급
                </span>
                <span className="text-[11px] font-mono font-bold text-[#ffd54f]">
                  [Lv.{currentLv}/10]
                </span>
                {bookItem && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] border border-[#00d2ff33]">
                    x{bookCount}권 보유
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8b9bb4] mt-0.5">
                {dropOrigin ? (
                  <span className="text-[#ffb74d] font-bold flex items-center gap-1">
                    <span>👾 드랍 마물:</span>
                    <strong className="text-white underline underline-offset-2">{dropOrigin.monsterName}</strong>
                    {dropOrigin.floor && <span className="text-[#ffd54f] font-mono">({dropOrigin.floor}F {dropOrigin.isBoss ? '보스' : dropOrigin.monsterType === 'elite' ? '정예' : '마물'})</span>}
                  </span>
                ) : (
                  <span>📖 방주 고대 비전 마도서 (에테르 제본)</span>
                )}
              </div>
            </div>
          </div>
          <button
            className="w-7 h-7 rounded-lg bg-[#141b2c] text-[#8b9bb4] hover:text-white flex items-center justify-center border border-[#23324d] transition-colors shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 스크롤 가능한 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 min-h-0">
          {/* 👾 드랍 마물 전용 안내 배너 */}
        {dropOrigin && (
          <div className="p-2 rounded-xl bg-[#ff980018] border border-[#ff980044] text-xs flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-[#ffb74d]">
              <span className="text-base">👾</span>
              <span>드랍 마물:</span>
              <strong className="text-white text-sm tracking-wide">{dropOrigin.monsterName}</strong>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#0b0f19] text-[#ffd54f] border border-[#ff980033]">
              {dropOrigin.floor ? `${dropOrigin.floor}F ` : ''}{dropOrigin.isBoss ? '👑 보스 전리품' : dropOrigin.monsterType === 'elite' ? '⚡ 정예 마물' : '일반 마물'}
            </span>
          </div>
        )}

        {/* ⚔️ 계열 적합도 및 호환성 뱃지 바 */}
        <div
          className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs"
          style={{ backgroundColor: affMeta.bg, borderColor: affMeta.borderColor }}
        >
          <div className="flex items-center gap-1.5 font-bold" style={{ color: affMeta.color }}>
            <span className="text-base">{affMeta.icon}</span>
            <span>{affMeta.name}</span>
          </div>
          {isMatch ? (
            <span className="text-[10px] font-bold text-[#4ade80] bg-[#4ade8022] px-2 py-0.5 rounded border border-[#4ade8044]">
              ✓ 계열 적합 (위력 100%)
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#f87171] bg-[#f8717122] px-2 py-0.5 rounded border border-[#f8717144] animate-pulse">
              ⚠️ 계열 부조화 (위력 50% 반감)
            </span>
          )}
        </div>

        {!isMatch && (
          <div className="p-2.5 rounded-xl bg-[#2a1215] border border-[#ef535066] text-xs text-[#ffcdd2] flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[#ff8a80]">직업군 계열 불일치 페널티 경고</span>
              <span className="text-[10px] text-[#ffcdd2] leading-relaxed">
                {hero.name}({heroClassName})의 계열과 맞지 않는 비전서입니다. 전투 중 사용 시 스킬의 모든 위력(피해/치유/보호막/버프)이 <span className="font-bold text-[#ff5252]">50% 반감</span>됩니다.
              </span>
            </div>
          </div>
        )}

        {/* 4분할 핵심 스펙 그리드 */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">마나 소모</span>
            <span className="text-xs font-bold text-[#64b5f6]">{skill.manaCost} MP</span>
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">쿨다운</span>
            <span className="text-xs font-bold text-[#ffd54f]">{skill.cooldown || 0}턴</span>
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">위력 계수</span>
            <span className="text-xs font-bold text-[#38ef7d]">{currentPowerPct}%</span>
            {currentLv > 1 && currentPowerPct !== basePowerPct && (
              <span className="text-[9px] text-[#ffd54f] font-mono block">(초기 {basePowerPct}%)</span>
            )}
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">대상</span>
            <span className="text-[10px] font-bold text-[#cfd8dc] truncate block">{targetLabel}</span>
          </div>
        </div>

        {/* 🏷️ 스킬 특성 태그 뱃지 바 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map(t => (
            <span
              key={t.id}
              className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
          ))}
        </div>

        {/* 효과 유형 & 포지션 보너스 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-[#141d2f] border border-[#22314d] text-[#b0bec5] flex items-center gap-1.5">
            <span className="text-[10px] text-[#8b9bb4]">효과 속성:</span>
            <span className="font-bold text-white">{effectText}</span>
            {skill.statusDuration && (
              <span className="text-[10px] text-[#ffd54f]">({skill.statusDuration}턴)</span>
            )}
          </div>
          {posLabel && (
            <div
              className="px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold"
              style={{ borderColor: `${posColor}44`, backgroundColor: `${posColor}15`, color: posColor }}
            >
              <span>📍 {posLabel}</span>
            </div>
          )}
        </div>

        {/* 상세 효과 설명 */}
        <div className="p-3 rounded-xl bg-[#101726] border border-[#1e2a3f] flex flex-col gap-1">
          <div className="text-[11px] font-bold text-[#00d2ff]">📖 마도서 비전 효과</div>
          <div className="text-xs text-[#e2e8f0] leading-relaxed whitespace-pre-line">{skill.description}</div>
        </div>

        {/* ⚡ 상태이상 연계 메커니즘 섹션 */}
        {combos.length > 0 && (
          <div className="p-2.5 rounded-xl bg-[#111a2c] border border-[#00d2ff33] flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-[#ffd54f] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>⚡ 상태이상 연계 메커니즘</span>
              </span>
              <span className="text-[9px] text-[#8b9bb4] font-normal">적 상태이상 시 발동</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
              {combos.map(c => (
                <div key={c.comboName} className="text-xs p-2 rounded-lg bg-[#0b101b] border border-[#1d273a] flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1">
                      <span>{c.icon}</span>
                      <span>{c.comboName}</span>
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                      style={{ backgroundColor: `${c.bannerColor}18`, color: c.bannerColor, border: `1px solid ${c.bannerColor}44` }}
                    >
                      필요 적 상태: {c.triggerStatus}
                    </span>
                  </div>
                  {/* 연계 스킬 태그 뱃지 */}
                  <div className="flex items-center gap-1 flex-wrap text-[9px]">
                    <span className="text-[#8b9bb4]">연계 스킬 태그:</span>
                    {c.requiredTagIds.map(tId => {
                      const tMeta = getTagMeta(tId);
                      return (
                        <span
                          key={tId}
                          className="px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5"
                          style={{ backgroundColor: tMeta.bg, color: tMeta.text, border: `1px solid ${tMeta.border}` }}
                        >
                          <span>{tMeta.icon}</span>
                          <span>{tMeta.label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#cfd8dc] leading-snug">{c.fullDesc}</div>
                </div>
              ))}
            </div>
            {/* 💡 연계 메커니즘 안내 팁 */}
            <div className="p-2 rounded-lg bg-[#0a1220] border border-[#223652] text-[10px] text-[#90caf9] flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">💡</span>
                <span>적 상태이상 시 일치 태그 스킬로 공격 시 연계 폭발</span>
              </span>
              <EncyclopediaBadge query="스킬 연계" tab="skills" label="연계 백과" compact />
            </div>
          </div>
        )}

        {/* 📊 마도서 연구 습득률(Mastery) 프로그레스 바 */}
        <div className="p-2.5 rounded-xl bg-[#0f1523] border border-[#1e2a3f] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b9bb4] flex items-center gap-1 font-medium">
              <span>📖 연구 습득률</span>
              <span className="text-[10px] text-[#80cbc4]">({rMeta.label} · 권당 +{gainPerBook}%)</span>
            </span>
            <span className={`font-mono font-bold ${currentMastery >= 100 ? 'text-[#38ef7d]' : 'text-[#00d2ff]'}`}>
              {currentMastery}% / 100% {currentMastery >= 100 && '✓ 습득완료'}
            </span>
          </div>
          <div className="w-full h-2 bg-[#141b2c] rounded-full overflow-hidden border border-[#23324d]">
            <div
              className={`h-full transition-all duration-300 ${
                currentMastery >= 100
                  ? 'bg-gradient-to-r from-[#26a69a] to-[#38ef7d]'
                  : 'bg-gradient-to-r from-[#00b4db] to-[#00d2ff]'
              }`}
              style={{ width: `${Math.min(100, currentMastery)}%` }}
            />
          </div>
          {currentMastery < 100 && (
            <div className="text-[10px] text-[#8b9bb4] flex items-center justify-between">
              <span>완전 습득까지 필요한 연독:</span>
              <span className="text-[#ffd54f] font-bold font-mono">
                약 {Math.max(1, Math.ceil((100 - currentMastery) / gainPerBook))}권 추가 필요
              </span>
            </div>
          )}
        </div>

        {/* 서고 상태 안내 바 */}
        <div className="px-3 py-2 rounded-xl bg-[#0f1523] border border-[#1a2538] flex items-center justify-between text-xs">
          <span className="text-[#8b9bb4]">서고 상태</span>
          {isLearned ? (
            <span className="font-bold flex items-center gap-1.5">
              {slotIndex === 0 && <span className="text-[#00d2ff]">★ 1번 전투 슬롯 장착 중</span>}
              {slotIndex === 1 && <span className="text-[#00d2ff]">★ 2번 전투 슬롯 장착 중</span>}
              {slotIndex === -1 && <span className="text-[#81c784]">✓ 습득 완료 (대기 상태)</span>}
            </span>
          ) : (
            <span className="font-bold text-[#ffd54f]">
              {isFullLearned ? '⚠️ 습득 슬롯 가득 참 (4/4)' : '○ 미습득 (보유 중)'}
            </span>
          )}
        </div>
        </div>

        {/* 하단 액션 버튼 바 (하단 고정) */}
        <div className="shrink-0 p-3 pt-2.5 border-t border-[#1b263b] bg-[#0c101c] flex items-center justify-between gap-2 flex-wrap">
          <div>
            {isLearned && onOpenEnhance && (
              <button
                className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#26a69a] hover:bg-[#26a69a22] border border-[#26a69a55] font-bold flex items-center gap-1"
                onClick={() => {
                  onClose();
                  onOpenEnhance(skill);
                }}
                title="에테르 연금 공방에서 스킬을 비전 강화합니다"
              >
                <span>⚡ 비전 강화</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLearned ? (
              <>
                <button
                  className={`btn text-xs px-3 py-1.5 font-bold ${slotIndex === 0 ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    if (slotIndex === 0) gm.unequipSkillSlot(hero.id, 0);
                    else gm.equipSkillToSlot(hero.id, skill.id, 0);
                    onClose();
                  }}
                >
                  {slotIndex === 0 ? '✓ 1번 슬롯 해제' : '1번 슬롯 장착'}
                </button>
                <button
                  className={`btn text-xs px-3 py-1.5 font-bold ${slotIndex === 1 ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    if (slotIndex === 1) gm.unequipSkillSlot(hero.id, 1);
                    else gm.equipSkillToSlot(hero.id, skill.id, 1);
                    onClose();
                  }}
                >
                  {slotIndex === 1 ? '✓ 2번 슬롯 해제' : '2번 슬롯 장착'}
                </button>
                <button
                  className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                  onClick={() => {
                    if (onUnlearn) onUnlearn(skill);
                    else gm.unlearnSkill(hero.id, skill.id);
                    onClose();
                  }}
                >
                  🗑️ 스킬 망각
                </button>
              </>
            ) : (
              <>
                {currentMastery > 0 && (
                  <button
                    className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                    onClick={() => {
                      if (onAbandon) onAbandon(skill, currentMastery);
                      else gm.abandonStudyingSkill(hero.id, skill.id);
                      onClose();
                    }}
                  >
                    🚫 중도 포기
                  </button>
                )}
                {bookItem && (
                  <ActionButton
                    label={
                      isFullLearned
                        ? '슬롯 가득 참'
                        : `📖 마도서 연독 (${currentMastery}% / +${gainPerBook}%)`
                    }
                    variant={canLearn ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={!canLearn}
                    onClick={() => {
                      gm.learnSkillFromBook(hero.id, bookItem.id);
                      onClose();
                    }}
                  />
                )}
              </>
            )}
            <button
              className="btn btn-ghost text-xs px-3 py-1.5 font-bold text-[#8b9bb4] hover:text-white"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillManagerOverlay: React.FC<{
  hero: Mercenary;
  skillBooks: SkillBookItem[];
  onClose: () => void;
}> = ({ hero, skillBooks, onClose }) => {
  const { state, gm } = useGameManager();
  const [tab, setTab] = useState<'learned' | 'books'>('learned');
  const [enhanceTargetSkill, setEnhanceTargetSkill] = useState<Skill | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<{
    skill: Skill;
    bookItem?: SkillBookItem;
    isLearned: boolean;
    slotIndex: number;
    bookLv: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    type: 'unlearn' | 'abandon';
    skill: Skill;
    mastery?: number;
  } | null>(null);

  const cClass = hero.classId ? CHARACTER_CLASSES[hero.classId] : null;
  const specialId = cClass?.specialSkill?.id;
  const learnedSkills = (hero.learnedSkills || [])
    .filter(sid => sid !== specialId)
    .map(sid => gm.resolveSkillData(sid, hero))
    .filter((s): s is Skill => !!s && !s.isSpecial);
  const equipped = hero.equippedSkills || [];
  const isFullLearned = learnedSkills.length >= 6;

  // 📖 학습(연독) 중인 스킬 목록 (0 < mastery < 100, 미습득)
  const studyingSkillIds: string[] = [...(hero.studyingSkills || [])]
    .filter(sid => sid !== specialId && !(hero.learnedSkills || []).includes(sid));
  if (hero.skillMastery) {
    Object.keys(hero.skillMastery).forEach(sid => {
      const m = hero.skillMastery?.[sid] || 0;
      if (m > 0 && m < 100 && sid !== specialId && !(hero.learnedSkills || []).includes(sid) && !studyingSkillIds.includes(sid)) {
        studyingSkillIds.push(sid);
      }
    });
  }

  const studyingSkills = studyingSkillIds
    .map(sid => ({
      skill: gm.resolveSkillData(sid, hero),
      mastery: hero.skillMastery?.[sid] || 0,
    }))
    .filter((item): item is { skill: Skill; mastery: number } => !!item.skill && !item.skill.isSpecial);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#0b0e17] animate-slide-up">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#00d2ff]">{hero.name}의 스킬북 서고</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                습득 {learnedSkills.length}/6
              </span>
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onClose}
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          <span style={{ color: '#c56060' }}>닫기</span>
        </button>
      </div>

      {/* 탭 전환 바 */}
      <div className="flex gap-1 p-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        <button
          className={`btn flex-1 py-1.5 text-xs font-bold transition-all ${tab === 'learned' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('learned')}
        >
          ⚔️ 습득 스킬 ({learnedSkills.length}/6)
        </button>
        <button
          className={`btn flex-1 py-1.5 text-xs font-bold transition-all ${tab === 'books' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('books')}
        >
          📚 보유 마도서 ({skillBooks.reduce((sum, b) => sum + (b.count || 1), 0)}권)
        </button>
      </div>

      {/* 컨텐츠 목록 */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {/* 탭 1: 습득 스킬 및 학습 중인 스킬 */}
        {tab === 'learned' && (
          <div className="flex flex-col gap-3">
            {/* ⚔️ 섹션 1: 정식 습득 스킬 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#00d2ff] flex items-center gap-1.5">
                  <span>⚔️ 정식 습득 스킬</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] font-mono">
                    {learnedSkills.length}/6
                  </span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  최대 6개 습득 · 2개 장착
                </span>
              </div>

              {learnedSkills.length === 0 ? (
                <div className="panel p-4 text-center text-[#8b9bb4] text-xs bg-[#0f1420]">
                  정식 습득 완료된 스킬이 없습니다.<br />
                  <span className="text-[10px] text-[#00d2ff] mt-0.5 block">
                    [보유 마도서] 탭에서 마도서를 연독해 스킬을 터득하세요.
                  </span>
                </div>
              ) : (
                learnedSkills.map(sk => {
                  const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === sk.id);
                  const matchingBookItem = (skillBooks || []).find(b => b.skill.id === sk.id);
                  const bookLv = hero.skillLevels?.[sk.id] || matchingBookItem?.level || 1;
                  const rawRarity = matchingBookItem?.rarity || (bookDef ? getSkillBookRarity(bookDef.rank) : 'common');
                  const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;

                  const isEquippedSlot1 = equipped[0] === sk.id;
                  const isEquippedSlot2 = equipped[1] === sk.id;
                  const isEquippedAny = isEquippedSlot1 || isEquippedSlot2;

                  return (
                    <div
                      key={sk.id}
                      className={`panel p-3 rounded-xl flex flex-col gap-2 transition-all cursor-pointer hover:border-[#00d2ff88] group ${
                        isEquippedAny ? 'border-[#00d2ff] bg-[#121c2c]' : 'border-[#222d42] bg-[#131926]'
                      }`}
                      onClick={() => {
                        setDetailModalItem({
                          skill: sk,
                          bookItem: matchingBookItem,
                          isLearned: true,
                          slotIndex: isEquippedSlot1 ? 0 : isEquippedSlot2 ? 1 : -1,
                          bookLv,
                          rarity: rawRarity,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952] group-hover:scale-105 transition-transform flex items-center justify-center">
                            <GameIcon name={sk.id} icon={sk.icon} size={24} />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white group-hover:text-[#00d2ff] transition-colors">{sk.name}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                                style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                              >
                                {rMeta.label}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#ffd54f]">
                                Lv.{bookLv}
                              </span>
                              {isEquippedSlot1 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                                  ★ 1번 슬롯
                                </span>
                              )}
                              {isEquippedSlot2 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                                  ★ 2번 슬롯
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-[#64b5f6] font-mono font-bold">{sk.manaCost} MP</span>
                          <span className="text-[9px] text-[#8b9bb4] group-hover:text-[#00d2ff] flex items-center gap-0.5 font-medium">
                            🔍 상세 보기
                          </span>
                        </div>
                      </div>

                      {/* 장착, 강화 & 망각 액션 버튼 그룹 */}
                      <div className="pt-2 border-t border-[#1f2738] flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button
                            className={`btn text-xs px-2.5 py-1 font-bold ${isEquippedSlot1 ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEquippedSlot1) gm.unequipSkillSlot(hero.id, 0);
                              else gm.equipSkillToSlot(hero.id, sk.id, 0);
                            }}
                          >
                            {isEquippedSlot1 ? '✓ 1번 해제' : '1번 장착'}
                          </button>
                          <button
                            className={`btn text-xs px-2.5 py-1 font-bold ${isEquippedSlot2 ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEquippedSlot2) gm.unequipSkillSlot(hero.id, 1);
                              else gm.equipSkillToSlot(hero.id, sk.id, 1);
                            }}
                          >
                            {isEquippedSlot2 ? '✓ 2번 해제' : '2번 장착'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            className="btn btn-ghost text-xs px-2.5 py-1 text-[#26a69a] hover:bg-[#26a69a22] border border-[#26a69a55] font-bold flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnhanceTargetSkill(sk);
                            }}
                            title="에테르 연금 공방에서 스킬을 비전 강화합니다"
                          >
                            <span>⚡ 강화</span>
                          </button>
                          <button
                            className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ type: 'unlearn', skill: sk });
                            }}
                            title="스킬을 망각하여 슬롯을 비웁니다"
                          >
                            🗑️ 망각
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 📖 섹션 2: 학습(연독) 중인 스킬 */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#1e283d]">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                  <span>📖 학습(연독) 중인 스킬</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    studyingSkills.length >= 6 ? 'bg-[#ef535022] text-[#ef5350] font-bold' : 'bg-[#ffd54f22] text-[#ffd54f]'
                  }`}>
                    {studyingSkills.length}/6
                  </span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  최대 6개 동시 연구 가능
                </span>
              </div>

              {studyingSkills.length >= 6 && (
                <div className="px-2.5 py-1.5 rounded-lg bg-[#ef535018] border border-[#ef535044] text-[10px] text-[#ff8a80] flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>학습 슬롯이 가득 찼습니다 (6/6). 새 마도서를 읽으려면 기존 학습을 완료하거나 중도 포기하세요.</span>
                </div>
              )}

              {studyingSkills.length === 0 ? (
                <div className="panel p-4 text-center text-[#8b9bb4] text-xs bg-[#0f1420]">
                  현재 학습 중인 스킬이 없습니다.<br />
                  <span className="text-[10px] text-[#ffd54f] mt-0.5 block">
                    [보유 마도서] 탭에서 마도서를 읽어 최대 6개까지 동시에 연구할 수 있습니다.
                  </span>
                </div>
              ) : (
                studyingSkills.map(({ skill: sk, mastery }) => {
                  const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === sk.id);
                  const matchingBookItem = (skillBooks || []).find(b => b.skill.id === sk.id);
                  const bookLv = hero.skillLevels?.[sk.id] || matchingBookItem?.level || 1;
                  const rawRarity = matchingBookItem?.rarity || (bookDef ? getSkillBookRarity(bookDef.rank) : 'common');
                  const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;
                  const gainPerBook = getMasteryGainPerBook(rawRarity);
                  const booksNeeded = Math.max(1, Math.ceil((100 - mastery) / gainPerBook));
                  const availableBooks = matchingBookItem?.count || 0;

                  return (
                    <div
                      key={sk.id}
                      className="panel p-3 bg-[#131926] border border-[#ffd54f44] rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-[#ffd54f88] group transition-all"
                      onClick={() => {
                        setDetailModalItem({
                          skill: sk,
                          bookItem: matchingBookItem,
                          isLearned: false,
                          slotIndex: -1,
                          bookLv,
                          rarity: rawRarity,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952] group-hover:scale-105 transition-transform flex items-center justify-center">
                            <GameIcon name={sk.id} icon={sk.icon} size={24} />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white group-hover:text-[#ffd54f] transition-colors">{sk.name}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                                style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                              >
                                {rMeta.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold">
                                연독 중
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs text-[#ffd54f] font-mono font-bold">{mastery}%</span>
                          <span className="text-[9px] text-[#8b9bb4] group-hover:text-[#ffd54f] flex items-center gap-0.5 font-medium">
                            🔍 상세 보기
                          </span>
                        </div>
                      </div>

                      {/* 📊 연독률 게이지 바 */}
                      <div className="flex flex-col gap-1 bg-[#0d121c] p-2 rounded-lg border border-[#1b263b]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8b9bb4] flex items-center gap-1">
                            <span>권당 +{gainPerBook}%</span>
                            <span>·</span>
                            <span className="text-[#80cbc4]">완전 습득까지 약 {booksNeeded}권</span>
                          </span>
                          <span className="text-[#ffd54f] font-mono font-bold">
                            {mastery}% / 100%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#141b2c] rounded-full overflow-hidden border border-[#23324d]">
                          <div
                            className="h-full bg-gradient-to-r from-[#ffd54f] to-[#ffb300] transition-all duration-300"
                            style={{ width: `${Math.min(100, mastery)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-[#8b9bb4] pt-0.5">
                          <span>서고 보유: <strong className="text-white font-mono">{availableBooks}권</strong></span>
                          <span>{availableBooks >= booksNeeded ? '✨ 즉시 완전 습득 가능' : '마도서 추가 수집 필요'}</span>
                        </div>
                      </div>

                      {/* 액션 버튼: 이어서 연독하기 & 중도 포기 */}
                      <div className="pt-1 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033] font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({ type: 'abandon', skill: sk, mastery });
                          }}
                          title="학습을 중도 포기하고 연독률을 초기화합니다"
                        >
                          🚫 중도 포기
                        </button>

                        <button
                          className={`btn text-xs px-3 py-1 font-bold ${
                            availableBooks > 0 && !isFullLearned ? 'btn-primary' : 'btn-ghost opacity-50'
                          }`}
                          disabled={availableBooks <= 0 || isFullLearned}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (matchingBookItem) {
                              gm.learnSkillFromBook(hero.id, matchingBookItem.id);
                            }
                          }}
                        >
                          {isFullLearned
                            ? '습득 슬롯 가득참'
                            : availableBooks > 0
                            ? `📖 이어서 연독 (+${gainPerBook}%)`
                            : '마도서 부족'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 탭 2: 보유 마도서 목록 (전수/습득하기) */}
        {tab === 'books' && (
          <>
            {skillBooks.length === 0 && (
              <div className="panel p-8 text-center text-[#8b9bb4] text-sm">
                보관함에 보유 중인 마도서가 없습니다.
              </div>
            )}

            {isFullLearned && (
              <div className="bg-[#ffd54f15] border border-[#ffd54f44] p-2 rounded-lg text-center text-xs text-[#ffd54f] font-bold">
                ⚠️ 습득 슬롯 가득 참 (6/6). 새 스킬을 배우려면 [습득 스킬] 탭에서 기존 스킬을 망각하세요.
              </div>
            )}

            {skillBooks.map(item => {
              const alreadyKnows = (hero.learnedSkills || []).includes(item.skill.id);
              const isStudying = studyingSkillIds.includes(item.skill.id);
              const isStudyingFull = studyingSkills.length >= 6 && !isStudying;
              const canLearn = !isFullLearned && !alreadyKnows && !isStudyingFull;
              const bookLv = item.level || hero.skillLevels?.[item.skill.id] || 1;
              const rawRarity = item.rarity || getSkillBookRarity(item.rank);
              const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;
              const bookCount = item.count || 1;
              const mastery = hero.skillMastery?.[item.skill.id] ?? (alreadyKnows ? 100 : 0);
              const gain = getMasteryGainPerBook(rawRarity);
              const bookDef = ALL_SKILL_BOOKS.find(b => b.id === item.bookId || b.skill.id === item.skill.id);
              const cardAffinity = item.affinity || bookDef?.affinity || item.skill.affinity;
              const cardAffMeta = getSkillAffinityMeta(cardAffinity);
              const heroRole = CHARACTER_CLASSES[hero.classId]?.role;
              const cardIsMatch = checkSkillAffinityMatch(cardAffinity, heroRole, hero.classId);
              return (
                <div
                  key={item.id}
                  className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl flex flex-col gap-2 cursor-pointer hover:border-[#00d2ff88] group transition-all"
                  onClick={() => {
                    setDetailModalItem({
                      skill: item.skill,
                      bookItem: item,
                      isLearned: alreadyKnows,
                      slotIndex: equipped[0] === item.skill.id ? 0 : equipped[1] === item.skill.id ? 1 : -1,
                      bookLv,
                      rarity: rawRarity,
                    });
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952] group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                        <GameIcon name={item.bookId || item.id || item.skill?.id} icon={item.icon} size={28} />
                      </span>
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        {/* 1행: 마도서 이름 + 등급 뱃지 + 계열 뱃지 + 직업 적합도 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white group-hover:text-[#00d2ff] transition-colors">{item.name}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0"
                            style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                          >
                            {rMeta.label}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shrink-0"
                            style={{ backgroundColor: cardAffMeta.bg, color: cardAffMeta.color, border: `1px solid ${cardAffMeta.borderColor}` }}
                          >
                            <span>{cardAffMeta.icon}</span>
                            <span>{cardAffMeta.shortName}</span>
                          </span>
                          {cardIsMatch ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#4ade8015] text-[#4ade80] border border-[#4ade8033] shrink-0">
                              적합
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#f8717122] text-[#f87171] border border-[#f8717144] shrink-0">
                              ⚠️ 위력 50%
                            </span>
                          )}
                        </div>

                        {/* 2행: 레벨 + 권수와 습득률을 같은 라인에 나란히 표시 (드랍 마물명 제외) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-[#ffd54f]">
                            Lv.{bookLv}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00d2ff15] text-[#00d2ff] border border-[#00d2ff33]">
                            x{bookCount}권
                          </span>
                          {!alreadyKnows ? (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] flex items-center gap-1">
                              <span>습득률 {mastery}%</span>
                              <span className="text-[9px] text-[#ffb74d] font-normal">(+{gain}%)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#4ade8015] text-[#4ade80] border border-[#4ade8033]">
                              ✓ 습득 완료 (100%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <ActionButton
                        label={
                          alreadyKnows
                            ? '✓ 습득 완료'
                            : isFullLearned
                            ? '슬롯 가득참'
                            : `📖 연독 (${mastery}% / +${gain}%)`
                        }
                        variant={canLearn ? 'primary' : 'ghost'}
                        size="sm"
                        disabled={!canLearn}
                        onClick={(e) => {
                          e?.stopPropagation();
                          gm.learnSkillFromBook(hero.id, item.id);
                        }}
                      />
                      <span className="text-[9px] text-[#8b9bb4] group-hover:text-[#00d2ff] flex items-center gap-0.5 font-medium">
                        🔍 상세 보기
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── 🔍 마도서 상세 정보 모달 ── */}
      {detailModalItem && (
        <SkillBookDetailModal
          hero={hero}
          detail={detailModalItem}
          isFullLearned={isFullLearned}
          onClose={() => setDetailModalItem(null)}
          onOpenEnhance={(sk) => setEnhanceTargetSkill(sk)}
          onUnlearn={(sk) => setConfirmModal({ type: 'unlearn', skill: sk })}
          onAbandon={(sk, m) => setConfirmModal({ type: 'abandon', skill: sk, mastery: m })}
          gm={gm}
        />
      )}

      {/* ── ⚡ 스킬 비전 강화 모달 (서고에서 바로가기) ── */}
      {enhanceTargetSkill && (
        <GrimoireEnhanceModal
          open={!!enhanceTargetSkill}
          hero={state.barracks.find(h => h.id === hero.id) || hero}
          skill={enhanceTargetSkill}
          onClose={() => setEnhanceTargetSkill(null)}
          gm={gm}
        />
      )}

      {/* ── ⚠️ 스킬 망각 / 중도 포기 재확인 모달 ── */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-[360px] bg-[#0d121f] border border-[#ef535066] rounded-2xl shadow-2xl p-4 flex flex-col gap-3 text-left animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-[#ef5350] border-b border-[#252f44] pb-2">
              <span className="text-xl">
                {confirmModal.type === 'unlearn' ? '🗑️' : '🚫'}
              </span>
              <span className="font-bold text-sm text-white">
                {confirmModal.type === 'unlearn' ? '스킬 망각 확인' : '학습 중도 포기 확인'}
              </span>
            </div>

            <div className="text-xs text-[#cfd8dc] leading-relaxed flex flex-col gap-2">
              <div>
                <strong className="text-white text-sm">[{confirmModal.skill.name}]</strong>
                {confirmModal.type === 'unlearn' ? (
                  <span> 스킬을 완전히 망각하시겠습니까?</span>
                ) : (
                  <span>의 학습(연독)을 중도 포기하시겠습니까?</span>
                )}
              </div>

              {confirmModal.type === 'unlearn' ? (
                <div className="p-2.5 rounded-lg bg-[#ef535015] border border-[#ef535033] text-[11px] text-[#ff8a80]">
                  ⚠️ <strong>주의:</strong> 스킬을 망각하면 전투 슬롯에서 즉시 해제되며, 다시 습득하려면 마도서를 처음부터(0%) 다시 연독해야 합니다.
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#ef535015] border border-[#ef535033] text-[11px] text-[#ff8a80]">
                  ⚠️ <strong>주의:</strong> 현재까지 달성한 연독률(<strong className="text-white font-mono">{confirmModal.mastery || 0}%</strong>)이 완전히 초기화되며, 학습 슬롯(1칸)이 반환됩니다.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293f]">
              <button
                className="btn btn-ghost text-xs px-3 py-1.5 text-[#8b9bb4] hover:text-white"
                onClick={() => setConfirmModal(null)}
              >
                취소
              </button>
              <button
                className="btn btn-danger text-xs px-3.5 py-1.5 font-bold"
                onClick={() => {
                  if (confirmModal.type === 'unlearn') {
                    gm.unlearnSkill(hero.id, confirmModal.skill.id);
                  } else {
                    gm.abandonStudyingSkill(hero.id, confirmModal.skill.id);
                  }
                  setConfirmModal(null);
                  setDetailModalItem(null);
                }}
              >
                {confirmModal.type === 'unlearn' ? '망각하기' : '중도 포기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// (EquipmentEnhanceModal is defined at the top of the file)


// ─────────────────────────────────────────────────────────────
//  🔮 마도 인챈트 상세 설정 모달 (EquipmentEnchantModal)
// ─────────────────────────────────────────────────────────────
interface EquipmentEnchantModalProps {
  item: EquipmentItem;
  onClose: () => void;
  gm: GameManager;
  resources: GameResources;
  discountPct: number;
  mult: number;
}

const EquipmentEnchantModal: React.FC<EquipmentEnchantModalProps> = ({
  item,
  onClose,
  gm,
  resources,
  discountPct,
  mult,
}) => {
  const [enchantType, setEnchantType] = useState<'prefix' | 'suffix'>('prefix');
  const [isPure, setIsPure] = useState<boolean>(false);
  const [isEnchanting, setIsEnchanting] = useState<boolean>(false);
  const [pendingOutcome, setPendingOutcome] = useState<'success' | 'keep' | 'drop' | undefined>(undefined);

  const canPrefix = item.level >= 3;
  const canSuffix = item.level >= 7;
  const hasAnyEnchant = !!item.prefix || !!item.suffix;

  const forgeLv = (gm.buildings as unknown as Record<string, { level?: number }>)['blacksmith']?.level || (gm.buildings as unknown as Record<string, { level?: number }>)['forge']?.level || 1;
  const wearer = item.equippedHeroId ? (gm.barracks || []).find(h => h.id === item.equippedHeroId) : null;
  const successRate = getEnchantSuccessRate(forgeLv, isPure);
  const stoneCost = getEnchantStoneCost(item.rarity);
  const { gold: goldCost, ether: etherCost } = getEnchantResourceCosts(isPure, mult);

  const locItem = item;
  const itemName = locItem?.name || item.name;

  const stoneKey = isPure
    ? (enchantType === 'prefix' ? 'pure_prefix_stone' : 'pure_suffix_stone')
    : (enchantType === 'prefix' ? 'prefix_stone' : 'suffix_stone');

  const stoneCount = (resources as unknown as Record<string, number>)[stoneKey] || 0;

  const canEnchantSlot = enchantType === 'prefix' ? canPrefix : canSuffix;
  const canAfford = stoneCount >= stoneCost && (resources.gold || 0) >= goldCost && (resources.ether || 0) >= etherCost;
  const canExecute = canEnchantSlot && canAfford;

  const handleStartEnchant = () => {
    if (!canExecute || isEnchanting) return;
    const roll = Math.random() * 100;
    const outcome: 'success' | 'keep' = roll < successRate ? 'success' : 'keep';
    setPendingOutcome(outcome);
    setIsEnchanting(true);
  };

  const handleEnchantComplete = () => {
    setIsEnchanting(false);
    gm.enchantEquipment(item.id, enchantType, isPure);
    setPendingOutcome(undefined);
  };

  // Options Pool for preview (장비 슬롯 및 순수석 등급에 맞춤)
  const wType = item.slot === 'weapon' ? (item.weaponType || detectWeaponType(item)) : undefined;
  const candidates = getEnchantCandidates(item.slot, enchantType, isPure, wType);

  const stoneMeta: Record<string, { name: string; icon: string }> = {
    prefix_stone: { name: '일반 접두석', icon: '✨' },
    pure_prefix_stone: { name: '순수 접두석', icon: '⭐' },
    suffix_stone: { name: '일반 접미석', icon: '🔮' },
    pure_suffix_stone: { name: '순수 접미석', icon: '🌌' },
  };

  const slotLabel = item.slot === 'weapon'
    ? ('🗡️ 주무기')
    : item.slot === 'armor'
    ? ('🛡️ 방어구')
    : ('💍 장신구');

  const modalTitle = '🔮 마도 장비 인챈트 공방';

  return (
    <Modal title={modalTitle} open={true} onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        {/* 장비 헤더 */}
        <div className="p-3 bg-[#131926] border border-[#222d42] rounded-xl flex items-center gap-3">
          <span 
            className="p-2 rounded-xl bg-[#323d4e] border shrink-0 flex items-center justify-center shadow-lg transition-all"
            style={getRarityBorderStyle(item.rarity)}
          >
            <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={48} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-white truncate">{itemName}</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ backgroundColor: `${getRarityColor(item.rarity)}22`, color: getRarityColor(item.rarity), border: `1px solid ${getRarityColor(item.rarity)}44` }}
              >
                [{getRarityLabel(item.rarity)}]
              </span>
              <EncyclopediaBadge query="인챈트" tab="systems" label="인챈트 백과" compact />
              {wearer ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                  👤 {wearer.name} {'착용중'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                  {'보관함'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8b9bb4] mt-0.5">
              {slotLabel} | 강화 단계: <span className="text-[#ffd54f] font-bold font-mono">+{item.level}</span> | 필요 인챈트석: <span className="text-[#38ef7d] font-bold font-mono">{stoneCost}개</span>
            </div>
          </div>
        </div>

        {/* 성공 확률 및 레벨 보너스 게이지 */}
        <div className="p-2.5 rounded-xl bg-[#101624] border border-[#233554] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white flex items-center gap-1">
              <span>🎲 인챈트 성공 확률:</span>
              <span className={`font-mono text-sm ${isPure ? 'text-[#ce93d8]' : 'text-[#38ef7d]'}`}>
                {successRate}%
              </span>
              {isPure && <span className="text-[10px] text-[#ce93d8] font-normal">(순수석 50% 반감)</span>}
            </span>
            <span className="text-[10px] text-[#8b9bb4]">
              {forgeLv > 6
                ? `병기창 Lv.${forgeLv} (+${(forgeLv - 6) * 5}% 상승)`
                : '병기창 Lv.7부터 +5%/Lv 증가'}
            </span>
          </div>
          <div className="w-full bg-[#182338] h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${successRate}%`,
                background: 'linear-gradient(90deg, #00d2ff, #38ef7d)'
              }}
            />
          </div>
          <div className="text-[10px] text-[#64b5f6] flex items-center justify-between">
            <span>🛡️ 실패 시 장비 손상/파괴/하락 없음 (재료만 소모)</span>
            <span className="text-[#8b9bb4]">등급 소모: <span className="text-[#ffd54f] font-bold">{stoneCost}개</span></span>
          </div>
        </div>

        {/* 현재 부여된 인챈트 상태 */}
        <div className="p-3 bg-[#0d121c] border border-[#1f2738] rounded-xl flex flex-col gap-2">
          <div className="text-xs font-bold text-[#00d2ff]">{'✨ 현재 인챈트 현황'}</div>
          {(() => {
            const locPre = item.prefix;
            const preName = locPre?.name || item.prefix?.name;
            const rawPreDesc = locPre?.description || item.prefix?.description;
            const cleanPreDesc = (item.slot !== 'weapon' && rawPreDesc)
              ? rawPreDesc
                  .replace(', 고유스킬 [작열탄] 부여 (기본 공격 대체)', '')
                  .replace(', 고유스킬 [동결 타격] 부여 (기본 공격 대체)', '')
                  .replace(', 고유스킬 [신성 심판] 부여 (기본 공격 대체)', '')
                  .replace(', 고유스킬 [파멸 강타] 부여 (기본 공격 대체)', '')
              : rawPreDesc;

            return (
              <div className={`p-2 rounded-lg border text-xs ${item.prefix ? 'bg-[#ffd54f15] border-[#ffd54f44] text-[#ffd54f]' : 'bg-[#141a27] border-[#222d42] text-[#8b9bb4]'}`}>
                <span className="font-bold">'✨ 접두사: '</span>
                {item.prefix ? (
                  <span className="text-white">
                    <span className="text-[#ffd54f] font-bold">[{preName}]</span> {cleanPreDesc}
                    {item.slot === 'weapon' && item.prefix.grantedSkill && (
                      <span className="text-[#38ef7d] font-bold block mt-0.5">
                        '⚔️ 기본공격 대체: '[{item.prefix.grantedSkill.name}]
                      </span>
                    )}
                  </span>
                ) : (
                  <span>{canPrefix ? ('미부여 (인챈트 가능)') : ('🔒 +3강 이상 필요')}</span>
                )}
              </div>
            );
          })()}

          {(() => {
            const locSuf = item.suffix;
            const sufName = locSuf?.name || item.suffix?.name;
            const sufDesc = locSuf?.description || item.suffix?.description;

            return (
              <div className={`p-2 rounded-lg border text-xs ${item.suffix ? 'bg-[#00d2ff15] border-[#00d2ff44] text-[#00d2ff]' : 'bg-[#141a27] border-[#222d42] text-[#8b9bb4]'}`}>
                <span className="font-bold">'🔮 접미사: '</span>
                {item.suffix ? (
                  <span className="text-white">
                    <span className="text-[#00d2ff] font-bold">[{sufName}]</span> {sufDesc}
                  </span>
                ) : (
                  <span>{canSuffix ? ('미부여 (인챈트 가능)') : ('🔒 +7강 이상 필요')}</span>
                )}
              </div>
            );
          })()}
        </div>

        {/* 슬롯 선택 (접두사 vs 접미사) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              enchantType === 'prefix'
                ? 'bg-[#ffd54f22] border-[#ffd54f] text-[#ffd54f] shadow'
                : canPrefix
                ? 'bg-[#121724] border-[#26334a] text-[#8b9bb4] hover:text-white' : 'bg-[#121724] border-[#26334a] text-[#555] opacity-50 cursor-not-allowed'
            }`}
            onClick={() => setEnchantType('prefix')}
          >
            <span className="text-sm">{'✨ 접두어 슬롯'}</span>
            <span className="text-[10px]">
              {canPrefix
                ? (item.slot === 'weapon'
                    ? ('공격/속성/스킬 (+3강)')
                    : item.slot === 'armor'
                    ? ('방어/생명/수호 (+3강)')
                    : ('마나/속도/행운 (+3강)'))
                : ('🔒 +3강 이상 필요')}
            </span>
          </button>

          <button
            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              enchantType === 'suffix'
                ? 'bg-[#00d2ff22] border-[#00d2ff] text-[#00d2ff] shadow'
                : canSuffix
                ? 'bg-[#121724] border-[#26334a] text-[#8b9bb4] hover:text-white' : 'bg-[#121724] border-[#26334a] text-[#555] opacity-50 cursor-not-allowed'
            }`}
            onClick={() => setEnchantType('suffix')}
          >
            <span className="text-sm">{'🔮 접미어 슬롯'}</span>
            <span className="text-[10px]">
              {canSuffix
                ? (item.slot === 'weapon'
                    ? ('피해증폭/흡혈/관통 (+7강)')
                    : item.slot === 'armor'
                    ? ('방어/재생/가호 (+7강)')
                    : ('신속/마력/지혜 (+7강)'))
                : ('🔒 +7강 이상 필요')}
            </span>
          </button>
        </div>

        {/* 인챈트석 등급 선택 (일반 vs 순수) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between transition-all ${
              !isPure
                ? 'bg-[#38ef7d22] border-[#38ef7d] text-[#38ef7d]' : 'bg-[#121724] border-[#26334a] text-[#8b9bb4]'
            }`}
            onClick={() => setIsPure(false)}
          >
            <span>🔹 일반 인챈트석</span>
            <span className="text-xs font-mono font-bold">
              ({(resources as unknown as Record<string, number>)[enchantType === 'prefix' ? 'prefix_stone' : 'suffix_stone'] || 0} / {stoneCost}개)
            </span>
          </button>

          <button
            className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between transition-all ${
              isPure
                ? 'bg-[#ce93d822] border-[#ce93d8] text-[#ce93d8]' : 'bg-[#121724] border-[#26334a] text-[#8b9bb4]'
            }`}
            onClick={() => setIsPure(true)}
          >
            <span>⭐ 순수 인챈트석</span>
            <span className="text-xs font-mono font-bold">
              ({(resources as unknown as Record<string, number>)[enchantType === 'prefix' ? 'pure_prefix_stone' : 'pure_suffix_stone'] || 0} / {stoneCost}개)
            </span>
          </button>
        </div>

        {/* 무기 접두사 스킬 특화 알림 */}
        {item.slot === 'weapon' && enchantType === 'prefix' && (
          <div className="p-2 rounded-lg bg-[#38ef7d15] border border-[#38ef7d33] text-[11px] text-[#38ef7d] flex items-center gap-1.5">
            <span>🗡️</span>
            <span>{'무기 접두사 인챈트 시 기본 공격을 대체하는 고유 스킬(작열탄, 동결 타격, 신성 심판, 파멸 강타 등)을 획득할 수 있습니다!'}</span>
          </div>
        )}

        {/* 부여 가능 후보 풀 미리보기 (슬롯 전용 카테고리) */}
        <div className="p-2.5 bg-[#0d121c] border border-[#1f2738] rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[#8b9bb4]">
            <span className="font-bold text-white">
              📜 {isPure
                ? ('순수석 후보 풀 (에픽~전설 확정)')
                : ('일반석 후보 풀 (희귀~에픽)')}
              <span className="text-[#00d2ff] text-[10px] font-normal ml-1">
                [{item.slot === 'weapon' ? ('🗡️ 무기 전용') : item.slot === 'armor' ? ('🛡️ 방어구 전용') : ('💍 장신구 전용')}]
              </span>
            </span>
            <span className="text-[10px] font-mono">{'총'} {candidates.length}{'종'}</span>
          </div>
          <div className="max-h-28 overflow-y-auto flex flex-col gap-1 pr-1">
            {candidates.map(opt => {
              const rColor = opt.rarity === 'legendary' ? '#ffd54f' : opt.rarity === 'epic' ? '#ce93d8' : '#42a5f5';
              const locCand = opt;
              const candName = locCand?.name || opt.name;
              const rawDesc = locCand?.description || opt.description;
              const cleanDesc = (item.slot !== 'weapon' && enchantType === 'prefix')
                ? rawDesc
                    .replace(', 고유스킬 [작열탄] 부여 (기본 공격 대체)', '')
                    .replace(', 고유스킬 [동결 타격] 부여 (기본 공격 대체)', '')
                    .replace(', 고유스킬 [신성 심판] 부여 (기본 공격 대체)', '')
                    .replace(', 고유스킬 [파멸 강타] 부여 (기본 공격 대체)', '')
                : rawDesc;
              return (
                <div key={opt.id} className="p-1 px-2 rounded bg-[#141a27] border border-[#232f46] text-[11px] flex items-center justify-between">
                  <span className="font-bold" style={{ color: rColor }}>[{candName}]</span>
                  <span className="text-[10px] text-[#cfd8dc] truncate max-w-[210px]">{cleanDesc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 소모 재화 */}
        <div className="p-2.5 bg-[#0d121c] border border-[#1f2738] rounded-xl flex flex-col gap-1.5">
          <div className="text-xs font-bold text-[#cfd8dc]">
            📦 {'소모 재화'} ({'대장간'} -{discountPct}%)
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono pt-0.5">
            <span className={`px-2.5 py-1 rounded-md border font-bold flex items-center gap-1 ${stoneCount >= stoneCost ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d33]' : 'bg-[#ef535015] text-[#ef5350] border-[#ef535033]'}`}>
              <span>{stoneMeta[stoneKey]?.icon}</span>
              <span>{stoneMeta[stoneKey]?.name}:</span>
              <span>{stoneCost}/{stoneCount}개</span>
            </span>
            <span className={`px-2.5 py-1 rounded-md border font-bold flex items-center gap-1 ${(resources.gold || 0) >= goldCost ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d33]' : 'bg-[#ef535015] text-[#ef5350] border-[#ef535033]'}`}>
              <span>🪙</span>
              <span>골드:</span>
              <span>{goldCost.toLocaleString()}/{(resources.gold || 0).toLocaleString()}</span>
            </span>
            <span className={`px-2.5 py-1 rounded-md border font-bold flex items-center gap-1 ${(resources.ether || 0) >= etherCost ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d33]' : 'bg-[#ef535015] text-[#ef5350] border-[#ef535033]'}`}>
              <span>✨</span>
              <span>에테르:</span>
              <span>{etherCost.toLocaleString()}/{(resources.ether || 0).toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center gap-2 pt-1">
          <ActionButton
            label={
              !canEnchantSlot
                ? (enchantType === 'prefix'
                    ? ('🔒 +3강 이상 필요')
                    : ('🔒 +7강 이상 필요'))
                : canAfford
                ? (`🔮 인챈트 시도 (${successRate}%)`)
                : ('재화/인챈트석 부족')
            }
            variant={canExecute ? 'primary' : 'ghost'}
            className="flex-1 py-2 font-bold shadow-lg"
            disabled={!canExecute || isEnchanting}
            onClick={handleStartEnchant}
          />
          {hasAnyEnchant && (
            <ActionButton
              label={'✕ 초기화 (에테르 50)'}
              variant="danger-outline"
              size="sm"
              className="py-2"
              style={{
                border: '1.5px solid #c56060',
                color: '#ffffff',
                backgroundColor: 'transparent'
              }}
              disabled={(resources.ether || 0) < 50 || isEnchanting}
              onClick={() => {
                gm.cleanseEnchant(item.id);
              }}
            />
          )}
          <button
            className="btn btn-ghost px-4 py-2 text-xs hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center gap-1"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onClose}
            disabled={isEnchanting}
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            <span style={{ color: '#c56060' }}>닫기</span>
          </button>
        </div>
      </div>

      {/* 🌟 마도 인챈트 연출 모달 🌟 */}
      <CraftProgressModal
        open={isEnchanting}
        type="enchant_equipment"
        title="마도 장비 인챈트"
        itemName={itemName}
        itemIcon={item.icon || '🔮'}
        itemSub={`${enchantType === 'prefix' ? '접두어' : '접미어'} ${isPure ? '순수석 인챈트' : '일반 인챈트'}`}
        durationMs={2000}
        outcome={pendingOutcome}
        onComplete={handleEnchantComplete}
      />
    </Modal>
  );
};

const getSuitableClassesText = (recipeId: string, slot: EquipmentSlot): string => {
  if (slot === 'accessory') return '전 클래스 공용';
  if (recipeId === 'rec_sword') {
    return '기사, 성기사, 보병, 버서커, 검성';
  }
  if (recipeId === 'rec_spear') {
    return '기사, 성기사, 보병, 버서커, 사제';
  }
  if (recipeId === 'rec_gun') {
    return '거너, 전술포수, 하이퍼레인저';
  }
  if (recipeId === 'rec_bow') {
    return '도적, 암살자, 그림자망령, 검성';
  }
  if (recipeId === 'rec_dagger') {
    return '도적, 암살자, 그림자망령, 버서커';
  }
  if (recipeId === 'rec_staff') {
    return '마법사, 원소술사, 주교, 성녀';
  }
  if (recipeId === 'rec_plate_armor') {
    return '기사, 성기사, 보병, 버서커';
  }
  if (recipeId === 'rec_leather_armor') {
    return '도적, 암살자, 거너, 사제';
  }
  if (recipeId === 'rec_robe') {
    return '마법사, 원소술사, 주교, 성녀';
  }
  return '다양한 클래스';
};

// ─────────────────────────────────────────────────────────────
//  ⚒️ 단조 상세 & 스탯 ±30% 랜덤 단조 실행 모달
// ─────────────────────────────────────────────────────────────
interface EquipmentCraftModalProps {
  recipe: EquipmentRecipe;
  onClose: () => void;
  gm: GameManager;
  resources: GameResources;
  discountPct: number;
  mult: number;
}

const EquipmentCraftModal: React.FC<EquipmentCraftModalProps> = ({
  recipe,
  onClose,
  gm,
  resources,
  discountPct,
  mult,
}) => {
  const [craftedItem, setCraftedItem] = useState<EquipmentItem | null>(null);

  const res = resources as unknown as Record<string, number>;
  const canCraft = Object.entries(recipe.cost).every(([k, v]) => {
    const discountedReq = Math.max(1, Math.floor((v as number) * mult));
    return (res[k] || 0) >= discountedReq;
  });

  const slotBadge = recipe.slot === 'weapon' ? '🗡️ 무기' : recipe.slot === 'armor' ? '🛡️ 방어구' : '💍 장신구';
  const suitableText = getSuitableClassesText(recipe.id, recipe.slot);
  const forgeLevel = gm.buildings['blacksmith']?.level || 1;
  const rates = getForgeRarityRates(forgeLevel);

  const statLabels: Record<string, { label: string; icon: string; color: string }> = {
    atk: { label: '공격력', icon: '⚔️', color: '#ff8a65' },
    def: { label: '방어력', icon: '🛡️', color: '#4fc3f7' },
    hp: { label: 'HP', icon: '❤️', color: '#81c784' },
    mp: { label: 'MP', icon: '💧', color: '#64b5f6' },
    spd: { label: '속도', icon: '⚡', color: '#ffd54f' },
    luck: { label: '행운', icon: '🍀', color: '#a7ffeb' }
  };

  const [isCrafting, setIsCrafting] = useState(false);
  const [pendingRarity, setPendingRarity] = useState<EquipmentItem['rarity'] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ⏳ 장비 희귀도별 점진적 소요 시간 (일반: 1.5초, 희귀: 2.5초, 에픽: 3.5초, 전설/신화: 4.5초)
  const craftDurationMs = useMemo(() => {
    const targetRarity = pendingRarity || recipe.rarity;
    switch (targetRarity) {
      case 'rare': return 2500;
      case 'epic': return 3500;
      case 'legendary':
      case 'unique': return 4500;
      default: return 1500;
    }
  }, [pendingRarity, recipe.rarity]);

  const handleCraft = () => {
    if (!canCraft) return;
    const rolled = rollForgeItemRarity(forgeLevel);
    setPendingRarity(rolled);
    setIsCrafting(true);
  };

  const handleCraftComplete = () => {
    setIsCrafting(false);
    const item = gm.craftEquipment(recipe.id, pendingRarity || undefined);
    if (item) {
      setCraftedItem(item);
    }
    setPendingRarity(null);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <Modal title="⚒️ 장비 단조 공방" open={true} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {/* 장비 헤더 요약 */}
        <div className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-lg">
            <GameIcon name={recipe.templateId || getEquipmentTemplateId(recipe as any) || recipe.id} icon={recipe.icon} size={48} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-base text-white">{recipe.name}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: `${getRarityColor(recipe.rarity)}22`,
                  color: getRarityColor(recipe.rarity),
                  border: `1px solid ${getRarityColor(recipe.rarity)}44`
                }}
              >
                [{getRarityLabel(recipe.rarity)}]
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                {slotBadge}
              </span>
            </div>
            <div className="text-[11px] text-[#38ef7d] mt-1 font-medium">
              🎯 적합: {suitableText}
            </div>
          </div>
        </div>

        {/* 장비 설명 */}
        <div className="text-xs text-[#8b9bb4] bg-[#0c101a] p-2.5 rounded-lg border border-[#1a2234] leading-relaxed">
          {recipe.description}
        </div>

        {/* 🎲 단조 등급 확률 및 노강 안내 */}
        <div className="p-2.5 rounded-xl bg-[#141b2c] border border-[#23324d] flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-[#8b9bb4]">
            <span className="font-bold text-[#cfd8e8] flex items-center gap-1">
              🎲 단조 등급 확률 (병기창 Lv.{forgeLevel})
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
              0강(노강) 지급
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#9e9e9e22] text-[#9e9e9e] font-mono border border-[#9e9e9e44]">
              일반 {(rates.common * 100).toFixed(0)}%
            </span>
            {rates.rare > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#42a5f522] text-[#42a5f5] font-mono font-bold border border-[#42a5f544]">
                ✨ 희귀 {(rates.rare * 100).toFixed(0)}%
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#42a5f510] text-[#6b7c96] font-mono border border-[#42a5f522]">
                🔒 Lv.3 희귀 해금
              </span>
            )}
            {rates.epic > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#ab47bc22] text-[#ce93d8] font-mono font-bold border border-[#ab47bc44]">
                🌟 영웅 {(rates.epic * 100).toFixed(0)}%
              </span>
            )}
            {rates.legendary > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-mono font-bold border border-[#ffd54f44]">
                👑 전설 {(rates.legendary * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#8b9bb4] leading-relaxed">
            💡 병기창 레벨에 비례하여 강화된 기초 스탯이 반영되어 0강(노강)으로 지급되며, 희귀 이상 제작 시 추가 스탯이 개화합니다.
          </div>
        </div>

        {/* 🏷️ 무기 고유 특성 뱃지 및 메커니즘 상세 */}
        {recipe.slot === 'weapon' && (() => {
          const wt = recipe.weaponTrait || getWeaponTrait(recipe);
          if (!wt) return null;
          return (
            <div
              className="p-3 rounded-xl border flex flex-col gap-1.5 shadow-md animate-fade-in"
              style={{ backgroundColor: `${wt.color}10`, borderColor: `${wt.color}55` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm" style={{ color: wt.color }}>
                  {wt.badge}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold shadow-sm"
                  style={{ backgroundColor: wt.bgColor, color: wt.color, border: `1px solid ${wt.color}55` }}
                >
                  고유 효과
                </span>
              </div>
              <div className="text-xs text-[#e2e8f0] leading-relaxed">
                {wt.description}
              </div>
              <div className="text-[10px] text-[#90a4ae] flex items-center gap-1 pt-1.5 border-t border-[#ffffff15]">
                <span>💡</span>
                <span><strong>효과 요약:</strong> {wt.shortDesc}</span>
              </div>
            </div>
          );
        })()}

        {/* 🎲 제작 스탯 및 ±30% 랜덤 편차 범위 안내 */}
        <div className="panel p-3 bg-[#111724] border border-[#1f2b40] rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#ffd54f] flex items-center gap-1">
              <span>🎲</span>
              <span>제작 예상 스탯 (±30% 무작위 편차)</span>
            </span>
            <span className="text-[10px] text-[#00d2ff] font-medium bg-[#00d2ff15] px-2 py-0.5 rounded-full border border-[#00d2ff33]">
              70% ~ 130% 수치 롤
            </span>
          </div>
          <div className="text-[10px] text-[#8b9bb4] leading-tight">
            단조 시 대장장이의 숙련도와 담금질 상태에 따라 기본값의 ±30% 범위에서 랜덤하게 스탯이 완성됩니다.
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {Object.entries(recipe.baseStats).map(([k, v]) => {
              const s = statLabels[k] || { label: k.toUpperCase(), icon: '✨', color: '#ffd54f' };
              const minVal = Math.max(1, Math.round((v as number) * 0.7));
              const maxVal = Math.max(1, Math.round((v as number) * 1.3));
              return (
                <div
                  key={k}
                  className="p-2 rounded-lg bg-[#0b0e17] border border-[#1b2537] flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: s.color }}>
                    <span className="flex items-center gap-1">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                    <span className="text-[10px] text-[#8b9bb4]">기준 {v}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white flex items-center justify-between">
                    <span className="text-[#8b9bb4] text-[10px]">제작 범위:</span>
                    <span className="text-[#38ef7d]">{minVal} ~ {maxVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 필요 재료 섹션 */}
        <div className="panel p-3 bg-[#111724] border border-[#1f2b40] rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#cfd8e8] flex items-center gap-1">
              <span>📦</span>
              <span>필요 소모 재료</span>
            </span>
            <span className="text-[10px] text-[#38ef7d] font-bold">
              특전 할인 -{discountPct}% 적용
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(recipe.cost).map(([k, v]) => {
              const cur = res[k] || 0;
              const req = Math.max(1, Math.floor((v as number) * mult));
              const ok = cur >= req;
              const meta = RES_NAMES_AND_ICONS[k] || GameManager.getResourceMeta(k) || { label: k, icon: '📦' };
              const label = ('label' in meta ? meta.label : (meta as any).name) || k;
              return (
                <div
                  key={k}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    ok ? 'bg-[#38ef7d0f] border-[#38ef7d33] text-[#38ef7d]' : 'bg-[#ef53500f] border-[#ef535033] text-[#ef5350]'
                  }`}
                >
                  <span className="flex items-center gap-1 text-white font-sans text-[11px]">
                    <span>{meta.icon}</span>
                    <span>{label}</span>
                  </span>
                  <span className="font-bold">
                    {req} / {cur}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🎉 단조 성공 결과 알림 */}
        {craftedItem && (
          <div className="panel p-3 bg-[#192415] border border-[#38ef7d66] rounded-xl flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#38ef7d] flex items-center gap-1">
                <span>✨</span>
                <span>단조 성공 완료!</span>
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: `${getRarityColor(craftedItem.rarity)}22`,
                  color: getRarityColor(craftedItem.rarity),
                  border: `1px solid ${getRarityColor(craftedItem.rarity)}44`
                }}
              >
                [{getRarityLabel(craftedItem.rarity)}]
              </span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <GameIcon name={craftedItem.templateId || getEquipmentTemplateId(craftedItem) || craftedItem.id} icon={craftedItem.icon} size={28} />
              <span>{craftedItem.name}</span>
            </div>
            <div className="text-xs text-[#cfd8e8] font-mono flex items-center gap-2 flex-wrap bg-[#00000044] p-2 rounded-lg">
              {Object.entries(craftedItem.stats).map(([k, v]) => {
                const baseV = (recipe.baseStats as Record<string, number>)[k] || 0;
                const diff = (v as number) - baseV;
                const diffPct = baseV > 0 ? Math.round((diff / baseV) * 100) : 0;
                const sign = diff >= 0 ? `+${diff}` : `${diff}`;
                const pctSign = diffPct >= 0 ? `+${diffPct}` : `${diffPct}`;
                const isGreat = diffPct >= 15;
                return (
                  <span key={k} className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${isGreat ? 'bg-[#ffd54f22] text-[#ffd54f]' : 'bg-[#ffffff15] text-[#38ef7d]'}`}>
                    {k.toUpperCase()} {v} ({sign} / {pctSign}%)
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex gap-2 pt-2 border-t border-[#1f2738]">
          <ActionButton
            label="닫기"
            variant="ghost"
            size="md"
            className="flex-1 font-bold"
            onClick={onClose}
          />
          <ActionButton
            label={canCraft ? '⚒️ 장비 단조 시작' : '재료 부족'}
            variant={canCraft ? 'success' : 'ghost'}
            size="md"
            className="flex-2 font-bold shadow-lg"
            disabled={!canCraft}
            onClick={handleCraft}
          />
        </div>

        <div ref={bottomRef} />
      </div>

      {/* 🌟 장비 단조 연출 모달 🌟 */}
      <CraftProgressModal
        open={isCrafting}
        type="forge"
        title="심연 장비 단조 공정"
        itemName={recipe.name}
        itemIcon={recipe.icon || '⚔️'}
        itemSub={slotBadge}
        durationMs={craftDurationMs}
        onComplete={handleCraftComplete}
      />
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
//  ⚒️ 마도 대장간 (레벨별 할인 & 3레벨 주기 해금 시스템)
// ─────────────────────────────────────────────────────────────
const ForgeDrawer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, gm } = useGameManager();
    const [mainTab, setMainTab] = useState<'craft' | 'supplies' | 'enhance' | 'enchant' | 'curse'>('craft');
  const [craftCategory, setCraftCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [enhanceCategory, setEnhanceCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [enchantCategory, setEnchantCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');

  const [selectedCraftRecipe, setSelectedCraftRecipe] = useState<EquipmentRecipe | null>(null);
  const [cleanseOutcome, setCleanseOutcome] = useState<{ type: 'success' | 'fail'; message: string; item?: EquipmentItem } | null>(null);
  const [selectedEnhanceItemId, setSelectedEnhanceItemId] = useState<string | null>(null);
  const [selectedEnchantItemId, setSelectedEnchantItemId] = useState<string | null>(null);

  // ✨ 침식 장비 신성 정화 연출 모달 상태
  const [isPurifying, setIsPurifying] = useState(false);
  const [purifyingItem, setPurifyingItem] = useState<EquipmentItem | null>(null);
  const [pendingPurifyOutcome, setPendingPurifyOutcome] = useState<'success' | 'drop'>('success');

  // ⏱️ 정화된 장비 5분 타이머 1초마다 실시간 갱신
  const [, setPurifyTimerTick] = useState(0);
  useEffect(() => {
    if (mainTab !== 'curse') return;
    const interval = setInterval(() => {
      gm.cleanExpiredPurifiedItems();
      setPurifyTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mainTab, gm]);

  const purifiedHistory = useMemo(() => {
    return gm.getPurifiedEquipmentHistory();
  }, [gm, state.equipmentInventory, mainTab]);

  const selectedEnhanceItem = useMemo(() => {
    if (!selectedEnhanceItemId) return null;
    return state.equipmentInventory.find(i => i.id === selectedEnhanceItemId) || null;
  }, [selectedEnhanceItemId, state.equipmentInventory]);

  const selectedEnchantItem = useMemo(() => {
    if (!selectedEnchantItemId) return null;
    return state.equipmentInventory.find(i => i.id === selectedEnchantItemId) || null;
  }, [selectedEnchantItemId, state.equipmentInventory]);

  const res = state.resources as unknown as Record<string, number>;

  // 🌟 공통 장비 정렬 헬퍼: 장착된 장비 최상단 배치 ➔ 이후 획득 순서대로 정렬
  const sortEquipByEquippedAndAcquisition = useCallback((items: EquipmentItem[]) => {
    const invOrderMap = new Map<string, number>();
    (state.equipmentInventory || []).forEach((item, idx) => {
      if (item?.id) invOrderMap.set(item.id, idx);
    });

    return [...items].sort((a, b) => {
      const aEquipped = Boolean(a.equippedHeroId);
      const bEquipped = Boolean(b.equippedHeroId);
      if (aEquipped !== bEquipped) {
        return aEquipped ? -1 : 1; // 장착된 장비가 가장 상단
      }
      return (invOrderMap.get(a.id) ?? 0) - (invOrderMap.get(b.id) ?? 0); // 이후 획득 순서대로
    });
  }, [state.equipmentInventory]);

  const cursedItems = useMemo(() => {
    return sortEquipByEquippedAndAcquisition(
      (state.equipmentInventory || []).filter(i => i.isCorrupted || i.isCursed || i.isUnpurified || i.name.startsWith('[침식된]'))
    );
  }, [state.equipmentInventory, sortEquipByEquippedAndAcquisition]);

  const forgeLv = state.buildings['blacksmith']?.level || 1;
  const discountPct = Math.min(50, forgeLv * 3);
  const mult = gm.getForgeDiscountMultiplier();
  const unlocks = gm.getForgeFeatureUnlocks();
  const rates = getForgeRarityRates(forgeLv);

  // 단조 레시피 카테고리 필터링 (병기창 레벨별 동적 레시피 반영)
  const currentRecipes = gm.getForgeRecipes();
  const filteredRecipes = currentRecipes.filter(r => {
    if (craftCategory === 'all') return true;
    return r.slot === craftCategory;
  });

  // 보유 장비 카테고리 필터링 (강화) - ID 중복 방지 및 장착 장비 상단 + 획득 순서 정렬
  const filteredInventory = useMemo(() => {
    const seen = new Set<string>();
    const list = (state.equipmentInventory || []).filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      if (enhanceCategory === 'all') return true;
      return item.slot === enhanceCategory;
    });
    return sortEquipByEquippedAndAcquisition(list);
  }, [state.equipmentInventory, enhanceCategory, sortEquipByEquippedAndAcquisition]);

  // 보유 장비 카테고리 필터링 (인챈트) - ID 중복 방지 및 장착 장비 상단 + 획득 순서 정렬
  const filteredEnchantInventory = useMemo(() => {
    const seen = new Set<string>();
    const list = (state.equipmentInventory || []).filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      if (enchantCategory === 'all') return true;
      return item.slot === enchantCategory;
    });
    return sortEquipByEquippedAndAcquisition(list);
  }, [state.equipmentInventory, enchantCategory, sortEquipByEquippedAndAcquisition]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">⚒️</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#00d2ff]">{'병기창 대장간'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                Lv.{forgeLv}
              </span>
              <EncyclopediaBadge tab="equipment" label="병기창 백과" />
            </div>
            <div className="text-[10px] text-[#38ef7d]">
              ✨ {`건물 특전: 소모 자원/가격 -${discountPct}% 할인 적용중`}
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onBack}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* 대분류 탭 (5개 탭 연동) */}
      <div className="grid grid-cols-5 gap-1 p-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        <button
          className={`btn py-1.5 text-[11px] font-bold transition-all ${mainTab === 'craft' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMainTab('craft')}
        >
          ⚒️ {'단조'}
        </button>
        <button
          className={`btn py-1.5 text-[11px] font-bold transition-all ${mainTab === 'supplies' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMainTab('supplies')}
        >
          📦 {'보급품'}
        </button>
        <button
          className={`btn py-1.5 text-[11px] font-bold transition-all ${
            mainTab === 'enhance' ? 'btn-primary' : unlocks.enhance.unlocked ? 'btn-ghost' : 'btn-ghost opacity-50'
          }`}
          onClick={() => setMainTab('enhance')}
        >
          {unlocks.enhance.unlocked ? ('⚡ 강화') : '🔒 Lv.3'}
        </button>
        <button
          className={`btn py-1.5 text-[11px] font-bold transition-all ${
            mainTab === 'enchant' ? 'btn-primary' : unlocks.enchant.unlocked ? 'btn-ghost' : 'btn-ghost opacity-50'
          }`}
          onClick={() => setMainTab('enchant')}
        >
          {unlocks.enchant.unlocked ? ('✨ 인챈트') : '🔒 Lv.6'}
        </button>
        <button
          className={`btn py-1.5 text-[11px] font-bold transition-all relative ${
            mainTab === 'curse' ? 'btn-primary' : unlocks.curse.unlocked ? 'btn-ghost' : 'btn-ghost opacity-50'
          }`}
          onClick={() => setMainTab('curse')}
        >
          {unlocks.curse.unlocked ? ('✨ 정화') : '🔒 Lv.1'}
          {unlocks.curse.unlocked && cursedItems.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ef5350] animate-pulse" />
          )}
        </button>
      </div>

      {/* ── 1. ⚒️ 장비 단조 탭 (기본 해금) ── */}
      {mainTab === 'craft' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* 소분류 카테고리 칩 바 */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121724] border-b border-[#1f2738] shrink-0">
            {[
              { key: 'all', label: '전체 (12)', icon: '📦' },
              { key: 'weapon', label: '무기 (6)', icon: '🗡️' },
              { key: 'armor', label: '방어구 (3)', icon: '🛡️' },
              { key: 'accessory', label: '장신구 (3)', icon: '💍' },
            ].map(cat => (
              <button
                key={cat.key}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  craftCategory === cat.key
                    ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739] shadow-md shadow-[#42321955]' : 'bg-[#182030] text-[#8b9bb4] hover:text-white border border-[#26334a]'
                }`}
                onClick={() => setCraftCategory(cat.key as any)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 레시피 카드 목록 */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
            {filteredRecipes.map(recipe => {
              const suitableText = getSuitableClassesText(recipe.id, recipe.slot);
              const recipeName = recipe.name;

              const slotBadge = recipe.slot === 'weapon'
                ? ('🗡️ 무기')
                : recipe.slot === 'armor'
                ? ('🛡️ 방어구')
                : ('💍 장신구');

              return (
                <div
                  key={recipe.id}
                  className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl hover:border-[#00d2ff66] transition-all flex flex-col gap-2 cursor-pointer"
                  onClick={() => setSelectedCraftRecipe(recipe)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 rounded-xl bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-md">
                        <GameIcon name={recipe.templateId || getEquipmentTemplateId(recipe as any) || recipe.id} icon={recipe.icon} size={32} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">{recipeName}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                            style={{
                              backgroundColor: `${getRarityColor(recipe.rarity)}22`,
                              color: getRarityColor(recipe.rarity),
                              border: `1px solid ${getRarityColor(recipe.rarity)}44`
                            }}
                          >
                            [{getRarityLabel(recipe.rarity)}]
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold shrink-0">
                            {slotBadge}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] font-mono border border-[#ffd54f33] shrink-0">
                            최대: {rates.maxRarity === 'legendary' ? '전설' : rates.maxRarity === 'epic' ? '영웅' : rates.maxRarity === 'rare' ? '희귀' : '일반'}
                          </span>
                          {recipe.slot === 'weapon' && (() => {
                            const wt = recipe.weaponTrait || getWeaponTrait(recipe);
                            if (!wt) return null;
                            return (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 animate-pulse"
                                style={{
                                  backgroundColor: wt.bgColor,
                                  color: wt.color,
                                  border: `1px solid ${wt.color}66`
                                }}
                                title={`${wt.name}: ${wt.description}`}
                              >
                                {wt.badge}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[10px] text-[#38ef7d] mt-0.5 font-medium truncate">
                          🎯 {suitableText}
                        </div>
                      </div>
                    </div>

                    <ActionButton
                      label={'단조 상세'}
                      variant="primary"
                      size="sm"
                      className="px-3 py-1 font-bold shadow text-xs shrink-0"
                      onClick={() => setSelectedCraftRecipe(recipe)}
                    />
                  </div>

                  {/* 기본 스탯 칩 목록 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(recipe.baseStats).map(([k, v]) => {
                      const statLabels: Record<string, { label: string; icon: string; color: string }> = {
                        atk: { label: '공격력', icon: '⚔️', color: '#ff8a65' },
                        def: { label: '방어력', icon: '🛡️', color: '#4fc3f7' },
                        hp: { label: 'HP', icon: '❤️', color: '#81c784' },
                        mp: { label: 'MP', icon: '💧', color: '#64b5f6' },
                        spd: { label: '속도', icon: '⚡', color: '#ffd54f' },
                        luck: { label: '행운', icon: '🍀', color: '#a7ffeb' }
                      };
                      const s = statLabels[k] || { label: k.toUpperCase(), icon: '✨', color: '#ffd54f' };
                      return (
                        <span
                          key={k}
                          className="text-[11px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: `${s.color}18`,
                            color: s.color,
                            border: `1px solid ${s.color}44`
                          }}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                          <span>+{String(v)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. 📦 원정 보급품 사전 제작 탭 ── */}
      {mainTab === 'supplies' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 overflow-y-auto gap-3">
          {forgeLv >= 6 ? (
            /* 🌟 병기창 Lv.6+ : 강화 보급품 7종이 일반 보급품을 완전히 대체 */
            <>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#171f33] to-[#251833] border border-[#ffd54f55] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                    <span>✨📦</span>
                    <span>성채 특수 강화 보급품 제작소 (병기창 Lv.6+ 전면 대체)</span>
                    <EncyclopediaBadge query="보급품" tab="systems" label="보급품 백과" compact />
                  </div>
                  <div className="text-[11px] text-[#cfd8e8] mt-0.5 leading-relaxed">
                    병기창 Lv.6 특화로 일반 보급품이 <strong className="text-[#38ef7d]">7종의 강화 보급품으로 전면 대체</strong>되었습니다! 제작된 강화품은 창고에 적재되며 채비 시 최우선 불출됩니다.
                    <span className="text-[#ffd54f] block text-[10px] mt-0.5">※ 채비실에서 즉석 추가하는 보급품은 일반 보급품이므로 항상 미리 생산해두어야 합니다.</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-xs text-[#38ef7d] font-bold px-2 py-0.5 rounded bg-[#38ef7d15] border border-[#38ef7d33]">
                    대장간 특전 -{discountPct}%
                  </span>
                  <span className="text-[10px] text-[#ffd54f] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ffd54f22] border border-[#ffd54f44]">
                    강화 보급품 전면 가동
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  {
                    key: 'enhanced_torch', label: '에테르 횃불', icon: '✨🔥', desc: '이벤트 발견율 +20%, 기습 억제 -20%, 위험도 축적 2배 (심연 고속 돌파)',
                    baseCosts: { gold: 240, wood: 6, coal: 6 }
                  },
                  {
                    key: 'enhanced_food', label: '던전 도시락', icon: '🍱', desc: '야영 시 마물 기습 위험 50% 억제 & 추가 회복량 +10% (HP/MP 45% 회복)',
                    baseCosts: { gold: 240, food: 12 }
                  },
                  {
                    key: 'enhanced_pickaxe', label: '심연 곡괭이', icon: '⛏️✨', desc: '광맥 채굴량 2배 (골드/광석 4배 수급), 비밀 숏컷 개척 시 위험도 -50 대폭 감소',
                    baseCosts: { gold: 300, stone: 18, wood: 3 }
                  },
                  {
                    key: 'enhanced_bandage', label: '성유 붕대', icon: '🩹✨', desc: '야영 시 모든 디버프 정화 + 3턴간 [디버프 면역] 결계 부여',
                    baseCosts: { gold: 270, herb: 6, leather: 3 }
                  },
                  {
                    key: 'enhanced_holy_water', label: '여신의 성수', icon: '💧✨', desc: '타락 제단 봉헌 시 전원 HP 30%/MP 40% 회복 + 모든 디버프 해제',
                    baseCosts: { gold: 360, herb: 6, ether: 60 }
                  },
                  {
                    key: 'enhanced_key', label: '황금 열쇠', icon: '🗝️✨', desc: '잠긴 상자/석관 100% 안전 개방 + 저주받은 장비 획득 확률 +50% 추가',
                    baseCosts: { gold: 300, iron: 20, stone: 12 }
                  },
                  {
                    key: 'enhanced_rift_anchor', label: '심연의 닻', icon: '⚓✨', desc: '긴급 이송 시간 2턴 단축(2턴) & 성채 귀환 시 배낭 물품 분실 확률 차단(손실 0%)',
                    baseCosts: { gold: 720, stone: 12, ether: 50 }
                  },
                ].map(sup => {
                  const inStock = gm.citadelSupplies?.[sup.key] || 0;
                  const cost1: Record<string, number> = {};
                  const cost5: Record<string, number> = {};
                  Object.entries(sup.baseCosts).forEach(([r, c]) => {
                    cost1[r] = Math.max(1, Math.floor(c * mult));
                    cost5[r] = Math.max(1, Math.floor(c * mult * 5));
                  });

                  const canAfford1 = Object.entries(cost1).every(([r, c]) => (res[r] || 0) >= c);
                  const canAfford5 = Object.entries(cost5).every(([r, c]) => (res[r] || 0) >= c);

                  const handleCraft = (qty: number, costObj: Record<string, number>) => {
                    Object.entries(costObj).forEach(([r, c]) => {
                      gm.modifyResource(r as keyof typeof state.resources, -c);
                    });
                    gm.addCitadelSupply(sup.key, qty);
                    if (sup.key === 'enhanced_torch' && qty > 0) {
                      gm.updateQuestObjective('Q_ENHANCED_SUPPLY_TORCH', 0, 1);
                    }
                    gm.addLog(`⚒️✨ [병기창 강화제작] ${sup.icon} ${sup.label} +${qty}개를 제작하여 성채 창고에 적재했습니다.`, 'reward');
                    SoundManager.getInstance().play('anvil');
                  };

                  return (
                    <div key={sup.key} className="panel p-3 bg-[#161426] border border-[#ffd54f33] rounded-xl hover:border-[#ffd54f88] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 rounded-lg bg-[#241a38] border border-[#3f2e5a] flex items-center justify-center shrink-0 w-10 h-10">
                            <GameIcon name={sup.key} icon={sup.icon} size={26} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#ffd54f]">{sup.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                                창고 재고 {inStock}개
                              </span>
                            </div>
                            <div className="text-[10px] text-[#cfd8e8] mt-0.5">{sup.desc}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#2a223d] flex-wrap gap-2">
                        <div className="text-xs text-[#ffd54f] flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#8b9bb4]">소모/재고:</span>
                          {Object.entries(cost1).map(([r, c]) => {
                            const cur = res[r] || 0;
                            const ok = cur >= c;
                            const meta = RES_NAMES_AND_ICONS[r] || GameManager.getResourceMeta(r) || { label: r, icon: '📦' };
                            const label = ('label' in meta ? meta.label : (meta as any).name) || r;
                            return (
                              <span
                                key={r}
                                className={`font-mono text-xs px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
                                  ok ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d33]' : 'bg-[#ef535015] text-[#ef5350] border-[#ef535033]'
                                }`}
                              >
                                <span>{meta.icon}</span>
                                <span>{label}</span>
                                <span>{c}/{cur}</span>
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            className={`btn text-xs px-3 py-1 font-bold ${canAfford1 ? 'btn-primary' : 'btn-ghost opacity-40'}`}
                            disabled={!canAfford1}
                            onClick={() => handleCraft(1, cost1)}
                          >
                            1개 제작
                          </button>
                          <button
                            className={`btn text-xs px-3 py-1 font-bold ${canAfford5 ? 'btn-success' : 'btn-ghost opacity-40'}`}
                            disabled={!canAfford5}
                            onClick={() => handleCraft(5, cost5)}
                          >
                            5개 일괄
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* 📦 병기창 Lv.1~5 : 일반 보급품 7종 제작 + 하단에 강화 보급품 잠금 안내 */
            <>
              <div className="p-3 rounded-xl bg-[#121826] border border-[#1f2738] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#00d2ff] flex items-center gap-1.5">
                    <span>📦</span>
                    <span>성채 원정 보급품 사전 제작소</span>
                    <EncyclopediaBadge query="보급품" tab="systems" label="보급품 백과" compact />
                  </div>
                  <div className="text-[11px] text-[#8b9bb4] mt-0.5">
                    제작된 소모품은 창고에 적재되며, 탐험 채비 시 무료로 우선 불출됩니다.
                  </div>
                </div>
                <span className="text-xs text-[#38ef7d] font-bold px-2 py-1 rounded bg-[#38ef7d15] border border-[#38ef7d33]">
                  대장간 특전 -{discountPct}%
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  {
                    key: 'torch', label: '탐험 횃불', icon: '🔥', desc: '심연 시야 확보 & 기습 방지',
                    baseCosts: { gold: 40, wood: 2, coal: 2 }
                  },
                  {
                    key: 'food', label: '던전 식량', icon: '🍖', desc: '야영 시 파티 체력/마나 회복',
                    baseCosts: { gold: 40, food: 4 }
                  },
                  {
                    key: 'pickaxe', label: '채굴 곡괭이', icon: '⛏️', desc: '광맥 채굴 시 2배 자원 획득 (귀환 보존)',
                    baseCosts: { gold: 50, stone: 6, wood: 1 }
                  },
                  {
                    key: 'bandage', label: '치유 붕대', icon: '🩹', desc: '야영 시 모든 디버프 정화 (귀환 보존)',
                    baseCosts: { gold: 45, herb: 1, leather: 1 }
                  },
                  {
                    key: 'holy_water', label: '정화의 성수', icon: '💧', desc: '저주 제단 정화 시 전원 HP/MP 50% 회복 + 디버프 해제 + 면역 3턴 (귀환 보존)',
                    baseCosts: { gold: 60, herb: 2, ether: 5 }
                  },
                  {
                    key: 'key', label: '던전 열쇠', icon: '🗝️', desc: '잠긴 상자/석관 100% 안전 개방 (귀환 보존)',
                    baseCosts: { gold: 50, iron: 2, stone: 4 }
                  },
                  {
                    key: 'rift_anchor', label: '균열의 닻', icon: '⚓', desc: '탐험 중 언제든 즉시 안전 귀환 (귀환 보존)',
                    baseCosts: { gold: 120, stone: 4, ether: 5 }
                  },
                ].map(sup => {
                  const inStock = gm.citadelSupplies?.[sup.key] || 0;
                  const cost1: Record<string, number> = {};
                  const cost5: Record<string, number> = {};
                  Object.entries(sup.baseCosts).forEach(([r, c]) => {
                    cost1[r] = Math.max(1, Math.floor(c * mult));
                    cost5[r] = Math.max(1, Math.floor(c * mult * 5));
                  });

                  const canAfford1 = Object.entries(cost1).every(([r, c]) => (res[r] || 0) >= c);
                  const canAfford5 = Object.entries(cost5).every(([r, c]) => (res[r] || 0) >= c);

                  const handleCraft = (qty: number, costObj: Record<string, number>) => {
                    Object.entries(costObj).forEach(([r, c]) => {
                      gm.modifyResource(r as keyof typeof state.resources, -c);
                    });
                    gm.addCitadelSupply(sup.key, qty);
                    gm.addLog(`⚒️ [병기창 제작] ${sup.icon} ${sup.label} +${qty}개를 제작하여 성채 창고에 적재했습니다.`, 'reward');
                    SoundManager.getInstance().play('anvil');
                  };

                  return (
                    <div key={sup.key} className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl hover:border-[#00d2ff66] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 rounded-lg bg-[#1a2234] border border-[#2b3952] flex items-center justify-center shrink-0 w-10 h-10">
                            <GameIcon name={sup.key} icon={sup.icon} size={26} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{sup.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                                창고 재고 {inStock}개
                              </span>
                            </div>
                            <div className="text-[10px] text-[#8b9bb4] mt-0.5">{sup.desc}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#1f2738] flex-wrap gap-2">
                        <div className="text-xs text-[#ffd54f] flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#8b9bb4]">소모/재고:</span>
                          {Object.entries(cost1).map(([r, c]) => {
                            const cur = res[r] || 0;
                            const ok = cur >= c;
                            const meta = RES_NAMES_AND_ICONS[r] || GameManager.getResourceMeta(r) || { label: r, icon: '📦' };
                            const label = ('label' in meta ? meta.label : (meta as any).name) || r;
                            return (
                              <span
                                key={r}
                                className={`font-mono text-xs px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
                                  ok ? 'bg-[#38ef7d15] text-[#38ef7d] border-[#38ef7d33]' : 'bg-[#ef535015] text-[#ef5350] border-[#ef535033]'
                                }`}
                              >
                                <span>{meta.icon}</span>
                                <span>{label}</span>
                                <span>{c}/{cur}</span>
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            className={`btn text-xs px-3 py-1 font-bold ${canAfford1 ? 'btn-primary' : 'btn-ghost opacity-40'}`}
                            disabled={!canAfford1}
                            onClick={() => handleCraft(1, cost1)}
                          >
                            1개 제작
                          </button>
                          <button
                            className={`btn text-xs px-3 py-1 font-bold ${canAfford5 ? 'btn-success' : 'btn-ghost opacity-40'}`}
                            disabled={!canAfford5}
                            onClick={() => handleCraft(5, cost5)}
                          >
                            5개 일괄
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 강화된 특수 보급품 잠금 배너 */}
              <div className="p-3.5 rounded-xl border border-[#2a3854] bg-[#0c101a] flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-lg bg-[#141b2b] border border-[#232f48]">🔒</span>
                  <div>
                    <div className="font-bold text-xs text-[#ffd54f]">강화된 특수 보급품 (7종) 잠금</div>
                    <div className="text-[10px] text-[#8b9bb4] mt-0.5 leading-relaxed">
                      병기창을 <strong className="text-[#00d2ff]">Lv.6</strong> 이상으로 증축하면 일반 보급품이 7종의 강화 보급품(에테르 횃불, 던전 도시락, 심연 곡괭이 등)으로 <strong className="text-[#ffd54f]">전면 대체 제작</strong>됩니다.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#2a1b10] text-[#ffd54f] border border-[#ffd54f44] shrink-0 font-bold">
                  현재 Lv.{forgeLv}/6
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 3. ⚡ 장비 강화 탭 (Lv.3 해금) ── */}
      {mainTab === 'enhance' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!unlocks.enhance.unlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="text-5xl">🔒</span>
              <div className="font-bold text-base text-[#ffd54f]">마도 대장간 Lv.3 필요</div>
              <div className="text-xs text-[#8b9bb4] max-w-[280px] leading-relaxed">
                장비 강화 시설은 대장간을 <span className="text-[#00d2ff] font-bold">Lv.3</span> 이상으로 증축하면 해금됩니다.
                <br />(현재 대장간: Lv.{forgeLv})
              </div>
            </div>
          ) : (
            <>
              {/* 강화 안내 배너 */}
              <div className="px-3 py-1.5 bg-[#161224] border-b border-[#1f2738] text-[10px] text-[#cfd8dc] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span>💡 <span className="text-[#38ef7d] font-bold">+0~+3강</span>: 안전 | <span className="text-[#00d2ff] font-bold">최대 +{GameManager.getForgeMaxEnhanceLevel(forgeLv)}강</span></span>
                  <EncyclopediaBadge query="강화" tab="systems" label="강화 백과" compact />
                </div>
                <span className="text-[#ffd54f] font-bold">특전 -{discountPct}%</span>
              </div>

              {/* 분류 칩 바 */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121724] border-b border-[#1f2738] shrink-0">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'weapon', label: '🗡️ 무기' },
                  { key: 'armor', label: '🛡️ 방어구' },
                  { key: 'accessory', label: '💍 장신구' },
                ].map(cat => (
                  <button
                    key={cat.key}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      enhanceCategory === cat.key
                        ? 'bg-[#ffd54f] text-[#000] shadow' : 'bg-[#182030] text-[#8b9bb4] border border-[#26334a]'
                    }`}
                    onClick={() => setEnhanceCategory(cat.key as any)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                {filteredInventory.length === 0 ? (
                  <div className="panel p-8 text-center text-sm text-[#8b9bb4]">
                    보유 중인 해당 분류의 장비가 없습니다.<br />
                    <span className="text-xs text-[#607d8b] mt-1 block">[단조] 탭에서 새로운 장비를 제작하세요.</span>
                  </div>
                ) : (
                  filteredInventory.map(item => {
                    const wearer = item.equippedHeroId ? state.barracks.find(h => h.id === item.equippedHeroId) : null;
                    const isUnique = item.rarity === 'unique' || item.id.startsWith('boss_') || item.id.includes('unique');
                    const rarityMeta = {
                      common:    { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' },
                      rare:      { label: '희귀', color: '#42a5f5', bg: '#42a5f522' },
                      epic:      { label: '에픽', color: '#ce93d8', bg: '#ce93d822' },
                      unique:    { label: '고유', color: '#ffb74d', bg: '#ff980022' },
                      legendary: { label: '전설', color: '#ffd54f', bg: '#ffd54f22' },
                    }[item.rarity || 'common'] || { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' };

                    return (
                      <div
                        key={item.id}
                        className="panel p-2.5 flex flex-col gap-1.5 cursor-pointer transition-all hover:border-[#ffd54f88] hover:bg-[#162032] border-[#222d42] bg-[#131926]"
                        onClick={() => setSelectedEnhanceItemId(item.id)}
                      >
                        {/* 1행: 아이콘 + 이름 + (+강화강) + [등급 뱃지] + [인챈트 아이콘] + [착용자 뱃지] */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="p-1 rounded-md bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center">
                              <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={22} />
                            </span>
                            <span
                              className={`font-bold ${item.name.length >= 15 ? 'text-xs' : 'text-sm'} text-white truncate max-w-[170px] sm:max-w-[220px]`}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs text-[#ffd54f] font-mono shrink-0">(+{item.level}/10강)</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                color: isUnique ? '#ffb74d' : rarityMeta.color,
                                backgroundColor: isUnique ? '#ff980022' : rarityMeta.bg,
                                border: `1px solid ${isUnique ? '#ff980055' : `${rarityMeta.color}44`}`
                              }}
                            >
                              {isUnique ? '👑 고유/보스' : `[${rarityMeta.label}]`}
                            </span>
                            {(item.prefix || item.suffix) && (
                              <span className="text-[10px] flex items-center gap-0.5 ml-0.5">
                                {item.prefix && <span title={`접두사: ${item.prefix.name}`}>✨</span>}
                                {item.suffix && <span title={`접미사: ${item.suffix.name}`}>🔮</span>}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {wearer ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                                👤 {wearer.name}
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                                보관함
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2행: 종합 스탯 요약 수치 */}
                        <div className="pt-0.5">
                          {renderTotalStats(item.stats)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 4. ✨ 마도 인챈트 탭 (Lv.6 해금) ── */}
      {mainTab === 'enchant' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!unlocks.enchant.unlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="text-5xl">🔒</span>
              <div className="font-bold text-base text-[#ce93d8]">마도 대장간 Lv.6 필요</div>
              <div className="text-xs text-[#8b9bb4] max-w-[280px] leading-relaxed">
                고급 마도 인챈트 공방은 대장간을 <span className="text-[#ce93d8] font-bold">Lv.6</span> 이상으로 증축하면 해금됩니다.
                <br />(현재 대장간: Lv.{forgeLv})
              </div>
            </div>
          ) : (
            <>
              {/* 분류 칩 바 */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121724] border-b border-[#1f2738] shrink-0">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'weapon', label: '🗡️ 무기' },
                  { key: 'armor', label: '🛡️ 방어구' },
                  { key: 'accessory', label: '💍 장신구' },
                ].map(cat => (
                  <button
                    key={cat.key}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      enchantCategory === cat.key
                        ? 'bg-[#ce93d8] text-[#000] shadow' : 'bg-[#182030] text-[#8b9bb4] border border-[#26334a]'
                    }`}
                    onClick={() => setEnchantCategory(cat.key as any)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                <div className="panel-accent p-3 bg-[#161224] border border-[#ce93d844]">
                  <div className="text-xs text-[#ffd54f] font-bold">✨ 접두석: {res.prefix_stone || 0}개 | 🔮 접미석: {res.suffix_stone || 0}개</div>
                  <div className="text-[11px] text-[#ce93d8] mt-0.5">⭐ 순수 접두석: {res.pure_prefix_stone || 0}개 | 🌌 순수 접미석: {res.pure_suffix_stone || 0}개</div>
                  <div className="text-[10px] text-[#8b9bb4] mt-1">💡 +3강 이상 접두어 인챈트 / +7강 이상 접미어 인챈트 해금 (인챈트 비용 -{discountPct}% 할인)</div>
                </div>

                {filteredEnchantInventory.length === 0 ? (
                  <div className="panel p-8 text-center text-sm text-[#8b9bb4]">
                    보유 중인 해당 분류의 장비가 없습니다.<br />
                    <span className="text-xs text-[#607d8b] mt-1 block">[단조] 탭에서 새로운 장비를 제작하거나 획득하세요.</span>
                  </div>
                ) : (
                  filteredEnchantInventory.map(item => {
                    const canPrefix = item.level >= 3;
                    const canSuffix = item.level >= 7;
                    const wearer = item.equippedHeroId ? state.barracks.find(h => h.id === item.equippedHeroId) : null;
                    const isUnique = item.rarity === 'unique' || item.id.startsWith('boss_') || item.id.includes('unique');
                    const rarityMeta = {
                      common:    { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' },
                      rare:      { label: '희귀', color: '#42a5f5', bg: '#42a5f522' },
                      epic:      { label: '에픽', color: '#ce93d8', bg: '#ce93d822' },
                      unique:    { label: '고유', color: '#ffb74d', bg: '#ff980022' },
                      legendary: { label: '전설', color: '#ffd54f', bg: '#ffd54f22' },
                    }[item.rarity || 'common'] || { label: '일반', color: '#9e9e9e', bg: '#9e9e9e22' };

                    return (
                      <div
                        key={item.id}
                        className="panel p-2.5 flex flex-col gap-1.5 cursor-pointer transition-all hover:border-[#ce93d888] hover:bg-[#1a1528] border-[#222d42] bg-[#131926]"
                        onClick={() => setSelectedEnchantItemId(item.id)}
                      >
                        {/* 1행: 아이콘 + 이름 + (+강화강) + [등급 뱃지] + [인챈트 아이콘] + [착용자 뱃지] */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="p-1 rounded-md bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center">
                              <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={22} />
                            </span>
                            <span
                              className={`font-bold ${item.name.length >= 15 ? 'text-xs' : 'text-sm'} text-white truncate max-w-[170px] sm:max-w-[220px]`}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs text-[#ffd54f] font-mono shrink-0">(+{item.level}강)</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                color: isUnique ? '#ffb74d' : rarityMeta.color,
                                backgroundColor: isUnique ? '#ff980022' : rarityMeta.bg,
                                border: `1px solid ${isUnique ? '#ff980055' : `${rarityMeta.color}44`}`
                              }}
                            >
                              {isUnique ? '👑 고유/보스' : `[${rarityMeta.label}]`}
                            </span>
                            {(item.prefix || item.suffix) && (
                              <span className="text-[10px] flex items-center gap-0.5 ml-0.5">
                                {item.prefix && <span title={`접두사: ${item.prefix.name}`}>✨</span>}
                                {item.suffix && <span title={`접미사: ${item.suffix.name}`}>🔮</span>}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {wearer ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                                👤 {wearer.name}
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4]">
                                보관함
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2행: 종합 스탯 요약 수치 및 인챈트 가능/부여 상태 */}
                        <div className="pt-0.5 flex items-center justify-between gap-1 flex-wrap">
                          {renderTotalStats(item.stats)}
                          <div className="text-[9px] font-mono flex items-center gap-1.5">
                            <span className={item.prefix ? 'text-[#ffd54f] font-bold' : canPrefix ? 'text-[#38ef7d]' : 'text-[#607d8b]'}>
                              {item.prefix ? `✨${item.prefix.name}` : canPrefix ? '✨접두가능' : '🔒+3강'}
                            </span>
                            <span className={item.suffix ? 'text-[#00d2ff] font-bold' : canSuffix ? 'text-[#38ef7d]' : 'text-[#607d8b]'}>
                              {item.suffix ? `🔮${item.suffix.name}` : canSuffix ? '🔮접미가능' : '🔒+7강'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 5. ✨ 침식 장비 정화 탭 (Lv.1 해금) ── */}
      {mainTab === 'curse' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!unlocks.curse.unlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="text-5xl">🔒</span>
              <div className="font-bold text-base text-[#ef5350]">병기창 건설 필요</div>
              <div className="text-xs text-[#8b9bb4] max-w-[280px] leading-relaxed">
                심연의 침식 장비 정화 제단은 대장간(병기창)을 건설하면 즉시 이용할 수 있습니다.
                <br />(현재 대장간: Lv.{forgeLv})
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="panel-accent p-3 bg-[#131b26] border border-[#00d2ff44] rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#00d2ff] font-bold flex items-center gap-1.5">
                    <span>✨</span>
                    <span>심연 침식 장비 정화 제단</span>
                    <EncyclopediaBadge query="정화" tab="systems" label="정화 백과" compact />
                  </span>
                  <span className="text-[10px] text-[#38ef7d] bg-[#38ef7d1f] px-2 py-0.5 rounded font-bold border border-[#38ef7d44]">
                    성공률 {gm.getPurifySuccessRate()}% (기본 30% + Lv.{forgeLv} 효과 +{forgeLv * 5}%)
                  </span>
                </div>
                <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                  던전에서 발굴된 [침식된] 장비의 마기를 정화하여 순정 상태로 복원합니다. 정화 시 단조 공정과 동일하게 기본 베이스 스탯의 <strong className="text-[#38ef7d]">±30% 랜덤 스탯 조정</strong>이 적용됩니다.
                </div>
                <div className="text-[10px] text-[#8b9bb4] pt-1 border-t border-[#00d2ff22] flex items-center justify-between">
                  <span>정화 1회 비용 (-{discountPct}% 할인 적용)</span>
                  <span className="font-mono text-white">🪙 {Math.max(1, Math.floor(100 * mult))}/{state.resources.gold || 0}G + ✨ {Math.max(1, Math.floor(5 * mult))}/{state.resources.ether || 0}</span>
                </div>
              </div>

              {/* 정화 결과 알림 배너 */}
              {cleanseOutcome && (
                <div className={`p-3 rounded-xl border flex flex-col gap-2 animate-fade-in ${
                  cleanseOutcome.type === 'success' 
                    ? 'bg-[#122416] border-[#38ef7d88] text-[#38ef7d]' 
                    : 'bg-[#261316] border-[#ef535088] text-[#ef5350]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <span>{cleanseOutcome.type === 'success' ? '🎉' : '💀'}</span>
                      <span>{cleanseOutcome.type === 'success' ? '신성 정화 성공! (순정 복원 완료)' : '정화 실패 (침식 폭주로 장비 파괴)'}</span>
                    </span>
                    <button className="text-xs px-1.5 py-0.5 rounded hover:bg-white/10 text-white cursor-pointer" onClick={() => setCleanseOutcome(null)}>✕</button>
                  </div>
                  <div className="text-xs text-white leading-relaxed">{cleanseOutcome.message}</div>
                  {cleanseOutcome.item && (
                    <div className="p-2.5 rounded-lg bg-black/50 border border-[#38ef7d44] flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        <GameIcon name={cleanseOutcome.item.templateId || getEquipmentTemplateId(cleanseOutcome.item) || cleanseOutcome.item.id} icon={cleanseOutcome.item.icon} size={24} />
                        <span className="font-bold text-white text-xs">{cleanseOutcome.item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold" style={{ color: getRarityColor(cleanseOutcome.item.rarity), backgroundColor: `${getRarityColor(cleanseOutcome.item.rarity)}22` }}>
                          [{getRarityLabel(cleanseOutcome.item.rarity)}]
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                        {Object.entries(cleanseOutcome.item.stats).map(([k, v]) => {
                          const baseV = (cleanseOutcome.item?.baseStats as Record<string, number>)?.[k] || 0;
                          const diff = baseV > 0 ? (v as number) - baseV : 0;
                          const diffPct = baseV > 0 ? Math.round((diff / baseV) * 100) : 0;
                          const sign = diff >= 0 ? `+${diff}` : `${diff}`;
                          const pctSign = diffPct >= 0 ? `+${diffPct}` : `${diffPct}`;
                          return (
                            <span key={k} className="px-1.5 py-0.5 bg-white/10 rounded font-bold text-[#ffd54f]">
                              {k.toUpperCase()} {v} ({sign} / {pctSign}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✨ 5분간 유지되는 최근 정화 완료 장비 목록 */}
              {purifiedHistory.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0e1f18] border border-[#10b98166] flex flex-col gap-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#38ef7d] flex items-center gap-1.5">
                      <span>✨</span>
                      <span>최근 정화 완료 장비 ({purifiedHistory.length}개)</span>
                    </span>
                    <span className="text-[10px] text-[#a7f3d0] bg-[#10b98122] px-2 py-0.5 rounded border border-[#10b98144] font-mono">
                      정화 후 5분간 유지
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {purifiedHistory.map(({ item, remainingSec }) => {
                      const m = Math.floor(remainingSec / 60);
                      const s = remainingSec % 60;
                      const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
                      const rarityColor = getRarityColor(item.rarity);
                      const isUnique = item.rarity === 'unique' || item.id.startsWith('boss_') || item.id.includes('unique');

                      return (
                        <div key={item.id} className="p-2.5 rounded-lg bg-[#08140f] border border-[#10b98133] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-[#12241b] border border-[#10b98144] shrink-0">
                                <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={22} />
                              </span>
                              <div>
                                <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold" style={{ color: isUnique ? '#ffb74d' : rarityColor, backgroundColor: `${isUnique ? '#ff9800' : rarityColor}22` }}>
                                    [{getRarityLabel(item.rarity)}]
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#6ee7b7]">{item.slot === 'weapon' ? '무기' : item.slot === 'armor' ? '방어구' : '장신구'}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#10b98125] text-[#34d399] border border-[#10b98144] shrink-0 flex items-center gap-1">
                              <span>⏱️</span>
                              <span>{timeStr} 남음</span>
                            </span>
                          </div>

                          {/* 정화 복원 스탯 배너 */}
                          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                            {Object.entries(item.stats || {}).map(([k, v]) => {
                              const baseV = (item.baseStats as Record<string, number>)?.[k] || 0;
                              const diff = baseV > 0 ? (v as number) - baseV : 0;
                              const diffPct = baseV > 0 ? Math.round((diff / baseV) * 100) : 0;
                              const sign = diff >= 0 ? `+${diff}` : `${diff}`;
                              const pctSign = diffPct >= 0 ? `+${diffPct}` : `${diffPct}`;
                              return (
                                <span key={k} className="px-1.5 py-0.5 bg-black/50 rounded font-bold text-[#ffd54f] border border-[#ffd54f33]">
                                  {k.toUpperCase()} {v} {baseV > 0 && `(${sign} / ${pctSign}%)`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {cursedItems.length === 0 ? (
                <div className="panel p-8 text-center text-sm text-[#8b9bb4]">
                  보유 중인 [침식된] 장비가 없습니다.<br />
                  <span className="text-xs text-[#607d8b] mt-1 block">던전 탐험, 보물상자 및 마물 토벌 시 드랍되는 장비를 수집하세요.</span>
                </div>
              ) : (
                cursedItems.map(item => {
                  const reqGold = Math.max(1, Math.floor(100 * mult));
                  const reqEther = Math.max(1, Math.floor(5 * mult));
                  const canCleanse = (state.resources.gold || 0) >= reqGold && (state.resources.ether || 0) >= reqEther;
                  const baseStats = item.baseStats && Object.keys(item.baseStats).length > 0 ? item.baseStats : item.stats;
                  const purifyRate = gm.getPurifySuccessRate();

                  return (
                    <div key={item.id} className="panel p-3 border border-[#ef535066] bg-[#14121a] rounded-xl flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#241316] border border-[#ef535044] flex items-center justify-center shrink-0">
                            <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={28} />
                          </span>
                          <div>
                            <div className="font-bold text-sm text-[#ef5350] flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold" style={{ color: getRarityColor(item.rarity), backgroundColor: `${getRarityColor(item.rarity)}22` }}>
                                [{getRarityLabel(item.rarity)}]
                              </span>
                            </div>
                            <div className="text-[10px] text-[#8b9bb4]">{item.slot === 'weapon' ? '무기' : item.slot === 'armor' ? '방어구' : '장신구'}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535044] shrink-0">
                          💀 착용 불가 (침식 상태)
                        </span>
                      </div>

                      <div className="text-[11px] text-[#ef5350] bg-[#ef535015] p-2 rounded-lg border border-[#ef535022]">
                        ⚠️ {item.description || item.curseDesc}
                      </div>

                      {/* 🎯 정화 시 베이스 ±30% 예상 스탯 미리보기 */}
                      <div className="text-[10px] bg-[#00000044] p-2 rounded-lg border border-[#ffffff10] flex flex-col gap-1 font-mono">
                        <div className="text-[#8b9bb4] font-sans text-[10px] font-bold flex items-center justify-between">
                          <span>🎯 정화 시 기본 베이스 스탯 ±30% 변동 범위:</span>
                          <span className="text-[#38ef7d]">성공률 {purifyRate}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(baseStats).map(([k, v]) => {
                            if (typeof v !== 'number' || v <= 0) return null;
                            const minVal = Math.max(1, Math.round(v * 0.7));
                            const maxVal = Math.round(v * 1.3);
                            return (
                              <span key={k} className="px-1.5 py-0.5 rounded bg-[#38ef7d15] text-[#38ef7d] border border-[#38ef7d33]">
                                {k.toUpperCase()} {minVal} ~ {maxVal} (기준 {v})
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <ActionButton
                        label={canCleanse ? `✨ 신성 정화 시작 (성공률 ${purifyRate}%)` : '정화 재화 부족'}
                        variant={canCleanse ? 'success' : 'ghost'}
                        size="sm"
                        className="w-full font-bold shadow"
                        disabled={!canCleanse}
                        onClick={() => {
                          const willSucceed = (Math.random() * 100) < purifyRate;
                          setPurifyingItem(item);
                          setPendingPurifyOutcome(willSucceed ? 'success' : 'drop');
                          setIsPurifying(true);
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 6. ⚒️ 단조 상세 모달 & ⚡ 장비 강화 모달 & 🔮 인챈트 모달 마운트 ── */}
      {selectedCraftRecipe && (
        <EquipmentCraftModal
          recipe={selectedCraftRecipe}
          onClose={() => setSelectedCraftRecipe(null)}
          gm={gm}
          resources={state.resources}
          discountPct={discountPct}
          mult={mult}
        />
      )}

      {selectedEnhanceItem && (
        <EquipmentEnhanceModal
          item={selectedEnhanceItem}
          onClose={() => setSelectedEnhanceItemId(null)}
          gm={gm}
          resources={state.resources}
          discountPct={discountPct}
          mult={mult}
        />
      )}

      {selectedEnchantItem && (
        <EquipmentEnchantModal
          item={selectedEnchantItem}
          onClose={() => setSelectedEnchantItemId(null)}
          gm={gm}
          resources={state.resources}
          discountPct={discountPct}
          mult={mult}
        />
      )}
      {/* ── ✨ 침식 장비 신성 정화 연출 모달 ── */}
      {purifyingItem && (
        <CraftProgressModal
          open={isPurifying}
          type="purify_equipment"
          title="병기창 신성 정화 의식"
          itemName={purifyingItem.name}
          itemIcon={purifyingItem.icon || '✨'}
          itemSub={`성공률 ${gm.getPurifySuccessRate()}% (병기창 Lv.${forgeLv})`}
          durationMs={2200}
          outcome={pendingPurifyOutcome}
          onComplete={() => {
            setIsPurifying(false);
            const isForcedSuccess = pendingPurifyOutcome === 'success';
            const res = gm.cleanseCurse(purifyingItem.id, isForcedSuccess);
            setCleanseOutcome({
              type: res.destroyed ? 'fail' : 'success',
              message: res.message,
              item: res.item
            });
            setPurifyingItem(null);
          }}
        />
      )}

    </div>
  );
};


// ─────────────────────────────────────────────────────────────
//  📦 영지 중앙 창고 (카테고리화 & 현재/최대 적재량 게이지 & 상세 설명 모달)
// ─────────────────────────────────────────────────────────────
interface StorageItemDef {
  key: string;
  label: string;
  icon: string;
  category: string;
  desc: string;
  detailDesc: string;
  sources: string[];
  usages: string[];
}

const StorageDrawer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, gm } = useGameManager();
  const [storageTab, setStorageTab] = useState<'resources' | 'supplies' | 'equipment' | 'quest'>('resources');
  const [selectedItemDetail, setSelectedItemDetail] = useState<StorageItemDef | null>(null);
  const [selectedEquipDetail, setSelectedEquipDetail] = useState<EquipmentItem | null>(null);
  const [equipCategory, setEquipCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [questCategory, setQuestCategory] = useState<'all' | 'ooparts' | 'memoir' | 'relic' | 'catalyst'>('all');
  const storageLv = state.buildings['storage']?.level || 0;

  const SUPPLY_ITEMS: StorageItemDef[] = [
    {
      key: 'torch',
      label: '탐험 횃불',
      icon: '🔥',
      category: '원정 보급품',
      desc: '시야 확보 & 기습 방지 & 위험도 억제',
      detailDesc: '심연의 짙은 어둠을 몰아내어 기습을 방지하고 위험도 증가 속도를 35% 늦춥니다. 탐험 중 점등 시 1개가 소모됩니다. (던전 귀환 시 휘발/소멸)',
      sources: ['마도 대장간 보급품 제작소 (목재 2 + 석탄 2 + 40G)', '서브 퀘스트 완료 보상', '탐험 채비실 사전 구매'],
      usages: ['던전 탐험 중 횃불 점등 (시야 100% 확보)', '던전 기습 확률 0% 무력화 및 오브젝트 발견율 상승']
    },
    {
      key: 'food',
      label: '던전 식량',
      icon: '🍖',
      category: '원정 보급품',
      desc: '야영(Camp) 시 체력/마나 35% 회복',
      detailDesc: '휴식 중 원정대의 허기를 채워줍니다. 야영을 거행할 때 1개를 소모하여 파티원 전원의 HP와 MP를 35% 즉시 회복합니다. (던전 귀환 시 휘발/소멸)',
      sources: ['마도 대장간 보급품 제작소 (식량 4 + 40G)', '서브 퀘스트 완료 보상', '탐험 채비실 사전 구매'],
      usages: ['던전 내 야영(Camp) 시 파티원 전원 체력 및 마나 35% 회복']
    },
    {
      key: 'pickaxe',
      label: '채굴 곡괭이',
      icon: '⛏️',
      category: '원정 보급품',
      desc: '광맥 채굴 시 2배 자원 획득 (귀환 보존)',
      detailDesc: '단단한 암반과 광맥을 파쇄하는 도구입니다. 던전 내에서 고순도 에테르 광맥을 채굴할 때 2배의 전리품을 안전하게 수확합니다. 미사용 잔여분은 성채 귀환 시 영구 보존됩니다.',
      sources: ['마도 대장간 보급품 제작소 (석재 6 + 목재 1 + 50G)', '서브 퀘스트 완료 보상', '던전 탐험 회수'],
      usages: ['던전 내 고순도 광맥 오브젝트 2배 자원 안전 채굴']
    },
    {
      key: 'bandage',
      label: '치유 붕대',
      icon: '🩹',
      category: '원정 보급품',
      desc: '야영 시 모든 디버프 상태이상 완전 치료 (귀환 보존)',
      detailDesc: '깨끗한 약초와 가죽으로 만든 멸균 붕대입니다. 야영 시 소지하고 있으면 파티원들의 출혈·중독·화상·빙결·기절·약화·실명 등 모든 해로운 디버프 상태이상을 즉시 치료합니다. 미사용 잔여분은 성채 귀환 시 영구 보존됩니다.',
      sources: ['마도 대장간 보급품 제작소 (약초 1 + 가죽 1 + 45G)', '서브 퀘스트 완료 보상', '던전 탐험 회수'],
      usages: ['던전 야영(Camp) 시 파티원 모든 디버프 상태이상 완전 정화']
    },
    {
      key: 'holy_water',
      label: '정화의 성수',
      icon: '💧',
      category: '원정 보급품',
      desc: '저주받은 제단/상자 정화 & 축복 (귀환 보존)',
      detailDesc: '에테르와 성스러운 약초를 축성한 물입니다. 심연의 타락한 제단이나 저주받은 보물상자를 정화하여 강력한 영구 축복으로 변환합니다. 미사용 잔여분은 성채 귀환 시 영구 보존됩니다.',
      sources: ['마도 대장간 보급품 제작소 (약초 2 + 에테르 5 + 60G)', '서브 퀘스트 완료 보상', '던전 탐험 회수'],
      usages: ['심연의 타락 제단 정화 및 축복 획득', '저주받은 보물상자 안전 정화']
    },
    {
      key: 'key',
      label: '던전 열쇠',
      icon: '🗝️',
      category: '원정 보급품',
      desc: '잠긴 상자/석관 100% 안전 개방 (귀환 보존)',
      detailDesc: '단단한 강철과 석재로 정밀 가공한 열쇠입니다. 잠겨 있는 보물 상자나 고대 석관을 함정 위험 없이 안전하게 해제하여 최고 등급 전리품을 획득합니다. 미사용 잔여분은 성채 귀환 시 영구 보존됩니다.',
      sources: ['마도 대장간 보급품 제작소 (철광석 2 + 석재 4 + 50G)', '서브 퀘스트 완료 보상', '던전 탐험 회수'],
      usages: ['잠긴 보물 상자 및 고대 석관 100% 안전 개방']
    },
    {
      key: 'rift_anchor',
      label: '균열의 닻',
      icon: '⚓',
      category: '원정 보급품',
      desc: '탐험 중 즉시 성채 안전 귀환 (귀환 보존)',
      detailDesc: '차원 공간을 고정하는 마도 닻입니다. 던전 탐험 도중 언제든 사용하여 획득한 전리품 손실 없이 성채로 즉시 안전 귀환합니다. 미사용 잔여분은 성채 귀환 시 영구 보존됩니다.',
      sources: ['마도 대장간 보급품 제작소 (골드 120 + 석재 4 + 에테르 5)', '서브 퀘스트 완료 보상', '탐험 채비실 사전 구매'],
      usages: ['던전 탐험 도중 즉시 성채 안전 귀환 (전리품 100% 보존)']
    },
    // ✨ 강화 보급품 7종
    {
      key: 'enhanced_torch',
      label: '에테르 횃불',
      icon: '✨🔥',
      category: '원정 보급품 (강화)',
      desc: '이벤트 발견율 +20%, 기습 억제 -20%, 위험도 축적 2배 (심연 고속 돌파)',
      detailDesc: '순수 에테르를 불꽃에 융합한 강화 횃불입니다. 심연 속의 은밀한 보물과 차원 틈새를 날카롭게 비추어 이벤트 발견율을 20% 높입니다.',
      sources: ['마도 대장간 강화제작소 (골드 240 + 목재 6 + 석탄 6)'],
      usages: ['던전 탐험 중 점등하여 시야 및 이벤트 발견율 대폭 증강']
    },
    {
      key: 'enhanced_food',
      label: '던전 도시락',
      icon: '🍱',
      category: '원정 보급품 (강화)',
      desc: '야영 시 마물 기습 위험 50% 억제 & 추가 회복량 +10% (HP/MP 45% 회복)',
      detailDesc: '정갈하게 포장된 고영양 전투 도시락입니다. 냄새를 완전히 차단하여 야영 중 마물에게 발각될 위험을 절반으로 줄이며 체력과 마나를 45% 회복합니다.',
      sources: ['마도 대장간 강화제작소 (골드 240 + 식량 12)'],
      usages: ['던전 내 야영(Camp) 시 안전하고 강력한 체력/마나 회복']
    },
    {
      key: 'enhanced_pickaxe',
      label: '심연 곡괭이',
      icon: '⛏️✨',
      category: '원정 보급품 (강화)',
      desc: '광맥 채굴량 2배 (골드/광석 4배 수급), 비밀 숏컷 개척 시 위험도 -50 대폭 감소',
      detailDesc: '심연의 마도 금속으로 벼려낸 강화 곡괭이입니다. 고순도 에테르 광맥을 파쇄하여 극대화된 자원을 캐내고 암벽을 뚫어 비밀 통로를 개척합니다.',
      sources: ['마도 대장간 강화제작소 (골드 300 + 석재 18 + 목재 3)'],
      usages: ['고순도 광맥 채굴 극대화 및 지름길 개척']
    },
    {
      key: 'enhanced_bandage',
      label: '성유 붕대',
      icon: '🩹✨',
      category: '원정 보급품 (강화)',
      desc: '야영 시 모든 디버프 정화 + 3턴간 [디버프 면역] 결계 부여',
      detailDesc: '성스러운 기름을 적신 정화의 붕대입니다. 야영 시 모든 악성 디버프를 즉시 치료하고 다음 3턴간 상태이상 면역 결계를 두릅니다.',
      sources: ['마도 대장간 강화제작소 (골드 270 + 약초 6 + 가죽 3)'],
      usages: ['야영 시 디버프 완전 치료 및 3턴간 면역 결계 전개']
    },
    {
      key: 'enhanced_holy_water',
      label: '여신의 성수',
      icon: '💧✨',
      category: '원정 보급품 (강화)',
      desc: '타락 제단 봉헌 시 전원 HP 30%/MP 40% 회복 + 모든 디버프 해제',
      detailDesc: '여신의 눈물이라 불리는 기적의 성수입니다. 심연의 오염된 제단을 정화하고 아군 전원의 체력과 마나를 풍족하게 회복시킵니다.',
      sources: ['마도 대장간 강화제작소 (골드 360 + 약초 6 + 에테르 60)'],
      usages: ['심연 제단 정화 및 파티 전원 즉시 치유']
    },
    {
      key: 'enhanced_key',
      label: '황금 열쇠',
      icon: '🗝️✨',
      category: '원정 보급품 (강화)',
      desc: '잠긴 상자/석관 100% 안전 개방 + 저주받은 장비 획득 확률 +50% 추가',
      detailDesc: '모든 마법 자물쇠를 해제하는 마스터 키입니다. 고대 보물상자를 안전하게 개방하며 희귀 장비를 추가로 얻을 확률이 상승합니다.',
      sources: ['마도 대장간 강화제작소 (골드 300 + 철광석 20 + 석재 12)'],
      usages: ['잠긴 보물 상자 안전 개방 및 고급 전리품 획득']
    },
    {
      key: 'enhanced_rift_anchor',
      label: '심연의 닻',
      icon: '⚓✨',
      category: '원정 보급품 (강화)',
      desc: '긴급 이송 시간 2턴 단축(2턴) & 성채 귀환 시 배낭 물품 분실 확률 차단(손실 0%)',
      detailDesc: '시공간 좌표를 완벽하게 고정하는 초공간 닻입니다. 귀환 시 배낭에 적재된 모든 전리품과 자원을 1개의 손실도 없이 100% 보존하여 복귀합니다.',
      sources: ['마도 대장간 강화제작소 (골드 720 + 석재 12 + 에테르 50)'],
      usages: ['전리품 100% 안전 보존 상태로 즉시 성채 안전 귀환']
    }
  ];

  // 🛡️ 현재 용병단(배럭 + 파티)이 착용 중인 모든 장비 ID 집합
  const equippedItemIds = new Set<string>();
  [...(state.barracks || []), ...(state.party || [])].forEach(hero => {
    if (hero.equipment) {
      if (hero.equipment.weapon?.id) equippedItemIds.add(hero.equipment.weapon.id);
      if (hero.equipment.armor?.id) equippedItemIds.add(hero.equipment.armor.id);
      if (hero.equipment.accessory?.id) equippedItemIds.add(hero.equipment.accessory.id);
    }
  });

  // 📜 퀘스트 & 오파츠 & 특수 아이템 목록 (오파츠 20종 + 회고록 10종 + 보스 신화 유물 10종 + 심연 촉매 4종)
  const QUEST_ITEMS: (StorageItemDef & { subCategory: 'ooparts' | 'memoir' | 'relic' | 'catalyst'; floor?: number })[] = [
    // 🏛️ 구세계 오파츠 20종 (1~10F 멸망 이전 유물)
    {
      key: 'ooparts_1_1', label: '금이 간 스마트폰 액정', icon: '📱', subCategory: 'ooparts', floor: 1, category: '구세계 오파츠 (1F)',
      desc: '구세계 전자기기 액정 파편', detailDesc: '한때 전 인류를 초연결하던 손바닥 안의 컴퓨터 화면 파편입니다. 액정에 희미한 배터리 잔량 아이콘이 각인되어 있습니다.',
      sources: ['1F 침묵의 회랑 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 1F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_1_2', label: '녹슨 스테인리스 텀블러', icon: '🥤', subCategory: 'ooparts', floor: 1, category: '구세계 오파츠 (1F)',
      desc: '구세계 이중 진공 보온 텀블러', detailDesc: '멸망 이전 인류가 따뜻한 커피를 담아 마시던 진공 보온병입니다. 바닥면에 흐릿한 브랜드 로고가 새겨져 있습니다.',
      sources: ['1F 침묵의 회랑 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 1F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_2_1', label: '빛바랜 플라스틱 신용카드', icon: '💳', subCategory: 'ooparts', floor: 2, category: '구세계 오파츠 (2F)',
      desc: '구세계 마그네틱 결제 카드', detailDesc: '한때 실물 금화 없이도 신뢰와 신용만으로 물품을 거래할 수 있게 했던 얇은 플라스틱 카드입니다.',
      sources: ['2F 망령의 납골당 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 2F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_2_2', label: '먼지 쌓인 카세트 테이프', icon: '📼', subCategory: 'ooparts', floor: 2, category: '구세계 오파츠 (2F)',
      desc: '구세계 자기 테이프 음원 기록체', detailDesc: '자기 테이프에 소리와 음악을 기록하여 재생하던 아날로그 저장 매체입니다. 손글씨로 앨범 제목이 적혀 있습니다.',
      sources: ['2F 망령의 납골당 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 2F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_3_1', label: '방전된 리튬 배터리', icon: '🔋', subCategory: 'ooparts', floor: 3, category: '구세계 오파츠 (3F)',
      desc: '구세계 2차 전지 배터리', detailDesc: '화학 반응을 통해 전기를 저장하고 모바일 기기를 구동하던 휴대용 에너지원 셀입니다.',
      sources: ['3F 에테르 광맥 던전 상자 / 광맥 발굴 / 보스 드랍'], usages: ['심연의 백과사전(도감) 3F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_3_2', label: '금이 간 세라믹 머그잔', icon: '☕', subCategory: 'ooparts', floor: 3, category: '구세계 오파츠 (3F)',
      desc: '구세계 도자기 머그잔', detailDesc: '구세계의 직장인과 연구원들이 책상 위에 두고 음료를 마시던 도자기 잔입니다.',
      sources: ['3F 에테르 광맥 던전 상자 / 광맥 발굴 / 보스 드랍'], usages: ['심연의 백과사전(도감) 3F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_4_1', label: '찢겨진 지하철 노선도', icon: '🗺️', subCategory: 'ooparts', floor: 4, category: '구세계 오파츠 (4F)',
      desc: '구세계 광역 고속철도망 안내도', detailDesc: '복잡한 거미줄처럼 수도권 지하를 연결하던 고속 철도망 안내도입니다. 역 이름마다 번호가 매겨져 있습니다.',
      sources: ['4F 심연의 균열 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 4F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_4_2', label: '멈춰버린 쿼츠 손목시계', icon: '⌚', subCategory: 'ooparts', floor: 4, category: '구세계 오파츠 (4F)',
      desc: '구세계 전자 쿼츠 시계', detailDesc: '수정의 진동을 이용해 초 단위로 시간을 정밀 계측하던 소형 손목시계입니다. 초침이 멈춰 있습니다.',
      sources: ['4F 심연의 균열 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 4F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_5_1', label: '부서진 헤드폰', icon: '🎧', subCategory: 'ooparts', floor: 5, category: '구세계 오파츠 (5F)',
      desc: '구세계 음향 리시버 장치', detailDesc: '개인에게만 생생한 입체 음향을 전달하던 소형 스피커 헤드셋입니다. 푹신한 이어패드가 삭아 있습니다.',
      sources: ['5F 원초의 제단 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 5F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_5_2', label: '비닐 코팅된 학생증', icon: '🪪', subCategory: 'ooparts', floor: 5, category: '구세계 오파츠 (5F)',
      desc: '구세계 교육기관 학생 신분증', detailDesc: '어린 소년소녀들이 배움을 얻던 학교의 신원 확인증입니다. 앳된 미소를 띤 학생의 증명사진이 붙어 있습니다.',
      sources: ['5F 원초의 제단 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 5F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_6_1', label: '녹슨 와인 오프너', icon: '🍷', subCategory: 'ooparts', floor: 6, category: '구세계 오파츠 (6F)',
      desc: '구세계 코르크 개봉 기구', detailDesc: '연회와 만찬에서 코르크 마개를 뽑아 숙성된 포도주를 개봉하던 나선형 지렛대 기구입니다.',
      sources: ['6F 핏빛 성역 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 6F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_6_2', label: '말라붙은 립스틱 케이스', icon: '💄', subCategory: 'ooparts', floor: 6, category: '구세계 오파츠 (6F)',
      desc: '구세계 회전식 화장품 케이스', detailDesc: '붉은 안료를 입술에 칠해 미를 가꾸던 금속제 회전 케이스입니다. 붉은빛 자국이 남아 있습니다.',
      sources: ['6F 핏빛 성역 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 6F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_7_1', label: '빛바랜 폴라로이드 사진', icon: '📷', subCategory: 'ooparts', floor: 7, category: '구세계 오파츠 (7F)',
      desc: '구세계 즉석 인화 필름 사진', detailDesc: '촬영 즉시 화학 반응으로 소중한 순간을 필름에 담아낸 가족의 사진입니다. 뒷면에 날짜가 적혀 있습니다.',
      sources: ['7F 망각의 묘지 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 7F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_7_2', label: '굳어버린 3색 볼펜', icon: '🖊️', subCategory: 'ooparts', floor: 7, category: '구세계 오파츠 (7F)',
      desc: '구세계 다색 필기구', detailDesc: '검정, 빨강, 파랑 잉크를 하나의 자루에 담아 손쉽게 기록을 남기던 편리한 도구입니다.',
      sources: ['7F 망각의 묘지 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 7F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_8_1', label: '부서진 무전기 트랜시버', icon: '📻', subCategory: 'ooparts', floor: 8, category: '구세계 오파츠 (8F)',
      desc: '구세계 무선 음성 통신 단말', detailDesc: '전파를 이용해 수 킬로미터 밖의 동료와 실시간으로 음성 교신하던 휴대용 통신 장비입니다.',
      sources: ['8F 단죄의 성채 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 8F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_8_2', label: '찌그러진 티타늄 안경테', icon: '👓', subCategory: 'ooparts', floor: 8, category: '구세계 오파츠 (8F)',
      desc: '구세계 초경량 티타늄 프레임', detailDesc: '시력이 감퇴한 자들의 시야를 교정해 주던 탄성 높은 티타늄 합금 프레임입니다.',
      sources: ['8F 단죄의 성채 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 8F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_9_1', label: '홀로그램 디스플레이 큐브', icon: '🧊', subCategory: 'ooparts', floor: 9, category: '구세계 오파츠 (9F)',
      desc: '구세계 3D 홀로그램 투사기', detailDesc: '허공에 빛으로 입체 영상과 데이터를 띄우던 미래형 디스플레이입니다. 마력을 넣으면 지지직거리는 잔상이 떠오릅니다.',
      sources: ['9F 환영의 미궁 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 9F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_9_2', label: '녹아내린 카메라 렌즈', icon: '🔍', subCategory: 'ooparts', floor: 9, category: '구세계 오파츠 (9F)',
      desc: '구세계 광학 유리 렌즈', detailDesc: '멸망의 순간마저 후대에 전하기 위해 고열 속에서도 셔터를 누른 기록자의 흔적입니다.',
      sources: ['9F 환영의 미궁 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 9F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_10_1', label: '양자 코어 칩셋', icon: '💾', subCategory: 'ooparts', floor: 10, category: '구세계 오파츠 (10F)',
      desc: '구세계 양자 연산 코어 칩셋', detailDesc: '나노미터 실리콘 회로 속에 인류의 철학, 예술, 유전체 정보가 암호화되어 잠들어 있는 초소형 양자 프로세서입니다.',
      sources: ['10F 심연의 심장부 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 10F 오파츠 컬렉션 등록']
    },
    {
      key: 'ooparts_10_2', label: '타임캡슐 황동 열쇠', icon: '🗝️', subCategory: 'ooparts', floor: 10, category: '구세계 오파츠 (10F)',
      desc: '구세계 최후의 방공호 마스터 키', detailDesc: '심연 가장 깊은 화강암반 지하 벙커에 묻힌 인류 문명의 두 번째 새벽을 열 물리적 열쇠입니다.',
      sources: ['10F 심연의 심장부 던전 상자 / 보스 드랍'], usages: ['심연의 백과사전(도감) 10F 오파츠 컬렉션 등록']
    },

    // 📜 심연 회고록 쪽지 10종
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => ({
      key: `memoir_note_${f}`,
      label: `${f}층 심연 회고록 쪽지`,
      icon: '📜',
      subCategory: 'memoir' as const,
      floor: f,
      category: '심연 탐험대 회고록',
      desc: `${f}층 심연 선발대가 남긴 마지막 생존 기록`,
      detailDesc: `과거 심연을 개척하던 선발대원들이 피와 잉크로 기록한 수기입니다. ${f}층의 지형과 마물의 약점, 멸망의 전조가 상세히 기록되어 있습니다.`,
      sources: [`${f}층 탐험 중 특별 오브젝트 수색 / 서브 퀘스트`],
      usages: ['심연의 백과사전 회고록 도감 등록 (영구 파티 스탯 보너스)']
    })),

    // 👑 10대 보스 신화 유물 10종
    {
      key: 'relic_floor_1', label: '침묵의 흑핵', icon: '🖤', subCategory: 'relic', floor: 1, category: '보스 신화 유물',
      desc: '1F 침묵의 주시자 처치 정수', detailDesc: '1층 군주의 심장에 응축되어 있던 순수 암흑 핵입니다. 마도 대장간에서 1티어 보스 고유 장비를 단조하는 핵심 매개체입니다.',
      sources: ['1F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_2', label: '망령의 영혼수정', icon: '👻', subCategory: 'relic', floor: 2, category: '보스 신화 유물',
      desc: '2F 망령 군주 처치 정수', detailDesc: '수많은 원혼의 비명이 결정화된 푸른빛 영혼 보석입니다. 2티어 보스 고유 장비를 단조합니다.',
      sources: ['2F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_3', label: '원초의 광맥 심장', icon: '🫀', subCategory: 'relic', floor: 3, category: '보스 신화 유물',
      desc: '3F 광맥 수호자 처치 정수', detailDesc: '지하 마나 광맥의 핵이 박동하는 살아있는 암석 심장입니다. 3티어 보스 고유 장비를 단조합니다.',
      sources: ['3F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_4', label: '심연의 시공 닻', icon: '⚓', subCategory: 'relic', floor: 4, category: '보스 신화 유물',
      desc: '4F 시공 지배자 처치 정수', detailDesc: '시공간 균열을 틀어막고 현실을 고정하는 마도 닻입니다. 4티어 보스 고유 장비를 단조합니다.',
      sources: ['4F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_5', label: '공허 지배자의 모노리스 핵', icon: '👁️', subCategory: 'relic', floor: 5, category: '보스 신화 유물',
      desc: '5F 공허 거신 처치 정수', detailDesc: '원초의 제단을 수호하던 거신의 이마에서 추출한 칠흑의 눈입니다. 5티어 보스 고유 장비를 단조합니다.',
      sources: ['5F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_6', label: '진홍 성배', icon: '🍷', subCategory: 'relic', floor: 6, category: '보스 신화 유물',
      desc: '6F 핏빛 대공 처치 정수', detailDesc: '끝없이 피가 솟아나는 저주받은 진홍의 성배입니다. 6티어 보스 고유 장비를 단조합니다.',
      sources: ['6F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_7', label: '영혼 나침반', icon: '🧭', subCategory: 'relic', floor: 7, category: '보스 신화 유물',
      desc: '7F 망각 사신 처치 정수', detailDesc: '망각의 안개 속에서 영혼의 길을 인도하는 사신의 나침반입니다. 7티어 보스 고유 장비를 단조합니다.',
      sources: ['7F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_8', label: '기사단장 휘장', icon: '🛡️', subCategory: 'relic', floor: 8, category: '보스 신화 유물',
      desc: '8F 타락한 기사단장 처치 정수', detailDesc: '단죄의 성채를 수호하던 성기사단의 최고위 흑철 휘장입니다. 8티어 보스 고유 장비를 단조합니다.',
      sources: ['8F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_9', label: '진실 거울 파편', icon: '🪞', subCategory: 'relic', floor: 9, category: '보스 신화 유물',
      desc: '9F 환영 군주 처치 정수', detailDesc: '모든 환각과 도플갱어의 본체를 비추는 마도 만화경 거울 파편입니다. 9티어 보스 고유 장비를 단조합니다.',
      sources: ['9F 보스 처치 (100% 확정)'], usages: ['마도 대장간 보스 고유 장비 단조']
    },
    {
      key: 'relic_floor_10', label: '심연 군주의 마핵', icon: '👑', subCategory: 'relic', floor: 10, category: '보스 신화 유물',
      desc: '10F 심연 종말 군주 처치 정수', detailDesc: '심연의 심장부를 지배하던 절대자의 옥새이자 종말의 마핵입니다. 10티어 종말 신화 장비를 단조합니다.',
      sources: ['10F 보스 처치 (100% 확정)'], usages: ['마도 대장간 10티어 신화 장비 단조']
    },

    // 🔮 심연 특수 촉매 4종
    {
      key: 'compass', label: '차원의 나침반', icon: '🧭', subCategory: 'catalyst', category: '심연 특수 촉매',
      desc: '용병 긴급 이송 턴 1턴 단축 & 차원 포탈 발견↑',
      detailDesc: '공허의 에테르 흐름을 감지하고 차원 통로를 단축하는 마도 나침반입니다. 던전 내에서 예비 대원을 긴급 이송할 때 소요되는 대기 턴을 1턴 줄여줍니다. 또한 탐험 중 비밀 차원 포탈의 발견 확률도 함께 증가합니다.',
      sources: ['탐험 채비실 촉매 제작 (골드 50 + 마력 수정 1 + 에테르 10)'], usages: ['채비실에서 활성화하여 던전 출격']
    },
    {
      key: 'blood_contract', label: '피의 서약서', icon: '📜', subCategory: 'catalyst', category: '심연 특수 촉매',
      desc: '강적 출현율 증가 & 전리품 2배',
      detailDesc: '마물의 피와 약초, 질긴 가죽에 새긴 피의 계약입니다. 몬스터 조우 확률이 상승하지만, 탐험에서 획득하는 모든 골드 전리품이 2배로 증폭됩니다.',
      sources: ['탐험 채비실 촉매 제작 (골드 50 + 가죽 2 + 약초 2)'], usages: ['채비실에서 활성화하여 던전 출격']
    },
    {
      key: 'dimensional_whistle', label: '차원의 호각', icon: '📯', subCategory: 'catalyst', category: '심연 특수 촉매',
      desc: '전멸 시 배낭 전리품 10~50% 회수',
      detailDesc: '공간 왜곡 신호를 보내는 비상 호각입니다. 파티 전멸 시 구조대를 긴급 호출하여 배낭 전리품의 10~50%를 회수합니다. (미장착 시 전멸하면 배낭 전리품 100% 소실)',
      sources: ['탐험 채비실 촉매 제작 (골드 150 + 에테르 20 + 공허의 파편 1)'], usages: ['채비실에서 활성화하여 던전 출격']
    },
    {
      key: 'golden_toad', label: '황금 두꺼비', icon: '🐸', subCategory: 'catalyst', category: '심연 특수 촉매',
      desc: '드랍 자원 즉시 골드 자동 변환',
      detailDesc: '고대 심연의 탐욕을 머금은 황금 두꺼비 유물입니다. 던전에서 획득하는 장비, 오파츠, 수집품을 제외한 모든 자원류(목재, 석재, 철광석, 약초, 가죽 등)를 얻는 즉시 블랙마켓 기본 시세에 따라 골드로 환전하여 배낭에 입고합니다.',
      sources: ['탐험 채비실 촉매 제작 (골드 1000 + 철광석 20 + 에테르 50)'], usages: ['채비실에서 활성화하여 던전 출격']
    }
  ];

  // 📦 필터링된 퀘스트/오파츠 목록
  const filteredQuestItems = useMemo(() => {
    if (questCategory === 'all') return QUEST_ITEMS;
    return QUEST_ITEMS.filter(item => item.subCategory === questCategory);
  }, [questCategory]);

  // 📦 순수 미착용 보관 장비 전체 목록 (중복 ID 배제)
  const unequippedList = useMemo(() => {
    const seen = new Set<string>();
    return (state.equipmentInventory || []).filter(item => {
      if (!item || !item.id) return false;
      if (item.equippedHeroId) return false;
      if (equippedItemIds.has(item.id)) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [state.equipmentInventory, equippedItemIds]);

  // 📦 카테고리 필터링된 보관 장비
  const filteredEquipment = useMemo(() => {
    if (equipCategory === 'all') return unequippedList;
    return unequippedList.filter(item => item.slot === equipCategory);
  }, [unequippedList, equipCategory]);

  const RESOURCE_GROUPS: Array<{
    title: string;
    icon: string;
    items: StorageItemDef[];
  }> = [
    {
      title: '🪵 기본 원자재',
      icon: '🪵',
      items: [
        {
          key: 'gold',
          label: '골드',
          icon: '🪙',
          category: '기본 원자재',
          desc: '영지 통화 & 고용/제작/강화 비용',
          detailDesc: '방주와 심연 전역에서 통용되는 고대 순금 주화입니다. 시설 건설 및 증축, 용병 고용 및 전직 의식, 대장간 장비 단조 및 암시장 거래의 기초 화폐로 쓰입니다.',
          sources: ['던전 탐험 전리품 획득', '보물상자 및 고대 석관 개방', '차원 아레나 랭킹전 승리', '블랙 마켓 자원 대량 매각'],
          usages: ['영지 시설 건축 및 레벨업', '용병단 모집 및 고용', '장비 단조, 강화 및 인챈트', '출정 보급품 및 촉매 유물 준비']
        },
        {
          key: 'wood',
          label: '목재',
          icon: '🪵',
          category: '기본 원자재',
          desc: '벌목소 생산 & 건물 건설 및 횃불 연료',
          detailDesc: '방주 주변의 고대 석화림에서 벌채한 마도 목재입니다. 시설의 뼈대를 세우고 모닥불의 온기를 지피며, 심연 탐험용 횃불과 곡괭이를 제작하는 데 필수적입니다.',
          sources: ['벌목소(Lumber Camp) 틱 생산', '심연 1~2층 탐험 수목 채집', '블랙 마켓 매입'],
          usages: ['영지 시설 건축/증축', '모닥불 장작 투입 (온기 스택 유지)', '횃불 및 채굴 곡괭이 보급품 제작']
        },
        {
          key: 'stone',
          label: '석재',
          icon: '🪨',
          category: '기본 원자재',
          desc: '채석장 생산 & 방벽 및 방어 시설',
          detailDesc: '심연의 극한 압력을 견뎌낸 고밀도 암반석입니다. 대장간, 방벽, 성채의 견고한 외벽을 축조하고 탐험용 채굴 곡괭이를 만드는 데 소모됩니다.',
          sources: ['채석장(Quarry) 틱 생산', '심연 1~2층 암반 채광', '블랙 마켓 매입'],
          usages: ['방벽, 대장간, 시설 건축 및 증축', '탐험 채굴 곡괭이 제작']
        },
        {
          key: 'iron',
          label: '철광석',
          icon: '⚙️',
          category: '기본 원자재',
          desc: '광산 생산 & 무기/중갑 장비 단조 및 강화',
          detailDesc: '고강도 마도 합금의 기초가 되는 순수 철광석입니다. 대장간에서 기사와 전사의 무기 및 중갑 방어구를 단조하고 장비를 강화하는 핵심 광물입니다.',
          sources: ['철광산(Iron Mine) 틱 생산', '심연 2~3층 광맥 채굴', '블랙 마켓 매입'],
          usages: ['무기 및 방어구 장비 단조', '장비 강화 레벨업', '녹슨 만능열쇠 촉매 제작']
        },
        {
          key: 'food',
          label: '식량',
          icon: '🍖',
          category: '기본 원자재',
          desc: '가공소 생산 & 던전 야영 및 병동 치료',
          detailDesc: '보존성과 영양가가 뛰어난 건조 육류와 곡물 보급품입니다. 던전 탐험 중 야영(Camp)을 거행할 때 파티원의 체력과 마나를 대량 회복시키며, 병동의 부상 용병 치료 시 소비됩니다.',
          sources: ['식량 가공소(Food Processing) 틱 생산', '심연 1~2층 야수 사냥', '블랙 마켓 매입'],
          usages: ['출정 식량 보급', '던전 야영(Camp) 체력/마나 회복', '생체 복원 병동 입원 치료 틱 소모']
        },
        {
          key: 'ether',
          label: '에테르',
          icon: '✨',
          category: '기본 원자재',
          desc: '마도 정제소 생산 & 승급/전직 및 정화',
          detailDesc: '심연의 공간을 채우고 있는 순수 영혼 마력의 결정체입니다. 용병의 상위 클래스 전직 각성, 성수 조제, 저주받은 장비 정화 및 최고급 인챈트에 광범위하게 사용됩니다.',
          sources: ['마도 정제소(Ether Refinery) 틱 생산', '심연 3~4층 에테르 광맥 채굴', '보스 토벌 전리품'],
          usages: ['영혼의 제단 전직 각성 의식', '정화의 성수 조제', '저주받은 장비 신성 정화', '심연 촉매 유물 제작']
        },
      ]
    },
    {
      title: '🌿 던전 파밍 재료',
      icon: '🌿',
      items: [
        {
          key: 'herb',
          label: '약초',
          icon: '🌿',
          category: '던전 파밍 재료',
          desc: '붕대/물약 제조 & 성수 조제',
          detailDesc: '심연의 독기와 어둠 속에서도 자라나는 약효 높은 마도 이끼와 풀입니다. 출혈을 즉시 치료하는 지혈 붕대와 저주를 정화하는 성수를 조제하는 데 핵심 재료입니다.',
          sources: ['심연 1~3층 수풀 채집', '식물형 마물 토벌 전리품', '블랙 마켓 매입'],
          usages: ['지혈 붕대 보급품 제작', '정화의 성수 조제']
        },
        {
          key: 'leather',
          label: '가죽',
          icon: '🥋',
          category: '던전 파밍 재료',
          desc: '배낭/경갑옷 & 촉매 유물 제작',
          detailDesc: '심연 맹수와 마물의 외피를 무두질하여 만든 질긴 가죽입니다. 확장 배낭(군장), 도적/사수의 경갑 방어구, 그리고 피의 서약서 촉매를 만드는 데 사용됩니다.',
          sources: ['심연 1~3층 야수형 마물 토벌', '석관 개방 보상', '블랙 마켓 매입'],
          usages: ['표준/완전 군장 배낭 제작', '경갑 방어구 단조', '피의 서약서 촉매 제작']
        },
        {
          key: 'silk',
          label: '실크',
          icon: '🧵',
          category: '던전 파밍 재료',
          desc: '마법 로브/부적 단조 & 고급 마도 직조',
          detailDesc: '심연 거미와 균열의 누에가 자아낸 마력 직물입니다. 마법사와 사제의 마도 로브를 직조하고 신비로운 부적 악세서리를 제작하는 데 쓰입니다.',
          sources: ['심연 2~4층 거미형 마물 토벌', '던전 비밀 상자', '블랙 마켓 매입'],
          usages: ['마법 로브 및 부적 악세서리 단조']
        },
        {
          key: 'coal',
          label: '석탄',
          icon: '⚫',
          category: '던전 파밍 재료',
          desc: '횃불 제작 & 대장간 제련',
          detailDesc: '지하 암반에서 발굴되는 흑탄입니다. 대장간 화로의 화력을 극대화하여 고순도 제련을 돕고, 던전 탐험 시 어둠을 밝히는 횃불의 주 연료가 됩니다.',
          sources: ['심연 2~3층 광맥 채광', '채석장 부화물', '블랙 마켓 매입'],
          usages: ['탐험 횃불 제작', '대장간 시설 증축']
        },
        {
          key: 'bone',
          label: '짐승 뼈',
          icon: '🦴',
          category: '던전 파밍 재료',
          desc: '특수 장비 단조 & 시설 강화 재료',
          detailDesc: '던전의 마수와 언데드 몬스터에게서 획득한 단단한 뼈입니다. 특수 무기 및 방어구 단조, 고대 유물 가공의 핵심 재료로 사용됩니다.',
          sources: ['던전 전 층 몬스터 처치', '보물 상자 및 고대 석관 개방', '블랙 마켓 매입'],
          usages: ['병기창 특수 장비 단조', '심연 장비 제작 및 강화']
        },
      ]
    },
    {
      title: '🔮 심연 희귀 유물',
      icon: '🔮',
      items: [
        {
          key: 'crystal',
          label: '마력 수정',
          icon: '🔮',
          category: '심연 희귀 유물',
          desc: '지팡이/부적 단조 & 나침반',
          detailDesc: '에테르가 고온고압으로 결정화된 푸른 마법 보석입니다. 마법사의 비전 지팡이와 나침반 촉매를 연성하는 데 필수 불가결한 촉매체입니다.',
          sources: ['심연 3~4층 에테르 광맥 채굴', '정예 마물 처치', '블랙 마켓 매입'],
          usages: ['고급 지팡이 및 악세서리 단조', '심연의 나침반 촉매 제작']
        },
        {
          key: 'void_shard',
          label: '공허 파편',
          icon: '💠',
          category: '심연 희귀 유물',
          desc: '완전 군장 & 2차 전직 및 차원의 호각',
          detailDesc: '차원의 틈이 찢어지며 떨어진 붕괴된 공간의 파편입니다. 대용량 완전 군장 배낭, 차원의 호각 유물, 그리고 2차 전설 클래스 각성에 필요한 최상급 유물입니다.',
          sources: ['심연 4~5층 균열 탐험', '4층/5층 보스 토벌 전리품', '블랙 마켓 매입'],
          usages: ['완전 군장(20칸) 배낭 제작', '차원의 호각 촉매 유물', '2차 전설 전직 의식']
        },
      ]
    },
    {
      title: '✨ 마도 인챈트석',
      icon: '✨',
      items: [
        {
          key: 'prefix_stone',
          label: '일반 접두석',
          icon: '✨',
          category: '마도 인챈트석',
          desc: '+3강 장비 희귀 접두어 부여',
          detailDesc: '대장간에서 +3강 이상으로 강화된 장비에 날카로운(공격력↑), 맹렬한(치명타↑), 신속한(속도↑) 등의 강력한 전술 접두 옵션을 무작위로 인챈트합니다.',
          sources: ['심연 1~3층 보물상자 및 보스 토벌', '대장간 인챈트 연성', '블랙 마켓 매입'],
          usages: ['대장간 장비 접두 인챈트 부여']
        },
        {
          key: 'suffix_stone',
          label: '일반 접미석',
          icon: '🔮',
          category: '마도 인챈트석',
          desc: '+7강 장비 희귀 접미어 부여',
          detailDesc: '대장간에서 +7강 이상으로 강화된 장비에 수호자의(방어력↑), 불굴의(생명력↑), 흡혈의(피흡↑), 관통의(방관↑) 등의 접미 옵션을 무작위로 인챈트합니다.',
          sources: ['심연 2~4층 보물상자 및 보스 토벌', '대장간 인챈트 연성', '블랙 마켓 매입'],
          usages: ['대장간 장비 접미 인챈트 부여']
        },
        {
          key: 'pure_prefix_stone',
          label: '순수 접두석',
          icon: '⭐',
          category: '마도 인챈트석',
          desc: '에픽/전설 접두어 확정 인챈트',
          detailDesc: '순수한 정령석의 핵으로 만든 최상급 인챈트석입니다. +10강 이상의 궁극 장비에 파멸적인 최상위 등급 접두 옵션을 부여합니다.',
          sources: ['심연 3~5층 고대 석관 개방', '5층 최종 보스 토벌', '블랙 마켓(Lv.8)'],
          usages: ['대장간 최상급 접두 인챈트']
        },
        {
          key: 'pure_suffix_stone',
          label: '순수 접미석',
          icon: '🌌',
          category: '마도 인챈트석',
          desc: '에픽/전설 접미어 확정 인챈트',
          detailDesc: '심연의 공간 응축 보석으로 제작된 궁극의 인챈트석입니다. +10강 이상의 장비에 최고의 방어력 및 방어구 관통 접미 옵션을 부여합니다.',
          sources: ['심연 3~5층 고대 석관 개방', '5층 최종 보스 토벌', '블랙 마켓(Lv.8)'],
          usages: ['대장간 최상급 접미 인챈트']
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">📦</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#ffd54f]">방주 보관함</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold">
                Lv.{storageLv}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono border border-[#00d2ff33]">
                {'유지비 완전 면제'}
              </span>
              <EncyclopediaBadge query="창고" tab="buildings" label="창고 백과" />
            </div>
            <div className="text-[10px] text-[#8b9bb4]">
              🏰 {'성채'}: <span className="text-white font-mono font-bold">{gm.getMaxResourceCapacity('wood').toLocaleString()}</span> | 
              🌿 {'파밍'}: <span className="text-[#66bb6a] font-mono font-bold">{gm.getMaxResourceCapacity('iron').toLocaleString()}</span> | 
              🔮 {'심연'}: <span className="text-[#00d2ff] font-mono font-bold">{gm.getMaxResourceCapacity('crystal').toLocaleString()}</span> | 
              {'금화'}: <span className="text-[#ffd54f] font-mono font-bold">{gm.getMaxResourceCapacity('gold').toLocaleString()}</span>G
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onBack}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* ── 창고 메인 탭 (기본 자원 / 원정 보급품 / 미착용 장비 / 퀘스트·오파츠) ── */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        <button
          className={`btn py-1.5 text-xs font-bold transition-all ${storageTab === 'resources' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStorageTab('resources')}
        >
          🪵 {'자원 (16)'}
        </button>
        <button
          className={`btn py-1.5 text-xs font-bold transition-all ${storageTab === 'supplies' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStorageTab('supplies')}
        >
          🎒 {`보급품 (${SUPPLY_ITEMS.length})`}
        </button>
        <button
          className={`btn py-1.5 text-xs font-bold transition-all ${storageTab === 'equipment' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStorageTab('equipment')}
        >
          ⚔️ {`장비 (${unequippedList.length})`}
        </button>
        <button
          className={`btn py-1.5 text-xs font-bold transition-all ${storageTab === 'quest' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStorageTab('quest')}
        >
          📜 {`퀘스트 (${QUEST_ITEMS.filter(q => (state.resources[q.key] || 0) > 0 || q.subCategory === 'catalyst').length})`}
        </button>
      </div>

      {/* 안내 툴팁 바 */}
      <div className="px-3 py-1.5 bg-[#121926] border-b border-[#1f2738] text-[10px] text-[#8b9bb4] flex items-center justify-between shrink-0">
        <span>💡 항목 탭 시 상세 설명 및 옵션 확인</span>
        <span className="text-[#607d8b]">
          {storageTab === 'resources' 
            ? ('16종 자원 보관') 
            : storageTab === 'supplies' 
              ? ('6종 보급품 재고') 
              : storageTab === 'equipment'
                ? (`${unequippedList.length}개 장비 보관`)
                : ('오파츠·회고록·신화 유물·촉매')}
        </span>
      </div>

      {/* ── 1. 🪵 기본 자원 탭 ── */}
      {storageTab === 'resources' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3.5">
          {RESOURCE_GROUPS.map(group => (
            <div key={group.title} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-xs font-bold text-[#00d2ff]">{group.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {group.items.map(item => {
                  const current = (state.resources as Record<string, number>)[item.key] || 0;
                  const maxCap = gm.getMaxResourceCapacity(item.key as any);
                  const pct = Math.min(100, (current / maxCap) * 100);
                  const isFull = current >= maxCap;
                  const isNear = pct >= 80;

                  const netInfo = gm.getResourceNetRate(item.key as any);
                  return (
                    <div
                      key={item.key}
                      className="panel p-2.5 bg-[#131926] border border-[#222d42] hover:border-[#00d2ff88] hover:bg-[#172033] rounded-xl flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]"
                      onClick={() => setSelectedItemDetail(item)}
                      title="탭하여 상세 정보 확인"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base shrink-0 p-1 rounded-lg bg-[#323d4e] border border-[#4a576d] flex items-center justify-center">
                              <GameIcon name={item.key} icon={item.icon} size={18} />
                            </span>
                            <span className="font-bold text-xs text-white truncate hover:text-[#00d2ff]">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {netInfo.trend === 'up' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#38ef7d18] text-[#38ef7d] font-mono font-bold flex items-center gap-0.5 border border-[#38ef7d33]" title={`실시간 순생산: ${netInfo.text}`}>
                                ▲ {netInfo.text}
                              </span>
                            )}
                            {netInfo.trend === 'down' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#ef535018] text-[#ef5350] font-mono font-bold flex items-center gap-0.5 border border-[#ef535033]" title={`실시간 순감소(유지비 등): ${netInfo.text}`}>
                                ▼ {netInfo.text}
                              </span>
                            )}
                            {netInfo.trend === 'stable' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#607d8b15] text-[#8b9bb4] font-mono flex items-center gap-0.5">
                                {isFull ? 'FULL' : '—'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[9px] text-[#8b9bb4] truncate mb-2">
                          {item.desc}
                        </div>
                      </div>

                      {/* 수량 / 최대 적재량 게이지 */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className={`font-bold ${isFull ? 'text-[#ef5350]' : isNear ? 'text-[#ffd54f]' : 'text-[#38ef7d]'}`}>
                            {current.toLocaleString()}
                          </span>
                          <span className="text-[#607d8b]">/ {maxCap.toLocaleString()}</span>
                        </div>

                        <div className="w-full h-1.5 bg-[#1a2234] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFull ? 'bg-[#ef5350]' : isNear ? 'bg-[#ffd54f]' : 'bg-[#38ef7d]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. 🎒 원정 보급품 탭 ── */}
      {storageTab === 'supplies' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
          <div className="p-3 rounded-xl bg-[#121826] border border-[#1f2738] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#ffd54f]">
                📦 {'원정 보급품 창고 재고 현황'}
              </div>
              <div className="text-[10px] text-[#8b9bb4] mt-0.5">
                {'대장간 제작 및 퀘스트 보상으로 획득한 소모품이 안전하게 적재됩니다.'}
              </div>
            </div>
            <span className="text-xs text-[#38ef7d] font-bold px-2 py-0.5 rounded bg-[#38ef7d15] border border-[#38ef7d33]">
              {'채비실 무료 불출'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUPPLY_ITEMS.map(item => {
              const currentStock = gm.citadelSupplies?.[item.key] || 0;
              const locSupply = item;
              const label = locSupply?.label || item.label;
              const desc = locSupply?.desc || item.desc;
              return (
                <div
                  key={item.key}
                  className="panel p-3 bg-[#131926] border border-[#222d42] hover:border-[#ffd54f88] hover:bg-[#172033] rounded-xl flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]"
                  onClick={() => setSelectedItemDetail(item)}
                  title="탭하여 상세 설명 확인"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-lg shrink-0 p-1 rounded-lg bg-[#323d4e] border border-[#4a576d] flex items-center justify-center">
                          <GameIcon name={item.key} icon={item.icon} size={20} />
                        </span>
                        <span className="font-bold text-xs text-white truncate hover:text-[#ffd54f]">{label}</span>
                      </div>
                      <span className="text-[9px] text-[#ffd54f] opacity-80">🔍</span>
                    </div>

                    <div className="text-[9px] text-[#8b9bb4] line-clamp-2 mb-2">
                      {desc}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#1f2738]">
                    <span className="text-[10px] text-[#8b9bb4]">
                      {'보유 재고'}
                    </span>
                    <span className={`font-mono font-bold text-sm ${currentStock > 0 ? 'text-[#38ef7d]' : 'text-[#607d8b]'}`}>
                      currentStock.toLocaleString() + '개'
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. ⚔️ 미착용 장비 창고 탭 ── */}
      {storageTab === 'equipment' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* 소분류 칩 바 */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121724] border-b border-[#1f2738] shrink-0">
            {[
              { key: 'all', label: `전체 (${unequippedList.length})`, icon: '📦' },
              { key: 'weapon', label: `무기 (${unequippedList.filter(i => i.slot === 'weapon').length})`, icon: '🗡️' },
              { key: 'armor', label: `방어구 (${unequippedList.filter(i => i.slot === 'armor').length})`, icon: '🛡️' },
              { key: 'accessory', label: `장신구 (${unequippedList.filter(i => i.slot === 'accessory').length})`, icon: '💍' },
            ].map(cat => (
              <button
                key={cat.key}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  equipCategory === cat.key
                    ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739] shadow-md shadow-[#42321955]' : 'bg-[#182030] text-[#8b9bb4] hover:text-white border border-[#26334a]'
                }`}
                onClick={() => setEquipCategory(cat.key as any)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 장비 목록 */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
            {filteredEquipment.length === 0 ? (
              <div className="panel p-8 text-center text-sm text-[#8b9bb4] flex flex-col items-center gap-2">
                <span className="text-3xl">🛡️</span>
                <span>{'보관 중인 미착용 장비가 없습니다.'}</span>
                <span className="text-xs text-[#607d8b]">
                  {'대장간에서 단조하거나 던전 탐험을 통해 획득할 수 있습니다.'}
                </span>
              </div>
            ) : (
              filteredEquipment.map(item => {
                const RARITY_COLORS: Record<string, string> = {
                  common: '#cfd8dc',
                  rare: '#00d2ff',
                  unique: '#ff9100',
                  epic: '#ce93d8',
                  legendary: '#ffd54f',
                };
                const color = RARITY_COLORS[item.rarity] || '#cfd8dc';
                const slotName = item.slot === 'weapon'
                  ? ('무기')
                  : item.slot === 'armor'
                  ? ('방어구')
                  : ('장신구');
                const locEq = item;
                const itemName = locEq?.name || item.name;

                return (
                  <div
                    key={item.id}
                    className="panel p-3 bg-[#131926] border border-[#222d42] rounded-xl hover:border-[#00d2ff88] hover:bg-[#172033] cursor-pointer transition-all active:scale-[0.99] flex flex-col gap-2"
                    onClick={() => setSelectedEquipDetail(item)}
                    title="탭하여 장비 상세 스탯 확인"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-sm">
                          <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={28} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm truncate" style={{ color }}>{itemName}</span>
                            {item.level > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                                +{item.level}
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1f2738] text-[#8b9bb4] font-bold">
                              {slotName}
                            </span>
                            {item.isCursed && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold">
                                {'저주'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#ffd54f] font-mono mt-0.5">
                            {Object.entries(item.stats).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ')}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-[#00d2ff] font-bold shrink-0 bg-[#00d2ff15] px-2 py-1 rounded border border-[#00d2ff33]">
                        {'🔍 상세보기'}
                      </span>
                    </div>

                    {(item.prefix || item.suffix) && (
                      <div className="text-[10px] text-[#ce93d8] bg-[#1a1228] px-2 py-1 rounded flex items-center gap-2">
                        {item.prefix && <span>✨ [{item.prefix.name}]</span>}
                        {item.suffix && <span>🔮 [{item.suffix.name}]</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 4. 📜 퀘스트 & 오파츠 & 특수 아이템 창고 탭 ── */}
      {storageTab === 'quest' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* 소분류 칩 바 */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121724] border-b border-[#1f2738] shrink-0 overflow-x-auto">
            {[
              { key: 'all', label: `전체 (${QUEST_ITEMS.length})`, icon: '📜' },
              { key: 'ooparts', label: `🏛️ 오파츠 (${QUEST_ITEMS.filter(q => q.subCategory === 'ooparts').length})`, icon: '📱' },
              { key: 'memoir', label: `📜 회고록 (${QUEST_ITEMS.filter(q => q.subCategory === 'memoir').length})`, icon: '📜' },
              { key: 'relic', label: `👑 보스 유물 (${QUEST_ITEMS.filter(q => q.subCategory === 'relic').length})`, icon: '🖤' },
              { key: 'catalyst', label: `🔮 심연 촉매 (${QUEST_ITEMS.filter(q => q.subCategory === 'catalyst').length})`, icon: '🧭' },
            ].map(cat => (
              <button
                key={cat.key}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  questCategory === cat.key
                    ? 'bg-[#3b2d54] text-[#e9d5ff] border border-[#7c3aed] shadow-md shadow-[#7c3aed33]'
                    : 'bg-[#182030] text-[#8b9bb4] hover:text-white border border-[#26334a]'
                }`}
                onClick={() => setQuestCategory(cat.key as any)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 아이템 목록 */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {filteredQuestItems.map(item => {
              const current = (state.resources as Record<string, number>)[item.key] || 0;
              const isCatalyst = item.subCategory === 'catalyst';
              const isCatalystActive = isCatalyst && gm.activeCatalysts.includes(item.key);
              const hasItem = isCatalyst ? isCatalystActive : current > 0;

              return (
                <div
                  key={item.key}
                  className={`panel p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    hasItem 
                      ? 'bg-[#131926] border-[#25354e] hover:border-[#7c3aed88] hover:bg-[#182033]' 
                      : 'bg-[#0f141f] border-[#1a2333] opacity-60 hover:opacity-90'
                  }`}
                  onClick={() => setSelectedItemDetail(item)}
                  title="탭하여 상세 설명 및 획득처 확인"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`p-2 rounded-xl border shrink-0 flex items-center justify-center shadow-sm ${
                      hasItem ? 'bg-[#251e36] border-[#7c3aed55]' : 'bg-[#161c28] border-[#253247]'
                    }`}>
                      <GameIcon name={item.key} icon={item.icon} size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-xs truncate ${hasItem ? 'text-white' : 'text-[#8b9bb4]'}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#1e2738] text-[#93c5fd] border border-[#2d3e58]">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8b9bb4] truncate mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    {isCatalyst ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isCatalystActive 
                          ? 'bg-[#38ef7d22] text-[#38ef7d] border-[#38ef7d55]' 
                          : 'bg-[#00d2ff15] text-[#00d2ff] border-[#00d2ff33]'
                      }`}>
                        {isCatalystActive ? '출격 활성' : '채비 가능'}
                      </span>
                    ) : (
                      <div className="font-mono text-xs">
                        <span className={`font-bold ${current > 0 ? 'text-[#ffd54f]' : 'text-[#546e7a]'}`}>
                          {current > 0 ? `×${current.toLocaleString()}` : '미보유'}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-[#00d2ff] font-bold hover:underline">
                      상세보기 ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 🔍 장비 상세 설명 모달 ── */}
      {selectedEquipDetail && (() => {
        const item = selectedEquipDetail;
        const RARITY_COLORS: Record<string, string> = {
          common: '#cfd8dc',
          rare: '#00d2ff',
          unique: '#ff9100',
          epic: '#ce93d8',
          legendary: '#ffd54f',
        };
        const RARITY_NAMES: Record<string, string> = {
          common: '일반',
          rare: '희귀',
          unique: '고유',
          epic: '영웅',
          legendary: '전설',
        };
        const color = RARITY_COLORS[item.rarity] || '#cfd8dc';
        const rName = RARITY_NAMES[item.rarity] || ('일반');
        const slotName = item.slot === 'weapon'
          ? ('무기')
          : item.slot === 'armor'
          ? ('방어구')
          : ('장신구');

        const locEquip = item;
        const equipName = locEquip?.name || item.name;
        const equipDesc = locEquip?.description || item.description;

        return (
          <Modal
            title={`${'장비 상세 도감 — '}${equipName}`}
            open={true}
            onClose={() => setSelectedEquipDetail(null)}
            footer={
              <div className="flex items-center justify-between w-full">
                <button
                  className="btn btn-ghost text-xs px-3 py-1.5"
                  onClick={() => setSelectedEquipDetail(null)}
                >
                  ✕ 닫기
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-danger text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md shadow-[#ef535033]"
                    onClick={() => {
                      const basePriceMap: Record<string, number> = {
                        common: 50,
                        rare: 150,
                        unique: 400,
                        epic: 400,
                        legendary: 1000,
                      };
                      const basePrice = basePriceMap[item.rarity] || 50;
                      const levelMultiplier = 1 + (item.level || 0) * 0.35;
                      const enchantBonus = (item.prefix ? 50 : 0) + (item.suffix ? 50 : 0);
                      const sellPrice = Math.max(10, Math.floor(basePrice * levelMultiplier + enchantBonus));

                      const confirmMsg = `[${equipName}]을(를) 골드 🪙 ${sellPrice.toLocaleString()} G에 매각하시겠습니까?`;

                      if (window.confirm(confirmMsg)) {
                        gm.modifyResource('gold', sellPrice);
                        gm.removeEquipmentItem(item.id);
                        SoundManager.getInstance().play('coin');
                        const logMsg = `🪙 [장비 매각] [${equipName}]을(를) 판매하여 🪙 ${sellPrice.toLocaleString()} G를 획득했습니다.`;
                        gm.addLog(logMsg, 'reward');
                        setSelectedEquipDetail(null);
                      }
                    }}
                  >
                    🪙 {'골드로 매각'} (🪙 {(() => {
                      const basePriceMap: Record<string, number> = {
                        common: 50,
                        rare: 150,
                        unique: 400,
                        epic: 400,
                        legendary: 1000,
                      };
                      const basePrice = basePriceMap[item.rarity] || 50;
                      const levelMultiplier = 1 + (item.level || 0) * 0.35;
                      const enchantBonus = (item.prefix ? 50 : 0) + (item.suffix ? 50 : 0);
                      return Math.max(10, Math.floor(basePrice * levelMultiplier + enchantBonus)).toLocaleString();
                    })()} G)
                  </button>
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              {/* 상단 헤더 */}
              <div
                className="panel p-3 bg-[#131926] rounded-xl flex items-center gap-3 border"
                style={{ borderColor: `${color}44` }}
              >
                <span
                  className="p-2 rounded-xl bg-[#323d4e] border shrink-0 flex items-center justify-center shadow-lg"
                  style={{ borderColor: `${color}66` }}
                >
                  <GameIcon name={item.templateId || getEquipmentTemplateId(item) || item.id} icon={item.icon} size={48} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm" style={{ color }}>{equipName}</span>
                    {item.level > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff44]">
                        +{item.level}
                      </span>
                    )}
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-bold border"
                      style={{ color, borderColor: `${color}44`, backgroundColor: `${color}15` }}
                    >
                      {rName} {slotName}
                    </span>
                    {item.isCursed && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535044]">
                        {'저주받음'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8b9bb4] mt-0.5">{equipDesc}</div>
                </div>
              </div>

              {/* 기본 스탯 리스트 */}
              <div className="p-3 rounded-xl bg-[#0e131f] border border-[#1f2738] flex flex-col gap-1.5">
                <div className="text-[10px] text-[#00d2ff] font-bold flex items-center gap-1">
                  <span>📊</span>
                  <span>{'장비 스탯 옵션'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(item.stats).map(([st, val]) => (
                    <div key={st} className="p-1.5 rounded bg-[#141a29] border border-[#222d42] flex items-center justify-between">
                      <span className="text-[#8b9bb4]">{st.toUpperCase()}</span>
                      <span className="text-[#ffd54f] font-bold">+{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 접두 / 접미 인챈트 정보 */}
              {(item.prefix || item.suffix) && (() => {
                const locPre = item.prefix;
                const locSuf = item.suffix;
                const preName = locPre?.name || item.prefix?.name;
                const preDesc = locPre?.description || item.prefix?.description;
                const sufName = locSuf?.name || item.suffix?.name;
                const sufDesc = locSuf?.description || item.suffix?.description;

                return (
                  <div className="p-3 rounded-xl bg-[#161224] border border-[#ce93d833] flex flex-col gap-1.5">
                    <div className="text-[10px] text-[#ce93d8] font-bold flex items-center gap-1">
                      <span>✨</span>
                      <span>{'마도 인챈트 옵션'}</span>
                    </div>
                    {item.prefix && (
                      <div className="text-[11px] text-[#ffd54f] bg-[#0c0915] p-2 rounded border border-[#ffd54f33]">
                        ✨ [{'접두'}: {preName}] {preDesc}
                      </div>
                    )}
                    {item.suffix && (
                      <div className="text-[11px] text-[#00d2ff] bg-[#0c0915] p-2 rounded border border-[#00d2ff33]">
                        🔮 [{'접미'}: {sufName}] {sufDesc}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 저주 페널티 안내 */}
              {item.isCursed && (
                <div className="p-3 rounded-xl bg-[#1a0f14] border border-[#ef535044] text-[11px] text-[#ef5350]">
                  <div className="font-bold text-[10px] mb-0.5">
                    {'⚠️ 심연의 저주 페널티'}
                  </div>
                  {item.curseDesc || ('착용 시 어둠의 페널티가 부여됩니다. 대장간 Lv.9에서 신성 정화할 수 있습니다.')}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── 🔍 아이템 상세 설명 모달 ── */}
      {selectedItemDetail && (() => {
        const item = selectedItemDetail;
        const isCatalyst = (item as any).subCategory === 'catalyst' || item.category === '심연 촉매';
        const isQuestItem = item.category === '오파츠 유물' || item.category === '스토리 회고록' || item.category === '신화 유물' || item.category === '심연 촉매';
        const current = (state.resources as Record<string, number>)[item.key] || 0;
        const maxCap = gm.getMaxResourceCapacity(item.key as any);
        const pct = maxCap > 0 ? Math.min(100, Math.round((current / maxCap) * 100)) : 0;
        const isFull = maxCap > 0 && current >= maxCap;

        const locSupply = item;
        const resName = item.label;
        const displayLabel = locSupply?.label || resName || item.label;
        const displayCategory = locSupply?.category || (item.category === '원정 보급품'
          ? ('원정 보급품')
          : (item.category));
        const displayDesc = locSupply?.desc || item.desc;
        const displayDetailDesc = locSupply?.detailDesc || item.detailDesc;
        const displaySources = locSupply?.sources || item.sources;
        const displayUsages = locSupply?.usages || item.usages;

        return (
          <Modal
            title={`${'자원 도감 — '}${displayLabel}`}
            open={true}
            onClose={() => setSelectedItemDetail(null)}
            footer={
              <div className="flex items-center justify-between w-full">
                <button
                  className="btn btn-ghost text-xs px-3 py-1.5"
                  onClick={() => setSelectedItemDetail(null)}
                >
                  ✕ 닫기
                </button>
                <div className="text-[11px] text-[#8b9bb4]">
                  {item.category === '원정 보급품' ? (
                    <>
                      보관 수량:{' '}
                      <span className="font-bold text-white font-mono">
                        {(gm.citadelSupplies?.[item.key] || 0).toLocaleString()}개
                      </span>
                    </>
                  ) : isQuestItem || maxCap <= 0 ? (
                    isCatalyst ? (
                      <span className="text-[#38ef7d] font-bold">
                        {gm.activeCatalysts.includes(item.key) ? '🟢 탐험 출격 활성 상태' : '⚪ 채비실 선택 가능'}
                      </span>
                    ) : (
                      <>
                        보유 수량:{' '}
                        <span className="font-bold text-[#ffd54f] font-mono">
                          {current > 0 ? `${current.toLocaleString()}개` : '미보유'}
                        </span>
                      </>
                    )
                  ) : (
                    <>
                      중앙 창고 적재량:{' '}
                      <span className="font-bold text-white font-mono">
                        {current.toLocaleString()}/{maxCap.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              {/* 상단: 아이템 헤더 */}
              <div className="panel p-3 bg-[#131926] border border-[#00d2ff44] rounded-xl flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-xl bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-md">
                  <GameIcon name={item.key || (item as any).id} icon={item.icon} size={28} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-white">{displayLabel}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff33]">
                      {displayCategory}
                    </span>
                    {isFull && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold">
                        {'적재 한도 도달'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#cfd8dc] mt-0.5">{displayDesc}</div>
                </div>
              </div>

              {/* 상세 배경 & 설정 설명 */}
              <div className="p-3 rounded-xl bg-[#0e131f] border border-[#1f2738] text-[11px] text-[#cfd8dc] leading-relaxed">
                <div className="text-[10px] text-[#ffd54f] font-bold mb-1 flex items-center gap-1">
                  <span>📖</span>
                  <span>{'자원 상세 설명'}</span>
                </div>
                {displayDetailDesc}
              </div>

              {/* 획득처 & 주요 활용처 2열 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 획득처 */}
                <div className="p-2.5 rounded-xl bg-[#0f1726] border border-[#24334a] flex flex-col gap-1">
                  <div className="text-[11px] font-bold text-[#38ef7d] flex items-center gap-1">
                    <span>📥</span>
                    <span>{'주요 획득처'}</span>
                  </div>
                  <ul className="flex flex-col gap-1 mt-0.5">
                    {displaySources.map((src, i) => (
                      <li key={i} className="text-[10px] text-[#cfd8dc] flex items-start gap-1">
                        <span className="text-[#38ef7d] shrink-0">•</span>
                        <span>{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 사용처 */}
                <div className="p-2.5 rounded-xl bg-[#0f1726] border border-[#24334a] flex flex-col gap-1">
                  <div className="text-[11px] font-bold text-[#ffd54f] flex items-center gap-1">
                    <span>📤</span>
                    <span>{'주요 활용처'}</span>
                  </div>
                  <ul className="flex flex-col gap-1 mt-0.5">
                    {displayUsages.map((use, i) => (
                      <li key={i} className="text-[10px] text-[#cfd8dc] flex items-start gap-1">
                        <span className="text-[#ffd54f] shrink-0">•</span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 창고 적재 현황 게이지 바 또는 퀘스트/유물 상태 배너 */}
              {maxCap > 0 ? (
                <div className="p-3 rounded-xl bg-[#0a0d14] border border-[#1f2738] flex flex-col gap-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b9bb4]">
                      {'현재 적재량 / 최대 한도'}
                    </span>
                    <span className="font-bold text-white">
                      {current.toLocaleString()} / {maxCap.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1a2234] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFull ? 'bg-[#ef5350]' : pct >= 80 ? 'bg-[#ffd54f]' : 'bg-[#38ef7d]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#607d8b] font-sans mt-0.5">
                    {'💡 방주 영지에서 [중앙 창고]를 증축하면 모든 자원의 보관 한도가 대폭 증가합니다.'}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#121622] border border-[#2b3952] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isCatalyst ? '🧭' : '📜'}</span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isCatalyst ? '심연 원정대 특수 촉매' : '영구 보관 및 도감 수집 아이템'}
                      </div>
                      <div className="text-[10px] text-[#8b9bb4]">
                        {isCatalyst 
                          ? '던전 출격 전 채비실에서 활성화하여 고유 탐험 보너스를 받습니다.' 
                          : '창고 적재 용량을 차지하지 않으며 영구적으로 보존됩니다.'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#ffd54f] px-2.5 py-1 rounded bg-[#251e36] border border-[#7c3aed44]">
                    {isCatalyst ? (gm.activeCatalysts.includes(item.key) ? '활성화 중' : '비활성') : (current > 0 ? `소지: ${current}개` : '미보유')}
                  </span>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
//  🏥 생체 복원 병동 (병실 슬롯 인터랙티브 배치 & 용병 선택 입원 UI)
// ─────────────────────────────────────────────────────────────
const InfirmaryDrawer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, gm } = useGameManager();
    const [selectedBedIdx, setSelectedBedIdx] = useState<number | null>(null);
  
  const infirmaryB = state.buildings['infirmary'];
  const infirmaryLv = infirmaryB?.level || 1;
  const capacity = gm.getInfirmaryCapacity();
  const healPeriod = Math.max(1, Math.floor(5 - (infirmaryLv - 1) * 0.4));
  const mpPeriod = gm.getInfirmaryMpPeriod(infirmaryLv);
  const mpHealAmount = gm.getInfirmaryMpHealAmount(infirmaryLv);

  // 최대 7개 병상 중 현재 레벨에서 해금된 병상과 다음 잠금 병상 목록
  const activeBeds = Array.from({ length: capacity }, (_, i) => i);
  const getNextBedUnlockLevel = (curLv: number) => {
    const beds = [0, 2, 2, 3, 3, 4, 5, 6, 6, 7, 7];
    const curBeds = beds[Math.min(10, Math.max(0, curLv))] || 0;
    for (let l = curLv + 1; l <= 10; l++) {
      if (beds[l] > curBeds) return l;
    }
    return null;
  };
  const nextUnlockLv = getNextBedUnlockLevel(infirmaryLv);
  const nextLockedBedCount = nextUnlockLv !== null ? 1 : 0;

  const handleDischarge = (heroId: string) => {
    gm.dischargeFromInfirmary(heroId);
  };

  const handleSelectHeroToAdmit = (heroId: string) => {
    gm.admitToInfirmary(heroId);
    setSelectedBedIdx(null);
  };

  // 모달에 띄울 용병 목록 (부상자 및 마나 소모자 우선 정렬)
  const sortedBarracks = [...state.barracks].sort((a, b) => {
    const effA = gm.getHeroEffectiveStats(a);
    const effB = gm.getHeroEffectiveStats(b);
    const aMissing = (effA.maxHp - a.currentHp) + (infirmaryLv >= 4 ? (effA.maxMp - a.currentMp) : 0);
    const bMissing = (effB.maxHp - b.currentHp) + (infirmaryLv >= 4 ? (effB.maxMp - b.currentMp) : 0);
    return bMissing - aMissing;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1320] border-b border-[#1f2738] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">💉</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">생체 복원 병동</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535044]">
                Lv.{infirmaryLv} ({state.infirmaryPatients.length}/{capacity}인)
              </span>
              <EncyclopediaBadge query="생체 복원" tab="systems" label="병동 백과" />
            </div>
            <div className="text-[11px] text-[#8b9bb4]">
              {`${healPeriod}초당 HP+5 회복 (🍖${infirmaryLv <= 3 ? 2 : 3})`}
              {infirmaryLv >= 4 ? ` · ${mpPeriod}초당 MP+4 충전 (✨1)` : ''}
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onBack}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* 메인 병실 슬롯 목록 */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        <div className="text-xs font-bold text-[#8b9bb4] flex items-center justify-between px-1">
          <span>🛏️ {'집중 치료 병실 슬롯 (최대 7병상)'}</span>
          <span className="text-[11px] text-[#00d2ff]">{'빈 병상 클릭 시 입원'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeBeds.map(bedIdx => {
            const patientId = state.infirmaryPatients[bedIdx];
            const hero = patientId ? state.barracks.find(h => h.id === patientId) : null;

            if (hero) {
              const cls = CHARACTER_CLASSES[hero.classId];
              const eff = gm.getHeroEffectiveStats(hero);
              const hpPct = Math.min(100, Math.round((hero.currentHp / eff.maxHp) * 100));
              const mpPct = Math.min(100, Math.round((hero.currentMp / eff.maxMp) * 100));
              const isFullHp = hero.currentHp >= eff.maxHp;
              const isFullMp = infirmaryLv < 4 || hero.currentMp >= eff.maxMp;
              const isFullyRecovered = isFullHp && isFullMp;

              return (
                <div
                  key={`bed_${bedIdx}`}
                  className="relative panel-accent p-3 rounded-xl border border-[#ef535044] bg-[#121724] flex flex-col justify-between gap-2 shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between border-b border-[#1f2738] pb-1.5">
                    <span className="text-xs font-bold text-[#ef5350] flex items-center gap-1">
                      <span>🛏️</span> {`제 ${bedIdx + 1}병상`}
                    </span>
                    {isFullyRecovered ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] animate-pulse">
                        {'✨ 완치 및 충전 완료'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]">
                        {`💉 생체 치료 중 (${healPeriod}s HP${infirmaryLv >= 4 ? ` / ${mpPeriod}s MP` : ''})`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-2xl p-1.5 rounded-lg bg-[#182030] border border-[#24334a]">
                      {cls?.skills[0]?.icon || '⚔️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">{hero.name}</span>
                        <span className="text-[10px] font-bold text-[#8b9bb4]">Lv.{hero.level}</span>
                      </div>
                      <div className="text-[11px] text-[#8b9bb4] truncate">
                        {cls?.name || hero.classId} • {hero.title}
                      </div>
                    </div>
                  </div>

                  {/* 체력 게이지 */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8b9bb4]">체력 회복도</span>
                      <span className={`font-mono font-bold ${isFullHp ? 'text-[#38ef7d]' : 'text-[#ffb74d]'}`}>
                        {Math.round(hero.currentHp)} / {Math.round(eff.maxHp)} ({hpPct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#182030] overflow-hidden border border-[#24334a]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFullHp ? 'bg-gradient-to-r from-[#11998e] to-[#38ef7d]' : 'bg-gradient-to-r from-[#f2994a] to-[#f2c94c]'
                        }`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 마나 게이지 (Lv.4 이상 에테르 충전) */}
                  {infirmaryLv >= 4 && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#8b9bb4] flex items-center gap-1">
                          <span>✨ 마나 충전도</span>
                          <span className="text-[9px] text-[#00d2ff] font-mono">({mpPeriod}s당 +4 MP)</span>
                        </span>
                        <span className={`font-mono font-bold ${hero.currentMp >= eff.maxMp ? 'text-[#00d2ff]' : 'text-[#81d4fa]'}`}>
                          {Math.round(hero.currentMp)} / {Math.round(eff.maxMp)} ({mpPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#182030] overflow-hidden border border-[#24334a]">
                        <div
                          className="h-full bg-gradient-to-r from-[#0288d1] to-[#00d2ff] transition-all duration-300"
                          style={{ width: `${mpPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#1f2738]">
                    <span className="text-[10px] text-[#8b9bb4]">
                      {isFullyRecovered 
                        ? ('원정대 복귀 준비 완료')
                        : ('자동 치료 및 충전 중...')}
                    </span>
                    <button
                      className={`btn text-xs px-3 py-1 ${
                        isFullyRecovered ? 'btn-success font-bold' : 'btn-ghost text-[#ef5350] hover:bg-[#ef535022]'
                      }`}
                      onClick={() => handleDischarge(hero.id)}
                    >
                      🚪 {'퇴원 조치'}
                    </button>
                  </div>
                </div>
              );
            }

            // 빈 병상 슬롯
            return (
              <div
                key={`bed_${bedIdx}`}
                onClick={() => setSelectedBedIdx(bedIdx)}
                className="panel p-3.5 rounded-xl border border-dashed border-[#2a3b5c] bg-[#0e142288] hover:bg-[#141d30] hover:border-[#00d2ff] cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px] transition-all group"
              >
                <div className="w-full flex items-center justify-between text-xs text-[#8b9bb4]">
                  <span className="font-bold flex items-center gap-1">
                    <span>🛏️</span> {`제 ${bedIdx + 1}병상`}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d15] text-[#38ef7d]">
                    {'빈 병상'}
                  </span>
                </div>
                <div className="text-3xl text-[#00d2ff] group-hover:scale-110 transition-transform">
                  ➕
                </div>
                <div className="text-xs font-bold text-[#cfd8dc] group-hover:text-[#00d2ff]">
                  {'용병 입원시키기'}
                </div>
                <div className="text-[10px] text-[#8b9bb4]">
                  {'클릭하여 치료/충전할 용병을 선택하세요'}
                </div>
              </div>
            );
          })}

          {/* 다음 레벨 잠금 병상 미리보기 */}
          {nextLockedBedCount > 0 && nextUnlockLv !== null && (
            <div className="panel p-3 rounded-xl border border-dashed border-[#1f2738] bg-[#0a0d1488] opacity-50 flex flex-col items-center justify-center gap-1.5 min-h-[120px]">
              <span className="text-xl">🔒</span>
              <span className="text-xs font-bold text-[#8b9bb4]">
                {`제 ${capacity + 1}병상 (잠김)`}
              </span>
              <span className="text-[10px] text-[#607d8b]">
                {`병동 증축(Lv.${nextUnlockLv}) 시 해금`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 🏥 용병 입원 선택 모달 ── */}
      {selectedBedIdx !== null && (
        <Modal
          title={`🏥 ${`제 ${selectedBedIdx + 1}병상 입원 - 용병 선택`}`}
          open={true}
          onClose={() => setSelectedBedIdx(null)}
        >
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="text-xs text-[#8b9bb4] mb-1">
              {'치료/충전이 필요한 용병을 선택하세요. (파티 편성 중인 용병은 입원 시 파티에서 자동 제외됩니다)'}
            </div>

            {sortedBarracks.map(hero => {
              const cls = CHARACTER_CLASSES[hero.classId];
              const eff = gm.getHeroEffectiveStats(hero);
              const isAdmitted = state.infirmaryPatients.includes(hero.id);
              const isFullHp = hero.currentHp >= eff.maxHp;
              const isFullMp = infirmaryLv < 4 || hero.currentMp >= eff.maxMp;
              const isFullyHealthy = isFullHp && isFullMp;
              const inParty = state.party.some(p => p.id === hero.id);
              const hpPct = Math.min(100, Math.round((hero.currentHp / eff.maxHp) * 100));
              const mpPct = Math.min(100, Math.round((hero.currentMp / eff.maxMp) * 100));

              return (
                <div
                  key={hero.id}
                  className={`panel p-2.5 flex items-center justify-between gap-2 transition-all ${
                    isAdmitted
                      ? 'opacity-40 border-[#1f2738]'
                      : isFullyHealthy
                      ? 'border-[#24334a] bg-[#0c101a]' : 'border-[#ef535044] bg-[#141b2b] hover:border-[#00d2ff]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl">{cls?.skills[0]?.icon || '⚔️'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{hero.name}</span>
                        <span className="text-[10px] text-[#8b9bb4]">Lv.{hero.level}</span>
                        {inParty && (
                          <span className="text-[9px] px-1 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                            원정대
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#8b9bb4]">
                        <span>HP {Math.round(hero.currentHp)}/{Math.round(eff.maxHp)}</span>
                        {infirmaryLv >= 4 && (
                          <span className="text-[#00d2ff]">MP {Math.round(hero.currentMp)}/{Math.round(eff.maxMp)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 max-w-[140px]">
                        <div className="h-1.5 rounded-full bg-[#182030] overflow-hidden flex-1">
                          <div
                            className={`h-full ${isFullHp ? 'bg-[#38ef7d]' : 'bg-[#f2994a]'}`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        {infirmaryLv >= 4 && (
                          <div className="h-1.5 rounded-full bg-[#182030] overflow-hidden flex-1">
                            <div
                              className={`h-full ${isFullMp ? 'bg-[#00d2ff]' : 'bg-[#0288d1]'}`}
                              style={{ width: `${mpPct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAdmitted ? (
                      <span className="text-xs text-[#8b9bb4] px-2 py-1">입원 중</span>
                    ) : isFullyHealthy ? (
                      <span className="text-xs text-[#38ef7d] px-2 py-1">완전 회복 (100%)</span>
                    ) : (
                      <button
                        className="btn btn-primary text-xs px-3 py-1 font-bold"
                        onClick={() => handleSelectHeroToAdmit(hero.id)}
                      >
                        💉 입원
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  🛒 블랙 마켓 (레벨별 순차 해금 & Lv.8 환율 우대 시스템)
// ─────────────────────────────────────────────────────────────
//  🕵️‍♂️ 블랙 마켓 (15종 자원 거래 & 레벨별 마도 비전서 스킬북 상점)
// ─────────────────────────────────────────────────────────────
const MarketDrawer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, gm } = useGameManager();
  const [filterCat, setFilterCat] = useState<'all' | 'basic' | 'farming' | 'rare'>('all');
  const [tradeModalItem, setTradeModalItem] = useState<{
    key: string;
    name: string;
    icon: string;
    category: 'basic' | 'farming' | 'rare';
    reqLv: number;
    baseBuy: number;
    baseSell: number;
    tierName: string;
    desc: string;
  } | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRestockTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const marketLv = state.buildings['market']?.level || 1;
  const perks = gm.getMarketPerks();
  const res = state.resources as unknown as Record<string, number>;

  // 17종 전 품목 거래 목록 (영지 생산품 5종 + 파밍 재료 5종 + 심연 재료 7종)
  const ALL_MARKET_ITEMS: {
    key: string;
    name: string;
    icon: string;
    category: 'basic' | 'farming' | 'rare';
    reqLv: number;
    baseBuy: number;
    baseSell: number;
    tierName: string;
    desc: string;
  }[] = [
    { key: 'wood',              name: '목재',         icon: '🪵', category: 'basic',   reqLv: 1, baseBuy: 6,   baseSell: 3,   tierName: '영지 생산품', desc: '시설 건축 및 연료의 기본' },
    { key: 'food',              name: '식량',         icon: '🍖', category: 'basic',   reqLv: 1, baseBuy: 10,  baseSell: 5,   tierName: '영지 생산품', desc: '원정대 보급 및 영지 운영 유지비' },
    { key: 'stone',             name: '석재',         icon: '🪨', category: 'basic',   reqLv: 2, baseBuy: 8,   baseSell: 4,   tierName: '영지 생산품', desc: '대장간 및 방벽 건축석' },
    { key: 'coal',              name: '석탄',         icon: '⬛', category: 'basic',   reqLv: 2, baseBuy: 15,  baseSell: 7,   tierName: '영지 생산품', desc: '고열 제련 및 횃불 제작' },
    { key: 'ether',             name: '에테르',       icon: '✨', category: 'basic',   reqLv: 4, baseBuy: 25,  baseSell: 12,  tierName: '영지 생산품', desc: '전직 승급 및 마도 연구/유지비' },
    { key: 'iron',              name: '철광석',       icon: '⚙️', category: 'farming', reqLv: 3, baseBuy: 26,  baseSell: 10,  tierName: '파밍 재료',   desc: '무기 및 중갑 방어구 단조 (+30% 매입가)' },
    { key: 'leather',           name: '가죽',         icon: '🥋', category: 'farming', reqLv: 3, baseBuy: 23,  baseSell: 9,   tierName: '파밍 재료',   desc: '붕대 및 가죽 방어구 제작 (+30% 매입가)' },
    { key: 'bone',              name: '짐승 뼈',      icon: '🦴', category: 'farming', reqLv: 3, baseBuy: 25,  baseSell: 10,  tierName: '파밍 재료',   desc: '특수 결속 및 마도 보조 장비 가공 (+30% 매입가)' },
    { key: 'herb',              name: '약초',         icon: '🌿', category: 'farming', reqLv: 4, baseBuy: 29,  baseSell: 11,  tierName: '파밍 재료',   desc: '치유 물약 및 정화 성수 (+30% 매입가)' },
    { key: 'silk',              name: '실크',         icon: '🧵', category: 'farming', reqLv: 4, baseBuy: 36,  baseSell: 14,  tierName: '파밍 재료',   desc: '마도 로브 및 부적 직조 (+30% 매입가)' },
    { key: 'crystal',           name: '마력 수정',   icon: '💎', category: 'rare',    reqLv: 5, baseBuy: 75,  baseSell: 25,  tierName: '심연 재료',   desc: '상위 장비 단조 및 나침반 (+50% 매입가)' },
    { key: 'prefix_stone',      name: '일반 접두석', icon: '✨', category: 'rare',    reqLv: 6, baseBuy: 120, baseSell: 40,  tierName: '심연 재료',   desc: '+3강 이상 공격 옵션 부여 (+50% 매입가)' },
    { key: 'suffix_stone',      name: '일반 접미석', icon: '🔮', category: 'rare',    reqLv: 6, baseBuy: 120, baseSell: 40,  tierName: '심연 재료',   desc: '+7강 이상 보조 옵션 부여 (+50% 매입가)' },
    { key: 'void_shard',        name: '공허 파편',   icon: '🌌', category: 'rare',    reqLv: 7, baseBuy: 135, baseSell: 45,  tierName: '심연 재료',   desc: '에픽 장비 및 2차 전설 승급 (+50% 매입가)' },
    { key: 'pure_prefix_stone', name: '순수 접두석', icon: '⭐', category: 'rare',    reqLv: 8, baseBuy: 300, baseSell: 100, tierName: '심연 재료',   desc: '+10강 전용 최고급 접두 옵션 (+50% 매입가)' },
    { key: 'pure_suffix_stone', name: '순수 접미석', icon: '🌌', category: 'rare',    reqLv: 8, baseBuy: 300, baseSell: 100, tierName: '심연 재료',   desc: '+10강 전용 최고급 접미 옵션 (+50% 매입가)' },
    { key: 'pure_mana_stone',   name: '순수 마도석', icon: '💠', category: 'rare',    reqLv: 9, baseBuy: 525, baseSell: 175, tierName: '심연 재료',   desc: '신화급 각성 및 차원 왜곡 (+50% 매입가)' },
  ];

  const filteredItems = ALL_MARKET_ITEMS.filter(item => {
    if (filterCat === 'all') return true;
    return item.category === filterCat;
  });

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🕵️‍♂️</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#66bb6a]">{'블랙 마켓'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#66bb6a22] text-[#66bb6a] font-bold">
                Lv.{marketLv}
              </span>
              <EncyclopediaBadge query="블랙 마켓" tab="buildings" label="마켓 백과" />
            </div>
            <div className="text-[10px] text-[#ffd54f]">
              {'금화'}: <span className="font-mono font-bold">🪙 {state.resources.gold.toLocaleString()}G</span>
              <span className="text-[#38ef7d] ml-2 font-bold">⏱️ {`유지비 주기: ${20 + marketLv}초`}</span>
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onBack}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* 특전 안내 배너 */}
      <div className="px-3 py-1.5 bg-[#121926] border-b border-[#1f2738] text-[10px] text-[#8b9bb4] flex items-center justify-between shrink-0">
        <span>
          {marketLv >= 8 ? (
            <span className="text-[#38ef7d] font-bold">✨ Lv.8 특전 활성: 매입가 -10% 할인 | 매각가 +15% 우대 환율</span>
          ) : (
            <span>💡 블랙 마켓 Lv.8 달성 시: 매입가 -10% / 매각가 +15% 환율 우대</span>
          )}
        </span>
        <span className="text-[#607d8b]">{`총 ${ALL_MARKET_ITEMS.length}종 품목`}</span>
      </div>

      {/* 카테고리 칩 바 */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        {[
          { key: 'all', label: `전체 (${ALL_MARKET_ITEMS.length})` },
          { key: 'basic', label: `🏰 ${'영지 생산품'}` },
          { key: 'farming', label: `🌿 ${'파밍 재료'}` },
          { key: 'rare', label: `🔮 ${'심연 재료'}` },
        ].map(cat => (
          <button
            key={cat.key}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              filterCat === cat.key
                ? 'bg-[#66bb6a] text-[#000] shadow' : 'bg-[#182030] text-[#8b9bb4] border border-[#26334a]'
            }`}
            onClick={() => setFilterCat(cat.key as any)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 시장 아이템 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
        {filteredItems.map(item => {
          const isUnlocked = marketLv >= item.reqLv;
          const cur = res[item.key] || 0;
          const maxCap = gm.getMaxResourceCapacity(item.key as any);
          const isFull = cur >= maxCap;

          const stockInfo = gm.getMarketStockInfo(item.key, item.category);
          const isSoldOut = stockInfo.isSoldOut;

          const finalBuy = Math.max(1, Math.floor(item.baseBuy * (1 - perks.buyDiscountPct / 100)));
          const finalSell = Math.max(1, Math.floor(item.baseSell * (1 + perks.sellBonusPct / 100)));

          const canBuy = isUnlocked && !isSoldOut && state.resources.gold >= finalBuy && !isFull;
          const canSell = isUnlocked && cur > 0;

          return (
            <div
              key={item.key}
              className={`panel p-3 bg-[#131926] border rounded-xl transition-all cursor-pointer ${
                isUnlocked
                  ? 'border-[#222d42] hover:border-[#00d2ff88] hover:bg-[#161f30]' : 'border-[#1f2738] bg-[#0e121a] opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (isUnlocked) {
                  setTradeModalItem(item);
                  setTradeMode(canBuy ? 'buy' : canSell ? 'sell' : 'buy');
                  setTradeQty(1);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 rounded-lg bg-[#323d4e] border border-[#4a576d] flex items-center justify-center shadow-sm">
                    <GameIcon name={item.key} icon={item.icon} size={24} />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#8b9bb4]">
                        {item.tierName}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8b9bb4] mt-0.5">{item.desc}</div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isUnlocked ? (
                    isSoldOut ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535022] text-[#ef5350] font-bold border border-[#ef535044] animate-pulse">
                        ⏳ 매진 ({formatRestockTime(stockInfo.restockRemainingSec)})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd54f18] text-[#ffd54f] font-mono font-bold border border-[#ffd54f33]">
                        매입 재고: {stockInfo.current}/{stockInfo.max}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535018] text-[#ef5350] font-bold border border-[#ef535033]">
                      마켓 Lv.{item.reqLv} 필요
                    </span>
                  )}
                </div>
              </div>

              {isUnlocked ? (
                <div className="pt-2 border-t border-[#1f2738] flex items-center justify-between gap-2">
                  <div className="text-xs font-mono">
                    <span className="text-[#8b9bb4]">보유: </span>
                    <span className={`font-bold ${isFull ? 'text-[#ef5350]' : 'text-white'}`}>{cur.toLocaleString()}</span>
                    <span className="text-[#607d8b]">/{maxCap.toLocaleString()}</span>
                    {isFull && <span className="text-[9px] text-[#ef5350] ml-1 font-bold">[FULL]</span>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSoldOut ? (
                      <button
                        disabled
                        className="btn btn-ghost text-xs px-2.5 py-1 font-bold opacity-50 cursor-not-allowed text-[#ef5350] border border-[#ef535044]"
                      >
                        ⏳ 매진 ({formatRestockTime(stockInfo.restockRemainingSec)})
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary text-xs px-2.5 py-1 font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTradeModalItem(item);
                          setTradeMode('buy');
                          setTradeQty(1);
                        }}
                      >
                        📦 매입 <span className="text-[10px] opacity-80">🪙{finalBuy}G</span>
                      </button>
                    )}
                    <button
                      className="btn btn-success text-xs px-2.5 py-1 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeModalItem(item);
                        setTradeMode('sell');
                        setTradeQty(Math.max(1, Math.min(cur, 1)));
                      }}
                    >
                      🪙 매각 <span className="text-[10px] opacity-80">🪙+{finalSell}G</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#1f2738] text-[11px] text-[#505c73] flex items-center gap-1">
                  <span>🔒</span>
                  <span>블랙 마켓을 레벨 {item.reqLv}(으)로 증축하면 거래가 해금됩니다.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 🛒 자원 대량 거래 슬라이더 모달 ── */}
      {tradeModalItem && (() => {
        const item = tradeModalItem;
        const cur = res[item.key] || 0;
        const maxCap = gm.getMaxResourceCapacity(item.key as any);
        const finalBuy = Math.max(1, Math.floor(item.baseBuy * (1 - perks.buyDiscountPct / 100)));
        const finalSell = Math.max(1, Math.floor(item.baseSell * (1 + perks.sellBonusPct / 100)));

        const stockInfo = gm.getMarketStockInfo(item.key, item.category);
        const maxBuyAffordable = finalBuy > 0 ? Math.floor(state.resources.gold / finalBuy) : 0;
        const maxBuyCapacity = Math.max(0, maxCap - cur);
        const maxBuyStock = stockInfo.current;
        const maxBuy = Math.max(0, Math.min(maxBuyAffordable, maxBuyCapacity, maxBuyStock));
        const maxSell = cur; // 판매는 제한 없음

        const maxPossible = tradeMode === 'buy' ? maxBuy : maxSell;
        const pricePerUnit = tradeMode === 'buy' ? finalBuy : finalSell;
        const totalGoldAmount = tradeQty * pricePerUnit;

        const canExecute = tradeMode === 'buy'
          ? (tradeQty > 0 && tradeQty <= maxBuyStock && tradeQty <= maxBuyCapacity && state.resources.gold >= totalGoldAmount)
          : (tradeQty > 0 && tradeQty <= cur);

        const handleExecuteTrade = () => {
          if (!canExecute) return;
          if (tradeMode === 'buy') {
            const ok = gm.buyResource(item.key as any, tradeQty, finalBuy, item.category);
            if (ok) {
              SoundManager.getInstance().play('coin');
              setTradeModalItem(null);
            }
          } else {
            const ok = gm.sellResource(item.key as any, tradeQty, finalSell);
            if (ok) {
              SoundManager.getInstance().play('coin');
              setTradeModalItem(null);
            }
          }
        };

        return (
          <Modal
            title={`자원 일괄 거래 — ${item.name}`}
            open={true}
            onClose={() => setTradeModalItem(null)}
          >
            <div className="flex flex-col gap-3">
              {/* 아이템 요약 정보 */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#131926] border border-[#1f2738]">
                <span className="text-3xl p-2 rounded-xl bg-[#323d4e] border border-[#4a576d] flex items-center justify-center shadow-md">
                  <GameIcon name={item.key} icon={item.icon} size={28} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#8b9bb4] font-bold">
                      {item.tierName}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8b9bb4] mt-0.5">{item.desc}</div>
                  <div className="text-xs font-mono mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[#ffd54f]">창고: <span className="font-bold text-white">{cur.toLocaleString()}</span>/{maxCap.toLocaleString()}개</span>
                    <span className="text-[#64748b]">|</span>
                    <span className={stockInfo.isSoldOut ? 'text-[#ef5350] font-bold' : 'text-[#38ef7d]'}>
                      상점 재고: <span className="font-bold">{stockInfo.current}</span>/{stockInfo.max}개
                      {stockInfo.isSoldOut && ` (매진: ${formatRestockTime(stockInfo.restockRemainingSec)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 매진 시 안내 경고창 */}
              {tradeMode === 'buy' && stockInfo.isSoldOut && (
                <div className="p-2.5 rounded-xl bg-[#ef535018] border border-[#ef535033] text-center text-xs text-[#ef5350] font-bold">
                  ⏳ 상점의 매입 물량이 전량 매진되었습니다.
                  <div className="font-mono text-sm text-white mt-1">재입고까지 {formatRestockTime(stockInfo.restockRemainingSec)}</div>
                </div>
              )}

              {/* 매입 vs 매각 탭 선택 */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0e121d] border border-[#1f2738]">
                <button
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tradeMode === 'buy'
                      ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739] shadow-md shadow-[#42321955]' : 'text-[#8b9bb4] hover:text-white'
                  }`}
                  onClick={() => {
                    setTradeMode('buy');
                    setTradeQty(Math.max(1, Math.min(maxBuy, 1)));
                  }}
                >
                  <span>📦</span>
                  <span>대량 매입 (구매)</span>
                  <span className="text-[10px] opacity-80">🪙 {finalBuy}G/개</span>
                </button>
                <button
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tradeMode === 'sell'
                      ? 'bg-[#38ef7d] text-black shadow-lg shadow-[#38ef7d33]' : 'text-[#8b9bb4] hover:text-white'
                  }`}
                  onClick={() => {
                    setTradeMode('sell');
                    setTradeQty(Math.max(1, Math.min(cur, 1)));
                  }}
                >
                  <span>🪙</span>
                  <span>대량 매각 (판매)</span>
                  <span className="text-[10px] opacity-80">🪙 +{finalSell}G/개</span>
                </button>
              </div>

              {/* 수량 선택기 및 슬라이더 */}
              <div className="panel p-3.5 bg-[#101522] border border-[#1f2738] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b9bb4] font-bold">거래 수량 선택</span>
                  <div className="text-xs font-mono">
                    {tradeMode === 'buy' ? (
                      <span className="text-[#8b9bb4]">
                        최대 매입 가능: <span className="text-[#00d2ff] font-bold">{maxPossible.toLocaleString()}개</span>
                        {stockInfo.isSoldOut ? (
                          <span className="text-[#ef5350] ml-1 font-bold">({formatRestockTime(stockInfo.restockRemainingSec)} 후 입고)</span>
                        ) : (
                          <span className="text-[#ffd54f] ml-1">(재고: {stockInfo.current}개)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#8b9bb4]">
                        보유량(무제한 판매 가능): <span className="text-[#38ef7d] font-bold">{maxPossible.toLocaleString()}개</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 수량 입력 & +/- 증감 버튼 */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="btn btn-ghost px-3 py-1.5 text-base font-bold rounded-lg border border-[#222d42]"
                    disabled={tradeQty <= 1}
                    onClick={() => setTradeQty(Math.max(1, tradeQty - 1))}
                  >
                    -1
                  </button>
                  <div className="flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-[#080b12] border border-[#222d42]">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, maxPossible)}
                      value={tradeQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val)) setTradeQty(1);
                        else setTradeQty(Math.max(1, Math.min(Math.max(1, maxPossible), val)));
                      }}
                      className="w-16 text-center font-mono font-bold text-lg text-white bg-transparent outline-none"
                    />
                    <span className="text-xs text-[#8b9bb4]">개</span>
                  </div>
                  <button
                    className="btn btn-ghost px-3 py-1.5 text-base font-bold rounded-lg border border-[#222d42]"
                    disabled={tradeQty >= maxPossible || maxPossible <= 0}
                    onClick={() => setTradeQty(Math.min(maxPossible, tradeQty + 1))}
                  >
                    +1
                  </button>
                </div>

                {/* 부드러운 슬라이더 */}
                <div className="flex flex-col gap-1 px-1">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, maxPossible)}
                    value={maxPossible <= 0 ? 1 : Math.min(maxPossible, tradeQty)}
                    disabled={maxPossible <= 0}
                    onChange={(e) => setTradeQty(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg cursor-pointer bg-[#1a2234] accent-[#00d2ff]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#505c73]">
                    <span>1개</span>
                    <span>{Math.floor(maxPossible / 2) || 1}개</span>
                    <span>{maxPossible}개 (최대)</span>
                  </div>
                </div>

                {/* 빠른 프리셋 버튼 */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: '1개', val: 1 },
                    { label: '+10개', val: tradeQty + 10 },
                    { label: '+50개', val: tradeQty + 50 },
                    { label: '최대(MAX)', val: maxPossible },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      className="btn btn-ghost py-1 text-[11px] font-bold rounded-lg bg-[#151c2c] border border-[#222d42] hover:border-[#00d2ff66]"
                      disabled={maxPossible <= 0}
                      onClick={() => setTradeQty(Math.max(1, Math.min(maxPossible, p.val)))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 정산 요약 및 변동 미리보기 */}
              <div className="p-3 rounded-xl bg-[#0c101a] border border-[#1f2738] text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b9bb4]">
                    {tradeMode === 'buy' ? '총 필요 골드:' : '총 획득 골드:'}
                  </span>
                  <span className={`font-mono font-bold text-sm ${tradeMode === 'buy' ? 'text-[#ffd54f]' : 'text-[#38ef7d]'}`}>
                    {tradeMode === 'buy' ? `🪙 ${totalGoldAmount.toLocaleString()}G` : `🪙 +${totalGoldAmount.toLocaleString()}G`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8b9bb4]">보유 골드 변동:</span>
                  <span className="font-mono">
                    {state.resources.gold.toLocaleString()}G ➔{' '}
                    <span className={tradeMode === 'buy' ? 'text-[#ffd54f] font-bold' : 'text-[#38ef7d] font-bold'}>
                      {tradeMode === 'buy'
                        ? `${Math.max(0, state.resources.gold - totalGoldAmount).toLocaleString()}G`
                        : `${(state.resources.gold + totalGoldAmount).toLocaleString()}G`}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8b9bb4]">창고 재고 변동:</span>
                  <span className="font-mono">
                    {cur.toLocaleString()}개 ➔{' '}
                    <span className="text-white font-bold">
                      {tradeMode === 'buy' ? `${cur + tradeQty}개` : `${cur - tradeQty}개`}
                    </span>
                    <span className="text-[#505c73]"> / {maxCap}개</span>
                  </span>
                </div>
              </div>

              {/* 실행 버튼 */}
              <div className="flex gap-2 pt-1">
                <button
                  className="btn btn-ghost flex-1 py-2 text-xs font-bold"
                  onClick={() => setTradeModalItem(null)}
                >
                  취소
                </button>
                <button
                  className={`btn flex-[2] py-2 text-xs font-bold ${
                    tradeMode === 'buy' ? 'btn-primary' : 'btn-success'
                  }`}
                  disabled={!canExecute}
                  onClick={handleExecuteTrade}
                >
                  {tradeMode === 'buy'
                    ? (stockInfo.isSoldOut
                        ? `⏳ 매진 (${formatRestockTime(stockInfo.restockRemainingSec)} 후 입고)`
                        : `🪙 ${totalGoldAmount.toLocaleString()}G 지불하고 ${tradeQty}개 매입`)
                    : `🪙 +${totalGoldAmount.toLocaleString()}G 획득하고 ${tradeQty}개 매각`}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  🧪 마도서 제작 비전 & 상세 설명 모달 (GrimoireCraftDetailModal)
// ─────────────────────────────────────────────────────────────
interface GrimoireCraftDetailModalProps {
  recipe: GrimoireRecipe;
  alchemyLv: number;
  isPaused: boolean;
  resources: GameResources;
  onClose: () => void;
  onCraft: (recipeId: string) => void;
}

const GrimoireCraftDetailModal: React.FC<GrimoireCraftDetailModalProps> = ({
  recipe,
  alchemyLv,
  isPaused,
  resources,
  onClose,
  onCraft
}) => {
  const rMeta = GRIMOIRE_RARITY_META[recipe.rarity] || GRIMOIRE_RARITY_META.common;
  const isUnlocked = alchemyLv >= recipe.reqAlchemyLv;
  const res = resources as unknown as Record<string, number>;
  const canAfford = isUnlocked && !isPaused && Object.entries(recipe.cost).every(
    ([k, v]) => (res[k] || 0) >= (v as number)
  );

  const skill = recipe.skill;
  const tags = getSkillTags(skill);
  const combos = getTriggerableCombos(skill);

  const targetLabel = skill.targetType === 'all_enemies' ? '대상 파티 (적 전체)'
    : skill.targetType === 'all_allies' ? '아군 파티 (전체)'
    : skill.targetType === 'single_ally' ? '단일 아군'
    : skill.targetType === 'self' ? '자신 (시전자)'
    : '단일 적';

  const posLabel = skill.positionBonus === 'front' ? '전열 특화' : skill.positionBonus === 'back' ? '후열 저격' : skill.positionBonus === 'any' ? '전/후열 대응' : null;
  const posColor = skill.positionBonus === 'front' ? '#ef5350' : skill.positionBonus === 'back' ? '#42a5f5' : '#ab47bc';

  const effectLabelMap: Record<string, string> = {
    damage: '물리/마법 피해',
    heal: '생명력 치유',
    shield: '보호막 방벽',
    buff: '능력치 강화 버프',
    debuff: '능력치 약화 디버프',
    bleed: '지속 출혈 피해',
    poison: '맹독 누적 피해',
    stun: '행동 불능 기절',
    drain: '생명력/마나 흡수'
  };
  const effectText = effectLabelMap[skill.effectType || 'damage'] || '전투 마도 효과';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-[420px] bg-[#0b0f19] border rounded-2xl shadow-2xl p-4 flex flex-col gap-3 text-left animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: `${rMeta.color}88` }}
      >
        {/* 헤더: 아이콘 + 이름 + 등급 뱃지 + 출처 클래스 + 닫기 */}
        <div className="flex items-start justify-between gap-2 border-b border-[#1b263b] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="text-3xl p-2 rounded-xl bg-[#141d2f] border flex items-center justify-center shadow-md shrink-0"
              style={{ borderColor: `${rMeta.color}55` }}
            >
              <GameIcon name={skill.id} icon={skill.icon || '📖'} size={32} />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-white">{recipe.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                >
                  {rMeta.label} 등급
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#ffd54f1f] text-[#ffd54f] border border-[#ffd54f44]">
                  🎲 성공률 {GRIMOIRE_CRAFT_SUCCESS_RATES[recipe.rarity] || 80}%
                </span>
                {recipe.sourceClass && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#3949ab22] text-[#7986cb] border border-[#3949ab44] font-bold">
                    👤 {recipe.sourceClass} 비전
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8b9bb4] mt-0.5 flex items-center gap-1.5">
                <span>📖 에테르 제본 마도서</span>
                <span>•</span>
                {isUnlocked ? (
                  <span className="text-[#38ef7d] font-bold">제작 가능 (성공률 {GRIMOIRE_CRAFT_SUCCESS_RATES[recipe.rarity] || 80}%)</span>
                ) : (
                  <span className="text-[#ef5350] font-bold">공방 Lv.{recipe.reqAlchemyLv} 이상 해금</span>
                )}
              </div>
            </div>
          </div>
          <button
            className="w-7 h-7 rounded-lg bg-[#141b2c] text-[#8b9bb4] hover:text-white flex items-center justify-center border border-[#23324d] transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 4분할 핵심 스펙 그리드 */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">마나 소모</span>
            <span className="text-xs font-bold text-[#64b5f6]">{skill.manaCost} MP</span>
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">쿨다운</span>
            <span className="text-xs font-bold text-[#ffd54f]">{skill.cooldown || 0}턴</span>
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">위력 계수</span>
            <span className="text-xs font-bold text-[#38ef7d]">{Math.round((skill.power || 1.0) * 100)}%</span>
          </div>
          <div className="bg-[#101726] p-2 rounded-xl border border-[#1e2a3f]">
            <span className="text-[10px] text-[#8b9bb4] block">대상</span>
            <span className="text-[10px] font-bold text-[#cfd8dc] truncate block">{targetLabel}</span>
          </div>
        </div>

        {/* 🏷️ 스킬 특성 태그 뱃지 바 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map(t => (
            <span
              key={t.id}
              className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
          ))}
        </div>

        {/* 효과 유형 & 포지션 보너스 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-[#141d2f] border border-[#22314d] text-[#b0bec5] flex items-center gap-1.5">
            <span className="text-[10px] text-[#8b9bb4]">효과 속성:</span>
            <span className="font-bold text-white">{effectText}</span>
            {skill.statusDuration && (
              <span className="text-[10px] text-[#ffd54f]">({skill.statusDuration}턴)</span>
            )}
          </div>
          {posLabel && (
            <div
              className="px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold"
              style={{ borderColor: `${posColor}44`, backgroundColor: `${posColor}15`, color: posColor }}
            >
              <span>📍 {posLabel}</span>
            </div>
          )}
        </div>

        {/* 상세 효과 설명 */}
        <div className="p-3 rounded-xl bg-[#101726] border border-[#1e2a3f] flex flex-col gap-1">
          <div className="text-[11px] font-bold text-[#00d2ff]">📖 마도서 비전 효과</div>
          <div className="text-xs text-[#e2e8f0] leading-relaxed whitespace-pre-line">
            {recipe.desc || skill.description}
          </div>
        </div>

        {/* ⚡ 상태이상 연계 메커니즘 섹션 */}
        {combos.length > 0 ? (
          <div className="p-2.5 rounded-xl bg-[#111a2c] border border-[#00d2ff33] flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-[#ffd54f] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>⚡ 상태이상 연계 메커니즘</span>
              </span>
              <span className="text-[9px] text-[#8b9bb4] font-normal">적 상태이상 시 발동</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
              {combos.map(c => (
                <div key={c.comboName} className="text-xs p-2 rounded-lg bg-[#0b101b] border border-[#1d273a] flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1">
                      <span>{c.icon}</span>
                      <span>{c.comboName}</span>
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                      style={{ backgroundColor: `${c.bannerColor}18`, color: c.bannerColor, border: `1px solid ${c.bannerColor}44` }}
                    >
                      필요 적 상태: {c.triggerStatus}
                    </span>
                  </div>
                  {/* 연계 스킬 태그 뱃지 */}
                  <div className="flex items-center gap-1 flex-wrap text-[9px]">
                    <span className="text-[#8b9bb4]">연계 스킬 태그:</span>
                    {c.requiredTagIds.map(tId => {
                      const tMeta = getTagMeta(tId);
                      return (
                        <span
                          key={tId}
                          className="px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5"
                          style={{ backgroundColor: tMeta.bg, color: tMeta.text, border: `1px solid ${tMeta.border}` }}
                        >
                          <span>{tMeta.icon}</span>
                          <span>{tMeta.label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#cfd8dc] leading-snug">{c.fullDesc}</div>
                </div>
              ))}
            </div>
            {/* 💡 연계 메커니즘 안내 팁 */}
            <div className="p-2 rounded-lg bg-[#0a1220] border border-[#223652] text-[10px] text-[#90caf9] flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span>
                적에게 해당 상태이상이 걸려 있을 때 일치하는 태그 스킬로 공격하면 연계 콤보가 폭발합니다.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#111a2c] border border-[#22324f] text-[11px] text-[#8b9bb4]">
            💡 이 스킬은 독립적인 직타/강화형 비전으로, 언제나 즉시 최대 위력을 발휘합니다.
          </div>
        )}

        {/* 🧪 제작 비용 및 보유 자원 */}
        <div className="p-3 rounded-xl bg-[#0c101a] border border-[#1f2738] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b9bb4] font-bold">🧪 제본 소모 재료</span>
            {!isUnlocked && (
              <span className="text-[#ef5350] text-[11px] font-bold">공방 Lv.{recipe.reqAlchemyLv} 이상 필요</span>
            )}
            {isPaused && (
              <span className="text-[#ef5350] text-[11px] font-bold">공방 가동 중단 상태</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderCostBadges(recipe.cost, resources, false)}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 justify-end pt-1">
          <button className="btn btn-ghost text-xs px-3 py-2" onClick={onClose}>
            닫기
          </button>
          <button
            className={`btn text-xs px-4 py-2 font-bold flex items-center gap-1.5 ${
              !isUnlocked || !canAfford || isPaused ? 'btn-ghost opacity-60 cursor-not-allowed' : 'btn-primary'
            }`}
            disabled={!isUnlocked || !canAfford || isPaused}
            onClick={() => {
              onCraft(recipe.id);
            }}
          >
            <span>🧪</span>
            <span>
              {!isUnlocked
                ? `공방 Lv.${recipe.reqAlchemyLv} 필요`
                : isPaused
                ? '공방 가동 중단'
                : canAfford
                ? '마도서 제작하기'
                : '제작 재료 부족'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  🧪 에테르 연금 공방 (마도서 제작 & 최고 10레벨 비전 강화)
// ─────────────────────────────────────────────────────────────
const AlchemyDrawer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, gm } = useGameManager();
  const [activeTab, setActiveTab] = useState<'enhance' | 'craft'>('enhance');
  const [selectedHeroFilter, setSelectedHeroFilter] = useState<string>('all');
  const [recipeRarityFilter, setRecipeRarityFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [enhanceModalTarget, setEnhanceModalTarget] = useState<{ hero: Mercenary; skill: Skill } | null>(null);
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<GrimoireRecipe | null>(null);

  const alchemyLv = state.buildings['alchemy']?.level || 1;
  const isPaused = state.buildings['alchemy']?.isPaused || false;
  const res = state.resources as unknown as Record<string, number>;
  const maxEnhanceAllowed = GameManager.getAlchemyMaxEnhanceLevel(alchemyLv);

  const recipes = useMemo(() => gm.getGrimoireRecipes(), [gm]);

  const filteredRecipes = useMemo(() => {
    if (recipeRarityFilter === 'all') return recipes;
    return recipes.filter(r => r.rarity === recipeRarityFilter);
  }, [recipes, recipeRarityFilter]);

  // 성채의 모든 가용 용병 (barracks + party 고유 목록)
  const allAvailableHeroes = useMemo(() => {
    const map = new Map<string, Mercenary>();
    for (const h of (state.barracks || [])) {
      if (h?.id) map.set(h.id, h);
    }
    for (const h of (state.party || [])) {
      if (h?.id) map.set(h.id, h);
    }
    return Array.from(map.values());
  }, [state.barracks, state.party]);

  // 모든 용병이 습득한 스킬 목록 집계
  const allLearnedSkills = useMemo(() => {
    const list: {
      hero: Mercenary;
      skill: Skill;
      level: number;
      matchingBookCount: number;
    }[] = [];
    for (const h of allAvailableHeroes) {
      for (const sid of (h.learnedSkills || [])) {
        const sk = gm.resolveSkillData(sid, h);
        if (sk) {
          const bCount = (state.skillBookInventory || [])
            .filter(b => b.skill?.id === sid || b.skill?.name === sk.name || b.bookId === sid)
            .reduce((sum, b) => sum + (b.count || 1), 0);
          list.push({
            hero: h,
            skill: sk,
            level: h.skillLevels?.[sid] || 1,
            matchingBookCount: bCount
          });
        }
      }
    }
    return list;
  }, [allAvailableHeroes, state.skillBookInventory, gm]);

  // 필터링된 스킬 목록
  const filteredSkills = useMemo(() => {
    if (selectedHeroFilter === 'all') return allLearnedSkills;
    return allLearnedSkills.filter(item => item.hero.id === selectedHeroFilter);
  }, [allLearnedSkills, selectedHeroFilter]);

  const selectedHeroObj = useMemo(() => {
    if (selectedHeroFilter === 'all') return null;
    return allAvailableHeroes.find(h => h.id === selectedHeroFilter) || null;
  }, [allAvailableHeroes, selectedHeroFilter]);

  const [craftingRecipe, setCraftingRecipe] = useState<GrimoireRecipe | null>(null);
  const [pendingGrimoireOutcome, setPendingGrimoireOutcome] = useState<'success' | 'drop'>('success');
  // ⏳ 마도서 티어별 점진적 소요 시간 (1티어: 2.0초, 2티어: 2.8초, 3티어: 3.8초)
  const grimoireDurationMs = (craftingRecipe?.tier || 1) <= 1 ? 2000 : ((craftingRecipe?.tier || 1) === 2 ? 2800 : 3800);

  const handleCraft = (recipeId: string) => {
    const r = GRIMOIRE_CRAFT_RECIPES.find(rc => rc.id === recipeId);
    if (r) {
      const successRate = gm.getGrimoireCraftSuccessRate(r.rarity);
      const willSucceed = (Math.random() * 100) < successRate;
      setPendingGrimoireOutcome(willSucceed ? 'success' : 'drop');
      setCraftingRecipe(r);
    } else {
      gm.craftSkillBook(recipeId);
    }
  };

  const handleGrimoireCraftComplete = () => {
    if (craftingRecipe) {
      const isForcedSuccess = pendingGrimoireOutcome === 'success';
      gm.craftSkillBook(craftingRecipe.id, isForcedSuccess);
      setCraftingRecipe(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#26a69a]">{'에테르 연금 공방'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#26a69a22] text-[#26a69a] font-bold">
                Lv.{alchemyLv}
              </span>
              {isPaused && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold">
                  [가동 중단됨]
                </span>
              )}
              <EncyclopediaBadge tab="skills" label="연금 백과" />
            </div>
            <div className="text-[10px] text-[#80cbc4]">
              {'에테르'}: <span className="font-mono font-bold">✨ {state.resources.ether.toLocaleString()}</span>
              <span className="text-[#ffd54f] ml-2 font-bold">🪙 {state.resources.gold.toLocaleString()}G</span>
              <span className="text-[#8b9bb4] ml-2 font-mono">최대 강화 한도: Lv.{maxEnhanceAllowed}</span>
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onBack}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* 탭 전환 바 */}
      <div className="flex gap-1 p-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        <button
          className={`btn flex-1 py-1.5 text-xs font-bold transition-all ${activeTab === 'enhance' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('enhance')}
        >
          ✨ {`습득 스킬 강화 (${allLearnedSkills.length}개)`}
        </button>
        <button
          className={`btn flex-1 py-1.5 text-xs font-bold transition-all ${activeTab === 'craft' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('craft')}
        >
          📖 {`마도서 제작 (${recipes.length}종)`}
        </button>
      </div>

      {/* 탭 1: 습득 스킬 비전 강화 목록 */}
      {activeTab === 'enhance' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* ── 영웅 필터 탭 바 (상단 고정 shrink-0) ── */}
          {allAvailableHeroes.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0d16] border-b border-[#1f2738] overflow-x-auto shrink-0 scrollbar-none shadow-inner">
              <button
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedHeroFilter === 'all'
                    ? 'bg-[#26a69a] text-black font-extrabold shadow-sm'
                    : 'bg-[#141b2c] text-[#8b9bb4] hover:text-white hover:bg-[#1a2338] border border-[#222d42]'
                }`}
                onClick={() => setSelectedHeroFilter('all')}
              >
                <span>전체 용병</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedHeroFilter === 'all' ? 'bg-black/30 text-black font-black' : 'bg-[#0a0d14] text-[#80cbc4]'
                }`}>
                  {allLearnedSkills.length}
                </span>
              </button>
              {allAvailableHeroes.map(h => {
                const count = allLearnedSkills.filter(i => i.hero.id === h.id).length;
                const isSelected = selectedHeroFilter === h.id;
                const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === h.classId);
                return (
                  <button
                    key={h.id}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#26a69a] text-black font-extrabold shadow-sm'
                        : 'bg-[#141b2c] text-[#8b9bb4] hover:text-white hover:bg-[#1a2338] border border-[#222d42]'
                    }`}
                    onClick={() => setSelectedHeroFilter(h.id)}
                  >
                    <span>{cls?.icon || '👤'}</span>
                    <span>{h.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-black/30 text-black font-black'
                        : count > 0 ? 'bg-[#26a69a22] text-[#26a69a]' : 'bg-[#0a0d14] text-[#55657e]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
            {/* 가동 중단 알림 */}
            {isPaused && (
              <div className="p-2.5 rounded-lg bg-[#2a1215] border border-[#ef535055] text-xs text-[#ef5350] flex items-center gap-2">
                <span>⚠️</span>
                <span>식량 부족으로 공방 가동이 중단되었습니다. 식량을 보충하여 공방을 재가동하세요.</span>
              </div>
            )}

            {/* 안내 배너 */}
            <div className="p-3 bg-[#121926] border border-[#26a69a44] rounded-xl text-[11px] text-[#cfd8dc] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#26a69a] text-xs">✨ 용병 습득 스킬 비전 강화</div>
                <div>용병들이 습득한 스킬을 강화합니다. 강화 시 위력(+12%)과 소모 MP(+25%)가 증가합니다.</div>
              </div>
              <div className="text-right text-[10px] text-[#80cbc4]">
                <div>최대 강화 한도: <span className="font-bold text-white">Lv.{maxEnhanceAllowed}</span></div>
                <div className="text-[#8b9bb4]">표시 중: {filteredSkills.length}개 / 총 {allLearnedSkills.length}개</div>
              </div>
            </div>

            {filteredSkills.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8b9bb4] bg-[#131926] rounded-xl border border-[#222d42] flex flex-col items-center gap-2">
                <span className="text-3xl">📖</span>
                <span className="font-bold text-white">
                  {selectedHeroObj
                    ? `[${selectedHeroObj.name}]은(는) 아직 습득한 마도서 스킬이 없습니다.`
                    : '아직 스킬을 습득한 용병이 없습니다.'}
                </span>
                <p className="text-[11px] text-[#8b9bb4] max-w-sm leading-relaxed">
                  [원정단 병영]에서 용병을 선택하고 [서고]를 열어 마도서를 연독하세요.<br />
                  연구 습득률 100%를 달성하여 습득된 스킬은 이곳 에테르 공방에서 연금 재료를 바쳐 최대 Lv.10까지 비전 강화할 수 있습니다!
                </p>
                {selectedHeroFilter !== 'all' && (
                  <button
                    className="btn btn-ghost text-xs text-[#26a69a] border border-[#26a69a44] px-3 py-1 mt-2"
                    onClick={() => setSelectedHeroFilter('all')}
                  >
                    ◀ 전체 용병 스킬 보기
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
              {filteredSkills.map((item, idx) => {
                const sk = item.skill;
                const rType = getSkillBookRarity(sk.rank || 1);
                const rMeta = GRIMOIRE_RARITY_META[rType] || GRIMOIRE_RARITY_META.common;
                const bookLv = item.level;
                const baseSkill = gm.resolveSkillData(sk.id, 1) || sk;
                const basePowerPct = Math.round((baseSkill.power || 1.0) * 100);
                const curPower = Math.round((sk.power || 1.0) * 100);
                const curMp = sk.manaCost || 10;
                const isMax = bookLv >= 10;
                const rateInfo = GameManager.getEnhanceRateInfo(bookLv);

                return (
                  <div
                    key={`${item.hero.id}_${sk.id}_${idx}`}
                    onClick={() => setEnhanceModalTarget({ hero: item.hero, skill: sk })}
                    className="panel p-3 bg-[#131926] border border-[#222d42] hover:border-[#26a69a88] rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl p-1.5 rounded-lg bg-[#323d4e] border border-[#4a576d] group-hover:scale-105 transition-transform shrink-0 shadow-sm">
                        <GameIcon name={sk.id} icon={sk.icon || '📖'} size={24} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white group-hover:text-[#26a69a] transition-colors truncate">
                            {sk.name}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0"
                            style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                          >
                            {rMeta.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#ffd54f] shrink-0">
                            Lv.{bookLv}/10
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff15] text-[#00d2ff] font-bold border border-[#00d2ff33] shrink-0">
                            👤 {item.hero.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8b9bb4] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#64b5f6] font-mono font-bold">위력 {curPower}%</span>
                          {bookLv > 1 && curPower !== basePowerPct && (
                            <span className="text-[10px] text-[#ffd54f] font-mono">(초기 {basePowerPct}%)</span>
                          )}
                          <span>•</span>
                          <span className="text-[#81d4fa] font-mono font-bold">소모 {curMp} MP</span>
                          {!isMax && (
                            <>
                              <span>•</span>
                              <span className="text-[#38ef7d] font-bold">성공률 {rateInfo.successRate}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`btn text-xs px-3 py-1.5 font-bold flex items-center gap-1 ${
                          isMax ? 'btn-ghost text-[#ffd54f] border border-[#ffd54f44]' : 'btn-primary'
                        }`}
                        onClick={() => setEnhanceModalTarget({ hero: item.hero, skill: sk })}
                      >
                        <span>{isMax ? '★ MAX' : '⚡ 강화'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

      {/* 탭 2: 마도서 제작 */}
      {activeTab === 'craft' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* ── 등급별 필터 탭 바 (상단 고정 shrink-0) ── */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0d16] border-b border-[#1f2738] overflow-x-auto shrink-0 scrollbar-none shadow-inner">
            {(
              [
                { key: 'all', label: '전체', color: '#26a69a', reqLv: 1, rate: 0 },
                { key: 'common', label: '일반', color: '#9e9e9e', reqLv: 1, rate: 80 },
                { key: 'rare', label: '희귀', color: '#42a5f5', reqLv: 3, rate: 50 },
                { key: 'epic', label: '영웅', color: '#ab47bc', reqLv: 5, rate: 30 },
                { key: 'legendary', label: '전설', color: '#ffd54f', reqLv: 7, rate: 10 },
              ] as const
            ).map(tab => {
              const count = tab.key === 'all' 
                ? recipes.length 
                : recipes.filter(r => r.rarity === tab.key).length;
              const isSelected = recipeRarityFilter === tab.key;
              const isTabUnlocked = tab.key === 'all' || alchemyLv >= tab.reqLv;
              return (
                <button
                  key={tab.key}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#26a69a] text-black font-extrabold shadow-sm'
                      : !isTabUnlocked
                      ? 'bg-[#121622] text-[#546e7a] border border-[#1f2838] opacity-70'
                      : 'bg-[#141b2c] text-[#8b9bb4] hover:text-white hover:bg-[#1a2338] border border-[#222d42]'
                  }`}
                  onClick={() => setRecipeRarityFilter(tab.key)}
                >
                  <span style={{ color: isSelected ? '#000' : tab.color }}>●</span>
                  <span>{tab.label}</span>
                  {!isTabUnlocked && <span className="text-[9px] text-[#ef5350]">🔒Lv.{tab.reqLv}</span>}
                  {tab.rate > 0 && <span className={`text-[9px] ${isSelected ? 'text-black/80 font-bold' : 'text-[#80cbc4]'}`}>({tab.rate}%)</span>}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-black/30 text-black font-black' : 'bg-[#0a0d14] text-[#80cbc4]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
            <div className="p-3 bg-[#121926] border border-[#26a69a44] rounded-xl text-[11px] text-[#cfd8dc] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#26a69a] text-xs">🧪 에테르 마도서 제본 공방 (등급별 점진 해금 & 성공 확률)</div>
                <div className="mt-0.5 text-[#b0bec5]">
                  공방 레벨에 따라 등급이 점진 해금됩니다:
                  <span className="text-white font-medium"> Lv.1 일반(80%) ➔ Lv.3 희귀(50%) ➔ Lv.5 영웅(30%) ➔ Lv.7 전설(10%)</span>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#80cbc4] shrink-0 ml-2">
                <div>표시 중: <span className="font-bold text-white">{filteredRecipes.length}종</span> / 총 {recipes.length}종</div>
                <div className="text-[#8b9bb4]">공방 Lv.{alchemyLv} 가동 중</div>
              </div>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8b9bb4] bg-[#131926] rounded-xl border border-[#222d42] flex flex-col items-center gap-2">
                <span className="text-3xl">📭</span>
                <span className="font-bold text-white">해당 등급의 제작 가능한 마도서가 없습니다.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredRecipes.map(recipe => {
                  const isUnlocked = alchemyLv >= recipe.reqAlchemyLv;
                  const rMeta = GRIMOIRE_RARITY_META[recipe.rarity] || GRIMOIRE_RARITY_META.common;
                  const canAfford = isUnlocked && !isPaused && Object.entries(recipe.cost).every(
                    ([k, v]) => (res[k] || 0) >= (v as number)
                  );
                  const skillTags = getSkillTags(recipe.skill);

                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipeForModal(recipe)}
                      className={`panel p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer group transition-all ${
                        isUnlocked
                          ? 'bg-[#131926] border-[#222d42] hover:border-[#26a69a88] hover:bg-[#161f30]'
                          : 'bg-[#0e121a] border-[#1f2738] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl p-1.5 rounded-lg bg-[#323d4e] border border-[#4a576d] group-hover:scale-105 transition-transform shrink-0 shadow-sm">
                          <GameIcon name={recipe.skill.id || recipe.id} icon={recipe.skill.icon || '📖'} size={24} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white group-hover:text-[#26a69a] transition-colors truncate">
                              {recipe.name}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0"
                              style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
                            >
                              {rMeta.label}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] shrink-0 font-mono">
                              성공률 {GRIMOIRE_CRAFT_SUCCESS_RATES[recipe.rarity] || 80}%
                            </span>
                            {recipe.sourceClass && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3949ab22] text-[#7986cb] border border-[#3949ab44] font-bold shrink-0">
                                {recipe.sourceClass}
                              </span>
                            )}
                            <span className="text-[10px] text-[#80cbc4] shrink-0">
                              위력 {Math.round((recipe.skill.power || 1) * 100)}%
                            </span>
                            {recipe.skill.manaCost > 0 && (
                              <span className="text-[10px] text-[#64b5f6] font-mono shrink-0">
                                MP {recipe.skill.manaCost}
                              </span>
                            )}
                          </div>

                          {/* 태그 뱃지 간략 노출 */}
                          {skillTags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {skillTags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="text-[9px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5"
                                  style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
                                >
                                  <span>{tag.icon}</span>
                                  <span>{tag.label}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUnlocked ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            canAfford
                              ? 'bg-[#38ef7d18] text-[#38ef7d] border-[#38ef7d33]'
                              : 'bg-[#ffd54f18] text-[#ffd54f] border-[#ffd54f33]'
                          }`}>
                            {canAfford ? '제본 가능' : '재료 확인'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#ef535018] text-[#ef5350] font-bold border border-[#ef535033]">
                            🔒 Lv.{recipe.reqAlchemyLv} 해금
                          </span>
                        )}
                        <button
                          className="btn btn-primary text-xs px-2.5 py-1 font-bold flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecipeForModal(recipe);
                          }}
                        >
                          <span>🔍 상세/제작</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 🧪 마도서 제작 상세 모달 ── */}
      {selectedRecipeForModal && (
        <GrimoireCraftDetailModal
          recipe={selectedRecipeForModal}
          alchemyLv={alchemyLv}
          isPaused={isPaused}
          resources={state.resources}
          onClose={() => setSelectedRecipeForModal(null)}
          onCraft={(recipeId) => {
            setSelectedRecipeForModal(null);
            handleCraft(recipeId);
          }}
        />
      )}

      {/* ── ⚡ 스킬 비전 강화 팝업 모달 ── */}
      {enhanceModalTarget && (
        <GrimoireEnhanceModal
          open={!!enhanceModalTarget}
          hero={state.barracks.find(h => h.id === enhanceModalTarget.hero.id) || enhanceModalTarget.hero}
          skill={enhanceModalTarget.skill}
          onClose={() => setEnhanceModalTarget(null)}
          gm={gm}
        />
      )}

      {/* 🌟 마도서 제작 집필 연출 모달 🌟 */}
      {craftingRecipe && (
        <CraftProgressModal
          open={!!craftingRecipe}
          type="craft_grimoire"
          title="비전 마도서 연성 공정"
          itemName={craftingRecipe.name}
          itemIcon={craftingRecipe.icon || '📖'}
          itemSub={`성공률 ${GRIMOIRE_CRAFT_SUCCESS_RATES[craftingRecipe.rarity] || 80}% (${GRIMOIRE_RARITY_META[craftingRecipe.rarity]?.label || '일반'})`}
          durationMs={grimoireDurationMs}
          outcome={pendingGrimoireOutcome}
          onComplete={handleGrimoireCraftComplete}
        />
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
const QuestsDrawer: React.FC<{
  onClose: () => void;
  onNavigateDrawer?: (key: string) => void;
  onNavigateBuilding?: (buildingId: string) => void;
}> = ({ onClose, onNavigateDrawer, onNavigateBuilding }) => {
  const { state, gm, navigateTo } = useGameManager();
  const [catTab, setCatTab] = useState<'chain' | 'sub' | 'epic' | 'completed'>('chain');
  const [epicQuestForModal, setEpicQuestForModal] = useState<Quest | null>(null);
  const [, setSecondTick] = useState(0);

  useEffect(() => {
    gm.ensureActiveSubQuests();
    gm.checkAllQuestObjectives();
    const timer = setInterval(() => {
      setSecondTick(t => t + 1);
      gm.ensureActiveSubQuests();
    }, 1000);
    return () => clearInterval(timer);
  }, [gm]);

  // 🍺 주점 해금 여부 (주점이 해금되기 전까지 Q_MAIN_02는 퀘스트 창에 보이지 않음)
  const isTavernUnlocked = Boolean(
    state.buildings['tavern']?.unlocked ||
    (state.buildings['tavern']?.level || 0) >= 1 ||
    (state.buildings['quarry']?.level || 0) >= 1
  );

  const activeQuests = state.quests.filter(q => {
    if (q.status !== 'active') return false;
    if (q.id === 'Q_MAIN_02' && !isTavernUnlocked) return false;
    return true;
  });
  const completedQuests = state.quests.filter(q => q.status === 'completed');

  // 주점 및 영혼의 제단 건설 / 에픽 퀘스트 해금 여부
  const hasTavern = (state.buildings['tavern']?.level || 0) >= 1;
  const hasSanctuary = (state.buildings['sanctuary']?.level || 0) >= 1;
  const hasEpicUnlocked = hasSanctuary || activeQuests.some(q => q.type === 'epic');

  // 카테고리별 퀘스트 분류
  const chainActive = activeQuests.filter(q => ['main', 'building', 'promotion', 'field'].includes(q.type));
  const subActive = hasTavern ? activeQuests.filter(q => ['sub', 'repeatable'].includes(q.type)) : [];
  const epicActive = hasEpicUnlocked ? activeQuests.filter(q => q.type === 'epic') : [];

  // 카테고리별 수령 가능 개수
  const chainClaimable = chainActive.filter(q => q.objectives.every(o => o.isCompleted)).length;
  const subClaimable = subActive.filter(q => q.objectives.every(o => o.isCompleted)).length;
  const epicClaimable = epicActive.filter(q => q.objectives.every(o => o.isCompleted)).length;
  const totalClaimable = chainClaimable + subClaimable + epicClaimable;

  // 현재 탭에 노출할 퀘스트 목록 결정
  const displayedQuests = (() => {
    switch (catTab) {
      case 'chain': return chainActive;
      case 'sub': return subActive;
      case 'epic': return epicActive;
      case 'completed': return completedQuests;
      default: return chainActive;
    }
  })();

  const RN: Record<string, string> = {
    wood: '목재', stone: '석재', iron: '철광석', food: '식량',
    herb: '약초', leather: '가죽', silk: '실크', coal: '석탄',
    crystal: '마력수정', void_shard: '공허파편',
    prefix_stone: '일반 접두석', suffix_stone: '일반 접미석',
    pure_prefix_stone: '순수 접두석', pure_suffix_stone: '순수 접미석',
    relic_floor_1: '침묵의 흑핵', relic_floor_2: '망령의 영혼수정',
    relic_floor_3: '원초의 광맥 심장', relic_floor_4: '심연의 시공 닻',
    relic_floor_5: '공허 지배자의 모노리스 핵',
    relic_floor_6: '핏빛 대공의 진홍 성배',
    relic_floor_7: '망각 묘지기의 영혼 나침반',
    relic_floor_8: '단죄의 기사단장 맹세 휘장',
    relic_floor_9: '미궁 지배자의 진실 거울 파편',
    relic_floor_10: '심연 군주의 옥새'
  };

  const getBuildingIdForQuest = (quest: Quest): string | null => {
    const qIdMap: Record<string, string> = {
      'Q_MAIN_01': 'butchery',
      'Q_MAIN_02': 'tavern',
      'Q_BUILD_CABIN': 'cabin',
      'Q_BUILD_LUMBER': 'lumberCamp',
      'Q_BUILD_QUARRY': 'quarry',
      'Q_BUILD_FORGE': 'blacksmith',
      'Q_BUILD_ALCHEMY': 'alchemy',
      'Q_BUILD_INFIRMARY': 'infirmary',
      'Q_BUILD_MARKET': 'market',
      'Q_BUILD_SANCTUARY': 'sanctuary',
      'Q_BUILD_ARENA': 'arenaGate',
      'Q_UPGRADE_STORAGE': 'storage',
      'Q_UPGRADE_FORGE_03': 'blacksmith',
      'Q_EPIC_CITADEL_REBUILD_01': 'storage',
    };
    if (qIdMap[quest.id]) return qIdMap[quest.id];
    const text = (quest.title + ' ' + quest.summary + ' ' + quest.objectives.map(o => o.description).join(' '));
    if (text.includes('병기창') || text.includes('대장간')) return 'blacksmith';
    if (text.includes('연금') || text.includes('공방')) return 'alchemy';
    if (text.includes('병동') || text.includes('의료소') || text.includes('치료소')) return 'infirmary';
    if (text.includes('마켓') || text.includes('시장')) return 'market';
    if (text.includes('제단') || text.includes('영혼')) return 'sanctuary';
    if (text.includes('주점') || text.includes('라운지')) return 'tavern';
    if (text.includes('벌채소') || text.includes('벌목')) return 'lumberCamp';
    if (text.includes('시추소') || text.includes('광산') || text.includes('채굴')) return 'quarry';
    if (text.includes('정제소') || text.includes('가공소')) return 'butchery';
    if (text.includes('안식처') || text.includes('오두막')) return 'cabin';
    if (text.includes('병참고') || text.includes('창고')) return 'storage';
    if (text.includes('성화') || text.includes('모닥불')) return 'bonfire';
    if (text.includes('게이트') || text.includes('아레나')) return 'arenaGate';
    return null;
  };

  const getQuestShortcut = (quest: Quest) => {
    // 👑 [특화] 제1장: 첫 번째 심연 원정대 파견 (Q_MAIN_02 복합 연계 퀘스트)
    if (quest.id === 'Q_MAIN_02') {
      const tavern = state.buildings['tavern'];
      const isTavernBuilt = (tavern?.level || 0) >= 1;
      const isMercHired = Boolean(quest.objectives[1]?.isCompleted || (state.barracks.length > 2));
      const isDescentDone = Boolean(quest.objectives[2]?.isCompleted);

      // 1단계: 주점이 아직 건설되지 않음 ➔ 영지 건설 바로가기 (방랑 주점)
      if (!isTavernBuilt) {
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#2a2417] hover:bg-[#3d321f] text-[#ebd5b3] font-bold border border-[#876739] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            onClick={() => {
              if (onNavigateBuilding) onNavigateBuilding('tavern');
              else if (onNavigateDrawer) onNavigateDrawer('citadel');
              else onClose();
            }}
          >
            <span>🏛️</span>
            <span>영지 건설 바로가기 (방랑 주점)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      }

      // 2단계: 주점 건설 완료 & 용병 1명 미영입 ➔ 방랑 주점 바로가기
      if (!isMercHired) {
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#3a2512] hover:bg-[#4d3218] text-[#f3d19e] font-bold border border-[#a67c52] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            onClick={() => onNavigateDrawer ? onNavigateDrawer('tavern') : onClose()}
          >
            <span>🍺</span>
            <span>방랑 주점 바로가기 (용병 영입)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      }

      // 3단계: 용병 1명 영입 완료 & 1층 강하 미완료
      if (!isDescentDone) {
        // 파티 3인 미편성 시 ➔ 원정단 편성화면 바로가기
        if (state.party.length < 3) {
          return (
            <button
              className="text-xs px-3 py-1.5 rounded-lg bg-[#0d2238] hover:bg-[#12304f] text-[#00d2ff] font-bold border border-[#00d2ff66] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              onClick={() => onNavigateDrawer ? onNavigateDrawer('barracks') : onClose()}
            >
              <span>⚔️</span>
              <span>원정단 편성 바로가기 (파티 3인 편성)</span>
              <span className="text-[10px]">▶</span>
            </button>
          );
        }
        // 파티 3인 편성 완료 시 ➔ 심연 채비실 바로가기
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e0d2d] hover:bg-[#2b1340] text-[#e0b8ff] font-bold border border-[#7b3fa6] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            onClick={() => onNavigateDrawer ? onNavigateDrawer('explore') : onClose()}
          >
            <span>🎒</span>
            <span>심연 채비실 바로가기 (강하 준비)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      }

      // 4단계: 1층 강하까지 완수 ➔ 보상 수령 버튼 노출을 위해 null 반환
      return null;
    }

    const pendingObj = quest.objectives.find(o => !o.isCompleted);
    if (!pendingObj) return null;

    const desc = pendingObj.description;

    // 1. 방랑 주점 / 용병 영입 분기
    // 복합 연계 퀘스트(Q_MAIN_02 등): 주점 건설 후에는 용병 영입을 위해 '주점' 바로가기로 전환!
    const isRecruitObjective = desc.includes('용병') || desc.includes('영입') || desc.includes('고용') || desc.includes('주점 방문');
    if (isRecruitObjective) {
      const tavernLevel = state.buildings['tavern']?.level || 0;
      if (tavernLevel >= 1) {
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#3a2512] hover:bg-[#4d3218] text-[#f3d19e] font-bold border border-[#a67c52] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            onClick={() => onNavigateDrawer ? onNavigateDrawer('tavern') : onClose()}
          >
            <span>🍺</span>
            <span>방랑 주점 바로가기 (용병 영입)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      } else {
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#2a2417] hover:bg-[#3d321f] text-[#ebd5b3] font-bold border border-[#876739] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            onClick={() => {
              if (onNavigateBuilding) onNavigateBuilding('tavern');
              else if (onNavigateDrawer) onNavigateDrawer('citadel');
              else onClose();
            }}
          >
            <span>🏛️</span>
            <span>영지 건설 (방랑 주점)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      }
    }

    // 2. 심연 강하 / 채비실 / 던전 탐험 분기
    const isDescentObjective = desc.includes('강하') || desc.includes('채비') || desc.includes('파견') || desc.includes('출정')
      || desc.includes('회랑') || desc.includes('던전') || desc.includes('진입') || desc.includes('입장') || desc.includes('1층')
      || (quest.id === 'Q_MAIN_02' && !isRecruitObjective);
    if (isDescentObjective) {
      if (state.party.length < 3) {
        return (
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-[#0d2238] hover:bg-[#12304f] text-[#00d2ff] font-bold border border-[#00d2ff66] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            onClick={() => onNavigateDrawer ? onNavigateDrawer('barracks') : onClose()}
          >
            <span>⚔️</span>
            <span>원정단 편성 바로가기 (파티 3인 편성)</span>
            <span className="text-[10px]">▶</span>
          </button>
        );
      }
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#1e0d2d] hover:bg-[#2b1340] text-[#e0b8ff] font-bold border border-[#7b3fa6] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => onNavigateDrawer ? onNavigateDrawer('explore') : onClose()}
        >
          <span>🎒</span>
          <span>심연 채비실 바로가기 (강하 준비)</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 3. 건물 건설 / 증축 분기
    const isBuildingObjective = desc.includes('건설') || desc.includes('증축') || desc.includes('개설') || desc.includes('복원') || desc.includes('완공');
    if (isBuildingObjective || quest.type === 'building') {
      let targetBuildingId = getBuildingIdForQuest(quest);
      if (desc.includes('주점') || desc.includes('라운지')) targetBuildingId = 'tavern';
      else if (desc.includes('정제') || desc.includes('도축')) targetBuildingId = 'butchery';
      else if (desc.includes('주거') || desc.includes('오두막') || desc.includes('피난민')) targetBuildingId = 'cabin';
      else if (desc.includes('벌목') || desc.includes('영목')) targetBuildingId = 'lumberCamp';
      else if (desc.includes('채석') || desc.includes('시추') || desc.includes('광맥')) targetBuildingId = 'quarry';
      else if (desc.includes('대장간') || desc.includes('병기창')) targetBuildingId = 'blacksmith';
      else if (desc.includes('연금') || desc.includes('공방')) targetBuildingId = 'alchemy';
      else if (desc.includes('병동') || desc.includes('치료')) targetBuildingId = 'infirmary';
      else if (desc.includes('제단') || desc.includes('성소')) targetBuildingId = 'sanctuary';
      else if (desc.includes('창고') || desc.includes('보관')) targetBuildingId = 'storage';
      else if (desc.includes('성화') || desc.includes('모닥불')) targetBuildingId = 'bonfire';
      else if (desc.includes('게이트') || desc.includes('아레나')) targetBuildingId = 'arenaGate';

      const buildingNameMap: Record<string, string> = {
        tavern: '방랑 주점', butchery: '마물 정제소', cabin: '주거 구역', lumberCamp: '영목 벌채소',
        quarry: '지반 시추탑', blacksmith: '심연 대장간', alchemy: '연금 공방', infirmary: '생체 병동',
        sanctuary: '영혼 제단', storage: '보관 창고', bonfire: '신성 성화', arenaGate: '차원 관문'
      };
      const label = targetBuildingId && buildingNameMap[targetBuildingId] ? ` (${buildingNameMap[targetBuildingId]})` : '';

      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#2a2417] hover:bg-[#3d321f] text-[#ebd5b3] font-bold border border-[#876739] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => {
            if (targetBuildingId && onNavigateBuilding) {
              onNavigateBuilding(targetBuildingId);
            } else if (onNavigateDrawer) {
              onNavigateDrawer('citadel');
            } else {
              onClose();
            }
          }}
        >
          <span>🏛️</span>
          <span>영지 건설 바로가기{label}</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 4. 전직 / 승격 / 병영 분기
    const isBarracksObjective = desc.includes('전직') || desc.includes('승격') || desc.includes('배치') || desc.includes('파티');
    if (isBarracksObjective || quest.type === 'promotion') {
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#281b33] hover:bg-[#382647] text-[#dfb8f2] font-bold border border-[#7a4891] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => onNavigateDrawer ? onNavigateDrawer('barracks') : onClose()}
        >
          <span>⚔️</span>
          <span>용병 병영 바로가기</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 5. 대장간 / 단조 / 강화 / 인챈트
    const isForgeObjective = desc.includes('단조') || desc.includes('정화') || desc.includes('강화') || desc.includes('인챈트') || desc.includes('장비 제작');
    if (isForgeObjective) {
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#3d2b17] hover:bg-[#523a1f] text-[#f5d79e] font-bold border border-[#9c6f3b] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => onNavigateDrawer ? onNavigateDrawer('forge') : onClose()}
        >
          <span>⚒️</span>
          <span>마도 대장간 바로가기</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 6. 연금 공방 / 마도서 / 포션
    const isAlchemyObjective = desc.includes('마도서') || desc.includes('연성') || desc.includes('물약') || desc.includes('촉매');
    if (isAlchemyObjective) {
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#142d2b] hover:bg-[#1d3d3a] text-[#80cbc4] font-bold border border-[#2e6d65] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => onNavigateDrawer ? onNavigateDrawer('alchemy') : onClose()}
        >
          <span>🧪</span>
          <span>에테르 연금 공방 바로가기</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 7. 차원 게이트 / 아레나 / 네메시스 / 침공 / 전술 타워
    const isArenaObjective = desc.includes('아레나') || desc.includes('네메시스') || desc.includes('침공') || desc.includes('전술 타워') || desc.includes('결투') || desc.includes('투기장');
    if (isArenaObjective) {
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#2b101e] hover:bg-[#3d152a] text-[#ff80ab] font-bold border border-[#882d5a] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          onClick={() => {
            onClose();
            navigateTo('arena');
          }}
        >
          <span>🏆</span>
          <span>차원 게이트 바로가기</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    // 8. 던전 탐험 / 처치 / 도달
    const isExploreObjective = desc.includes('탐험') || desc.includes('야영') || desc.includes('처치') || desc.includes('도달') || desc.includes('격파') || desc.includes('층');
    if (isExploreObjective || quest.type === 'field') {
      return (
        <button
          className="text-xs px-3 py-1.5 rounded-lg bg-[#13281d] hover:bg-[#1b3829] text-[#a5d6a7] font-bold border border-[#3b7553] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          onClick={() => onNavigateDrawer ? onNavigateDrawer('explore') : onClose()}
        >
          <span>🌌</span>
          <span>심연 탐험 바로가기</span>
          <span className="text-[10px]">▶</span>
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">📜</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#38ef7d]">{'의뢰소'}</span>
              {totalClaimable > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold animate-pulse border border-[#38ef7d44]">
                  🎁 {`${totalClaimable}개 수령 가능`}
                </span>
              )}
              <EncyclopediaBadge query="퀘스트" tab="all" label="의뢰소 백과" />
            </div>
            <div className="text-[10px] text-[#8b9bb4]">
              '현상금 및 서사 의뢰소'
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onClose}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* ── 4종 카테고리 탭 바 (연계 / 서브 / 에픽 / 완료) ── */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[#0e121d] border-b border-[#1f2738] shrink-0">
        <button
          className={`btn py-1.5 px-0.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            catTab === 'chain' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => setCatTab('chain')}
        >
          <span>📜 {'연계'} ({chainActive.length})</span>
          {chainClaimable > 0 && (
            <span className="text-[9px] bg-[#38ef7d] text-black px-1 rounded-full font-bold">●</span>
          )}
        </button>

        <button
          className={`btn py-1.5 px-0.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            catTab === 'sub' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => setCatTab('sub')}
        >
          <span>🔄 {'서브'} ({hasTavern ? subActive.length : '🔒'})</span>
          {subClaimable > 0 && (
            <span className="text-[9px] bg-[#38ef7d] text-black px-1 rounded-full font-bold">●</span>
          )}
        </button>

        <button
          className={`btn py-1.5 px-0.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            catTab === 'epic' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => setCatTab('epic')}
        >
          <span>👑 {'에픽'} ({hasEpicUnlocked ? epicActive.length : '🔒'})</span>
          {epicClaimable > 0 && (
            <span className="text-[9px] bg-[#38ef7d] text-black px-1 rounded-full font-bold">●</span>
          )}
        </button>

        <button
          className={`btn py-1.5 px-0.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            catTab === 'completed' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => setCatTab('completed')}
        >
          <span>✅ {'완료'} ({completedQuests.length})</span>
        </button>
      </div>

      {/* 퀘스트 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
        {/* 서브 퀘스트 잠금 안내 */}
        {catTab === 'sub' && !hasTavern && (
          <div className="panel p-6 text-center flex flex-col items-center gap-2 bg-[#121722] border border-[#222d42] rounded-xl">
            <span className="text-4xl p-2 rounded-2xl bg-[#1e293b] border border-[#334155]">🍺🔒</span>
            <span className="font-bold text-sm text-[#ffd54f]">방랑자의 라운지 (주점) 건설 필요</span>
            <span className="text-xs text-[#8b9bb4] max-w-[280px] leading-relaxed">
              영지에 <strong>방랑자의 라운지</strong>를 건설하면 방주 생존자들의 구호 의뢰 및 마물 토벌 서브 퀘스트가 해금됩니다.
            </span>
            <div className="text-[11px] text-[#607d8b] mt-1 bg-[#090c14] px-3 py-1.5 rounded-lg border border-[#1b2334]">
              건설 비용: 🪵 목재 80, 🪨 석재 50, 🪙 300G
            </div>
            <button
              className="btn btn-primary text-xs px-4 py-2 mt-2 font-bold shadow-md flex items-center gap-1.5 active:scale-95"
              onClick={() => onNavigateDrawer ? onNavigateDrawer('citadel') : onClose()}
            >
              <span>🏛️</span>
              <span>영지에서 주점 건설하러 가기 ▶</span>
            </button>
          </div>
        )}

        {/* 10분 쿨다운 안내 카드 (주점 건설 완료 후 서브 슬롯 비었을 때) */}
        {catTab === 'sub' && hasTavern && subActive.length < 3 && state.subQuestCooldownUntil > 0 && (
          <div className="panel p-3 bg-[#11192e] border border-[#00d2ff44] rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl p-1.5 rounded-lg bg-[#16233d] border border-[#00d2ff33] animate-spin">⏳</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#00d2ff]">신규 의뢰 접수 대기 중</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-mono font-bold">
                    10분 쿨타임
                  </span>
                </div>
                <div className="text-[10px] text-[#8b9bb4] mt-0.5">
                  {(() => {
                    const diffSec = Math.max(0, Math.ceil((state.subQuestCooldownUntil - Date.now()) / 1000));
                    const mm = Math.floor(diffSec / 60);
                    const ss = diffSec % 60;
                    return `다음 주민/길드 의뢰 도착까지: ${mm}분 ${ss < 10 ? '0' : ''}${ss}초`;
                  })()}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[#ffd54f] font-mono font-bold shrink-0">
              슬롯 {subActive.length}/3
            </div>
          </div>
        )}

        {/* 에픽 퀘스트 잠금 안내 */}
        {catTab === 'epic' && !hasEpicUnlocked && (
          <div className="panel p-6 text-center flex flex-col items-center gap-2 bg-[#190e28] border border-[#e040fb44] rounded-xl">
            <span className="text-4xl p-2 rounded-2xl bg-[#2a133d] border border-[#e040fb66]">👑🔒</span>
            <span className="font-bold text-sm text-[#e040fb]">영혼의 제단 건설 필요</span>
            <span className="text-xs text-[#cfd8e8] max-w-[280px] leading-relaxed">
              영지에 <strong>영혼의 제단</strong>을 완공하면 각 층 광폭화 보스 토벌 및 고대 방주의 기원을 추적하는 <strong>3부작 에픽 시나리오</strong>가 해금됩니다.
            </span>
            <div className="text-[11px] text-[#8b9bb4] mt-1 bg-[#090c14] px-3 py-1.5 rounded-lg border border-[#1b2334]">
              건설 비용: 🪨 석재 120, ⚙️ 철광 50, ✨ 에테르 30, 🪙 1,000G
            </div>
            <button
              className="btn btn-primary text-xs px-4 py-2 mt-2 font-bold shadow-md flex items-center gap-1.5 active:scale-95"
              onClick={() => onNavigateDrawer ? onNavigateDrawer('citadel') : onClose()}
            >
              <span>🏛️</span>
              <span>영지에서 제단 건설하러 가기 ▶</span>
            </button>
          </div>
        )}

        {displayedQuests.length === 0 && !(catTab === 'sub' && !hasTavern) && !(catTab === 'epic' && !hasEpicUnlocked) && (
          <div className="panel p-8 text-center text-sm text-[#8b9bb4]">
            {catTab === 'completed'
              ? '아직 완료된 퀘스트가 없습니다.' : '현재 해당 탭의 진행 가능한 퀘스트가 없습니다.'}<br />
            <span className="text-xs text-[#607d8b] mt-1 block">
              {catTab === 'sub' ? '서브 퀘스트는 해결 시 새로운 의뢰가 계속 생성됩니다.' : '영지 시설을 확장하거나 심연을 탐험하세요.'}
            </span>
          </div>
        )}

        {displayedQuests.map(q => {
          const isAllDone = q.objectives.every(o => o.isCompleted);
          const isCompleted = q.status === 'completed';
          const isClaimable = !isCompleted && isAllDone;

          const typeTag = {
            main: { label: '메인', color: '#ffd54f', bg: '#ffd54f15' },
            building: { label: '시설', color: '#00d2ff', bg: '#00d2ff15' },
            promotion: { label: '전직', color: '#ce93d8', bg: '#ce93d815' },
            field: { label: '탐험', color: '#66bb6a', bg: '#66bb6a15' },
            repeatable: { label: '🔄 반복', color: '#26c6da', bg: '#26c6da15' },
            sub: { label: '서브', color: '#26c6da', bg: '#26c6da15' },
            epic: { label: '👑 에픽 스토리', color: '#e040fb', bg: '#e040fb20' },
          }[q.type] || { label: '임무', color: '#8b9bb4', bg: '#182030' };

          return (
            <div
              key={q.id}
              className={`panel p-3 rounded-xl transition-all flex flex-col gap-2.5 ${
                isClaimable
                  ? 'border-2 border-[#38ef7d] bg-[#0e1f18] shadow-lg shadow-[#38ef7d15]'
                  : isCompleted
                  ? 'border-[#222d42] bg-[#0e121a] opacity-80'
                  : q.type === 'epic'
                  ? 'border-2 border-[#e040fb55] bg-[#170e24] shadow-md shadow-[#e040fb15]' : 'border-[#26334a] bg-[#131926]'
              }`}
            >
              {/* 상단: 분류 뱃지 + 제목 + 상태 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                      style={{ color: typeTag.color, background: typeTag.bg, border: `1px solid ${typeTag.color}44` }}
                    >
                      {typeTag.label}
                    </span>
                    <span className="font-bold text-sm text-white">{q.title}</span>
                  </div>
                  <div className="text-[11px] text-[#cfd8dc] mt-1 leading-relaxed">{q.summary}</div>
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#607d8b22] text-[#8b9bb4] font-bold">
                      완료됨
                    </span>
                  ) : isClaimable ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44] animate-pulse">
                      🎁 완료! 수령 대기
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                      진행 중
                    </span>
                  )}
                </div>
              </div>

              {/* 목표 달성 게이지 목록 */}
              <div className="flex flex-col gap-1.5 bg-[#090c14] p-2 rounded-lg border border-[#1b2334]">
                {q.objectives.map((obj, idx) => {
                  const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));
                  return (
                    <div key={idx} className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`flex items-center gap-1 ${obj.isCompleted ? 'text-[#38ef7d] line-through' : 'text-[#cfd8dc]'}`}>
                          <span>{obj.isCompleted ? '✅' : '⏳'}</span>
                          <span>{obj.description}</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-[#ffd54f]">
                          {obj.current}/{obj.required}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-[#1a2234] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${obj.isCompleted ? 'bg-[#38ef7d]' : 'bg-[#00d2ff]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 보상 미리보기 뱃지 바 */}
              <div className="pt-2 border-t border-[#1f2738] flex flex-col gap-1.5">
                <span className="text-[10px] text-[#8b9bb4]">
                  {q.epicStory ? '달성 시나리오 & 분기 선택 보상:' : '달성 보상:'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {q.epicStory ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] font-bold border border-[#ffd54f33] flex items-center gap-1">
                        <GameIcon name="storage" icon="🏛️" size={13} /> 영지 발전 (대량 자원 & 재료)
                      </span>
                      <span className="text-[10px] text-[#8b9bb4]">or</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ce93d815] text-[#ce93d8] font-bold border border-[#ce93d833] flex items-center gap-1">
                        <GameIcon name="blacksmith" icon="⚔️" size={13} /> 결사대 무장 (여명검 & 보급품 풀세트)
                      </span>
                    </div>
                  ) : (
                    <>
                      {q.rewards.gold && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] font-mono font-bold border border-[#ffd54f33] flex items-center gap-1">
                          <GameIcon name="gold" icon="🪙" size={13} /> {q.rewards.gold}G
                        </span>
                      )}
                      {q.rewards.ether && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono font-bold border border-[#00d2ff33] flex items-center gap-1">
                          <GameIcon name="ether" icon="✨" size={13} /> {q.rewards.ether} 에테르
                        </span>
                      )}
                      {q.rewards.resources && Object.entries(q.rewards.resources).map(([k, amt]) => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#38ef7d15] text-[#38ef7d] font-mono font-bold border border-[#38ef7d33] flex items-center gap-1">
                          <GameIcon name={k} size={13} /> {RN[k] || k} +{amt}
                        </span>
                      ))}
                      {q.rewards.supplies?.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#ab47bc15] text-[#ce93d8] font-mono font-bold border border-[#ab47bc33] flex items-center gap-1">
                          <GameIcon name={s.key} icon={s.icon} size={13} /> {s.name} ×{s.qty}
                        </span>
                      ))}
                      {q.rewards.equipment && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff704315] text-[#ff7043] font-bold border border-[#ff704333] flex items-center gap-1">
                          <GameIcon name={q.rewards.equipment.id} icon={q.rewards.equipment.icon} size={13} /> {(() => {
                            const cleanName = q.rewards.equipment.name.replace(/^[^\w가-힣\[]+/, '').trim();
                            return cleanName.startsWith('[') ? cleanName : `[${cleanName}]`;
                          })()}
                        </span>
                      )}
                      {(q.rewards.unlockBuildingId || (q.rewards.unlockBuildingIds && q.rewards.unlockBuildingIds.length > 0)) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#42a5f515] text-[#42a5f5] font-bold border border-[#42a5f533] flex items-center gap-1">
                          <GameIcon name="bonfire" icon="🏛️" size={13} /> 신규 시설 해금
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 바로가기 링크 (진행 중인 퀘스트의 경우 해당 화면으로 즉시 이동) */}
              {!isCompleted && !isClaimable && (
                <div className="flex justify-end pt-1">
                  {getQuestShortcut(q)}
                </div>
              )}

              {/* 보상 수령 버튼 */}
              {isClaimable && (
                <button
                  className="btn btn-success w-full py-2 text-xs font-bold shadow-lg mt-1 flex items-center justify-center gap-1.5 animate-pulse"
                  onClick={() => {
                    if (q.epicStory) {
                      setEpicQuestForModal(q);
                    } else {
                      gm.completeQuest(q.id);
                    }
                  }}
                >
                  <span>{q.epicStory ? '📜' : '🎁'}</span>
                  <span>{q.epicStory ? '서사 확인 및 분기 보상 수령' : '보상 수령하기'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 에픽 퀘스트 서사 대화 및 분기 보상 선택 모달 */}
      {epicQuestForModal && (
        <EpicQuestDialogueModal
          quest={epicQuestForModal}
          onClose={() => setEpicQuestForModal(null)}
          onClaim={(choice) => {
            gm.completeQuest(epicQuestForModal.id, choice);
            setEpicQuestForModal(null);
          }}
        />
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
//  🌌 심연 강하 : 탐험 채비 및 구역 선택 (Expedition Prep Drawer)
// ─────────────────────────────────────────────────────────────
const FLOOR_NAMES_LIST_I18N: Record<string, string[]> = {
  ko: [
    '1층: 침묵의 회랑 (위험도 하)',
    '2층: 망령의 납골당 (위험도 중하)',
    '3층: 에테르 광맥 (위험도 중)',
    '4층: 심연의 균열 (위험도 중상)',
    '5층: ★ 원초의 제단 (Chapter 1 보스)',
    '6층: 핏빛 성역 (위험도 상)',
    '7층: 망각의 묘지 (위험도 상)',
    '8층: 단죄의 성채 (위험도 최상)',
    '9층: 환영의 미궁 (위험도 극상)',
    '10층: ★ 심연의 심장부 (최종 결전)',
    '11층: ★ 🌌 무간도 (Avici) [위험도 10,000 - 초월 엔드 컨텐츠]'
  ],
  en: [
    'Floor 1: Silent Cloister (Low Hazard)',
    'Floor 2: Ossuary of Phantoms (Mid-Low Hazard)',
    'Floor 3: Ether Vein (Medium Hazard)',
    'Floor 4: Abyssal Rift (Mid-High Hazard)',
    'Floor 5: ★ Primordial Altar (Chapter 1 Boss)',
    'Floor 6: Crimson Sanctuary (High Hazard)',
    'Floor 7: Graveyard of Oblivion (High Hazard)',
    'Floor 8: Citadel of Condemnation (Very High Hazard)',
    'Floor 9: Labyrinth of Illusions (Extreme Hazard)',
    'Floor 10: ★ Heart of the Abyss (Final Battle)',
    'Floor 11: ★ 🌌 Avici (Danger 10,000 - Transcendence Endgame)'
  ],
  ja: [
    '1階: 沈黙の回廊 (危険度 低)',
    '2階: 亡霊の納骨堂 (危険度 中低)',
    '3階: エーテル鉱脈 (危険度 中)',
    '4階: 深淵の亀裂 (危険度 中高)',
    '5階: ★ 原初の祭壇 (Chapter 1 ボス)',
    '6階: 血塗られた聖域 (危険度 高)',
    '7階: 忘却の墓地 (危険度 高)',
    '8階: 断罪の城塞 (危険度 最高)',
    '9階: 幻影の迷宮 (危険度 極限)',
    '10階: ★ 深淵の心臓部 (最終決戦)',
    '11階: ★ 🌌 無間道 (Avici) [危険度 10,000 - 超越エンドコンテンツ]'
  ]
};

const FLOOR_DESCS_I18N: Record<string, string[]> = {
  ko: [
    '예상 보상: 골드, 식량, 약초, 가죽, 일반 접두석 (몬스터 Lv.1~3)',
    '예상 보상: 철광석, 석탄, 실크, 일반 접미석 (몬스터 Lv.4~6)',
    '예상 보상: 고순도 에테르, 마력수정, 룬 철광, 순수 접두석 (몬스터 Lv.7~9)',
    '예상 보상: 공허 파편, 순수 접미석, 농축 수정, 대량 에테르 (몬스터 Lv.10~12)',
    '★ 1막 결전: 순수 마도석 세트, 전설 장비, 원초의 공허 파편 (보스 Lv.15)',
    '예상 보상: 핏빛 에센스, 농축 약초, 마수의 가죽, 고급 접두석 (몬스터 Lv.13~16)',
    '예상 보상: 망각의 유골, 고대 마력 수정, 저주 정화수, 고급 접미석 (몬스터 Lv.16~18)',
    '예상 보상: 단죄의 강철, 신성 에테르 룬, 순수 접두석 (몬스터 Lv.19~21)',
    '예상 보상: 환영의 거울 파편, 시공간 공허정수, 순수 접미석 (몬스터 Lv.22~25)',
    '★ 최종 결전: 신화급 장비, 궁극의 심연 정수, 대량 골드 & 에테르 (보스 Lv.28)',
    '★ 초월 엔드 컨텐츠: 정예 광폭화 마물 군단, 위험도 10,000 돌파, 진 최종 보스 토벌 (몹 Lv.20~520)'
  ],
  en: [
    'Expected: Gold, Food, Herbs, Leather, Common Prefix Stone (Lv.1~3)',
    'Expected: Iron Ore, Coal, Silk, Common Suffix Stone (Lv.4~6)',
    'Expected: High-purity Ether, Magic Crystal, Runic Iron, Pure Prefix Stone (Lv.7~9)',
    'Expected: Void Shards, Pure Suffix Stone, Concentrated Crystals, Ether (Lv.10~12)',
    '★ Act 1 Climax: Pure Arcane Stone Set, Legendary Gear, Primordial Void Shard (Boss Lv.15)',
    'Expected: Crimson Essence, Concentrated Herbs, Beast Leather, Greater Prefix Stone (Lv.13~16)',
    'Expected: Oblivion Bones, Ancient Crystal, Curse Purification Water, Greater Suffix Stone (Lv.16~18)',
    'Expected: Condemnation Steel, Holy Ether Rune, Pure Prefix Stone (Lv.19~21)',
    'Expected: Mirror Phantom Shards, Spacetime Void Essence, Pure Suffix Stone (Lv.22~25)',
    '★ Final Battle: Mythic Gear, Ultimate Abyss Essence, Massive Gold & Ether (Boss Lv.28)',
    '★ Transcendence Endgame: Enraged Elite Demons, Hazard 10,000+, True Final Boss (Lv.20~520)'
  ],
  ja: [
    '予想報酬: ゴールド, 食糧, 薬草, 革, 一般接頭石 (Lv.1~3)',
    '予想報酬: 鉄鉱石, 石炭, シルク, 一般接尾石 (Lv.4~6)',
    '予想報酬: 高純度エーテル, 魔力結晶, ルーン鉄鉱, 純粋接頭石 (Lv.7~9)',
    '予想報酬: 虚無の欠片, 純粋接尾石, 濃縮結晶, 大量エーテル (Lv.10~12)',
    '★ 第1幕決戦: 純粋魔導石セット, 伝説装備, 原初の虚無欠片 (ボス Lv.15)',
    '予想報酬: 血のエッセンス, 濃縮薬草, 魔獣の革, 高級接頭石 (Lv.13~16)',
    '予想報酬: 忘却の遺骨, 古代魔力結晶, 呪い浄化水, 高級接尾石 (Lv.16~18)',
    '予想報酬: 断罪の鋼, 神聖エーテルルーン, 純粋接頭石 (Lv.19~21)',
    '予想報酬: 幻影の鏡破片, 時空虚無エッセンス, 純粋接尾石 (Lv.22~25)',
    '★ 最終決戦: 神話級装備, 究極の深淵エッセンス, 大量ゴールド＆エーテル (ボス Lv.28)',
    '★ 超越エンドコンテンツ: 精鋭暴走魔物軍団, 危険度10,000突破, 真の最終ボス討伐 (Lv.20~520)'
  ]
};

const FLOOR_NAMES_LIST = FLOOR_NAMES_LIST_I18N.ko;

const RES_META: Record<string, { label: string; icon: string }> = {
  gold: { label: '골드', icon: '🪙' },
  wood: { label: '목재', icon: '🪵' },
  stone: { label: '석재', icon: '🪨' },
  iron: { label: '철광석', icon: '⚙️' },
  food: { label: '식량', icon: '🍖' },
  ether: { label: '에테르', icon: '✨' },
  herb: { label: '약초', icon: '🌿' },
  bone: { label: '짐승 뼈', icon: '🦴' },
  void_shard: { label: '공허파편', icon: '🌌' },
  dark_essence: { label: '암흑정수', icon: '🌑' },
  crystal: { label: '마력수정', icon: '💎' },
  leather: { label: '가죽', icon: '🥋' },
  coal: { label: '석탄', icon: '⬛' },
  silk: { label: '실크', icon: '🧵' },
};

interface ItemCostDef {
  key: string;
  label: string;
  icon: string;
  desc: string;
  detailDesc: string;
  costs: Record<string, number>;
}

const SUPPLIES: ItemCostDef[] = [
  {
    key: 'torch', label: '횃불', icon: '🔥',
    desc: '어둠 억제 & 위험도 상승 완화',
    detailDesc: '심연의 짙은 어둠을 몰아내어 기습을 방지하고 위험도 증가 속도를 35% 늦춥니다. 탐험 중 점등 시 1개가 소모됩니다. (목재 2개, 석탄 2개 소모)',
    costs: { gold: 40, wood: 2, coal: 2 }
  },
  {
    key: 'food', label: '식량', icon: '🍖',
    desc: '야영 시 HP/MP 35% 회복',
    detailDesc: '휴식 중 원정대의 허기를 채워줍니다. 야영(Camp)을 진행할 때 1개를 소모하여 파티원 전원의 HP와 MP를 35% 회복합니다. (방주 식량 4개 소모)',
    costs: { gold: 40, food: 4 }
  },
  {
    key: 'pickaxe', label: '곡괭이', icon: '⛏️',
    desc: '광맥 채굴 및 무너진 통로 개척',
    detailDesc: '단단한 암반과 광맥을 파쇄하는 도구입니다. 던전 내에서 고순도 에테르 광맥을 채굴하거나 막힌 지름길을 뚫을 수 있습니다. (석재 6개, 목재 1개 소모)',
    costs: { gold: 50, stone: 6, wood: 1 }
  },
  {
    key: 'bandage', label: '붕대', icon: '🩹',
    desc: '야영 시 모든 디버프 상태이상 치료',
    detailDesc: '깨끗한 약초와 가죽으로 만든 붕대입니다. 야영 시 소지하고 있으면 파티원들의 출혈·중독·화상 등 모든 해로운 디버프 상태이상을 즉시 정화합니다.',
    costs: { gold: 45, herb: 1, leather: 1 }
  },
  {
    key: 'holy_water', label: '정화의 성수', icon: '💧',
    desc: '저주 제단 정화 시 HP/MP 50% 회복 & 디버프 해제 & 면역 3턴',
    detailDesc: '에테르와 성스러운 약초를 축성한 물입니다. 심연의 타락한 제단을 정화하여 파티원 전원의 HP/MP 50% 회복, 디버프 해제 및 3턴간 상태이상 면역 결계를 부여합니다.',
    costs: { gold: 60, herb: 2, ether: 5 }
  },
  {
    key: 'key', label: '던전 열쇠', icon: '🗝️',
    desc: '잠긴 고대 석관 및 보물 상자 안전 개방',
    detailDesc: '단단한 강철과 석재로 정밀 가공한 열쇠입니다. 잠겨 있는 보물 상자나 고대 석관을 함정 위험 없이 안전하게 해제하여 최대 전리품을 획득합니다.',
    costs: { gold: 50, iron: 2, stone: 4 }
  },
  {
    key: 'rift_anchor', label: '균열의 닻', icon: '⚓',
    desc: '탐험 중 언제든 성채로 즉시 안전 귀환',
    detailDesc: '차원 공간을 고정하는 마도 닻입니다. 던전 탐험 도중 언제든 사용하여 획득한 전리품 손실 없이 성채로 즉시 안전 귀환합니다. (미사용 시 영구 보존)',
    costs: { gold: 120, stone: 4, ether: 5 }
  },
];

const ENHANCED_SUPPLY_MAP: Record<string, { enhancedKey: string; enhancedLabel: string; enhancedIcon: string }> = {
  torch:       { enhancedKey: 'enhanced_torch',       enhancedLabel: '에테르 횃불', enhancedIcon: '✨🔥' },
  food:        { enhancedKey: 'enhanced_food',        enhancedLabel: '던전 도시락', enhancedIcon: '🍱' },
  pickaxe:     { enhancedKey: 'enhanced_pickaxe',     enhancedLabel: '심연 곡괭이', enhancedIcon: '⛏️✨' },
  bandage:     { enhancedKey: 'enhanced_bandage',     enhancedLabel: '성유 붕대',   enhancedIcon: '🩹✨' },
  holy_water:  { enhancedKey: 'enhanced_holy_water',  enhancedLabel: '여신의 성수', enhancedIcon: '💧✨' },
  key:         { enhancedKey: 'enhanced_key',         enhancedLabel: '황금 열쇠',   enhancedIcon: '🗝️✨' },
  rift_anchor: { enhancedKey: 'enhanced_rift_anchor', enhancedLabel: '심연의 닻',   enhancedIcon: '⚓✨' },
};

const CATALYSTS: ItemCostDef[] = [
  {
    id: 'compass', key: 'compass', name: '차원의 나침반', label: '차원의 나침반', icon: '🧭',
    desc: '용병 긴급 이송 턴 1턴 단축 & 차원 포탈 발견↑',
    detailDesc: '공허의 에테르 흐름을 감지하고 차원 통로를 단축하는 마도 나침반입니다. 던전 내에서 예비 대원을 긴급 이송할 때 소요되는 대기 턴을 1턴 줄여줍니다. 또한 탐험 중 비밀 차원 포탈의 발견 확률도 함께 증가합니다.',
    costs: { gold: 50, crystal: 1, ether: 10 }
  } as ItemCostDef & { id: string; name: string },
  {
    id: 'blood_contract', key: 'blood_contract', name: '피의 서약서', label: '피의 서약서', icon: '📜',
    desc: '강적 출현율 증가 & 전리품 2배',
    detailDesc: '마물의 피와 약초, 질긴 가죽에 새긴 피의 계약입니다. 몬스터 조우 확률이 상승하지만, 탐험에서 획득하는 모든 골드 전리품이 2배로 증폭됩니다.',
    costs: { gold: 50, leather: 2, herb: 2 }
  } as ItemCostDef & { id: string; name: string },
  {
    id: 'dimensional_whistle', key: 'dimensional_whistle', name: '차원의 호각', label: '차원의 호각', icon: '📯',
    desc: '전멸 시 배낭 전리품 10~50% 회수',
    detailDesc: '공간 왜곡 신호를 보내는 비상 호각입니다. 파티 전멸 시 구조대를 긴급 호출하여 배낭 전리품의 10~50%를 회수합니다. (미장착 시 전멸하면 배낭 전리품 100% 소실)',
    costs: { gold: 150, ether: 20, void_shard: 1 }
  } as ItemCostDef & { id: string; name: string },
  {
    id: 'golden_toad', key: 'golden_toad', name: '황금 두꺼비', label: '황금 두꺼비', icon: '🐸',
    desc: '드랍 자원 즉시 골드 변환',
    detailDesc: '고대 심연의 탐욕을 머금은 황금 두꺼비 유물입니다. 던전에서 획득하는 장비, 오파츠, 수집품을 제외한 모든 자원류(목재, 석재, 철광석, 약초, 가죽 등)를 얻는 즉시 블랙마켓 기본 시세에 따라 골드로 환전하여 배낭에 입고합니다.',
    costs: { gold: 1000, iron: 20, ether: 50 }
  } as ItemCostDef & { id: string; name: string },
];

const BAG_OPTIONS = [
  { id: 'small', name: '가벼운 백팩', slots: 12, perk: '기습 회피율 +10%', costs: {} },
  { id: 'medium', name: '표준 군장', slots: 16, perk: '표준 밸런스형', costs: { gold: 100, leather: 2 } },
  { id: 'large', name: '완전 군장', slots: 20, perk: '대용량 보관함', costs: { gold: 300, ether: 30, void_shard: 1 } },
  { id: 'wagon', name: '견고한 짐수레', slots: 30, perk: '30칸 & 자원 스택 99', costs: { gold: 1200, wood: 20, iron: 15, leather: 10, ether: 50, void_shard: 3 } },
];

export const ExploreDrawer: React.FC<{ onClose: () => void; onNavigateDrawer?: (k: string) => void }> = ({ onClose, onNavigateDrawer }) => {
  const { state, gm, navigateTo } = useGameManager();
  const { lang, dict, tr } = useI18n();
  const [step, setStep] = useState<'prep' | 'zone'>('prep');
  const [showPartyWarning, setShowPartyWarning] = useState(false);
  const [showSynergyGuide, setShowSynergyGuide] = useState(false);
  const [showCodexModal, setShowCodexModal] = useState(false);
  const [showWagonAdConfirm, setShowWagonAdConfirm] = useState(false);

  // 파티원 수 확인 (최소 3인 필수)
  const partyCount = state.party.length;
  const forgeLv = state.buildings['blacksmith']?.level || 0;

  // 채비 상태 (이전에 선택한 백팩 규격 복원 및 유지. 단 짐수레 사용 후 또는 충전 소진 시 기본 선택 배낭은 표준 군장으로 리셋)
  const initialBagId = (() => {
    if (gm.lastSelectedBagId === 'wagon' && (gm.wagonAdCharges ?? 0) <= 0) {
      gm.lastSelectedBagId = 'medium';
      gm.backpackCapacity = 16;
      return 'medium';
    }
    return gm.lastSelectedBagId || (BAG_OPTIONS.find(b => b.slots === (state.backpackCapacity || gm.backpackCapacity))?.id) || 'medium';
  })();
  const [selectedBagId, setSelectedBagId] = useState<string>(initialBagId);
  const [supplyCounts, setSupplyCounts] = useState<Record<string, number>>({
    torch: 1,
    food: 1,
    pickaxe: 1,
    rift_anchor: 1,
    key: 0,
    bandage: 0,
    holy_water: 0,
  });
  const [selectedCatalysts, setSelectedCatalysts] = useState<string[]>([]);

  // 상세 확인 팝업 모달 상태
  const [inspectItem, setInspectItem] = useState<{ item: ItemCostDef; type: 'supply' | 'catalyst' } | null>(null);

  const selectedBag = BAG_OPTIONS.find(b => b.id === selectedBagId) || BAG_OPTIONS[1];

  const [isCatalystAdLoading, setIsCatalystAdLoading] = useState(false);

  const handleWatchAdForCatalyst = async () => {
    if (isCatalystAdLoading) return;
    setIsCatalystAdLoading(true);
    try {
      const res = await GoogleAdService.getInstance().showRewardedAd({
        placement: 'catalyst',
        title: '심연 촉매 슬롯 개방',
        description: '광고를 시청하여 다음 원정에서 심연 촉매를 최대 2개 장착할 수 있도록 슬롯을 개방합니다.',
        rewardText: '심연 촉매 슬롯 개방 (최대 2개 무료 장착)',
      });
      if (res.rewarded) {
        gm.grantCatalystCharge();
      }
    } finally {
      setIsCatalystAdLoading(false);
    }
  };

  const handleSelectBag = async (bagId: string) => {
    if (bagId === 'wagon') {
      const wCharges = gm.wagonAdCharges ?? 0;
      if (wCharges <= 0) {
        setShowWagonAdConfirm(true);
        return;
      }
    }

    setSelectedBagId(bagId);
    gm.lastSelectedBagId = bagId;
    const bOption = BAG_OPTIONS.find(b => b.id === bagId);
    if (bOption) {
      gm.backpackCapacity = bOption.slots;
    }
    gm.saveGame();
  };

  const handleConfirmWagonAd = async () => {
    setShowWagonAdConfirm(false);
    const res = await GoogleAdService.getInstance().showRewardedAd({
      placement: 'wagon',
      title: '견고한 짐수레 1회 사용',
      description: '광고를 시청하여 이번 원정에서 30칸 대용량 짐수레(자원 스택 99) 1회 사용 및 심연 촉매 슬롯을 개방합니다.',
      rewardText: '짐수레 1회 사용 & 심연 촉매 슬롯 개방',
    });
    if (res.rewarded) {
      gm.refillWagonCharges();
      setSelectedBagId('wagon');
      gm.lastSelectedBagId = 'wagon';
      gm.backpackCapacity = 30;
      gm.saveGame();
    }
  };

  // 총 소모 자원 계산
  const totalCosts: Record<string, number> = {};
  
  // 1. 배낭 비용
  Object.entries(selectedBag.costs).forEach(([res, val]) => {
    totalCosts[res] = (totalCosts[res] || 0) + val;
  });

  // 2. 소모품 비용 (강화 보급품 재고 우선 무료 불출 ➔ 일반 재고 무료 불출 ➔ 초과분만 구매 비용 계산!)
  Object.entries(supplyCounts).forEach(([key, count]) => {
    if (count > 0) {
      const item = SUPPLIES.find(s => s.key === key);
      if (item) {
        const enhInfo = ENHANCED_SUPPLY_MAP[key];
        const enhInStock = enhInfo ? (gm.citadelSupplies?.[enhInfo.enhancedKey] || 0) : 0;
        const fromEnh = Math.min(count, enhInStock);
        const remainAfterEnh = count - fromEnh;

        const normalInStock = gm.citadelSupplies?.[key] || 0;
        const fromNormal = Math.min(remainAfterEnh, normalInStock);
        const needToBuy = Math.max(0, remainAfterEnh - fromNormal);

        if (needToBuy > 0) {
          Object.entries(item.costs).forEach(([res, val]) => {
            totalCosts[res] = (totalCosts[res] || 0) + (val * needToBuy);
          });
        }
      }
    }
  });

  // 3. 촉매 비용 (광고로 슬롯을 개방한 상태면 자원 비용 완전 면제!)
  if (!gm.hasCatalystCharge) {
    selectedCatalysts.forEach(cid => {
      const cat = CATALYSTS.find(c => c.key === cid);
      if (cat) {
        Object.entries(cat.costs).forEach(([res, val]) => {
          totalCosts[res] = (totalCosts[res] || 0) + val;
        });
      }
    });
  }

  // 보유 자원 체크
  const resState = state.resources as unknown as Record<string, number>;
  const missingResources: string[] = [];
  Object.entries(totalCosts).forEach(([res, req]) => {
    const cur = resState[res] || 0;
    if (cur < req) {
      const meta = RES_META[res] || GameManager.getResourceMeta(res);
      const rLabel = ('label' in meta ? meta.label : (meta as any)?.name) || res;
      missingResources.push(`${meta?.icon || '📦'} ${rLabel} (${cur}/${req})`);
    }
  });

  const canAfford = missingResources.length === 0;

  // 촉매 선택 토글 (광고 미시청 시 0/0 잠김 해금 유도, 개방 시 최대 2개)
  const toggleCatalyst = (id: string) => {
    if (!gm.hasCatalystCharge) {
      handleWatchAdForCatalyst();
      return;
    }
    if (selectedCatalysts.includes(id)) {
      setSelectedCatalysts(selectedCatalysts.filter(c => c !== id));
    } else {
      if (selectedCatalysts.length >= 2) {
        gm.addLog('심연 촉매는 최대 2개까지만 장착할 수 있습니다.', 'danger');
        return;
      }
      setSelectedCatalysts([...selectedCatalysts, id]);
    }
  };

  // 포지션 토글
  const cyclePosition = (heroId: string, currentPos: string) => {
    const nextPos: Record<string, 'front' | 'mid' | 'back'> = {
      front: 'mid',
      mid: 'back',
      back: 'front',
    };
    gm.setHeroPosition(heroId, nextPos[currentPos] || 'mid');
  };

  // 던전 최종 진입
  const startDescent = (floorNum: number, initialDanger: number = 0) => {
    if (partyCount < 3) {
      setShowPartyWarning(true);
      return;
    }

    if (!canAfford) {
      gm.addLog(`자원이 부족합니다! 부족한 자원: ${missingResources.join(', ')}`, 'danger');
      return;
    }

    // 모든 소모 자원 차감
    Object.entries(totalCosts).forEach(([res, amt]) => {
      gm.modifyResource(res as keyof typeof state.resources, -amt);
    });

    // 배낭 용량 저장
    gm.lastSelectedBagId = selectedBag.id;
    gm.backpackCapacity = selectedBag.slots;

    // 창고 재고 차감 및 던전 인벤토리 채우기 (강화 보급품 재고 무조건 우선 불출!)
    gm.dungeonInventory = [];
    Object.entries(supplyCounts).forEach(([k, qty]) => {
      if (qty > 0) {
        const item = SUPPLIES.find(s => s.key === k);
        if (item) {
          const enhInfo = ENHANCED_SUPPLY_MAP[k];
          const enhInStock = enhInfo ? (gm.citadelSupplies?.[enhInfo.enhancedKey] || 0) : 0;
          const fromEnh = Math.min(qty, enhInStock);
          const remainQty = qty - fromEnh;

          // 1) 강화 보급품 우선 불출
          if (fromEnh > 0 && enhInfo) {
            gm.consumeCitadelSupply(enhInfo.enhancedKey, fromEnh);
            gm.addToDungeonInventory(enhInfo.enhancedKey, enhInfo.enhancedLabel, enhInfo.enhancedIcon, fromEnh, undefined, undefined, 'supply');
          }

          // 2) 초과분은 일반 보급품으로 다른 스택에 불출
          if (remainQty > 0) {
            const normalInStock = gm.citadelSupplies?.[k] || 0;
            const fromNormal = Math.min(remainQty, normalInStock);
            if (fromNormal > 0) {
              gm.consumeCitadelSupply(k, fromNormal);
            }
            gm.addToDungeonInventory(item.key, item.label, item.icon, remainQty, undefined, undefined, 'supply');
          }
        }
      }
    });

    // 🔮 심연 활성 촉매 설정 (보급품 채비 완료 후 활성화하여 보급품이 황금 두꺼비로 변환되는 것 방지)
    gm.activeCatalysts = selectedCatalysts;
    if (selectedCatalysts.length > 0) {
      gm.consumeCatalystCharge();
    }
    if (selectedBag.id === 'wagon') {
      gm.wagonAdCharges = 0; // 1회 사용 즉시 소모
    }

    // 🏥 입원 환자 출전 원천 차단
    if (gm.party.some(p => gm.infirmaryPatients.includes(p.id))) {
      gm.addLog('⚠️ [출전 불가] 생체 복원 병동에 입원 중인 용병이 파티에 포함되어 있습니다. 퇴원 후 출전하세요.', 'danger');
      return;
    }
    gm.dungeonFloor = floorNum;
    gm.sortPartyByPosition();
    gm.dungeonDangerLevel = initialDanger;
    gm.isOvercharged = false;
    gm.overchargedBossDefeatedOnFloor = 0;
    gm.defeatedOverchargedFloorsThisRun = [];
    // 📜 제1장 퀘스트: 침묵의 회랑 1구역 진입 즉시 목표 달성 (최초 1회만 달성 트리거)
    if (floorNum >= 1 && !gm.hasEnteredDungeon) {
      gm.hasEnteredDungeon = true;
      gm.updateQuestObjective('Q_MAIN_02', 2, 1);
    }
    const dangerLog = initialDanger > 0 ? ` (시작 위험도: ${initialDanger.toLocaleString()})` : '';
    gm.addLog(`⚔️ [심연 강하] ${selectedBag.name}과 보급품을 채비하고 ${floorNum === 11 ? '무간도' : `${floorNum}층`}으로 진입합니다!${dangerLog}`, 'story');
    gm.saveGame();
    navigateTo('exploration');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d111a] text-[#cfd8e8] relative">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] shrink-0 bg-[#080b11]">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${step === 'prep' ? 'text-[#f3e5c8]' : 'text-[#c4a5e6]'}`}>
            {step === 'prep' ? '🏕️ 심연 강하: 탐험 채비실' : '🌀 강하 구역(층) 선택'}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${step === 'prep' ? 'bg-[#5c452444] text-[#f3e5c8] border-[#87673955]' : 'bg-[#2a113d55] text-[#c4a5e6] border-[#5c2b8a66]'}`}>
            {step === 'prep' ? '1단계: 채비' : '2단계: 진입'}
          </span>
          <EncyclopediaBadge tab="all" label="탐험 백과" />
        </div>
        <button
          className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg flex items-center justify-center"
          style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
          onClick={onClose}
          aria-label="닫기"
        >
          <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
        </button>
      </div>

      {/* ── 1단계: 탐험 채비 ── */}
      {step === 'prep' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
          {/* 1. 원정대 진형 배치 */}
          <div className="panel p-3 bg-[#111622]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#ffd54f]">🛡️ 1. 원정대 포지션 배치</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${partyCount === 3 ? 'bg-[#38ef7d22] text-[#38ef7d]' : 'bg-[#ef535022] text-[#ef5350]'}`}>
                  ({partyCount}/3명)
                </span>
              </div>
              <span className="text-[10px] text-[#8b9bb4]">버튼을 탭하여 위치 변경</span>
            </div>

            {/* 파티원 3인 미달 시 경고 배너 */}
            {partyCount < 3 && (
              <div className="p-2.5 rounded-lg bg-[#2b1414] border border-[#ef535088] flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="text-xs font-bold text-[#ef5350]">원정대 인원 부족 ({partyCount}/3명)</div>
                    <div className="text-[10px] text-[#cfd8dc]">심연 던전 진입을 위해 3명의 파티원을 모두 편성해야 합니다.</div>
                  </div>
                </div>
                {onNavigateDrawer && (
                  <button
                    className="btn btn-primary text-xs px-2.5 py-1 font-bold shrink-0 shadow-md shadow-[#ffd54f22] cursor-pointer"
                    onClick={() => {
                      onNavigateDrawer('barracks');
                    }}
                  >
                    👥 편성하기
                  </button>
                )}
              </div>
            )}

            {/* 입원 중인 용병 포함 경고 배너 */}
            {state.party.some(p => state.infirmaryPatients.includes(p.id)) && (
              <div className="p-2.5 rounded-lg bg-[#2b1414] border border-[#ff704388] flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  <div>
                    <div className="text-xs font-bold text-[#ff7043]">입원 환자 포함 (출전 불가)</div>
                    <div className="text-[10px] text-[#cfd8dc]">생체 복원 병동에 입원 중인 용병이 파티에 있습니다. 퇴원하거나 다른 용병으로 교체하세요.</div>
                  </div>
                </div>
                {onNavigateDrawer && (
                  <button
                    className="btn btn-primary text-xs px-2.5 py-1 font-bold shrink-0 cursor-pointer"
                    onClick={() => {
                      onNavigateDrawer('barracks');
                    }}
                  >
                    👥 편성 변경
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {(() => {
                const validParty = state.party.filter(p => state.barracks.some(b => b.id === p.id));
                if (validParty.length === 0) {
                  return (
                    <div className="p-3 text-center text-xs text-[#8b9bb4] bg-[#0c101a] rounded-lg border border-[#1f2738] flex flex-col items-center gap-2">
                      <div>
                        현재 원정대에 편성된 용병이 없습니다.<br />
                        <span className="text-[10px] text-[#ffd54f] font-bold mt-1 inline-block">[원정단 편성]에서 3명의 용병을 출전시켜 주세요.</span>
                      </div>
                      {onNavigateDrawer && (
                        <button
                          className="btn btn-primary text-xs px-3 py-1 font-bold shadow-md shadow-[#ffd54f22] cursor-pointer flex items-center gap-1.5"
                          onClick={() => onNavigateDrawer('barracks')}
                        >
                          <span>⚔️</span>
                          <span>원정단 편성하기</span>
                        </button>
                      )}
                    </div>
                  );
                }
                return validParty.map((hero) => {
                  const pos = hero.position || 'mid';
                  const posMeta = {
                    front: { label: '🛡️ 전열', color: '#ef5350', perk: '피격률↑ 피해-10%' },
                    mid:   { label: '🎯 중열', color: '#ffd54f', perk: '치명타+10% 회피+10%' },
                    back:  { label: '🔮 후열', color: '#42a5f5', perk: '마나소모-15% 마법+15%' },
                  }[pos];
                  const cls = CHARACTER_CLASSES[hero.classId];
                  const classEmoji = getClassEmoji(hero.classId);
                  const heroPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
                    || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
                    || (hero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(hero.portraitPromptKey) : undefined)
                    || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
                    || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

                  return (
                    <div key={hero.id} className="flex items-center justify-between p-2 rounded bg-[#182030] border border-[#27354d]">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg bg-[#111827] border border-[#23334d] flex items-center justify-center shrink-0 overflow-hidden shadow-inner"
                          title={`${cls?.name || hero.classId} (${hero.name})`}
                        >
                          {heroPortrait ? (
                            <img
                              src={heroPortrait}
                              alt={hero.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-lg">{classEmoji}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{hero.name}</span>
                            <span className="text-[10px] text-[#00d2ff] font-medium">{cls?.name || hero.classId}</span>
                            <span className="text-[10px] text-[#8b9bb4]">Lv.{hero.level}</span>
                            {state.infirmaryPatients.includes(hero.id) && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-bold animate-pulse">
                                🏥 입원중
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-[#8b9bb4]">{posMeta.perk}</div>
                        </div>
                      </div>
                      <button
                        className="btn text-xs px-3 py-1 font-bold border transition-all"
                        style={{ borderColor: posMeta.color, color: posMeta.color, background: `${posMeta.color}15` }}
                        onClick={() => cyclePosition(hero.id, pos)}
                      >
                        {posMeta.label}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* 1.5. 원정대 활성 시너지 (Party Synergies) */}
          <PartySynergyPanel
            party={state.party.filter(p => state.barracks.some(b => b.id === p.id))}
            onOpenGuide={() => setShowSynergyGuide(true)}
            onOpenCodex={() => setShowCodexModal(true)}
          />

          {/* 2. 배낭 규격 선택 (테두리 가시성 강화) */}
          <div className="panel p-3 bg-[#111622]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#00d2ff]">
                🎒 2. {'배낭 규격 선택'}
              </span>
              <span className="text-[10px] text-[#00d2ff]">
                '현재 선택:' {selectedBag.name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BAG_OPTIONS.map((bag) => {
                const isSelected = selectedBagId === bag.id;
                const locBag = bag;
                const bName = locBag?.name || bag.name;
                const bPerk = locBag?.perk || bag.perk;
                return (
                  <div
                    key={bag.id}
                    className={`relative panel p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-2 border-[#876739] bg-[#42321944] shadow-[0_0_12px_rgba(135,103,57,0.35)] scale-[1.02]' : 'border border-[#27354d] bg-[#141a29] hover:border-[#415473]'
                    }`}
                    onClick={() => handleSelectBag(bag.id)}
                  >
                    {/* 선택 체크 뱃지 */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-[#5c4524] text-[#f3e5c8] border border-[#876739] font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow">
                        ✓
                      </div>
                    )}
                    <div className={`text-xs font-bold ${isSelected ? 'text-[#f3e5c8]' : 'text-white'}`}>{bName}</div>
                    <div className={`text-base font-mono font-bold my-0.5 ${isSelected ? 'text-[#f3e5c8]' : 'text-[#8b9bb4]'}`}>
                      {bag.slots}{'칸'}
                    </div>
                    <div className="text-[9px] text-[#8b9bb4] mb-1">{bPerk}</div>
                    <div className="text-[10px] font-mono flex flex-wrap justify-center gap-1">
                      {bag.id === 'wagon' ? (
                        (gm.wagonAdCharges ?? 0) > 0 ? (
                          <span className="text-[#38ef7d] font-bold">{tr('인증 완료')}</span>
                        ) : (
                          <span className="text-[#ffd54f] font-bold flex items-center gap-0.5">🎬 {tr('광고 시청')}</span>
                        )
                      ) : Object.keys(bag.costs).length === 0 ? (
                        <span className="text-[#66bb6a]">{'무료'}</span>
                      ) : (
                        Object.entries(bag.costs).map(([r, c]) => (
                          <span key={r} className="text-[#ffd54f]">{RES_META[r]?.icon || '📦'}{c}</span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 소모품 보급 (탭하면 상세 팝업) */}
          <div className="panel p-3 bg-[#111622]">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div>
                <span className="text-xs font-bold text-[#66bb6a]">
                  🍖 {'3. 필수 소모품 보급'}
                </span>
                <span className="text-[10px] text-[#8b9bb4] ml-2">
                  {'(항목 탭 시 상세/재료 확인)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="text-[10px] px-2 py-0.5 rounded bg-[#e74c3c22] text-[#ff7675] hover:bg-[#e74c3c44] border border-[#e74c3c44] transition-colors"
                  onClick={() => setSupplyCounts({ torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, rift_anchor: 0 })}
                  title={'모든 소모품 0개로 설정'}
                >
                  {'비우기 (0개)'}
                </button>
                <button
                  className="text-[10px] px-2 py-0.5 rounded bg-[#1f2738] text-[#8b9bb4] hover:text-white transition-colors"
                  onClick={() => setSupplyCounts({ torch: 1, food: 1, pickaxe: 1, rift_anchor: 1, key: 0, bandage: 0, holy_water: 0 })}
                  title={'기본 프리셋 (횃불 1, 식량 1, 곡괭이 1, 균열의 닻 1)'}
                >
                  {'기본 (1,1,1,닻1)'}
                </button>
                <button
                  className="text-[10px] px-2 py-0.5 rounded bg-[#5c452433] text-[#f3e5c8] hover:bg-[#5c452455] font-bold border border-[#87673966] transition-colors"
                  onClick={() => setSupplyCounts({ torch: 3, food: 3, pickaxe: 1, bandage: 1, holy_water: 1, key: 1, rift_anchor: 1 })}
                  title={'완전 탐사 프리셋 (횃불 3, 식량 3, 나머지 각 1개)'}
                >
                  {'완전 탐사 (3,3,올1)'}
                </button>
              </div>
            </div>

            {/* 💡 병기창 Lv.6+ 보급품 운용 규칙 안내 배너 */}
            {forgeLv >= 6 && (
              <div className="p-2.5 rounded-lg bg-[#141b2d] border border-[#00d2ff44] text-[10px] text-[#cfd8e8] mb-2.5 leading-relaxed flex items-start gap-2">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <div className="text-[#00d2ff] font-bold text-[11px] mb-0.5">병기창 Lv.6+ 보급품 운용 안내</div>
                  <div>
                    채비실에서 즉시 추가(구매)하는 보급품은 <strong className="text-[#ffd54f]">일반 보급품</strong>입니다.
                    월등한 효과의 <strong className="text-[#38ef7d]">강화 보급품(에테르 횃불 등)</strong>을 지참하려면 <strong className="text-white underline">병기창에서 미리 생산</strong>해두어야 하며, 창고 재고가 채비 시 최우선 불출됩니다!
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {SUPPLIES.map((item) => {
                const cnt = supplyCounts[item.key] || 0;
                const locSupply = item;
                const sLabel = item.label;
                const sDesc = item.desc;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded bg-[#182030] border border-[#27354d] hover:border-[#3d5070] transition-colors"
                  >
                    {/* 클릭 시 상세 팝업 열기 */}
                    {(() => {
                      const enhInfo = ENHANCED_SUPPLY_MAP[item.key];
                      const enhInStock = enhInfo ? (gm.citadelSupplies?.[enhInfo.enhancedKey] || 0) : 0;
                      const normInStock = gm.citadelSupplies?.[item.key] || 0;
                      const activeKey = enhInStock > 0 && enhInfo ? enhInfo.enhancedKey : item.key;
                      const activeIcon = enhInStock > 0 && enhInfo ? enhInfo.enhancedIcon : item.icon;

                      return (
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => setInspectItem({ item, type: 'supply' })}
                        >
                          <span className="text-xl flex items-center justify-center">
                            <GameIcon name={activeKey} icon={activeIcon} size={20} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white hover:text-[#00d2ff]">{sLabel}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d33] flex items-center gap-1">
                                {enhInStock > 0 ? (
                                  <>
                                    <span className="text-[#ffd54f]">✨강화 {enhInStock}개</span>
                                    <span className="text-[#8b9bb4]">|</span>
                                    <span>일반 {normInStock}개</span>
                                  </>
                                ) : (
                                  <span>{`창고 재고 ${normInStock}개`}</span>
                                )}
                              </span>
                              {cnt > 0 && (
                                (() => {
                                  const fromEnh = Math.min(cnt, enhInStock);
                                  const remain = cnt - fromEnh;
                                  const fromNorm = Math.min(remain, normInStock);
                                  const needBuy = Math.max(0, remain - fromNorm);

                                  return (fromEnh > 0 || fromNorm > 0) ? (
                                    <span className="text-[9px] text-[#38ef7d] font-mono">
                                      ({fromEnh > 0 ? `✨${fromEnh}개 강화품 우선` : ''}{fromNorm > 0 ? `${fromEnh > 0 ? ', ' : ''}${fromNorm}개 일반재고` : ''}{needBuy > 0 ? `, ${needBuy}개 구매` : ''})
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-[#ffd54f] flex items-center gap-1">
                                      {Object.entries(item.costs).map(([r, val]) => (
                                        <span key={r}>{RES_META[r]?.icon}{val * cnt}</span>
                                      ))}
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                            <div className="text-[9px] text-[#8b9bb4] truncate">{sDesc}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 수량 증감 버튼 */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        className="btn btn-ghost px-2 py-0.5 text-xs text-[#8b9bb4]"
                        onClick={() => setSupplyCounts({ ...supplyCounts, [item.key]: Math.max(0, cnt - 1) })}
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-sm text-[#00d2ff]">{cnt}</span>
                      <button
                        className="btn btn-ghost px-2 py-0.5 text-xs text-[#00d2ff]"
                        onClick={() => setSupplyCounts({ ...supplyCounts, [item.key]: Math.min(10, cnt + 1) })}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. 심연 촉매 & 특수 유물 (상시 표시: 미시청 시 0/0 선택 잠김, 광고 시청 시 0/2 개방) */}
          <div className={`panel p-3 transition-all ${
            gm.hasCatalystCharge
              ? 'bg-[#111622] border border-[#ce93d866] shadow-[0_0_15px_rgba(206,147,216,0.15)]'
              : 'bg-[#10141f] border border-[#27354d]'
          }`}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ce93d8]">
                  🔮 4. 심연 촉매 & 특수 유물
                </span>
                {gm.hasCatalystCharge ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44] flex items-center gap-0.5">
                    <span>✨</span>
                    <span>슬롯 개방됨 (0/2)</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ef535015] text-[#ef5350] font-bold border border-[#ef535033] flex items-center gap-0.5">
                    <span>🔒</span>
                    <span>슬롯 잠김 (0/0)</span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono font-bold ${gm.hasCatalystCharge ? 'text-[#ce93d8]' : 'text-[#ef5350]'}`}>
                {gm.hasCatalystCharge ? `${selectedCatalysts.length}/2개 선택됨` : '0/0개 선택 가능'}
              </span>
            </div>

            {/* 광고 미시청 시 슬롯 개방 안내 및 시청 버튼 배너 */}
            {!gm.hasCatalystCharge && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#181126] to-[#120d1c] border border-[#8e24aa44] flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl select-none shrink-0">🔮</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#e1bee7]">
                      광고를 시청하면 촉매 선택 슬롯이 <strong className="text-[#ffd54f]">0/2</strong>로 개방됩니다!
                    </div>
                    <div className="text-[10px] text-[#9e9e9e] mt-0.5 leading-tight">
                      원정 1회 동안 촉매 4종 중 최대 2개 무료 장착 <span className="text-[#38ef7d]">(묘지·성화·짐수레 광고로도 동시 개방)</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCatalystAdLoading}
                  className="btn btn-primary text-xs px-3.5 py-2 font-bold shrink-0 bg-gradient-to-r from-[#ab47bc] to-[#7b1fa2] hover:brightness-110 border-0 flex items-center gap-1.5 shadow-lg shadow-[#ab47bc33] cursor-pointer whitespace-nowrap"
                  onClick={handleWatchAdForCatalyst}
                >
                  <span>🎬</span>
                  <span>{isCatalystAdLoading ? '로딩 중...' : '광고 보고 0/2 개방'}</span>
                </button>
              </div>
            )}

            {/* 촉매 4종 카드 그리드 (항상 표시되어 효과 확인 가능) */}
            <div className="grid grid-cols-2 gap-2">
              {CATALYSTS.map((cat) => {
                const isSelected = selectedCatalysts.includes(cat.key);
                const catLabel = cat.label;
                const catDesc = cat.desc;
                return (
                  <div
                    key={cat.key}
                    className={`panel p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-2 border-[#ce93d8] bg-[#ce93d822] shadow-[0_0_12px_rgba(206,147,216,0.3)]' 
                        : gm.hasCatalystCharge
                          ? 'border border-[#27354d] bg-[#141a29] hover:border-[#3d5070]'
                          : 'border border-[#222a3d] bg-[#101522] opacity-90 hover:border-[#3d5070]'
                    }`}
                    onClick={() => setInspectItem({ item: cat, type: 'catalyst' })}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{cat.icon}</span>
                        {gm.hasCatalystCharge ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38ef7d15] text-[#38ef7d] font-bold border border-[#38ef7d33]">
                            무료 장착
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535015] text-[#ef5350] font-bold border border-[#ef535033]">
                            0/0 잠김
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-[#ce93d8]' : 'text-white'}`}>{catLabel}</div>
                      <div className="text-[9px] text-[#8b9bb4] mt-0.5 line-clamp-2 leading-tight">{catDesc}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] text-[#00d2ff] underline">
                        {'상세보기'}
                      </span>
                      {gm.hasCatalystCharge ? (
                        <button
                          className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${
                            isSelected ? 'bg-[#ce93d8] text-black' : 'bg-[#27354d] text-[#cfd8e8] hover:bg-[#3d5070]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCatalyst(cat.key);
                          }}
                        >
                          {isSelected ? '✓ 장착됨' : '+ 장착'}
                        </button>
                      ) : (
                        <button
                          className="text-[9px] px-2 py-0.5 rounded font-bold bg-[#8e24aa28] text-[#e1bee7] border border-[#8e24aa55] hover:bg-[#8e24aa55] flex items-center gap-0.5 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWatchAdForCatalyst();
                          }}
                        >
                          <span>🎬</span>
                          <span>개방</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── 2단계: 심연 구역(층) 선택 ── */
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
          <div className="text-xs text-[#8b9bb4] mb-1">
            {'채비 완료! 진입할 심연의 구역을 선택하십시오.'}
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((f) => {
            const isUnlocked = f <= state.unlockedDungeonFloor;
            const currentLang = (typeof lang === 'string' && ['ko', 'en', 'ja'].includes(lang)) ? lang : 'ko';
            const floorNames = FLOOR_NAMES_LIST_I18N[currentLang] || FLOOR_NAMES_LIST_I18N.ko;
            const floorDescs = FLOOR_DESCS_I18N[currentLang] || FLOOR_DESCS_I18N.ko;
            if (f === 11) {
              return (
                <div
                  key={f}
                  className={`panel p-3 flex flex-col gap-2.5 transition-all ${
                    isUnlocked ? 'bg-[#181126] border-[#a742f5]' : 'opacity-40 bg-[#0a0e17] cursor-not-allowed border-[#27354d]'
                  }`}
                  style={{ border: isUnlocked ? '1.5px solid #a742f5' : '1px solid #27354d' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#ce93d8]">
                          {isUnlocked ? `🌌 ★ ${floorNames[10]}` : '🔒 심연 11층: 무간도 (미해금)'}
                        </span>
                        {isUnlocked && (
                          gm.isFloorPurified(11) ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#10b98125] text-[#34d399] border border-[#10b98166] flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                              ✨ 무간 심연 완전 정화
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#7c3aed20] text-[#c4b5fd] border border-[#7c3aed55] flex items-center gap-1">
                              🌫️ 원초의 연무 (공/방 +50%)
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-[10px] text-[#cfd8dc] mt-0.5">
                        {isUnlocked
                          ? `초월 엔드 컨텐츠: 1,000 위험도 단위 세부 진입로 개방 (현재 해금: 무간도 1~${gm.unlockedAviciTier || 1}계층 / 몹 Lv.20~520)`
                          : ('10층 보스 아스모데우스를 토벌해야 무간도 진입로가 영구 해금됩니다.')}
                      </div>
                    </div>
                  </div>

                  {/* 🌌 무간도 1,000 단위 세부 진입 계층 선택 그리드 */}
                  {isUnlocked && (
                    <div className="pt-2 border-t border-[#3d2757] flex flex-col gap-1.5">
                      <div className="text-[11px] font-bold text-[#e1bee7] flex items-center justify-between">
                        <span>{'📍 진입 계층 선택 (위험도 1,000 단위 세부 진입로)'}</span>
                        <span className="text-[10px] text-[#ffd54f]">
                          {`진척도: ${gm.unlockedAviciTier || 1} / 10 계층 해금`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((tier) => {
                          const tierUnlocked = tier <= (gm.unlockedAviciTier || 1);
                          const startDanger = tier === 1 ? 0 : (tier - 1) * 1000 + 1;
                          const reqDanger = (tier - 1) * 1000;
                          const startLv = 20 + Math.floor(startDanger / 100) * 5;
                          return (
                            <button
                              key={tier}
                              type="button"
                              disabled={!tierUnlocked}
                              onClick={() => tierUnlocked && startDescent(11, startDanger)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all ${
                                tierUnlocked
                                  ? 'bg-[#29163f] hover:bg-[#3e1d61] border border-[#ba68c8] text-white shadow-sm hover:scale-[1.01]' : 'bg-[#120d1c] border border-[#2b1e3d] text-[#6b627d] cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="text-left">
                                <div className="font-bold flex items-center gap-1">
                                  <span>{tierUnlocked ? '🌌' : '🔒'}</span>
                                  <span>{`무간도 ${tier}계층`}</span>
                                  {tier === 10 && <span className="text-[9px] text-[#ff7043] font-bold">{'[최심부]'}</span>}
                                </div>
                                <div className="text-[9px] text-[#b39ddb]">
                                  {tierUnlocked
                                    ? (`시작 위험도 ${startDanger.toLocaleString()} (Lv.${startLv}+)`)
                                    : (`위험도 ${reqDanger.toLocaleString()} 돌파 시 해금`)}
                                </div>
                              </div>
                              {tierUnlocked && (
                                <span 
                                  className="text-[10px] font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-0.5"
                                  style={{
                                    background: 'linear-gradient(135deg, #13081c 0%, #220b32 100%)',
                                    color: '#cfbddf',
                                    border: '1px solid #431d66',
                                    boxShadow: '0 2px 6px rgba(25, 8, 38, 0.4)'
                                  }}
                                >
                                  {'강하 ⚔️'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            const isPurified = gm.isFloorPurified(f);
            return (
              <div
                key={f}
                className={`panel p-3 flex items-center justify-between cursor-pointer transition-all ${
                  isUnlocked ? 'hover:border-[#7c3aed88] bg-gradient-to-r from-[#0f0e18] to-[#140e1f]' : 'opacity-40 bg-[#0a0e17] cursor-not-allowed'
                }`}
                style={{ borderColor: isUnlocked ? (isPurified ? '#10b98166' : '#5c2b8a66') : '#27354d' }}
                onClick={() => isUnlocked && startDescent(f)}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: isUnlocked ? '#c4a5e6' : '#8b9bb4' }}>
                      {isUnlocked ? `🌀 ${floorNames[f - 1]}` : (`🔒 심연 ${f}층 (미해금)`)}
                    </span>
                    {isUnlocked && (
                      isPurified ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#10b98125] text-[#34d399] border border-[#10b98166] flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                          ✨ 심연 정화 완료
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#7c3aed20] text-[#c4b5fd] border border-[#7c3aed55] flex items-center gap-1">
                          🌫️ 연무 잠식 (공/방 +{f * 5}%)
                        </span>
                      )
                    )}
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] mt-0.5">
                    {isUnlocked ? floorDescs[f - 1] : ('이전 층의 정예 마물이나 보스를 토벌하고 다음 층으로 이동해야 영구 해금됩니다.')}
                  </div>
                  {isUnlocked && (
                    <div className="text-[9px] mt-1 font-mono">
                      {isPurified ? (
                        <span className="text-[#34d399]">
                          ✨ 성역 정화 완료: 짙은 연무가 걷혀 마물들의 마기 강화가 영구히 소멸했습니다.
                        </span>
                      ) : (
                        <span className="text-[#a78bfa]">
                          🌫️ 원초의 마기 잠식 중: 마물 흉폭화 (+{f * 5}%) · 보스 유물 봉헌 시 정화
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isUnlocked && (
                  <button 
                    className="btn text-xs px-3.5 py-1.5 font-bold rounded-lg transition-all active:scale-95 shadow-md flex items-center gap-1 hover:brightness-110 shrink-0"
                    style={{
                      background: isPurified 
                        ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' 
                        : 'linear-gradient(135deg, #13081c 0%, #220b32 100%)',
                      color: isPurified ? '#a7f3d0' : '#cfbddf',
                      border: isPurified ? '1px solid #059669' : '1px solid #431d66',
                      boxShadow: isPurified ? '0 2px 6px rgba(5, 150, 105, 0.4)' : '0 2px 6px rgba(25, 8, 38, 0.5)'
                    }}
                  >
                    {'강하 개시 ⚔️'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 상세 정보 & 자원 확인 팝업 모달 ── */}
      {inspectItem && (() => {
        const isSupply = inspectItem.type === 'supply';
        const itemLabel = inspectItem.item.label;
        const itemDesc = inspectItem.item.detailDesc || inspectItem.item.desc;
        const categoryTag = isSupply ? '필수 소모품' : '심연 촉매 유물';

        return (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
            onClick={() => setInspectItem(null)}
          >
            <div 
              className="panel-accent w-full max-w-[340px] p-4 flex flex-col gap-3 shadow-2xl"
              style={{ background: '#111622', border: '1px solid #333d4e' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 팝업 헤더 */}
              <div className="flex items-center justify-between border-b border-[#27354d] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl flex items-center justify-center">
                    <GameIcon name={inspectItem.item.key || (inspectItem.item as any).id} icon={inspectItem.item.icon} size={24} />
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[#00d2ff]">{itemLabel}</div>
                    <div className="text-[10px] text-[#8b9bb4]">{categoryTag}</div>
                  </div>
                </div>
                <button className="btn btn-ghost text-xs px-2 py-0.5" onClick={() => setInspectItem(null)}>✕</button>
              </div>

              {/* 상세 설명 */}
              <div className="text-xs text-[#cfd8dc] leading-relaxed bg-[#182030] p-2.5 rounded border border-[#27354d]">
                {itemDesc}
              </div>

              {/* 필요 자원 vs 영지 보유 자원 리스트 (수량 연동 실시간 계산) */}
              <div>
                <div className="text-[11px] font-bold text-[#ffd54f] mb-1.5 flex items-center justify-between">
                  <span>📦 필요 자원 / 영지 현재 자원</span>
                  {isSupply && (
                    <span className="text-[10px] text-[#00d2ff] font-normal font-mono">
                      (수량: {supplyCounts[inspectItem.item.key] || 0}개 기준)
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(inspectItem.item.costs).map(([res, unitReq]) => {
                    const meta = RES_META[res] || GameManager.getResourceMeta(res);
                    const resName = ('label' in meta ? meta.label : (meta as any)?.name) || res;
                    const curAmt = resState[res] || 0;
                    const count = isSupply ? (supplyCounts[inspectItem.item.key] || 0) : 1;
                    const totalReq = count > 0 ? unitReq * count : unitReq;
                    const isEnough = curAmt >= (count > 0 ? unitReq * count : 0);
                    
                    return (
                      <div key={res} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-[#141a29] border border-[#27354d]">
                        <span className="flex items-center gap-1.5 font-bold text-white">
                          <span>{meta?.icon || '📦'}</span>
                          <span>{resName}</span>
                          {count > 1 && (
                            <span className="text-[9px] text-[#8b9bb4] font-normal">
                              (개당 {unitReq})
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs flex items-center gap-1">
                          <span className="text-[#ffd54f] font-bold">
                            필요 {count === 0 ? `0 (${unitReq})` : totalReq}
                          </span>
                          <span className="text-[#8b9bb4]">/</span>
                          <span className={isEnough ? 'text-[#66bb6a] font-bold' : 'text-[#ef5350] font-bold'}>
                            보유 {curAmt}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 팝업 하단 액션 */}
              <div className="border-t border-[#27354d] pt-2 flex items-center justify-between">
                {isSupply ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-[#8b9bb4]">보급 수량:</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost px-2.5 py-1 text-xs"
                        onClick={() => setSupplyCounts({
                          ...supplyCounts,
                          [inspectItem.item.key]: Math.max(0, (supplyCounts[inspectItem.item.key] || 0) - 1)
                        })}
                      >
                        -1
                      </button>
                      <span className="font-mono font-bold text-sm text-[#00d2ff] w-6 text-center">
                        {supplyCounts[inspectItem.item.key] || 0}
                      </span>
                      <button
                        className="btn btn-ghost px-2.5 py-1 text-xs text-[#00d2ff]"
                        onClick={() => setSupplyCounts({
                          ...supplyCounts,
                          [inspectItem.item.key]: Math.min(10, (supplyCounts[inspectItem.item.key] || 0) + 1)
                        })}
                      >
                        +1
                      </button>
                      <button
                        className="btn btn-primary text-xs px-3 py-1 ml-1"
                        onClick={() => setInspectItem(null)}
                      >
                        완료
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-[#8b9bb4]">
                      {gm.hasCatalystCharge 
                        ? (selectedCatalysts.includes(inspectItem.item.key) ? '현재 장착 중' : '미장착 상태 (최대 2개)') 
                        : '슬롯 잠김 (0/0개 선택 가능)'}
                    </span>
                    {gm.hasCatalystCharge ? (
                      <button
                        className={`btn text-xs px-4 py-1.5 font-bold ${
                          selectedCatalysts.includes(inspectItem.item.key) ? 'btn-danger' : 'btn-primary'
                        }`}
                        onClick={() => {
                          toggleCatalyst(inspectItem.item.key);
                          setInspectItem(null);
                        }}
                      >
                        {selectedCatalysts.includes(inspectItem.item.key) ? '장착 해제' : '장착하기'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary text-xs px-3.5 py-1.5 font-bold bg-gradient-to-r from-[#ab47bc] to-[#7b1fa2] border-0 flex items-center gap-1 shadow cursor-pointer"
                        onClick={async () => {
                          setInspectItem(null);
                          await handleWatchAdForCatalyst();
                        }}
                      >
                        <span>🎬</span>
                        <span>광고 보고 0/2 개방</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 하단 비용 바 & 네비게이션 */}
      <div className="p-3 bg-[#080b11] border-t border-[#1f2738] shrink-0 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#8b9bb4]">총 채비 소모 자원</div>
          <div className="text-xs font-bold font-mono flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            {Object.entries(totalCosts).length === 0 ? (
              <span className="text-[#66bb6a]">소모 자원 없음</span>
            ) : (
              Object.entries(totalCosts).map(([r, amt]) => {
                const cur = resState[r] || 0;
                const isShort = cur < amt;
                const meta = RES_META[r] || GameManager.getResourceMeta(r);
                const rLabel = ('label' in meta ? meta.label : (meta as any)?.name) || r;
                return (
                  <span key={r} className={`flex items-center gap-0.5 ${isShort ? 'text-[#ef5350]' : 'text-[#ffd54f]'}`} title={`${rLabel} ${amt}개 필요 (보유: ${cur})`}>
                    <span>{meta?.icon || '📦'}</span>
                    <span>{rLabel}</span>
                    <span>{amt}</span>
                  </span>
                );
              })
            )}
          </div>
          {!canAfford && (
            <div className="text-[10px] text-[#ef5350] mt-0.5 line-clamp-1">
              ⚠️ 부족: {missingResources.join(', ')}
            </div>
          )}
        </div>

        {step === 'prep' ? (
          <button
            className={`btn px-5 py-2.5 text-sm font-bold ${canAfford && !gm.party.some((p: Mercenary) => state.infirmaryPatients.includes(p.id)) ? 'btn-primary' : 'btn-ghost opacity-40'}`}
            disabled={!canAfford || gm.party.some((p: Mercenary) => state.infirmaryPatients.includes(p.id))}
            onClick={() => {
              if (gm.party.some((p: Mercenary) => state.infirmaryPatients.includes(p.id))) {
                return;
              }
              if (partyCount < 3) {
                setShowPartyWarning(true);
                return;
              }
              setStep('zone');
            }}
            style={canAfford ? { background: 'linear-gradient(135deg, #1e0d2d 0%, #34144b 100%)', color: '#e2d4f0', border: '1px solid #5c2b8a', boxShadow: '0 3px 12px rgba(45, 15, 65, 0.4)' } : {}}
          >
            {gm.party.some((p: Mercenary) => state.infirmaryPatients.includes(p.id))
              ? ('⚠️ 입원 환자 출전 불가')
              : (partyCount < 3 ? ('⚠️ 3인 파티 필요') : ('진입 구역 선택 ▶'))}
          </button>
        ) : (
          <button
            className="btn btn-ghost px-4 py-2 text-xs text-[#8b9bb4]"
            onClick={() => setStep('prep')}
          >
            ◀ {'채비 수정하기'}
          </button>
        )}
      </div>

      {/* ── ⚠️ 파티원 3인 미만 경고 모달 ── */}
      {showPartyWarning && (
        <Modal
          title="⚠️ 원정대 인원 부족 (파티 3인 필수)"
          open={true}
          onClose={() => setShowPartyWarning(false)}
          footer={
            <div className="flex gap-2 w-full justify-end">
              <ActionButton
                label="닫기"
                variant="ghost"
                onClick={() => setShowPartyWarning(false)}
              />
              {onNavigateDrawer && (
                <ActionButton
                  label="👥 원정단 편성으로 이동"
                  variant="primary"
                  onClick={() => {
                    setShowPartyWarning(false);
                    onNavigateDrawer('barracks');
                  }}
                />
              )}
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#241315] border border-[#ef535066]">
              <span className="text-3xl">👥</span>
              <div>
                <div className="text-sm font-bold text-[#ef5350]">파티 인원이 3명 미만입니다!</div>
                <div className="text-xs text-[#cfd8dc] mt-0.5 font-mono">
                  현재 출전 인원: <span className="font-bold text-[#ffd54f]">{partyCount} / 3명</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-[#cfd8dc] leading-relaxed">
              심연 던전은 위험도가 극도로 높아 <strong className="text-[#ffd54f]">최소 3인의 정예 원정대</strong> 편성이 필수적입니다.
              <br /><br />
              <span className="text-[#00d2ff] font-bold">[영지 관리 ➔ 원정단 편성]</span>에서 용병 3명을 파티에 출전시킨 후 다시 출정 채비를 진행해주세요!
            </div>
          </div>
        </Modal>
      )}

      {/* ── ✨ 원정대 시너지 도감 모달 ── */}
      <SynergyGuideModal
        open={showSynergyGuide}
        onClose={() => setShowSynergyGuide(false)}
        party={gm.party}
      />

      {/* ── 📜 심연의 백과 도감 모달 ── */}
      <CodexModal
        open={showCodexModal}
        onClose={() => setShowCodexModal(false)}
        gm={gm}
      />

      {/* ── 🛒 견고한 짐수레 광고 시청 확인 모달 ── */}
      {showWagonAdConfirm && (
        <Modal
          title={tr('🛒 견고한 짐수레 사용 안내')}
          open={showWagonAdConfirm}
          onClose={() => setShowWagonAdConfirm(false)}
          footer={
            <div className="flex gap-2 w-full justify-end">
              <ActionButton
                label={tr('취소')}
                variant="ghost"
                onClick={() => setShowWagonAdConfirm(false)}
              />
              <button
                type="button"
                onClick={handleConfirmWagonAd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd54f] to-[#ffb300] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#ffd54f33] cursor-pointer active:scale-95 transition-transform"
              >
                <span>🎬</span>
                <span>{tr('광고 보고 1회 사용')}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-2 text-center items-center">
            <span className="text-4xl animate-bounce">🛒</span>
            <div className="text-sm font-bold text-white leading-relaxed">
              {tr('이 항목은 광고를 봐야 사용할 수 있습니다.')}
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed max-w-sm">
              {tr('견고한 짐수레(30칸 & 자원 스택 99)는 광고 1회 시청 시 이번 원정(1회) 동안 사용하실 수 있습니다.')}
              <br />
              {tr('광고를 시청하시겠습니까?')}
            </p>
            <div className="p-2.5 rounded-lg bg-[#2a133844] border border-[#ce93d833] text-[11px] text-[#e1bee7] w-full text-center">
              ✨ <strong>{tr('보너스')}:</strong> {tr('심연 촉매 슬롯(최대 2개 무료 장착)도 함께 개방됩니다!')}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  메인 CitadelScreen
// ─────────────────────────────────────────────────────────────
export const CitadelScreen: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const { lang, dict } = useI18n();
  useCustomAssetVersion();
  
  const [selectedWheelIdx, setSelectedWheelIdx] = useState(0);
  const [wheelDragOffset, setWheelDragOffset] = useState(0);
  const wheelDragStartXRef = useRef<number | null>(null);
  const isWheelDraggingRef = useRef(false);
  const wheelHasSwipedRef = useRef(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [drawerStack, setDrawerStack] = useState<string[]>([]);
  const [barracksInitialCat, setBarracksInitialCat] = useState<'dungeon' | 'dimensional'>('dungeon');
  const [resetModal, setResetModal] = useState(false);
  const [expeditionReport, setExpeditionReport] = useState<ExpeditionReturnReport | null>(null);
  const [isLootDoubled, setIsLootDoubled] = useState(false);
  const [isLootAdLoading, setIsLootAdLoading] = useState(false);

  const handleDoubleLootAd = async () => {
    if (!expeditionReport || isLootDoubled || isLootAdLoading) return;
    setIsLootAdLoading(true);
    try {
      const res = await GoogleAdService.getInstance().showRewardedAd({
        placement: 'loot_double',
        title: '원정 전리품 자원 2배',
        description: '획득한 모든 수량성 파밍 자원을 2배로 증폭하여 입고합니다.',
        rewardText: '파밍 자원 2배 획득',
      });
      if (res.rewarded) {
        if (expeditionReport.totalGold > 0) {
          gm.modifyResource('gold', expeditionReport.totalGold);
        }
        expeditionReport.items.forEach(it => {
          if (it.itemType === 'resource' || it.itemType === 'gold' || (!it.key.startsWith('ooparts_') && !it.key.startsWith('relic_') && !it.key.startsWith('memoir_'))) {
            if (gm.resources[it.key as keyof GameResources] !== undefined) {
              gm.modifyResource(it.key as keyof GameResources, it.qty);
            }
          }
        });
        setIsLootDoubled(true);
        gm.saveGame();
      }
    } finally {
      setIsLootAdLoading(false);
    }
  };
  const [pausedNoticeBuilding, setPausedNoticeBuilding] = useState<BuildingState | null>(null);
  const [offlineReportModal, setOfflineReportModal] = useState<any>(null);
  const [latestOfflineReport, setLatestOfflineReport] = useState<any>(gm.offlineReport || null);
  const [showIntroStory, setShowIntroStory] = useState(false);
  // 📜 심연의 백과 모달 상태
  const [showCodexModal, setShowCodexModal] = useState(false);
  // 🏰 퀘스트 바로가기 시 해당 건물 강조 및 자동 스크롤 상태
  const [highlightedBuildingId, setHighlightedBuildingId] = useState<string | null>(null);
  // 📜 퀘스트 완료 즉시 알림 토스트 상태 (건물 완공 시 패널을 닫지 않아도 화면 상단에 플로팅)
  const [questCompleteToast, setQuestCompleteToast] = useState<{ questId: string; title: string; rewardSummary?: string } | null>(null);

  // 🔔 퀘스트 목표 완수 / 보상 수령 준비 완료 이벤트 수신
  useEffect(() => {
    const handleQuestReady = (data: any) => {
      if (data && data.questId) {
        setQuestCompleteToast({
          questId: data.questId,
          title: data.title || '새로운 퀘스트 달성',
          rewardSummary: data.rewardSummary || (data.quest ? gm.getQuestRewardSummary(data.quest) : undefined)
        });
        SoundManager.getInstance().play('quest_complete');
        triggerHaptic('heavy');
      }
    };
    gm.on('questReadyToClaim', handleQuestReady);
    return () => {
      gm.off('questReadyToClaim', handleQuestReady);
    };
  }, [gm]);

  // 10초 후 토스트 자동 소멸
  useEffect(() => {
    if (!questCompleteToast) return;
    const timer = setTimeout(() => {
      setQuestCompleteToast(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [questCompleteToast]);

  // 퀘스트 의뢰소 등에서 특정 건물 건설 바로가기 클릭 시
  const handleNavigateBuilding = useCallback((buildingId: string) => {
    setHighlightedBuildingId(buildingId);
    setDrawerStack(stack => [...stack, 'quests']);
    setOpenDrawer('citadel');
    setTimeout(() => {
      const el = document.getElementById(`building-card-${buildingId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 220);
    // 6초 후 강조 효과 자동 소멸
    setTimeout(() => {
      setHighlightedBuildingId(prev => (prev === buildingId ? null : prev));
    }, 6000);
  }, []);

  // 🌙 부재 중 오프라인 정산 발생 시 이미지 창 상단에 결산 알림 버튼 표시
  useEffect(() => {
    if (gm.offlineReport) {
      setLatestOfflineReport(gm.offlineReport);
    }
    const handleOfflineSettled = (report: any) => {
      if (report) {
        setLatestOfflineReport(report);
      }
    };
    gm.on('offlineProgressSettled', handleOfflineSettled);
    return () => {
      gm.off('offlineProgressSettled', handleOfflineSettled);
    };
  }, [gm]);

  // 🏰 던전 원정 귀환 시 전리품 정산 보고서 자동 팝업
  useEffect(() => {
    if (gm.returnReport) {
      setExpeditionReport(gm.returnReport);
      gm.returnReport = null;
      SoundManager.getInstance().play('loot_open');
    }
    const handleExpeditionSettled = (data: unknown) => {
      const report = data as ExpeditionReturnReport;
      if (report) {
        setExpeditionReport(report);
        SoundManager.getInstance().play('loot_open');
      }
    };
    gm.on('expeditionSettled', handleExpeditionSettled);
    return () => {
      gm.off('expeditionSettled', handleExpeditionSettled);
    };
  }, [gm]);

  // 🏰 성채 진입 시 모든 전투/던전 상태이상 및 야영 쿨다운 초기화 보장
  useEffect(() => {
    gm.clearPartyStatusEffects();
  }, [gm]);

  // 📖 게임 시작 시 초반 세계관 서사 & 퀘스트 안내 모달 자동 노출
  useEffect(() => {
    const uid = gm.getCurrentUserId();
    const introSeenKey = `limbo_intro_story_seen_${uid}`;
    try {
      const seen = localStorage.getItem(introSeenKey);
      if (!seen) {
        const timer = setTimeout(() => {
          setShowIntroStory(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [gm]);

  useEffect(() => {
    const handleOpenIntroStory = () => {
      setShowIntroStory(true);
    };
    const handleOpenDimBarracks = () => {
      setBarracksInitialCat('dimensional');
      setOpenDrawer('barracks');
    };
    const handleOpenTavern = () => {
      setOpenDrawer('tavern');
    };
    gm.on('openIntroStory', handleOpenIntroStory);
    gm.on('openDimensionalBarracks', handleOpenDimBarracks);
    gm.on('openTavernDrawer', handleOpenTavern);
    return () => {
      gm.off('openIntroStory', handleOpenIntroStory);
      gm.off('openDimensionalBarracks', handleOpenDimBarracks);
      gm.off('openTavernDrawer', handleOpenTavern);
    };
  }, [gm]);

  const handleCloseIntroStory = useCallback(() => {
    const uid = gm.getCurrentUserId();
    try {
      localStorage.setItem(`limbo_intro_story_seen_${uid}`, 'true');
    } catch (_) {}
    setShowIntroStory(false);
  }, [gm]);

  const handleOpenQuestsFromIntro = useCallback(() => {
    handleCloseIntroStory();
    setOpenDrawer('quests');
    SoundManager.getInstance().play('click');
  }, [handleCloseIntroStory]);

  // 건설된 건물(방랑자의 라운지, 병기창, 병동, 마켓 등)에 따라 동적으로 확장되는 하단 휠 메뉴
  const activeWheelItems = useMemo(() => {
    const isEn = lang === 'en';
    const isJa = lang === 'ja';

    const items: Array<{ key: string; label: string; sub: string; icon: string; color: string }> = [
      { key: 'citadel',  label: isEn ? 'Citadel' : isJa ? '要塞' : '성채',  sub: isEn ? 'Ark Management' : isJa ? '方舟管理' : '방주 관리',  icon: '🏰', color: '#ff7b25' },
      { key: 'barracks', label: isEn ? 'Barracks' : isJa ? '兵舎' : '병영', sub: isEn ? 'Squad Management' : isJa ? '部隊管理' : '부대 관리', icon: '⚔️', color: '#00d2ff' },
    ];

    // 1. 방랑자의 라운지 (주점)
    if ((state.buildings['tavern']?.level || 0) > 0) {
      items.push({
        key: 'tavern',
        label: isEn ? 'Wanderer Lounge' : isJa ? '放浪者ラウンジ' : '방랑자의 라운지',
        sub: isEn ? 'Recruit & Bonds' : isJa ? '傭兵募集 & 絆' : '용병 모집 및 유대',
        icon: '🍸',
        color: '#ab47bc'
      });
    }
    // 2. 심연의 병기창 (대장간)
    if ((state.buildings['blacksmith']?.level || 0) > 0) {
      items.push({
        key: 'forge',
        label: isEn ? 'Armory Forge' : isJa ? '兵器廠鍛冶屋' : '병기창 대장간',
        sub: isEn ? 'Craft & Enhance' : isJa ? '装備鍛造 & 強化' : '장비 제련 및 강화',
        icon: '⚒️',
        color: '#00e676'
      });
    }
    // 3. 생체 복원 병동 (병원)
    if ((state.buildings['infirmary']?.level || 0) > 0) {
      items.push({
        key: 'infirmary',
        label: isEn ? 'Restoration Ward' : isJa ? '生体復元病棟' : '생체 복원 병동',
        sub: isEn ? 'Heal & Recovery' : isJa ? '治療 & 負傷回復' : '치료 및 부상 회복',
        icon: '💉',
        color: '#ef5350'
      });
    }
    // 4. 에테르 연금 공방 (마도서 제작 & 강화)
    if ((state.buildings['alchemy']?.level || 0) > 0) {
      items.push({
        key: 'alchemy',
        label: isEn ? 'Aether Workshop' : isJa ? 'エーテル工房' : '에테르 공방',
        sub: isEn ? 'Grimoires & Alchemy' : isJa ? '魔導書製作 & 強化' : '마도서 제작 & 강화',
        icon: '🧪',
        color: '#26a69a'
      });
    }
    // 5. 황혼의 블랙 마켓 (시장)
    if ((state.buildings['market']?.level || 0) > 0) {
      items.push({
        key: 'market',
        label: isEn ? 'Black Market' : isJa ? 'ブラックマーケット' : '블랙 마켓',
        sub: isEn ? 'Contraband Trading' : isJa ? '闇市取引' : '암시장 거래',
        icon: '🕶️',
        color: '#ffd54f'
      });
    }
    // 6. 📜 심연의 백과 & 회고록 (컬렉션)
    items.push({
      key: 'codex',
      label: isEn ? 'Abyssal Codex' : isJa ? '深淵の百科' : '심연의 백과',
      sub: isEn ? 'Memoirs & Lore' : isJa ? '回顧録 & 図鑑' : '고대 서사 & 컬렉션',
      icon: '📜',
      color: '#ffd54f'
    });

    // 7. 🪦 성채 묘지 (영령의 안식처)
    items.push({
      key: 'cemetery',
      label: isEn ? 'Ark Cemetery' : isJa ? '要塞墓地' : '성채 묘지',
      sub: isEn ? 'Rest of the Fallen' : isJa ? '英霊の安息所' : '영령의 안식처 & 추모',
      icon: '🪦',
      color: '#78909c'
    });

    items.push(
      { key: 'quests',  label: isEn ? 'Quest Board' : isJa ? '依頼所' : '의뢰소',   sub: isEn ? 'Bounties & Tasks' : isJa ? '賞金首依頼' : '현상금 퀘스트', icon: '📜', color: '#38ef7d' },
      { key: 'explore', label: isEn ? 'Abyss Delve' : isJa ? '深淵探査' : '심연 탐사', sub: isEn ? 'Abyssal Descent' : isJa ? '深淵降下作戦' : '심연 강하 작전', icon: '🌌', color: '#5c6bc0' },
    );

    // 8. 🏆 차원 앵커 게이트 (건설 시 개방: 아레나 / 네메시스 / 침공)
    const gateLv = state.buildings['arenaGate']?.level || 0;
    if (gateLv > 0 || gm.isMasterAccount) {
      items.push({
        key: 'arena',
        label: isEn ? 'Dimensional Gate' : isJa ? '次元ゲート' : '차원 게이트',
        sub: isEn
          ? (gateLv >= 6 ? 'Arena, Raid & Invasion' : gateLv >= 3 ? 'Arena & Nemesis' : 'PVP Arena')
          : isJa
          ? (gateLv >= 6 ? '闘技場 & 侵攻 & レイド' : gateLv >= 3 ? '闘技場 & ネメシス' : 'PVP闘技場')
          : (gateLv >= 6 ? '아레나 & 침공 & 레이드' : gateLv >= 3 ? '아레나 & 네메시스' : '차원 아레나 PvP'),
        icon: '🏆',
        color: '#ff416c',
      });
    }

    return items;
  }, [state.buildings, gm.isMasterAccount, lang]);

  // 시설 입장 및 드로어 열기 시도 (스택 기반 내비게이션 지원)
  const handleTryOpenDrawer = useCallback((key: string, fromCurrent = false) => {
    if (key === 'codex') {
      setShowCodexModal(true);
    } else if (key === 'arena') {
      navigateTo('arena');
    } else {
      setOpenDrawer(prev => {
        if (fromCurrent && prev && prev !== key) {
          setDrawerStack(stack => [...stack, prev]);
        }
        return key;
      });
    }
    return true;
  }, [navigateTo, gm]);

  // 드로어 닫기 핸들러 (직전 드로어가 스택에 있으면 직전 드로어로 복귀, 없으면 하단 네비로 복귀)
  const handleCloseDrawer = useCallback(() => {
    setDrawerStack(stack => {
      if (stack.length > 0) {
        const nextStack = [...stack];
        const prevDrawer = nextStack.pop()!;
        setOpenDrawer(prevDrawer);
        return nextStack;
      }
      setOpenDrawer(null);
      return [];
    });
  }, []);

  // 백드롭 클릭 등으로 모든 드로어를 한 번에 닫을 때
  const handleCloseAllDrawers = useCallback(() => {
    setDrawerStack([]);
    setOpenDrawer(null);
  }, []);

  const handleWheelSelect = useCallback((item: { key: string; label: string; sub: string; icon: string; color: string }) => {
    setDrawerStack([]); // 하단 휠에서 직접 선택 시 새로운 세션으로 초기화
    handleTryOpenDrawer(item.key, false);
  }, [handleTryOpenDrawer]);

    // 🎡 모바일 터치 및 마우스 드래그로 휠 내비게이션 부드럽게 회전
  const handleWheelDragStart = (clientX: number) => {
    wheelDragStartXRef.current = clientX;
    isWheelDraggingRef.current = true;
    wheelHasSwipedRef.current = false;
    setWheelDragOffset(0);
  };

  const handleWheelDragMove = (clientX: number) => {
    if (!isWheelDraggingRef.current || wheelDragStartXRef.current === null) return;
    const deltaX = clientX - wheelDragStartXRef.current;
    
    // 40px 이상 드래그 시 즉시 다음/이전 메뉴로 전환
    const SWIPE_THRESHOLD = 40;
    if (deltaX < -SWIPE_THRESHOLD) {
      setSelectedWheelIdx(prev => (prev + 1) % activeWheelItems.length);
      wheelDragStartXRef.current = clientX;
      wheelHasSwipedRef.current = true;
      setWheelDragOffset(0);
    } else if (deltaX > SWIPE_THRESHOLD) {
      setSelectedWheelIdx(prev => (prev - 1 + activeWheelItems.length) % activeWheelItems.length);
      wheelDragStartXRef.current = clientX;
      wheelHasSwipedRef.current = true;
      setWheelDragOffset(0);
    } else {
      setWheelDragOffset(deltaX * 0.35); // 탄성 저항 시각 효과
    }
  };

  const handleWheelDragEnd = () => {
    isWheelDraggingRef.current = false;
    wheelDragStartXRef.current = null;
    setWheelDragOffset(0);
  };

  const handleWheelScroll = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 15 || Math.abs(e.deltaY) > 15) {
      if (e.deltaX > 0 || e.deltaY > 0) {
        setSelectedWheelIdx(prev => (prev + 1) % activeWheelItems.length);
      } else {
        setSelectedWheelIdx(prev => (prev - 1 + activeWheelItems.length) % activeWheelItems.length);
      }
    }
  };

  const safeWheelIdx = selectedWheelIdx % activeWheelItems.length;
  const selectedItem = activeWheelItems[safeWheelIdx];

  // 퀘스트 알림 및 수령 대기 여부 계산 (주점이 해금되기 전까지 Q_MAIN_02는 알림에서 제외)
  const isTavernUnlockedCitadel = Boolean(
    state.buildings['tavern']?.unlocked ||
    (state.buildings['tavern']?.level || 0) >= 1 ||
    (state.buildings['quarry']?.level || 0) >= 1
  );
  const visibleActiveQuests = state.quests.filter(q => {
    if (q.status !== 'active') return false;
    if (q.id === 'Q_MAIN_02' && !isTavernUnlockedCitadel) return false;
    return true;
  });
  const claimableQuestCount = visibleActiveQuests.filter(q => q.objectives.every(o => o.isCompleted)).length;
  const hasActiveQuests = visibleActiveQuests.length > 0;
  const hasQuestAlert = claimableQuestCount > 0 || hasActiveQuests;
  // 👑 1차 영지 재건 완성 에픽 퀘스트 수령/서사 확인 대기 상태
  const epicRebuildQuest = state.quests.find(q => q.id === 'Q_EPIC_CITADEL_REBUILD_01');
  const isEpicRebuildReady = epicRebuildQuest && epicRebuildQuest.status === 'active' && epicRebuildQuest.objectives.every(o => o.isCompleted);

  // 📜 도감 등록 가능 개수 계산
  const registerableCodexCount = useMemo(() => {
    return gm.getRegisterableCodexCount();
  }, [state.resources, state.citadelSupplies, state.equipmentInventory, state.skillBookInventory, state.codexUnlockedItems, gm]);

  const currentArtKey = openDrawer || selectedItem?.key || 'citadel';
  const artInfo = DRAWER_ART_META[currentArtKey] || DRAWER_ART_META.citadel;
  const warmthLabel = state.bonfireWarmthTime > 0
    ? `🔥 ${Math.floor(state.bonfireWarmthTime / 60)}m${String(state.bonfireWarmthTime % 60).padStart(2, '0')}s`
    : state.bonfireStacks > 0 ? `🔥 ${state.bonfireStacks}/5` : '';

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col relative bg-transparent overflow-hidden">
      
      {/* 🌟 퀘스트 완료 즉시 알림 플로팅 토스트 배너 (패널이 열려 있어도 화면 최상단 z-40에 표시) */}
      {questCompleteToast && (
        <div className="absolute top-2 left-3 right-3 z-40 animate-slide-down">
          <div className="panel p-2.5 bg-[#121622]/95 backdrop-blur-md border border-[#876739] shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_15px_rgba(212,175,55,0.25)] flex items-center justify-between gap-2 rounded-xl">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xl animate-bounce">📜</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#423219] text-[#f3e5c8] border border-[#876739]">
                    퀘스트 목표 달성!
                  </span>
                  {questCompleteToast.rewardSummary && (
                    <span className="text-[10px] text-[#ffd54f] font-mono truncate">
                      🎁 {questCompleteToast.rewardSummary}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#f3e5c8] truncate mt-0.5">
                  {questCompleteToast.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="btn btn-primary text-xs px-2.5 py-1.5 font-bold flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                onClick={() => {
                  setQuestCompleteToast(null);
                  setOpenDrawer('quests');
                }}
                title="퀘스트 창으로 이동하여 보상과 다음 연계 퀘스트를 확인합니다"
              >
                <span>🎁</span>
                <span>보상 수령 ▶</span>
              </button>
              <button
                className="text-xs text-[#8b9bb4] hover:text-white px-1.5 py-1"
                onClick={() => setQuestCompleteToast(null)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {!openDrawer && (
        <div className="absolute top-2 right-3 z-20 flex items-center gap-1.5">
          <button
            className="px-2 py-0.5 rounded bg-[#ffd54f15] hover:bg-[#ffd54f33] text-[#ffd54f] border border-[#ffd54f44] text-[10px] font-bold shadow-sm flex items-center gap-1 transition-all"
            onClick={() => setShowCodexModal(true)}
            title="심연의 백과 & 고대 컬렉션 열기"
          >
            <span>📜</span>
            <span>백과</span>
            {registerableCodexCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ef5350] text-white text-[9px] font-extrabold shadow-sm animate-pulse">
                {registerableCodexCount}
              </span>
            )}
          </button>
          <button
            className="px-2 py-0.5 rounded bg-[#78909c15] hover:bg-[#78909c33] text-[#cfd8dc] border border-[#78909c44] text-[10px] font-bold shadow-sm flex items-center gap-1 transition-all"
            onClick={() => handleTryOpenDrawer('cemetery', true)}
            title="성채 묘지 & 영령의 가호"
          >
            <span>🪦</span>
            <span>묘지</span>
            {gm.cemetery && gm.cemetery.length > 0 && (
              <span className="text-[9px] text-[#ff7043] font-mono font-bold">
                {gm.cemetery.length}/5
              </span>
            )}
            {gm.activeAncestralBlessing && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba68c8] animate-pulse" title={`영령 결속: ${gm.activeAncestralBlessing.name}`} />
            )}
          </button>
          <button className="text-[11px] text-[#ff4444] opacity-50 hover:opacity-100 ml-1" onClick={() => setResetModal(true)}>초기화</button>
        </div>
      )}

      {/* 메인 일러스트 카드 & 퀘스트 마커 (상단 고정 이미지창) */}
      <div 
        className={`px-3 pt-2 shrink-0 relative z-20 ${openDrawer ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (openDrawer) handleCloseAllDrawers();
        }}
      >
        <div 
          className="relative w-full panel overflow-hidden transition-all duration-300 shadow-xl" 
          style={{ height: 'clamp(140px, 22vh, 220px)' }}
        >
          {/* 메인 일러스트 및 루프 애니메이션 비디오 (MP4 / WebM / GIF / WebP 자동 지원) */}
          <video
            key={artInfo.img}
            autoPlay
            loop
            muted
            playsInline
            poster={artInfo.img}
            className="w-full h-full object-cover animate-fade-in transition-all duration-300"
            style={{ filter: 'brightness(0.96) contrast(1.05)' }}
          >
            <source src={artInfo.img.replace(/\.[^/.]+$/, ".webm")} type="video/webm" />
            <source src={artInfo.img.replace(/\.[^/.]+$/, ".mp4")} type="video/mp4" />
            <img
              src={artInfo.img}
              alt={artInfo.title}
              className="w-full h-full object-cover animate-fade-in transition-all duration-300"
              style={{ filter: 'brightness(0.96) contrast(1.05)' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'assets/citadel_bonfire.jpg';
              }}
            />
          </video>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, #0b0d13cc 85%, #0b0d13 100%)' }} />

          {/* 퀘스트 & 오프라인 결산 알림 마커 컨테이너 (드로어가 열려 있어도 보상 수령 대기 시 상단 일러스트 위에 표시) */}
          {(!openDrawer || claimableQuestCount > 0) && (
            <div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-1.5 items-start">
              {/* 👑 1차 영지 재건 완성 대서사 에픽 퀘스트 알림 마커 */}
              {isEpicRebuildReady && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ffd700] via-[#ffb300] to-[#ff8f00] text-black text-xs font-black shadow-[0_0_20px_rgba(255,215,0,0.85)] border-2 border-white hover:scale-105 transition-all cursor-pointer animate-pulse"
                  onClick={() => handleTryOpenDrawer('quests', true)}
                  title="모든 시설이 Lv.1 이상으로 완공되었습니다! 1차 영지 재건 서사와 향후 전개 인사이트를 확인하세요."
                >
                  <span className="text-sm animate-bounce">👑</span>
                  <span className="text-[11px] font-extrabold tracking-wide">
                    1차 영지 재건 완성! (대서사 확인)
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black text-[#ffd700] text-[9px] font-black shadow-sm">
                    EPIC
                  </span>
                </button>
              )}

              {/* 📜 도감 등록 가능 알림 마커 */}
              {registerableCodexCount > 0 && (
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 border border-[#ef5350] text-[#ff7043] text-xs font-bold shadow-lg shadow-[#ef535044] hover:scale-105 transition-all cursor-pointer animate-fade-in"
                  onClick={() => setShowCodexModal(true)}
                  title="등록 가능한 심연의 백과 컬렉션이 있습니다!"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef5350] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef5350]"></span>
                  </span>
                  <span className="text-sm">📜</span>
                  <span className="text-[11px] font-bold text-white tracking-wide">
                    도감 등록 가능
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#ef5350] text-white text-[10px] font-extrabold shadow-sm">
                    {registerableCodexCount}
                  </span>
                </button>
              )}

              {/* 퀘스트 알림 마커 */}
              {hasQuestAlert && (
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 border border-[#ffd54f] text-[#ffd54f] text-xs font-bold shadow-lg shadow-[#ffd54f33] hover:scale-105 transition-all cursor-pointer animate-fade-in"
                  onClick={() => handleTryOpenDrawer('quests', true)}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffd54f] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffd54f]"></span>
                  </span>
                  <span className="animate-bounce text-sm">❗</span>
                  <span className="text-[11px] font-bold tracking-wide">
                    {claimableQuestCount > 0 ? `${'보상 수령'} (${claimableQuestCount})` : '퀘스트 확인'}
                  </span>
                </button>
              )}

              {/* 오프라인 결산 알림 마커 (퀘스트 알림 아래에 표시) */}
              {latestOfflineReport && (
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 border border-[#00d2ff] text-[#00d2ff] text-xs font-bold shadow-lg shadow-[#00d2ff33] hover:scale-105 transition-all cursor-pointer animate-fade-in"
                  onClick={() => setOfflineReportModal(latestOfflineReport)}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]"></span>
                  </span>
                  <span className="text-sm">🌙</span>
                  <span className="text-[11px] font-bold tracking-wide">
                    {'오프라인 영지 수익 정산'} ({latestOfflineReport.formattedTime})
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 하단 동적 타이틀 및 서브타이틀 */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base shrink-0">{artInfo.icon}</span>
              <div className="min-w-0">
                <span className="font-cinzel text-sm sm:text-base font-bold text-[#00d2ff] tracking-wide truncate block">{artInfo.title}</span>
                <div className="text-[11px] text-[#cfd8e8] mt-0.5 font-medium line-clamp-1">
                  {artInfo.subtitle}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#8b9bb4] mt-0.5 shrink-0">
              {`아레나 ${state.currentArenaRank}위`} ({state.currentArenaRating}P){warmthLabel && ` | ${warmthLabel}`}
            </div>
          </div>
        </div>
      </div>

      {/* 로그 패널 (드로어가 닫혀 있을 때만 렌더링하여 드로어에 85% 이상 화면 확보) */}
      {!openDrawer && (
        <div className="px-3 pt-2 transition-all duration-300 flex-1 min-h-0">
          <LogPanel logs={state.citadelLogs || []} maxHeight={175} emptyMessage={'기록된 영지 로그가 없습니다.'} />
        </div>
      )}

      {/* 🎡 모바일 스와이프/드래그 지원 회전 휠 내비게이션 */}
      {!openDrawer ? (
        <div className="px-3 py-2 shrink-0 select-none">
          <div 
            className="panel p-3 touch-pan-y"
            onWheel={handleWheelScroll}
            onTouchStart={(e) => handleWheelDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleWheelDragMove(e.touches[0].clientX)}
            onTouchEnd={handleWheelDragEnd}
            onTouchCancel={handleWheelDragEnd}
            onMouseDown={(e) => handleWheelDragStart(e.clientX)}
            onMouseMove={(e) => handleWheelDragMove(e.clientX)}
            onMouseUp={handleWheelDragEnd}
            onMouseLeave={handleWheelDragEnd}
          >
            <div className="flex items-center justify-between text-[11px] text-[#ffd54f] mb-2 px-1">
              <span className="font-medium">🎡 {'좌우 드래그로 빠른 메뉴 탐색'}</span>
              <span className="text-[#8b9bb4] font-mono font-bold text-[10px]">
                {safeWheelIdx + 1} / {activeWheelItems.length}
              </span>
            </div>

            <div 
              className="flex items-center justify-center gap-1.5 transition-transform duration-75"
              style={{ transform: `translateX(${wheelDragOffset}px)` }}
            >
              <button 
                className="text-[#8b9bb4] text-xl p-1 hover:text-white transition-colors active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWheelIdx((selectedWheelIdx - 1 + activeWheelItems.length) % activeWheelItems.length);
                }}
                aria-label={'이전 메뉴'}
              >
                ◀
              </button>

              {[-1, 0, 1].map(offset => {
                const idx = (selectedWheelIdx + offset + activeWheelItems.length) % activeWheelItems.length;
                const item = activeWheelItems[idx];
                const isCenter = offset === 0;
                return (
                  <div
                    key={item.key}
                    className={`relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${
                      isCenter ? 'hover:scale-105 active:scale-95 shadow-lg' : 'hover:opacity-80 active:scale-90'
                    }`}
                    style={{
                      width: isCenter ? 112 : 86,
                      height: isCenter ? 108 : 88,
                      background: isCenter ? `${item.color}25` : '#141822',
                      border: `${isCenter ? 2 : 1}px solid ${isCenter ? item.color : '#2c384d'}`,
                      opacity: isCenter ? 1 : 0.6,
                      boxShadow: isCenter ? `0 0 15px ${item.color}33` : 'none'
                    }}
                    onClick={() => {
                      if (wheelHasSwipedRef.current) return;
                      if (isCenter) {
                        handleWheelSelect(item);
                      } else {
                        setSelectedWheelIdx(idx);
                      }
                    }}
                  >
                    {item.key === 'codex' && registerableCodexCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-[#ef5350] text-white text-[9px] font-extrabold shadow-md animate-pulse">
                        {registerableCodexCount}
                      </span>
                    )}
                    <div className="flex items-center justify-center" style={{ minHeight: isCenter ? 32 : 24 }}>
                      <GameIcon name={item.key} icon={item.icon} size={isCenter ? 26 : 20} />
                    </div>
                    <div 
                      className="font-bold mt-0.5 text-center px-1 truncate max-w-full" 
                      style={{ fontSize: isCenter ? 12 : 10, color: isCenter ? '#fff' : '#8b9bb4' }}
                    >
                      {item.label}
                    </div>
                    {isCenter && (
                      <div className="text-[9px] text-[#8b9bb4] mt-0.5 text-center px-1 truncate max-w-full">
                        {item.sub}
                      </div>
                    )}
                  </div>
                );
              })}

              <button 
                className="text-[#8b9bb4] text-xl p-1 hover:text-white transition-colors active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWheelIdx((selectedWheelIdx + 1) % activeWheelItems.length);
                }}
                aria-label={'다음 메뉴'}
              >
                ▶
              </button>
            </div>

            {/* 미니 페이지네이션 인디케이터 점 */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {activeWheelItems.map((item, i) => (
                <button
                  key={item.key}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === safeWheelIdx ? 'w-4 bg-[#ffd54f] shadow-[0_0_8px_rgba(255,213,79,0.6)]' : 'w-1.5 bg-[#2c384d] hover:bg-[#4a5a75]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWheelIdx(i);
                  }}
                  title={item.label}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 바깥 영역 클릭/터치 닫기용 백드롭 오버레이 (성채 화면 상단 이미지 및 패널 외 영역만 덮어 터치 시 닫힘, 상단 자원바는 제외) */}
          <div 
            className="absolute inset-0 z-25 bg-black/40 backdrop-blur-[1px] cursor-pointer transition-opacity animate-fade-in" 
            onClick={handleCloseAllDrawers}
            onTouchEnd={handleCloseAllDrawers}
          />
          
          {/* 플렉스로 남은 공간을 모두 차지하는 드로어 컨테이너 (상단 이미지창 바로 아래까지 슬라이드 업) */}
          <div 
            className="panel-accent w-full flex-1 min-h-0 overflow-hidden flex flex-col z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] mt-1.5 animate-slide-up" 
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            {openDrawer === 'citadel'   && (
              <CitadelDrawer 
                onClose={handleCloseDrawer} 
                onEnterDrawer={(k) => handleTryOpenDrawer(k, true)}
                highlightedBuildingId={highlightedBuildingId}
                onClearHighlight={() => setHighlightedBuildingId(null)}
              />
            )}
            {openDrawer === 'barracks'  && <BarracksDrawer onClose={handleCloseDrawer} onNavigateDrawer={(k) => handleTryOpenDrawer(k, true)} initialCategory={barracksInitialCat} />}
            {openDrawer === 'quests'    && (
              <QuestsDrawer 
                onClose={handleCloseDrawer} 
                onNavigateDrawer={(k) => {
                  if (k === 'barracks') setBarracksInitialCat('dungeon');
                  handleTryOpenDrawer(k, true);
                }} 
                onNavigateBuilding={handleNavigateBuilding}
              />
            )}
            {openDrawer === 'explore'   && (
              <ExploreDrawer 
                onClose={handleCloseDrawer} 
                onNavigateDrawer={(k) => {
                  if (k === 'barracks') setBarracksInitialCat('dungeon');
                  handleTryOpenDrawer(k, true);
                }} 
              />
            )}
            {openDrawer === 'tavern'    && (
              <TavernDrawer 
                onBack={handleCloseDrawer} 
                onNavigateDrawer={(k) => {
                  if (k === 'barracks') setBarracksInitialCat('dungeon');
                  handleTryOpenDrawer(k, true);
                }} 
              />
            )}
            {openDrawer === 'forge'     && <ForgeDrawer onBack={handleCloseDrawer} />}
            {openDrawer === 'storage'   && <StorageDrawer onBack={handleCloseDrawer} />}
            {openDrawer === 'infirmary' && <InfirmaryDrawer onBack={handleCloseDrawer} />}
            {openDrawer === 'alchemy'   && <AlchemyDrawer onBack={handleCloseDrawer} />}
            {openDrawer === 'market'    && <MarketDrawer onBack={handleCloseDrawer} />}
            {openDrawer === 'cemetery'  && <CemeteryDrawer onBack={handleCloseDrawer} />}
          </div>
        </>
      )}

      {/* ── 🏰 던전 원정 귀환 전리품 정산 보고서 모달 ── */}
      {expeditionReport && (
        <Modal
          title="🏰 던전 원정 귀환 — 전리품 정산 보고서"
          open={!!expeditionReport}
          onClose={() => setExpeditionReport(null)}
          footer={
            <div className="flex flex-col gap-2 w-full">
              {!isLootDoubled ? (
                <button
                  type="button"
                  disabled={isLootAdLoading}
                  onClick={handleDoubleLootAd}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#ffd54f88] bg-gradient-to-r from-[#ffd54f33] via-[#ffb30044] to-[#ffd54f33] hover:brightness-110 text-[#ffd54f] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#ffd54f22] cursor-pointer"
                >
                  <span>🎬</span>
                  <span>{isLootAdLoading ? '광고 로딩 중...' : '광고 보고 파밍 자원 2배 획득 (장비/오파츠 제외)'}</span>
                </button>
              ) : (
                <div className="w-full py-1.5 px-3 rounded-xl bg-[#38ef7d15] border border-[#38ef7d44] text-[#38ef7d] font-bold text-xs text-center flex items-center justify-center gap-1">
                  <span>✨</span>
                  <span>파밍 자원 2배 획득 완료!</span>
                </div>
              )}
              <ActionButton
                label="📦 모든 전리품을 방주 창고에 입고하고 확인"
                variant="primary"
                className="w-full text-sm font-bold py-2 shadow-lg shadow-[#42321955]"
                onClick={() => {
                  setIsLootDoubled(false);
                  setExpeditionReport(null);
                }}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1 animate-fade-in">
            {/* 상단 층수 및 골드 정산 요약 배너 */}
            <div className="p-3 rounded-xl bg-[#0e1626] border border-[#87673955] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌌</span>
                <div>
                  <div className="text-xs font-bold text-[#00d2ff]">
                    심연 {expeditionReport.floor}층 원정 탐험 완료
                  </div>
                  <div className="text-[10px] text-[#8b9bb4]">
                    총 {expeditionReport.totalSlots}개 배낭 슬롯 전리품 안전 수납
                  </div>
                </div>
              </div>
              {expeditionReport.totalGold > 0 ? (
                <div className="text-right">
                  <div className="text-[10px] text-[#8b9bb4]">획득 골드</div>
                  <div className="text-sm font-black font-mono text-[#ffd54f]">
                    🪙 +{expeditionReport.totalGold}G
                  </div>
                </div>
              ) : (
                <span className="text-xs font-mono text-[#8b9bb4]">골드 0G</span>
              )}
            </div>

            {/* 전리품 자원 목록 */}
            {expeditionReport.items.length > 0 ? (
              <div>
                <div className="text-xs font-bold text-[#cfd8dc] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">📦 수납된 원정 자원 & 전리품</span>
                  <span className="text-[10px] font-normal text-[#8b9bb4]">({expeditionReport.items.length}종)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {expeditionReport.items.map((it, idx) => {
                    const rMeta = GameManager.getResourceMeta(it.key);
                    const displayLabel = it.label || rMeta?.name || it.key;
                    const displayIcon = it.icon || rMeta?.icon;
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#141a29] border border-[#222d42] flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-lg shrink-0 flex items-center justify-center">
                            <GameIcon name={it.key} icon={displayIcon} size={20} />
                          </span>
                          <span className="text-xs text-white font-medium truncate">{displayLabel}</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-[#38ef7d] shrink-0 ml-1">
                          +{it.qty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#8b9bb4] bg-[#141a29] rounded-lg border border-[#222d42]">
                획득한 자원이 없습니다. (빈손 귀환)
              </div>
            )}

            {/* 획득 장비 목록 (있을 때만 표시) */}
            {expeditionReport.equipments && expeditionReport.equipments.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[#ffd54f] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">⚔️ 발굴된 룬 마도 장비</span>
                  <span className="text-[10px] font-normal text-[#8b9bb4]">({expeditionReport.equipments.length}개)</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                  {expeditionReport.equipments.map((eq, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#1a1528] border border-[#ffd54f44] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{eq.icon || '⚔️'}</span>
                        <span className="text-xs text-white font-bold truncate">{eq.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f]">
                        {eq.rarity?.toUpperCase() || 'COMMON'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📜 획득 보스/신화 비전서 목록 (있을 때 표시) */}
            {expeditionReport.skillBooks && expeditionReport.skillBooks.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[#ffd54f] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">📜 수납된 보스 마도 비전서</span>
                  <span className="text-[10px] font-normal text-[#8b9bb4]">({expeditionReport.skillBooks.length}권)</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                  {expeditionReport.skillBooks.map((sb, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#241738] border border-[#ffd54f66] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 flex items-center justify-center">
                          <GameIcon name={sb.bookId || sb.id || sb.skill?.id} icon={sb.skill?.icon || sb.icon || '📖'} size={20} />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs text-[#ffd54f] font-bold truncate block">{sb.name}</span>
                          <span className="text-[10px] text-[#ce93d8] truncate block">[{sb.skill?.name}] {sb.skill?.description}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] shrink-0 ml-1">
                        {(sb.rank || sb.grade || 'MYTHIC').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal title="⚠️ 게임 초기화" open={resetModal} onClose={() => setResetModal(false)}
        footer={<><ActionButton label="취소" variant="ghost" onClick={() => setResetModal(false)} />
          <ActionButton label="초기화" variant="danger" onClick={async () => { await gm.resetGame(); setResetModal(false); }} /></>}>
        <p className="text-sm text-[#cfd8dc]">현재 계정의 로컬 및 Firebase 클라우드 데이터가 모두 초기화되고 처음부터 다시 시작합니다. 정말 초기화하시겠습니까?</p>
      </Modal>

      {/* ── ⏸️ 시설 가동 중지 알림 모달 (CitadelScreen 메인) ── */}
      {pausedNoticeBuilding && (
        <Modal
          open={!!pausedNoticeBuilding}
          onClose={() => setPausedNoticeBuilding(null)}
          title={`⏸️ ${pausedNoticeBuilding.name} 가동 중지 안내`}
          footer={
            <div className="flex gap-2 justify-end w-full">
              <button
                className="btn btn-ghost text-xs px-3 py-1.5"
                onClick={() => setPausedNoticeBuilding(null)}
              >
                닫기
              </button>
              <button
                className="btn btn-success text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                onClick={() => {
                  const bId = pausedNoticeBuilding.id;
                  gm.toggleBuildingPause(bId);
                  setPausedNoticeBuilding(null);
                  const drawerKey = BUILDING_TO_DRAWER_KEY[bId];
                  if (drawerKey) {
                    if (bId === 'arenaGate') navigateTo('arena');
                    else handleTryOpenDrawer(drawerKey, true);
                  }
                }}
              >
                <span>▶️</span>
                <span>가동 재개 및 입장</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-[#2a1d12] border border-[#ff980066] flex items-center gap-3 shadow-lg">
              <span className="text-3xl p-2 rounded-xl bg-[#ff980022] border border-[#ff980044]">
                {pausedNoticeBuilding.icon}
              </span>
              <div>
                <div className="text-sm font-bold text-[#ffb74d] flex items-center gap-1.5">
                  <span>해당 건물은 중지중입니다.</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff980033] text-[#ffcc80] font-mono">
                    PAUSED
                  </span>
                </div>
                <div className="text-xs text-[#cfd8dc] mt-1 leading-relaxed">
                  현재 <strong>[{pausedNoticeBuilding.name}]</strong> 시설의 가동이 일시 정지되어 있어 입장할 수 없습니다.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#111724] border border-[#1e2a3e] text-xs text-[#8b9bb4] leading-relaxed flex flex-col gap-1.5">
              <div className="text-[#00d2ff] font-bold flex items-center gap-1">
                <span>ℹ️</span>
                <span>시설 이용 안내</span>
              </div>
              <div>
                시설을 정상적으로 이용하시려면 <strong className="text-white">[▶️ 가동 재개 및 입장]</strong> 버튼을 누르거나, <strong className="text-white">[방주 영지]</strong> 시설 관리에서 시설 가동을 다시 켜주세요.
              </div>
              <div className="text-[10px] text-[#ff8a80] mt-1">
                ※ 가동을 재개하면 시설의 고유 기능이 활성화되고 기본 운영 유지비 소모 및 자원 생산이 다시 시작됩니다.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 🌙 부재 중 영지 오프라인 정산 보고서 모달 ── */}
      {offlineReportModal && (
        <Modal
          title="🌙 부재 중 영지 활동 정산 보고서"
          open={!!offlineReportModal}
          onClose={() => setOfflineReportModal(null)}
          footer={
            <ActionButton
              label="🏰 방주 성채 업무 시작"
              variant="primary"
              className="w-full text-sm font-bold py-2.5 shadow-lg shadow-[#42321955]"
              onClick={() => {
                setOfflineReportModal(null);
                setLatestOfflineReport(null);
                gm.clearOfflineReport();
                SoundManager.getInstance().play('click');
                gm.addLog('📋 [결산 확인] 부재 중 영지 활동 결산 확인을 마치고 방주 성채 업무를 개시합니다.', 'system');
              }}
            />
          }
        >
          <div className="flex flex-col gap-3 py-1 animate-fade-in">
            {/* 상단 경과 시간 배너 */}
            <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#00d2ff55] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⏳</span>
                <div>
                  <div className="text-xs font-bold text-[#00d2ff]">
                    부재 중 경과 시간: {offlineReportModal.formattedTime}
                  </div>
                  <div className="text-[10px] text-[#8b9bb4]">
                    지휘관님이 자리를 비우신 동안에도 방주 시설이 멈추지 않고 가동되었습니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 생산된 자원 현황 */}
            {offlineReportModal.grossProduced && Object.keys(offlineReportModal.grossProduced).length > 0 && (
              <div>
                <div className="text-xs font-bold text-[#cfd8dc] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">📦 부재 중 총 생산 자원</span>
                  <span className="text-[10px] text-[#38ef7d]">실시간 생산 완료</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
                  {Object.entries(offlineReportModal.grossProduced).map(([k, amt]) => {
                    if (!amt || (amt as number) <= 0) return null;
                    const resMeta: Record<string, { icon: string; name: string }> = {
                      gold: { icon: '🪙', name: '골드' },
                      wood: { icon: '🪵', name: '목재' },
                      stone: { icon: '🪨', name: '석재' },
                      iron: { icon: '⚙️', name: '철광석' },
                      food: { icon: '🍖', name: '식량' },
                      ether: { icon: '✨', name: '에테르' },
                      leather: { icon: '🥋', name: '가죽' },
                    };
                    const meta = resMeta[k] || { icon: '📦', name: k };
                    const cap = gm.getMaxResourceCapacity(k as any);
                    const isAtCap = (state.resources[k as keyof GameResources] || 0) >= cap;
                    return (
                      <div
                        key={k}
                        className="p-2 rounded-lg bg-[#141a29] border border-[#222d42] flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base shrink-0">{meta.icon}</span>
                          <span className="text-xs text-white font-medium truncate">{meta.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-1">
                          <span className="text-xs font-bold font-mono text-[#38ef7d] block">
                            +{(amt as number).toLocaleString()}
                          </span>
                          {isAtCap && (
                            <span className="text-[9px] font-bold text-[#ffd54f] block font-mono">
                              [창고 한계]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 시설 유지비 정산 */}
            {(offlineReportModal.upkeepGoldPaid > 0 || offlineReportModal.upkeepFoodPaid > 0 || offlineReportModal.upkeepEtherPaid > 0) && (
              <div className="p-3 rounded-xl bg-[#141724] border border-[#2c384d] flex flex-col gap-2">
                <div className="text-xs font-bold text-[#ffd54f] flex items-center justify-between">
                  <span>📉 시설 운영 유지비 정산</span>
                  <span className="text-[10px] text-[#38ef7d] font-normal">생산량으로 자동 충당</span>
                </div>
                <div className="flex gap-2 flex-wrap text-xs font-mono">
                  {offlineReportModal.upkeepGoldPaid > 0 && (
                    <span className="px-2 py-1 rounded bg-[#2a1d12] text-[#ffb74d] border border-[#ff980044]">
                      🪙 골드 -{offlineReportModal.upkeepGoldPaid.toLocaleString()}G
                    </span>
                  )}
                  {offlineReportModal.upkeepFoodPaid > 0 && (
                    <span className="px-2 py-1 rounded bg-[#2a1d12] text-[#ffb74d] border border-[#ff980044]">
                      🍖 식량 -{offlineReportModal.upkeepFoodPaid.toLocaleString()}
                    </span>
                  )}
                  {offlineReportModal.upkeepEtherPaid > 0 && (
                    <span className="px-2 py-1 rounded bg-[#2a1d12] text-[#ffb74d] border border-[#ff980044]">
                      ✨ 에테르 -{offlineReportModal.upkeepEtherPaid.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#8b9bb4] leading-relaxed">
                  💡 창고가 가득 차더라도 유지비가 소비되면 다음 생산으로 즉시 재충전되어 창고 한계치가 안전하게 보전되었습니다.
                </div>
              </div>
            )}

            {/* 생체 복원 병동 치료 내역 */}
            {offlineReportModal.healedHeroes && offlineReportModal.healedHeroes.length > 0 && (
              <div className="p-3 rounded-xl bg-[#0f241a] border border-[#10b98155] flex flex-col gap-1.5">
                <div className="text-xs font-bold text-[#34d399] flex items-center gap-1">
                  <span>💉 생체 복원 병동 치료 완료</span>
                </div>
                <div className="text-xs text-[#cfd8dc] flex flex-col gap-0.5">
                  {offlineReportModal.healedHeroes.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between">
                      <span>• {h.name}</span>
                      <span className="text-[#34d399] font-mono">
                        HP +{h.hpGained} {h.isFullyHealed ? ' [완치!]' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 성화 온기 알림 */}
            <div className="p-2.5 rounded-xl bg-[#111622] border border-[#1e2738] flex items-center justify-between text-xs">
              <span className="text-[#8b9bb4] flex items-center gap-1.5">
                <span>🔥 방주의 성화</span>
              </span>
              <span className={offlineReportModal.bonfireWarmthExpired ? 'text-[#ef5350] font-bold' : 'text-[#ffd54f] font-mono'}>
                {offlineReportModal.bonfireWarmthExpired
                  ? '부재 중 성화 소멸 (재점화 필요)'
                  : `남은 온기: ${Math.floor((offlineReportModal.bonfireSecondsLeft || 0) / 60)}분`}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* 📖 초반 분위기 서사 & 퀘스트 안내 스토리 모달 */}
      <IntroStoryModal
        open={showIntroStory}
        onClose={handleCloseIntroStory}
        onOpenQuests={handleOpenQuestsFromIntro}
      />


      {/* 📜 심연의 백과 & 회고록 모달 */}
      <CodexModal
        open={showCodexModal}
        onClose={() => setShowCodexModal(false)}
        gm={gm}
      />
    </div>
  );
};
