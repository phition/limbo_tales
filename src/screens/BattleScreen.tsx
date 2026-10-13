import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ResourceBar } from '../components/ResourceBar';
import { useGameManager } from '../hooks/useGameManager';
import { useI18n } from '../hooks/useI18n';
import { GameManager } from '../managers/GameManager';
import { LogPanel } from '../components/LogPanel';
import { ActionButton } from '../components/ActionButton';
import { Mercenary, MonsterData, Skill, MonsterSkill, StatusEffect, STATUS_EFFECT_META, StatusEffectType, EquipmentItem, SkillBookItem, MONSTER_FACTION_META } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { ALL_SKILL_BOOKS, ALL_SKILLS_MAP, checkSkillAffinityMatch, getSkillAffinityMeta } from '../data/skillBooks';
import { SoundManager } from '../managers/SoundManager';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { LootSelectionModal } from '../components/LootSelectionModal';
import { BossEntranceCutscene } from '../components/BossEntranceCutscene';
import { Modal } from '../components/Modal';
import { HeroDetailModal } from '../components/HeroDetailModal';
import { MONSTERS } from '../data/monsters';
import { GameIcon } from '../components/GameIcon';
import { triggerHaptic } from '../utils/haptics';
import { getSkillTags, getTriggerableCombos, isComboReadyForMonster, isComboReadyForBattleTarget, getEffectivePositionBonus, SkillTag, ComboRule, getHeroAssistDef, selectAssistHero, AssistAttackDef, checkMonsterStatusComboOnHero, checkEquipmentProc, EnemyComboResult, EquipmentProcResult, getTagMeta, resolveCombatVfxAndSfx, getSkillMagicSchool, getElementalSubtype } from '../utils/skillComboUtils';
import { CustomAssetService } from '../services/CustomAssetService';
import { useCustomAssetVersion } from '../hooks/useCustomAssetVersion';
import { getHeroEquippedBossSet, getWeaponTrait, detectWeaponType } from '../data/equipment';
import { FeverBadgeType, FeverSynergyResult } from '../types/fever';
import { evaluateFeverSynergy } from '../utils/feverUtils';
import { FeverGaugeBar } from '../components/FeverGaugeBar';

// ── 몬스터 런타임 상태 ──────────────────────────────────────────────────────
interface MonsterState {
  id: string;
  data: MonsterData;
  maxHp: number;
  currentHp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  statusEffects: StatusEffect[];
  isEnraged: boolean;
  chargingState?: {
    skillName: string;
    remainingBreakDmg: number;
    maxBreakDmg: number;
    skill: MonsterSkill;
  } | null;
  isGroggy?: boolean;
}

const RES_NAME_MAP: Record<string, { name: string; icon: string }> = {
  gold: { name: '골드', icon: '🪙' },
  ether: { name: '에테르', icon: '✨' },
  wood: { name: '목재', icon: '🪵' },
  stone: { name: '석재', icon: '🪨' },
  iron: { name: '철광석', icon: '⚙️' },
  food: { name: '식량', icon: '🍖' },
  herb: { name: '약초', icon: '🌿' },
  bone: { name: '짐승 뼈', icon: '🦴' },
  leather: { name: '가죽', icon: '🧱' },
  silk: { name: '실크', icon: '🧵' },
  coal: { name: '석탄', icon: '⚫' },
  crystal: { name: '마력 수정', icon: '🔮' },
  void_shard: { name: '공허 파편', icon: '💠' },
  dark_essence: { name: '암흑 정수', icon: '🌑' },
  prefix_stone: { name: '일반 접두석', icon: '✨' },
  suffix_stone: { name: '일반 접미석', icon: '🔮' },
  pure_prefix_stone: { name: '순수 접두석', icon: '⭐' },
  pure_suffix_stone: { name: '순수 접미석', icon: '🌌' },
  relic_floor_1: { name: '침묵의 흑핵', icon: '🔮' },
  relic_floor_2: { name: '망령의 영혼수정', icon: '💠' },
  relic_floor_3: { name: '원초의 광맥 심장', icon: '🫀' },
  relic_floor_4: { name: '심연의 시공 닻', icon: '⚓' },
  relic_floor_5: { name: '공허 지배자의 모노리스 핵', icon: '👑' },
  relic_floor_6: { name: '핏빛 대공의 진홍 성배', icon: '🍷' },
  relic_floor_7: { name: '망각 묘지기의 영혼 나침반', icon: '🧭' },
  relic_floor_8: { name: '단죄의 기사단장 맹세 휘장', icon: '🎖️' },
  relic_floor_9: { name: '미궁 지배자의 진실 거울 파편', icon: '🪞' },
  relic_floor_10: { name: '심연 군주의 옥새', icon: '👑' },
  torch: { name: '횃불', icon: '🔥' },
  pickaxe: { name: '곡괭이', icon: '⛏️' },
  bandage: { name: '치유 붕대', icon: '🩹' },
  holy_water: { name: '정화의 성수', icon: '💧' },
  golden_toad: { name: '황금 두꺼비', icon: '🐸' },
  compass: { name: '차원의 나침반', icon: '🧭' },
  blood_contract: { name: '피의 서약서', icon: '📜' },
  dimensional_whistle: { name: '차원의 호각', icon: '📯' },
  skeleton_key: { name: '만능열쇠', icon: '🗝️' },
  // 📜 회고록 쪽지
  memoir_note_1: { name: '1층 회고록 쪽지', icon: '📜' },
  memoir_note_2: { name: '2층 회고록 쪽지', icon: '📜' },
  memoir_note_3: { name: '3층 회고록 쪽지', icon: '📜' },
  memoir_note_4: { name: '4층 회고록 쪽지', icon: '📜' },
  memoir_note_5: { name: '5층 회고록 쪽지', icon: '📜' },
  memoir_note_6: { name: '6층 회고록 쪽지', icon: '📜' },
  memoir_note_7: { name: '7층 회고록 쪽지', icon: '📜' },
  memoir_note_8: { name: '8층 회고록 쪽지', icon: '📜' },
  memoir_note_9: { name: '9층 회고록 쪽지', icon: '📜' },
  memoir_note_10: { name: '10층 회고록 쪽지', icon: '📜' },
  // 🏛️ 고대 오파츠
  ooparts_1_1: { name: '금이 간 스마트폰 액정', icon: '📱' },
  ooparts_1_2: { name: '녹슨 스테인리스 텀블러', icon: '🥤' },
  ooparts_2_1: { name: '빛바랜 플라스틱 신용카드', icon: '💳' },
  ooparts_2_2: { name: '먼지 쌓인 카세트 테이프', icon: '📼' },
  ooparts_3_1: { name: '방전된 리튬 배터리', icon: '🔋' },
  ooparts_3_2: { name: '금이 간 세라믹 머그잔', icon: '☕' },
  ooparts_4_1: { name: '찢겨진 지하철 노선도', icon: '🗺️' },
  ooparts_4_2: { name: '멈춰버린 쿼츠 손목시계', icon: '⌚' },
  ooparts_5_1: { name: '부서진 헤드폰', icon: '🎧' },
  ooparts_5_2: { name: '비닐 코팅된 학생증', icon: '🪪' },
  ooparts_6_1: { name: '녹슨 와인 오프너', icon: '🍷' },
  ooparts_6_2: { name: '말라붙은 립스틱 케이스', icon: '💄' },
  ooparts_7_1: { name: '빛바랜 폴라로이드 사진', icon: '📷' },
  ooparts_7_2: { name: '굳어버린 3색 볼펜', icon: '🖊️' },
  ooparts_8_1: { name: '부서진 무전기 트랜시버', icon: '📻' },
  ooparts_8_2: { name: '찌그러진 티타늄 안경테', icon: '👓' },
  ooparts_9_1: { name: '홀로그램 디스플레이 큐브', icon: '🧊' },
  ooparts_9_2: { name: '녹아내린 카메라 렌즈', icon: '🔍' },
  ooparts_10_1: { name: '양자 코어 칩셋', icon: '💾' },
  ooparts_10_2: { name: '타임캡슐 황동 열쇠', icon: '🗝️' },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * 🛡️ 대상에게 상태이상/버프 부여 (중복 시 새 항목을 추가하지 않고 지속 턴 합산 연장)
 */
export function applyStatusEffect(
  target: { statusEffects: StatusEffect[] },
  effect: StatusEffect,
  maxCapTurns = 9
): { isNew: boolean; currentTurns: number } {
  if (!Array.isArray(target.statusEffects)) {
    target.statusEffects = [];
  }
  const existing = target.statusEffects.find(se => se.type === effect.type);
  if (existing) {
    existing.turnsLeft = Math.min(maxCapTurns, existing.turnsLeft + effect.turnsLeft);
    existing.totalTurns = Math.max(existing.totalTurns, existing.turnsLeft);
    if (effect.magnitude !== undefined) {
      if (effect.type === 'shield') {
        existing.magnitude = (existing.magnitude || 0) + effect.magnitude;
      } else {
        existing.magnitude = Math.max(existing.magnitude || 0, effect.magnitude);
      }
    }
    if (effect.source) existing.source = effect.source;
    return { isNew: false, currentTurns: existing.turnsLeft };
  } else {
    target.statusEffects.push({ ...effect });
    return { isNew: true, currentTurns: effect.turnsLeft };
  }
}

// ── 몬스터 일러스트 패널 (현재 타겟팅된 적의 배경 일러스트 실시간 연동) ────────────────
const MonsterImagePanel: React.FC<{ targetMonster?: MonsterState; totalCount: number; isAttacking?: boolean }> = ({ targetMonster, isAttacking }) => {
  const gm = GameManager.getInstance();
  const [imgError, setImgError] = useState(false);
  const mon = targetMonster;
  const isAlive = (mon?.currentHp || 0) > 0;

  useEffect(() => {
    setImgError(false);
  }, [mon?.id, mon?.data?.imagePath]);

  const getPrompt = (m: MonsterState) => {
    const type = m.data.type === 'boss' ? 'epic boss creature' : m.data.type === 'elite' ? 'elite monster' : 'dungeon monster';
    return `[AI 이미지 프롬프트 — assets/${m.data.promptKey}.jpg]\n"${m.data.name}, ${type}, dark fantasy RPG style,\nglowing eyes, menacing pose, dramatic rim lighting,\nhigh detail concept art, black background"`;
  };

  const defMon = mon?.data.id ? MONSTERS[mon.data.id] : undefined;
  const customOverride = mon?.data.id ? CustomAssetService.getInstance().getMonsterOverride(mon.data.id) : undefined;
  const rawImageSrc = customOverride || defMon?.imagePath || mon?.data.imagePath;
  const imageSrc = rawImageSrc ? (rawImageSrc.startsWith('data:') || rawImageSrc.includes('?') ? rawImageSrc : `${rawImageSrc}?v=2`) : undefined;
  const showImage = imageSrc && !imgError;

  return (
    <div className={`px-3 pt-2 shrink-0 relative ${isAttacking ? 'z-40' : 'z-10'}`}>
      <div
        className={`relative w-full panel flex items-center justify-center transition-all duration-300 shadow-xl ${
          isAttacking
            ? 'overflow-visible border-[#ff1744] shadow-[0_0_35px_rgba(255,23,68,0.6)] ring-1 ring-[#ff174488]'
            : 'overflow-hidden'
        }`}
        style={{ height: 'min(170px, 22vh)', background: 'linear-gradient(135deg, #0d1525 0%, #1a0a2e 50%, #0d1525 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 rounded-xl overflow-hidden pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#a742f5 0,#a742f5 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#a742f5 0,#a742f5 1px,transparent 0,transparent 50%)', backgroundSize: '40px 40px' }} />

        {/* 👾 공격 시 배경 은은한 플래시 */}
        {isAttacking && (
          <div className="absolute inset-0 bg-radial from-[#ff174445] via-transparent to-transparent pointer-events-none animate-pulse z-10 rounded-xl" />
        )}

        {showImage ? (
          <img
            key={imageSrc}
            src={imageSrc}
            alt={mon?.data.name}
            className={`transition-all duration-300 pointer-events-none ${
              !isAlive ? 'grayscale opacity-35 brightness-50' : ''
            } ${
              isAttacking
                ? 'absolute inset-0 w-full h-full object-contain object-center z-50 animate-monster-attack-surge drop-shadow-[0_20px_35px_rgba(255,23,68,0.95)] filter brightness-125'
                : 'absolute inset-0 w-full h-full object-cover object-top animate-fade-in'
            }`}
            style={{
              objectPosition: isAttacking ? 'center' : 'top',
              filter: isAlive
                ? (isAttacking ? 'brightness(1.28) contrast(1.2) saturate(1.35)' : 'brightness(0.8) contrast(1.1) saturate(1.15)')
                : 'grayscale(100%) brightness(0.4)'
            }}
            onError={() => setImgError(true)}
          />
        ) : mon ? (
          <div className={`relative z-10 flex flex-col items-center w-full px-4 ${isAttacking ? 'animate-monster-attack-surge z-50' : ''}`}>
            <div className="text-5xl mb-2" style={{ filter: isAlive ? (isAttacking ? 'drop-shadow(0 0 20px #ff1744)' : 'drop-shadow(0 0 10px #a742f5)') : undefined }}>
              {!isAlive ? '💀' : mon.data.type === 'boss' ? '👑' : mon.data.type === 'elite' ? '⭐' : '👾'}
            </div>
            <div className="text-[11px] text-[#6b5b8a] text-center leading-tight whitespace-pre-line font-mono">
              {getPrompt(mon)}
            </div>
          </div>
        ) : (
          <div className="text-[#455a64] text-sm">전투 준비 중...</div>
        )}

        {mon && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
            style={{ background: 'linear-gradient(to top, #0d1525ee, transparent)' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                style={{
                  background: !isAlive ? '#37474f22' : mon.data.type === 'boss' ? '#ffd54f22' : mon.data.type === 'elite' ? '#ff6b6b22' : '#00d2ff22',
                  color: !isAlive ? '#607d8b' : mon.data.type === 'boss' ? '#ffd54f' : mon.data.type === 'elite' ? '#ff6b6b' : '#00d2ff',
                  border: `1px solid ${!isAlive ? '#37474f44' : mon.data.type === 'boss' ? '#ffd54f44' : mon.data.type === 'elite' ? '#ff6b6b44' : '#00d2ff44'}`
                }}>
                {!isAlive ? '💀 DEAD' : mon.data.type === 'boss' ? '👑 BOSS' : mon.data.type === 'elite' ? '⭐ ELITE' : '🎯 TARGET'}
              </span>
              {mon.data.faction && MONSTER_FACTION_META[mon.data.faction] && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0"
                  style={{
                    background: `${MONSTER_FACTION_META[mon.data.faction].color}22`,
                    color: MONSTER_FACTION_META[mon.data.faction].color,
                    border: `1px solid ${MONSTER_FACTION_META[mon.data.faction].color}44`,
                  }}
                  title={MONSTER_FACTION_META[mon.data.faction].desc}
                >
                  {MONSTER_FACTION_META[mon.data.faction].icon} {MONSTER_FACTION_META[mon.data.faction].label}
                </span>
              )}
              <span className="font-bold text-white text-sm truncate" style={{ color: !isAlive ? '#607d8b' : undefined, textDecoration: !isAlive ? 'line-through' : undefined }}>{mon.data.name}</span>
              {isAlive && mon.isEnraged && (
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono flex items-center gap-0.5 animate-pulse shrink-0 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,23,68,0.28), rgba(255,87,34,0.32))',
                    color: '#ff1744',
                    border: '1px solid rgba(255,23,68,0.7)',
                    boxShadow: '0 0 8px rgba(255,23,68,0.4)',
                    textShadow: '0 0 4px #ff1744'
                  }}
                  title="심연 오버차지 광폭화 상태"
                >
                  <span className="text-[10px]">⚡</span>
                  <span>광폭화</span>
                </span>
              )}
              {isAlive && (
                gm.isFloorPurified(gm.dungeonFloor) ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono bg-[#10b98122] text-[#34d399] border border-[#10b98155]" title="정화된 구역: 심연의 연무 강화 해제">
                    ✨ 정화됨
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono bg-[#7c3aed22] text-[#c4b5fd] border border-[#7c3aed55]" title={`심연의 연무로 마물 공격력과 방어력 +${gm.dungeonFloor === 11 ? 50 : gm.dungeonFloor * 5}% 강화`}>
                    🌫️ 연무 +{gm.dungeonFloor === 11 ? 50 : gm.dungeonFloor * 5}%
                  </span>
                )
              )}
              <span className="text-[10px] text-[#8b9bb4] font-mono ml-auto">
                Lv.{mon.data.level} (HP: <span className={!isAlive ? 'text-[#607d8b]' : mon.currentHp > mon.maxHp * 0.3 ? 'text-[#38ef7d]' : 'text-[#ef5350]'}>{!isAlive ? '0' : Math.round(mon.currentHp)}/{Math.round(mon.maxHp)}</span>)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── 롱프레스 (홀드) 헬퍼 컴포넌트 ──────────────────────────────────────────
const LongPressBox: React.FC<{
  onLongPress: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ onLongPress, onClick, className = '', style, children }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongRef = useRef(false);

  const handleStart = () => {
    isLongRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(30); } catch (_) {}
      }
      onLongPress();
    }, 350);
  };

  const handleEnd = (shouldClick: boolean) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongRef.current && shouldClick && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={className}
      style={style}
      onMouseDown={handleStart}
      onMouseUp={() => handleEnd(true)}
      onMouseLeave={() => handleEnd(false)}
      onTouchStart={handleStart}
      onTouchEnd={() => handleEnd(true)}
      onTouchMove={() => handleEnd(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
    >
      {children}
    </div>
  );
};

// ── 🔍 스킬 상세 정보 모달 (홀드로 열림) ──────────────────────────────────
const SkillDetailModal: React.FC<{
  skill: Skill | null;
  hero?: Mercenary;
  canCast?: boolean;
  onCast?: () => void;
  onClose: () => void;
  gm?: ReturnType<typeof useGameManager>['gm'];
}> = ({ skill, hero, canCast, onCast, onClose, gm }) => {
  if (!skill) return null;
  const isBasic = skill.id === 'basic_attack' || skill.id === 'basic';
  const effectivePos = skill.positionBonus || getEffectivePositionBonus(skill);
  const posLabel = effectivePos === 'front' ? '전열 특화' : effectivePos === 'back' ? '후열 저격' : effectivePos === 'any' ? '전/후열 대응' : null;
  const posColor = effectivePos === 'front' ? '#ef5350' : effectivePos === 'back' ? '#42a5f5' : '#ab47bc';

  const targetLabel = skill.targetType === 'all_enemies' ? '적 전체 (광역)'
    : skill.targetType === 'single_enemy' ? '단일 적'
    : skill.targetType === 'all_allies' ? '아군 전체'
    : skill.targetType === 'single_ally' ? '단일 아군'
    : skill.targetType === 'self' ? '자신 (시전자)'
    : '단일 대상';

  const actualMpCost = gm ? gm.getSkillManaCost(skill.manaCost, undefined, hero) : skill.manaCost;
  const tags = getSkillTags(skill);
  const combos = getTriggerableCombos(skill);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative panel-accent w-full max-w-[380px] p-4 bg-[#0d1424] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#11192e] border border-[#22324f] flex items-center justify-center">
              <GameIcon name={skill.id} icon={skill.icon || '⚔️'} size={28} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white">{skill.name}</span>
                {skill.isSpecial && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                    {skill.name.includes('[궁극기]') ? '궁극기' : '고유기'}
                  </span>
                )}
                {skill.isUnique && <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ce93d822] text-[#ce93d8] border border-[#ce93d844]">보스 신화</span>}
              </div>
              <div className="text-[11px] text-[#8b9bb4]">
                {isBasic ? '기초 물리 타격' : `${hero ? `${hero.name}의 ` : ''}전투 기술`}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost text-xs px-2 py-1 text-[#8b9bb4] hover:text-white" onClick={onClose}>✕</button>
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

        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">마나 소모</span>
            <span className="text-xs font-bold text-[#64b5f6]">{actualMpCost} MP</span>
            {gm && (gm.dungeonFloor || 1) > 1 && skill.manaCost > 0 && (
              <span className="text-[9px] text-[#ff7043] block">({gm.dungeonFloor}F +{(gm.dungeonFloor - 1) * 10}%)</span>
            )}
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">쿨다운</span>
            <span className="text-xs font-bold text-[#ffd54f]">{skill.cooldown || 0}턴</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">위력 계수</span>
            <span className="text-xs font-bold text-[#38ef7d]">{Math.round((skill.power || 1.0) * 100)}%</span>
            {(() => {
              const baseSkill = gm?.resolveSkillData(skill.id, 1);
              const basePowerPct = Math.round((baseSkill?.power || 1.0) * 100);
              const curPowerPct = Math.round((skill.power || 1.0) * 100);
              return curPowerPct !== basePowerPct ? (
                <span className="text-[8px] text-[#ffd54f] font-mono block">(초기 {basePowerPct}%)</span>
              ) : null;
            })()}
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">대상</span>
            <span className="text-[10px] font-bold text-[#cfd8dc] truncate block">{targetLabel}</span>
          </div>
        </div>

        {effectivePos && (
          <div className="p-2 rounded-lg bg-[#162035] border text-xs flex items-center justify-between" style={{ borderColor: `${posColor}44` }}>
            <span className="font-bold flex items-center gap-1" style={{ color: posColor }}>
              <span>📍 포지션 특화:</span>
              <span>[{posLabel}]</span>
            </span>
            <span className="text-[10px] text-[#90a4ae]">
              {effectivePos === 'front' ? '전열 타격 시 +25% & 보호막 연계' : effectivePos === 'back' ? '후열 저격 시 +20% & 치명타' : '전열/후열 대응'}
            </span>
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-[#00d2ff]">📖 스킬 상세 효과</div>
          <div className="text-xs text-[#cfd8dc] leading-relaxed whitespace-pre-line">{skill.description}</div>
        </div>

        {/* ⚡ 상태이상 연계 콤보 안내 섹션 */}
        {combos.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#131d2e] border border-[#00d2ff33] flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-[#ffd54f] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>⚡ 상태이상 연계 메커니즘</span>
              </span>
              <span className="text-[9px] text-[#8b9bb4] font-normal">적 상태이상 시 발동</span>
            </div>
            <div className="flex flex-col gap-1">
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
            <div className="p-2 rounded bg-[#0a1220] border border-[#223652] text-[10px] text-[#90caf9] flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span>
                적에게 해당 상태이상이 걸려 있을 때 일치하는 태그 스킬로 공격하면 연계 콤보가 폭발합니다.
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={onClose}>닫기</button>
          {onCast && (
            <button
              className="btn btn-primary text-xs px-4 py-1.5"
              disabled={!canCast}
              onClick={() => {
                onCast();
                onClose();
              }}
            >
              스킬 사용
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── 👾 몬스터 상세 정보 모달 (홀드로 열림) ────────────────────────────────
const MonsterDetailModal: React.FC<{
  monster: MonsterState | null;
  onClose: () => void;
}> = ({ monster, onClose }) => {
  if (!monster) return null;
  const gm = GameManager.getInstance();
  const hpPct = clamp((monster.currentHp / monster.maxHp) * 100, 0, 100);
  const typeLabel = monster.data.type === 'boss' ? '👑 BOSS' : monster.data.type === 'elite' ? '⭐ ELITE' : '👾 NORMAL';
  const typeColor = monster.data.type === 'boss' ? '#ffd54f' : monster.data.type === 'elite' ? '#ff6b6b' : '#00d2ff';
  const customOverride = monster.data.id ? CustomAssetService.getInstance().getMonsterOverride(monster.data.id) : undefined;
  const defMon = monster.data.id ? MONSTERS[monster.data.id] : undefined;
  const rawImageSrc = customOverride || defMon?.imagePath || monster.data.imagePath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative panel-accent w-full max-w-[390px] p-4 bg-[#0d1424] border border-[#ff444455] rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2.5">
          <div className="flex items-center gap-2">
            {rawImageSrc ? (
              <img
                src={rawImageSrc}
                alt={monster.data.name}
                className="w-11 h-11 object-cover object-top rounded-xl border border-[#ff444455] shadow-md shrink-0"
                style={{ objectPosition: 'top' }}
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-2xl p-1.5 rounded-lg bg-[#1a0f1f] border border-[#3d2448]">
                {monster.data.type === 'boss' ? '👑' : monster.data.type === 'elite' ? '⭐' : '👾'}
              </span>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-white">{monster.data.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold" style={{ background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44` }}>
                  {typeLabel}
                </span>
                {monster.isEnraged && (
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono flex items-center gap-0.5 animate-pulse shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,23,68,0.3), rgba(255,87,34,0.35))',
                      color: '#ff1744',
                      border: '1px solid rgba(255,23,68,0.7)',
                      boxShadow: '0 0 8px rgba(255,23,68,0.4)',
                      textShadow: '0 0 4px #ff1744'
                    }}
                  >
                    <span>⚡</span>
                    <span>광폭화 (능력치 1.3배)</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8b9bb4] font-mono flex items-center gap-1.5">
                <span>Lv.{monster.data.level}</span>
                {monster.data.faction && MONSTER_FACTION_META[monster.data.faction] ? (
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded font-bold font-sans flex items-center gap-0.5"
                    style={{
                      background: `${MONSTER_FACTION_META[monster.data.faction].color}22`,
                      color: MONSTER_FACTION_META[monster.data.faction].color,
                      border: `1px solid ${MONSTER_FACTION_META[monster.data.faction].color}55`,
                    }}
                    title={MONSTER_FACTION_META[monster.data.faction].desc}
                  >
                    <span>{MONSTER_FACTION_META[monster.data.faction].icon}</span>
                    <span>{MONSTER_FACTION_META[monster.data.faction].label}</span>
                  </span>
                ) : (
                  <span>마물</span>
                )}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost text-xs px-2 py-1 text-[#8b9bb4] hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-[#8b9bb4]">체력 (HP)</span>
            <span className="font-bold text-[#38ef7d]">{Math.round(monster.currentHp)} / {Math.round(monster.maxHp)} ({Math.round(hpPct)}%)</span>
          </div>
          <div className="bar-track h-2 bg-[#11192e] rounded-full overflow-hidden">
            <div className="bar-fill-hp h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">공격력</span>
            <span className="text-xs font-bold text-[#ef5350]">{monster.atk}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">방어력</span>
            <span className="text-xs font-bold text-[#42a5f5]">{monster.def}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">속도</span>
            <span className="text-xs font-bold text-[#ffd54f]">{monster.spd}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">행운</span>
            <span className="text-xs font-bold text-[#ab47bc]">🍀 {monster.luck}</span>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-[#0c1220] border border-[#1e2d45] text-[10px] text-[#8b9bb4] flex justify-between">
          <span>치명타: <strong className="text-[#ce93d8]">{gm.getCritChance(monster.luck).toFixed(1)}%</strong></span>
          <span>상태이상 저항: <strong className="text-[#38ef7d]">{Math.min(50, monster.luck * 0.35).toFixed(1)}%</strong></span>
          <span>회피보정: <strong className="text-[#ffd54f]">+{Math.min(70, monster.luck * 0.3).toFixed(1)}%</strong></span>
        </div>

        {monster.data.faction && MONSTER_FACTION_META[monster.data.faction] && (
          <div className="px-2.5 py-1.5 rounded-lg bg-[#0c1220] border border-[#1e2d45] text-[10px] flex items-center justify-between">
            <span className="text-[#8b9bb4]">마법 계열 상성:</span>
            <span className="font-bold" style={{ color: MONSTER_FACTION_META[monster.data.faction].color }}>
              {monster.data.faction === 'undead' || monster.data.faction === 'corrupted'
                ? '✨ 신성 마법 피격 시 +20% 추가 피해'
                : monster.data.faction === 'beast'
                ? '🔮 암흑 마법 피격 시 +20% 추가 피해'
                : '⚙️ 원소 마법 상태이상 / 물리 공격에 균형 대응'}
            </span>
          </div>
        )}

        {monster.data.description && (
          <div className="p-2 rounded-lg bg-[#11192e] border border-[#22324f] text-xs text-[#8b9bb4] leading-relaxed">
            {monster.data.description}
          </div>
        )}

        {/* 🗡️ 고유 특수 능력 / 특수 스탯 (관통 / 흡혈 / 보호막 분쇄) */}
        {(() => {
          const rawPierce = monster.data.piercePct || 0;
          const pierceVal = Math.round(rawPierce <= 1 ? rawPierce * 100 : rawPierce);

          const rawDrain = monster.data.drainPct || 0;
          const drainVal = Math.round(rawDrain <= 1 ? rawDrain * 100 : rawDrain);

          const shieldBreakVal = monster.data.shieldBreakMult && monster.data.shieldBreakMult > 1 ? monster.data.shieldBreakMult : 0;

          const hasSpecialStats = pierceVal > 0 || drainVal > 0 || shieldBreakVal > 0;
          if (!hasSpecialStats) return null;

          return (
            <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#ff444433] flex flex-col gap-1.5">
              <div className="text-[11px] font-bold text-[#ff7043] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🗡️</span>
                  <span>고유 특수 능력 (Special Stats)</span>
                </span>
                <span className="text-[9px] text-[#8b9bb4]">전투 패널 미표기 고유 스탯</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {pierceVal > 0 && (
                  <div className="p-2 rounded bg-[#1a1322] border border-[#ff174444] flex flex-col gap-0.5">
                    <div className="flex items-center justify-between font-bold text-[#ff5252]">
                      <span>🗡️ 방어 관통</span>
                      <span className="font-mono text-sm">{pierceVal}%</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc] leading-tight">
                      아군의 방어력을 {pierceVal}% 무시하고 타격
                    </div>
                  </div>
                )}
                {drainVal > 0 && (
                  <div className="p-2 rounded bg-[#1f121d] border border-[#e91e6344] flex flex-col gap-0.5">
                    <div className="flex items-center justify-between font-bold text-[#ff4081]">
                      <span>🩸 생명력 흡혈</span>
                      <span className="font-mono text-sm">{drainVal}%</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc] leading-tight">
                      가한 실제 피해의 {drainVal}%만큼 체력 회복
                    </div>
                  </div>
                )}
                {shieldBreakVal > 0 && (
                  <div className="p-2 rounded bg-[#1f1912] border border-[#ff980044] flex flex-col gap-0.5">
                    <div className="flex items-center justify-between font-bold text-[#ffb74d]">
                      <span>🛡️ 보호막 분쇄</span>
                      <span className="font-mono text-sm">x{shieldBreakVal}</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc] leading-tight">
                      보호막 타격 시 {shieldBreakVal}배 증폭 피해
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-[#00d2ff] flex items-center justify-between">
            <span>✨ 활성화된 상태이상 / 버프 / 디버프</span>
            <span className="text-[10px] text-[#8b9bb4] font-mono">
              {monster.statusEffects.length + (monster.isGroggy ? 1 : 0)}개 활성
            </span>
          </div>
          {monster.statusEffects.length === 0 && !monster.isGroggy ? (
            <div className="text-[11px] text-[#546e7a] py-1">현재 부여된 상태이상이나 버프/디버프가 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {monster.isGroggy && (
                <div className="p-1.5 rounded bg-[#2b2210] border border-[#ffd54f55] flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💫</span>
                    <span className="font-bold text-[#ffd54f]">그로기 (Groggy)</span>
                    <span className="text-[10px] text-[#cfd8dc]">(차징 브레이크: 받는 피해 +50%)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#0d1424] text-[#ffd54f]">
                    행동 불가
                  </span>
                </div>
              )}
              {monster.statusEffects.map((se, idx) => {
                const meta = STATUS_EFFECT_META[se.type] || { icon: '✨', label: se.type, color: '#00d2ff', desc: '' };
                return (
                  <div key={idx} className="p-1.5 rounded bg-[#162035] border border-[#273859] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <GameIcon name={se.type} icon={meta.icon} size={16} />
                      <span className="font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-[10px] text-[#cfd8dc]">({meta.desc || `${se.magnitude || ''}`})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#0d1424] text-[#ffd54f]">
                      남은 턴: {se.turnsLeft}턴
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {monster.data.skills && monster.data.skills.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-[#ffd54f]">⚔️ 몬스터 사용 스킬</div>
            <div className="flex flex-col gap-1">
              {monster.data.skills.map((sk, idx) => {
                const skPierce = sk.piercePct ? Math.round(sk.piercePct <= 1 ? sk.piercePct * 100 : sk.piercePct) : 0;
                const skDrain = sk.drainPct ? Math.round(sk.drainPct <= 1 ? sk.drainPct * 100 : sk.drainPct) : (sk.effectType === 'drain' ? 40 : 0);
                return (
                  <div key={idx} className="p-1.5 rounded bg-[#162035] border border-[#273859] text-xs">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>{sk.name}</span>
                        {skPierce > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ff174422] text-[#ff5252] border border-[#ff174444]">
                            관통 {skPierce}%
                          </span>
                        )}
                        {skDrain > 0 && (
                          <span className="text-[8px] px-1 py-0.2 rounded font-bold bg-[#e91e6322] text-[#ff4081] border border-[#e91e6344]">
                            흡혈 {skDrain}%
                          </span>
                        )}
                      </span>
                      <span className="text-[#38ef7d] font-mono shrink-0">{Math.round((sk.power || 1.0) * 100)}% 위력</span>
                    </div>
                    <div className="text-[10px] text-[#8b9bb4]">{sk.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button className="btn btn-ghost text-xs px-4 py-1.5" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

// ── 용병 상태 행 (높이 10% 축소 최적화 및 롱프레스 정보 지원) ─────────────────
const HeroRow: React.FC<{
  hero: Mercenary;
  gm: GameManager;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onClick: () => void;
  onInspect: (hero: Mercenary) => void;
}> = ({ hero, gm, isCurrentTurn, isSelected, onClick, onInspect }) => {
  const isAlive = hero.currentHp > 0;
  const isDying = !isAlive && !hero.isPermanentlyDead;
  const stats = gm.getHeroEffectiveStats(hero);
  const hpPct = isAlive ? clamp((hero.currentHp / stats.maxHp) * 100, 0, 100) : 0;
  const mpPct = isAlive ? clamp((hero.currentMp / stats.maxMp) * 100, 0, 100) : 0;
  const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === hero.classId);
  const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
    || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
    || (hero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(hero.portraitPromptKey) : undefined)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

  return (
    <LongPressBox
      onLongPress={() => onInspect(hero)}
      onClick={onClick}
      className={`panel px-2.5 py-1 sm:py-1.5 cursor-pointer transition-all select-none relative ${
        hero.isPermanentlyDead
          ? 'opacity-35 grayscale bg-[#0c101a] border-[#18202d] shadow-none'
          : isDying
          ? 'border-[#ff1744] bg-gradient-to-r from-[#2c050d] via-[#1e0811] to-[#120810] shadow-[0_0_16px_rgba(255,23,68,0.55)] animate-pulse'
          : ''
      }`}
      style={{
        borderColor: hero.isPermanentlyDead
          ? '#18202d'
          : isDying
          ? '#ff1744'
          : isCurrentTurn
          ? '#00d2ff'
          : isSelected
          ? '#38ef7d'
          : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#00d2ff55] bg-[#1a2333] flex items-center justify-center relative shadow-xs" style={{ filter: hero.isPermanentlyDead ? 'grayscale(100%)' : undefined }}>
          {customPortrait ? (
            <img
              src={customPortrait}
              alt={hero.name}
              className={`w-full h-full object-cover ${!isAlive ? 'grayscale' : ''}`}
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          ) : cls?.skills[0] ? (
            <GameIcon name={cls.skills[0].id || hero.classId} icon={cls.skills[0].icon ?? '⚔️'} size={18} />
          ) : (
            '⚔️'
          )}
          {isDying && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">
              💀
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {(() => {
            const posMeta = {
              front: { label: '전열', color: '#ef5350' },
              mid:   { label: '중열', color: '#ffd54f' },
              back:  { label: '후열', color: '#42a5f5' },
            }[hero.position || 'mid'];
            return (
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                <span className="font-bold text-xs" style={{ color: hero.isPermanentlyDead ? '#607d8b' : isDying ? '#ff8a80' : undefined, textDecoration: !isAlive ? 'line-through' : undefined }}>{hero.name}</span>
                <span className="text-[10px] text-[#00d2ff] font-medium shrink-0">{cls?.name || hero.classId}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: hero.isPermanentlyDead ? '#607d8b' : isDying ? '#ff5252' : '#ffd54f' }}>Lv.{hero.level}</span>
                <span
                  className="text-[9px] px-1 py-0.2 rounded font-bold"
                  style={{ color: !isAlive ? '#607d8b' : posMeta.color, background: !isAlive ? '#26323822' : `${posMeta.color}22`, border: `1px solid ${!isAlive ? '#26323844' : `${posMeta.color}44`}` }}
                >
                  [{posMeta.label}]
                </span>
                {isAlive && isCurrentTurn && <span className="text-[9px] bg-[#00d2ff22] text-[#00d2ff] px-1 rounded font-bold border border-[#00d2ff44]">▶ 내 턴</span>}
                {isDying && (
                  <span className="text-[10px] text-white bg-[#d50000] border border-[#ff1744] px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_8px_#ff1744] flex items-center gap-1">
                    <span>⚠️ 사경 위기</span>
                    <span className="font-mono bg-black/40 px-1.5 py-0.2 rounded text-[#ffeb3b]">{hero.deathCountdown ?? 3}턴</span>
                  </span>
                )}
                {hero.isPermanentlyDead && (
                  <span className="text-[9px] text-[#b0bec5] bg-[#37474f44] border border-[#546e7a] px-1 rounded font-bold">
                    ⚰️ 영구 사망
                  </span>
                )}
              </div>
            );
          })()}

          {/* 사경 상태일 때 선명한 카운트다운 게이지 / 생존 시 일반 HP/MP 바 */}
          {isDying ? (
            <div className="w-full bg-[#3e0a11] h-4 rounded px-1.5 flex items-center justify-between border border-[#ff174488] my-0.5 shadow-inner">
              <span className="text-[10px] text-[#ff8a80] font-bold flex items-center gap-1">
                <span>💀</span>
                <span>완전 사망 카운트다운</span>
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px] font-black">
                <span className="text-[#ff1744] animate-pulse">● ● ●</span>
                <span className="bg-[#ff1744] px-1.5 py-0.2 rounded text-white font-bold tracking-wider">{hero.deathCountdown ?? 3}턴 남음</span>
              </div>
            </div>
          ) : (
            <>
              <div className="bar-track" style={{ height: 5 }}><div className="bar-fill-hp h-full" style={{ width: `${hpPct}%` }} /></div>
              <div className="bar-track mt-0.5" style={{ height: 4 }}><div className="bar-fill-mp h-full" style={{ width: `${mpPct}%` }} /></div>
            </>
          )}
        </div>
        <div className="text-right text-[10px] text-[#8b9bb4] shrink-0 font-mono flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span style={{ color: hero.isPermanentlyDead ? '#607d8b' : isDying ? '#ff1744' : '#ef5350', fontWeight: isDying ? 'bold' : 'normal' }}>
              {isDying ? `사경 (${hero.deathCountdown ?? 3}턴)` : `${Math.round(hero.currentHp)}/${Math.round(stats.maxHp)}`}
            </span>
            <button
              className="text-[10px] text-[#8b9bb4] hover:text-[#00d2ff] px-0.5"
              title="상세 정보 보기"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(hero);
              }}
            >
              ℹ️
            </button>
          </div>
          <div style={{ color: !isAlive ? '#546e7a' : '#90caf9' }}>{Math.round(hero.currentMp)}/{Math.round(stats.maxMp)}</div>
        </div>
      </div>
      {isAlive && hero.statusEffects.length > 0 && (
        <div className="flex gap-1 mt-0.5 flex-wrap">
          {hero.statusEffects.map((se, i) => {
            const meta = STATUS_EFFECT_META[se.type];
            return (
              <span
                key={i}
                className="text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5 font-bold"
                style={{ background: meta.color + '33', color: meta.color }}
              >
                <GameIcon name={se.type} icon={meta.icon} size={12} />
                <span>{se.turnsLeft}</span>
              </span>
            );
          })}
        </div>
      )}
    </LongPressBox>
  );
};

// ── BattleScreen 메인 ──────────────────────────────────────────────────────
export const BattleScreen: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const { lang, dict } = useI18n();
  useCustomAssetVersion();

  const [monsters, setMonsters] = useState<MonsterState[]>([]);
  const [targetedMonsterIdx, setTargetedMonsterIdx] = useState<number>(0);
  const monstersRef = useRef<MonsterState[]>([]);
  const [turnQueue, setTurnQueue] = useState<{ type: 'hero' | 'monster'; id: string }[]>([]);
  const turnQueueRef = useRef<{ type: 'hero' | 'monster'; id: string }[]>([]);
  const [turnIdx, setTurnIdx] = useState(-1); // 시작 전 상태
  const turnIdxRef = useRef(-1);
  const lastLoggedRoundRef = useRef<number>(0);
  const [selectedHeroIdx, setSelectedHeroIdx] = useState(0);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const isAutoBattleRef = useRef(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | null>(null);
  const [victorySummary, setVictorySummary] = useState<{
    gold: number;
    ether: number;
    guaranteedResource?: { key: string; name: string; icon: string; amount: number };
    exp: number;
    resources: Record<string, number>;
    equipment: EquipmentItem[];
    skillBooks?: SkillBookItem[];
    levelUps: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const battleEndedRef = useRef(false);
  const turnSkippedRef = useRef(false);
  const [heroCooldowns, setHeroCooldowns] = useState<Record<string, number>>({});
  const heroCooldownsRef = useRef<Record<string, number>>({});
  const [showLootModal, setShowLootModal] = useState(false);
  const [selectedSkillForModal, setSelectedSkillForModal] = useState<Skill | null>(null);
  const [inspectedMonster, setInspectedMonster] = useState<MonsterState | null>(null);
  const [inspectedHero, setInspectedHero] = useState<Mercenary | null>(null);
  const [showBossCutscene, setShowBossCutscene] = useState(false);
  const [bossForCutscene, setBossForCutscene] = useState<MonsterData | null>(null);
  const [, setInventoryVersion] = useState(0);
  // 🔥 전술 모멘텀 파티 공유 FEVER 게이지 상태 (0~5 슬롯)
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  feverBadgesRef.current = feverBadges;

  const addFeverBadge = useCallback((badge: FeverBadgeType) => {
    setFeverBadges(prev => {
      let next: FeverBadgeType[];
      if (prev.length >= 5) {
        // 🌟 5개 슬롯 완충 상태에서 새로운 모멘텀 뱃지 획득 시:
        // 맨 앞(가장 오래된) 뱃지를 밀어내고(FIFO 롤링 큐) 새 뱃지를 뒤에 추가하여 최종 버프를 실시간 교체!
        next = [...prev.slice(1), badge];
        triggerHaptic('medium');
      } else {
        next = [...prev, badge];
        if (next.length === 5) {
          triggerHaptic('heavy');
        } else {
          triggerHaptic('light');
        }
      }
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  const handleBossCutsceneComplete = useCallback(() => {
    setShowBossCutscene(false);
    setTimeout(() => advanceTurn(), 100);
  }, []);

  useEffect(() => {
    const onPendingUpdated = () => setInventoryVersion(v => v + 1);
    const onInvUpdated = () => setInventoryVersion(v => v + 1);
    gm.on('pendingLootUpdated', onPendingUpdated);
    gm.on('dungeonInventoryUpdated', onInvUpdated);
    return () => {
      gm.off('pendingLootUpdated', onPendingUpdated);
      gm.off('dungeonInventoryUpdated', onInvUpdated);
      // 전투 화면 이탈(언마운트) 시 채비실 원래 진형으로 복원
      let needEmit = false;
      gm.party.forEach(h => {
        const orig = initialPositionsRef.current[h.id];
        if (orig && h.position !== orig) {
          h.position = orig;
          needEmit = true;
        }
      });
      if (needEmit) {
        gm.emit('partyUpdated', gm.party);
      }
    };
  }, [gm]);

  // 🎯 타겟팅된 몬스터가 사망했을 경우, 생존해 있는 다음 몬스터로 타겟 자동 전환
  useEffect(() => {
    if (monsters.length > 0) {
      const curTarget = monsters[targetedMonsterIdx];
      if (!curTarget || curTarget.currentHp <= 0) {
        const nextAliveIdx = monsters.findIndex(m => m.currentHp > 0);
        if (nextAliveIdx !== -1 && nextAliveIdx !== targetedMonsterIdx) {
          setTargetedMonsterIdx(nextAliveIdx);
        }
      }
    }
  }, [monsters, targetedMonsterIdx]);

  // ── 상태 헬퍼: 피해 적용 로직 (보호막, 방어력 감소 처리, 치명타 배율 반영) ──
  const calculateDamage = (
    rawDmg: number,
    baseDef: number,
    statusEffects: StatusEffect[],
    isCrit: boolean,
    critMultiplier = 1.5,
    piercePct = 0,
    shieldBreakMult = 1,
    isGroggy = false,
    trueDamageRate = 0
  ) => {
    let def = Math.max(0, baseDef);
    if (piercePct > 0) {
      def = Math.round(def * (1 - Math.min(100, Math.max(0, piercePct)) / 100));
    }
    
    // 🔥 화상(burn): 전신 화염으로 방어력 50% 분쇄!
    const hasBurn = (statusEffects || []).some(s => s.type === 'burn');
    if (hasBurn) {
      def = Math.round(def * 0.5);
    }

    // ❄️ 냉각(freeze): 얼음 결정 외피 동결로 방어력 +40% 상승! (행동 불가 대신 방어 유지력 보전)
    const hasFreeze = (statusEffects || []).some(s => s.type === 'freeze');
    if (hasFreeze) {
      def = Math.round(def * 1.4);
    }

    // 🛡️ 방어력 디버프 및 버프 누적 연산
    const defDebuffs = (statusEffects || []).filter(s => s.type === 'debuff_def');
    const totalDefDebuff = defDebuffs.reduce((sum, s) => sum + (s.magnitude || 0), 0);
    if (totalDefDebuff > 0) {
      def = Math.max(0, Math.round(def * (1 - Math.min(0.95, totalDefDebuff))));
    }
    const defBuffs = (statusEffects || []).filter(s => s.type === 'buff_def');
    const totalDefBuff = defBuffs.reduce((sum, s) => sum + (s.magnitude || 0), 0);
    if (totalDefBuff > 0) {
      def = Math.round(def * (1 + totalDefBuff));
    }
    
    const extraCritDmg = isCrit ? Math.max(0, Math.round(rawDmg * (critMultiplier - 1))) : 0;
    let totalAttack = rawDmg + extraCritDmg;

    // 💫 그로기 상태: 받는 피해 +50% 증폭!
    if (isGroggy) {
      totalAttack = Math.floor(totalAttack * 1.5);
    }

    // 🌟 [아이디어 1: K=300 점근형 피해 감소(DR%) 공식]
    // 방어력에 의해 피해가 점근적으로 완만하게 경감 (DEF 300일 때 정확히 50% 반감)
    const K = 300;
    const mitigatedDmg = Math.round(totalAttack * (K / (def + K)));

    // 🗡️ [아이디어 4: 무기 강화 단계 비례 순수 피해 (True Damage)]
    // 1강당 1%, 10강이면 10%의 순수 피해가 방어력을 완전 무시하고 직격
    const trueDamage = trueDamageRate > 0 ? Math.round(totalAttack * Math.min(0.5, trueDamageRate)) : 0;

    // 최종 산출 피해 (최소 1 보장)
    let dmg = Math.max(1, mitigatedDmg + trueDamage);
    const isBlockedByDef = def >= totalAttack * 2.5;

    let absorbed = 0;
    const shield = statusEffects.find(s => s.type === 'shield');
    if (shield && shield.magnitude > 0) {
      const effectiveShieldDmg = Math.round(dmg * shieldBreakMult);
      if (shield.magnitude >= effectiveShieldDmg) {
        absorbed = effectiveShieldDmg;
        shield.magnitude -= effectiveShieldDmg;
        dmg = 0;
      } else {
        absorbed = shield.magnitude;
        dmg = Math.max(1, Math.round(dmg - (shield.magnitude / Math.max(0.1, shieldBreakMult))));
        shield.magnitude = 0;
      }
    }
    // 보호막으로 인해 피해가 완전히 흡수된 경우에만 Block (0 피해)
    const isBlock = Math.round(dmg) <= 0 && absorbed > 0;
    return { actualDamage: Math.round(dmg), absorbed: Math.round(absorbed), isBlock, isBlockedByDef, trueDamage };
  };

  // ── 💥 6대 상태이상 폭발 콤보 체인 (Status Detonation Combo Chain) 판별 ──
  interface DetonationResult {
    triggered: boolean;
    comboName: string;
    icon: string;
    desc: string;
    extraDamage: number;
    bonusLogs: string[];
    bannerColor: string;
  }

  const checkStatusDetonationCombo = (
    attacker: Mercenary,
    targetMon: MonsterState,
    allMonsters: MonsterState[],
    usedSkill: Skill | 'basic',
    baseDamageDealt: number
  ): DetonationResult => {
    const result: DetonationResult = {
      triggered: false,
      comboName: '',
      icon: '',
      desc: '',
      extraDamage: 0,
      bonusLogs: [],
      bannerColor: '#00d2ff'
    };

    if (targetMon.currentHp <= 0) return result;

    const skillTags = getSkillTags(usedSkill);
    const tagIds = skillTags.map(t => t.id);
    const hasTag = (id: string) => tagIds.includes(id);

    const effects = targetMon.statusEffects || [];
    const hasEffect = (type: string) => effects.some(s => s.type === type && s.turnsLeft > 0);
    const findEffect = (type: string) => effects.find(s => s.type === type && s.turnsLeft > 0);

    // 1. ❄️💥 [빙결 분쇄 (Shatter)]: 빙결/기절 + 물리 강타/베기 (crush / slash)
    const freezeEffect = findEffect('freeze') || findEffect('stun');
    if (freezeEffect && (hasTag('crush') || hasTag('slash'))) {
      result.triggered = true;
      result.comboName = '빙결 분쇄 (Shatter)';
      result.icon = '❄️💥';
      result.bannerColor = '#00d2ff';
      result.desc = '빙결된 외피가 산산조각나며 주변 적들에게 얼음 파편 폭풍을 흩뿌립니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.45));
      
      targetMon.statusEffects = effects.filter(s => s !== freezeEffect);
      const splashDmg = Math.max(1, Math.floor(baseDamageDealt * 0.45));
      allMonsters.forEach(otherMon => {
        if (otherMon.id !== targetMon.id && otherMon.currentHp > 0) {
          otherMon.currentHp = Math.max(0, otherMon.currentHp - splashDmg);
          result.bonusLogs.push(`❄️ [빙결 파편 폭풍] ${otherMon.data.name}에게 ${splashDmg} 얼음 파편 피해!`);
        }
      });
      return result;
    }

    // 2. 🩸💥 [과출혈 기폭 (Hemorrhage)]: 출혈 + 참격/관통/저격 (slash / pierce / snipe)
    const bleedEffect = findEffect('bleed');
    if (bleedEffect && (hasTag('slash') || hasTag('pierce') || hasTag('snipe'))) {
      result.triggered = true;
      result.comboName = '과출혈 기폭 (Hemorrhage)';
      result.icon = '🩸💥';
      result.bannerColor = '#ff1744';
      const turns = bleedEffect.turnsLeft || 1;
      const mag = bleedEffect.magnitude || 0.07;
      const burstDmg = Math.max(1, Math.floor(targetMon.maxHp * mag * turns * 1.5));
      result.extraDamage = burstDmg;
      result.desc = `상처가 터져나가며 ${burstDmg}의 과출혈 즉시 폭발 및 공격력이 25% 약화됩니다!`;

      applyStatusEffect(targetMon, {
        type: 'debuff_atk',
        turnsLeft: 2,
        totalTurns: 2,
        magnitude: 0.25,
        source: '과출혈 기폭'
      });
      return result;
    }

    // 3. ☣️💥 [독성 기화 폭발 (Catalytic Venom)]: 중독 + 원소/마법 (magic / elemental)
    const poisonEffect = findEffect('poison');
    if (poisonEffect && hasTag('magic')) {
      result.triggered = true;
      result.comboName = '독성 기화 폭발 (Catalytic Venom)';
      result.icon = '☣️💥';
      result.bannerColor = '#00e676';
      const cap = targetMon.data.type === 'boss' ? 1000 : 99999;
      const venomBurst = Math.min(cap, Math.max(1, Math.floor(targetMon.maxHp * 0.12)));
      result.extraDamage = venomBurst;
      result.desc = `독소가 마력과 격렬히 반응하여 ${venomBurst} 피해를 입히고 모든 적에게 맹독을 전이합니다!`;

      allMonsters.forEach(otherMon => {
        if (otherMon.id !== targetMon.id && otherMon.currentHp > 0) {
          applyStatusEffect(otherMon, {
            type: 'poison',
            turnsLeft: 2,
            totalTurns: 2,
            magnitude: poisonEffect.magnitude || 0.05,
            source: '독성 기화 전이'
          });
          result.bonusLogs.push(`☣️ [맹독 전이] ${otherMon.data.name}에게 2턴간 중독이 전염되었습니다!`);
        }
      });
      return result;
    }

    // 4. 🛡️💔 [자세 붕괴 (Stance Collapse)]: 방어 약화 + 둔기 강타/방패 파쇄 (crush / shield_break)
    const defDebuff = findEffect('debuff_def');
    if (defDebuff && (hasTag('crush') || hasTag('shield_break'))) {
      result.triggered = true;
      result.comboName = '자세 붕괴 (Stance Collapse)';
      result.icon = '🛡️💔';
      result.bannerColor = '#ff9100';
      result.desc = '무너진 방어선을 분쇄하여 1턴간 기절시키고 브레이크 수치를 대량 파쇄합니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.40));

      applyStatusEffect(targetMon, {
        type: 'stun',
        turnsLeft: 1,
        totalTurns: 1,
        magnitude: 0,
        source: '자세 붕괴'
      });

      if (targetMon.chargingState) {
        targetMon.chargingState.remainingBreakDmg -= 150;
        result.bonusLogs.push(`⚡ [브레이크 강타] ${targetMon.data.name}의 차징 게이지를 추가로 150 파쇄했습니다!`);
      }
      return result;
    }

    // 5. ✨⚖️ [신성 정벌 (Divine Retribution)]: 공격 약화 + 신성/빛 (holy)
    const atkDebuff = findEffect('debuff_atk');
    if (atkDebuff && hasTag('holy')) {
      result.triggered = true;
      result.comboName = '신성 정벌 (Divine Retribution)';
      result.icon = '✨⚖️';
      result.bannerColor = '#ffd54f';
      result.desc = '약화된 마물에게 단죄의 일격을 내리고 아군 전체를 시전자 공격력의 25%만큼 치유하며 마나 10을 회복합니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.35));

      const attackerEffectiveStats = gm.getHeroEffectiveStats(attacker);
      const attackerAtk = attackerEffectiveStats.atk || attacker.stats?.atk || 20;
      const healAmt = Math.max(1, Math.floor(attackerAtk * 0.25));
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          h.currentHp = Math.min(h.maxHp, h.currentHp + healAmt);
          h.currentMp = Math.min(h.maxMp, h.currentMp + 10);
        }
      });
      result.bonusLogs.push(`🌟 [신성 원호] 아군 전체 HP +${healAmt} (시전자 공격력의 25%) 치유 및 MP +10 환원!`);
      return result;
    }

    // 6. 🔥🌪️ [화염 폭풍 (Inferno Burst)]: 화상 + 폭풍/바람 (storm)
    const burnEffect = findEffect('burn');
    if (burnEffect && hasTag('storm')) {
      result.triggered = true;
      result.comboName = '화염 폭풍 (Inferno Burst)';
      result.icon = '🔥🌪️';
      result.bannerColor = '#ff6d00';
      const fireBurst = Math.max(1, Math.floor(baseDamageDealt * 0.45));
      result.extraDamage = fireBurst;
      result.desc = `불길에 거센 돌풍이 휘몰아쳐 ${fireBurst}의 폭발을 일으키고 모든 적에게 화상을 전파합니다!`;

      allMonsters.forEach(otherMon => {
        if (otherMon.id !== targetMon.id && otherMon.currentHp > 0) {
          applyStatusEffect(otherMon, {
            type: 'burn',
            turnsLeft: 2,
            totalTurns: 2,
            magnitude: burnEffect.magnitude || 0.08,
            source: '화염 폭풍 확산'
          });
          result.bonusLogs.push(`🔥 [불씨 확산] ${otherMon.data.name}에게 2턴간 화상이 확산되었습니다!`);
        }
      });
      return result;
    }

    // 7. ⚡❄️ [초전도 감전 (Superconduct)]: 빙결/기절 + 뇌격/마법 (lightning / magic)
    if (freezeEffect && (hasTag('lightning') || hasTag('magic'))) {
      result.triggered = true;
      result.comboName = '초전도 감전 (Superconduct)';
      result.icon = '⚡❄️';
      result.bannerColor = '#4fc3f7';
      result.desc = '빙결 표면에 벼락이 격돌하여 마법 저항이 50% 분쇄되고 연쇄 전격이 폭발합니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.40));

      applyStatusEffect(targetMon, {
        type: 'debuff_def',
        turnsLeft: 2,
        totalTurns: 2,
        magnitude: 0.50,
        source: '초전도 저항 분쇄'
      });
      return result;
    }

    // 8. 🎯🩸 [급소 처형 낙인 (Marked Execution)]: 출혈/방어약화 + 저격/관통 (snipe / pierce)
    if ((bleedEffect || defDebuff) && (hasTag('snipe') || hasTag('pierce'))) {
      result.triggered = true;
      result.comboName = '급소 처형 낙인 (Marked Execution)';
      result.icon = '🎯🩸';
      result.bannerColor = '#e040fb';
      result.desc = '약점이 노출된 적의 급소를 정확히 저격하여 100% 방어 무시 치명타를 꽂아넣었습니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.60));
      return result;
    }

    // 9. 🔮🩸 [암흑 피의 섭취 (Blood Feast)]: 출혈 + 암흑/흡혈 (dark / drain)
    if (bleedEffect && (hasTag('dark') || hasTag('drain'))) {
      result.triggered = true;
      result.comboName = '암흑 피의 섭취 (Blood Feast)';
      result.icon = '🔮🩸';
      result.bannerColor = '#880e4f';
      result.desc = '출혈 중인 상처에서 피의 마력을 강탈하여 아군 전체에 수호 방벽을 둘렀습니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.35));

      const shieldVal = Math.max(1, Math.floor(result.extraDamage * 0.60));
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(shieldVal * 0.5));
        }
      });
      result.bonusLogs.push(`🛡️ [피의 수호막] 아군 전체에게 활력 회복 파동 전개!`);
      return result;
    }

    // 10. ✨🔥 [성염 융화 (Holy Conflagration)]: 화상 + 신성 (holy)
    if (burnEffect && hasTag('holy')) {
      result.triggered = true;
      result.comboName = '성염 융화 (Holy Conflagration)';
      result.icon = '✨🔥';
      result.bannerColor = '#ffb300';
      result.desc = '불타는 마물에게 신성한 정화의 불길이 폭발하여 대상의 공격력을 정화하고 큰 피해를 입힙니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.45));

      applyStatusEffect(targetMon, {
        type: 'debuff_atk',
        turnsLeft: 2,
        totalTurns: 2,
        magnitude: 0.30,
        source: '성염 정화'
      });
      return result;
    }

    // 11. 🔨☣️ [신경 마비 충격 (Neuro Paralysis)]: 중독 + 강타 (crush)
    if (poisonEffect && hasTag('crush')) {
      result.triggered = true;
      result.comboName = '신경 마비 충격 (Neuro Paralysis)';
      result.icon = '🔨☣️';
      result.bannerColor = '#76ff03';
      result.desc = '체내에 퍼진 맹독 부위를 둔기로 강타하여 신경계를 마비시키고 1턴간 완전히 기절시켰습니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.35));

      applyStatusEffect(targetMon, {
        type: 'stun',
        turnsLeft: 1,
        totalTurns: 1,
        magnitude: 0,
        source: '신경 마비'
      });
      return result;
    }

    // 12. ⚡🌪️ [뇌폭 폭풍 (Thunder Tempest)]: 빙결/기절 + 폭풍 (storm)
    if (freezeEffect && hasTag('storm')) {
      result.triggered = true;
      result.comboName = '뇌폭 폭풍 (Thunder Tempest)';
      result.icon = '⚡🌪️';
      result.bannerColor = '#00e5ff';
      result.desc = '무력화된 적에게 뇌운 돌풍이 소환되어 모든 적을 휩쓰는 뇌폭 파동을 일으킵니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.35));

      const stormDmg = Math.max(1, Math.floor(baseDamageDealt * 0.35));
      allMonsters.forEach(otherMon => {
        if (otherMon.id !== targetMon.id && otherMon.currentHp > 0) {
          otherMon.currentHp = Math.max(0, otherMon.currentHp - stormDmg);
          result.bonusLogs.push(`🌪️ [뇌폭 회오리] ${otherMon.data.name}에게 ${stormDmg} 폭풍 피해!`);
        }
      });
      return result;
    }

    // 13. 🛡️💥 [산성 외골격 융해 (Acidic Meltdown)]: 중독 + 방패 파쇄 (shield_break)
    if (poisonEffect && hasTag('shield_break')) {
      result.triggered = true;
      result.comboName = '산성 외골격 융해 (Acidic Meltdown)';
      result.icon = '🛡️💥';
      result.bannerColor = '#cddc39';
      result.desc = '독산이 외골격을 녹여내려 방어력을 50% 분쇄하고 극심한 산성 피해를 입힙니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.35));

      applyStatusEffect(targetMon, {
        type: 'debuff_def',
        turnsLeft: 3,
        totalTurns: 3,
        magnitude: 0.50,
        source: '산성 부식'
      });
      return result;
    }

    // 14. 💫🗡️ [그림자 처형 기습 (Shadow Cull)]: 기절/공격약화 + 베기/저격 (slash / snipe)
    if ((freezeEffect || atkDebuff) && (hasTag('slash') || hasTag('snipe'))) {
      result.triggered = true;
      result.comboName = '그림자 처형 기습 (Shadow Cull)';
      result.icon = '💫🗡️';
      result.bannerColor = '#673ab7';
      result.desc = '무력화된 틈을 타 암살 일격을 가해 치명적 처형 피해를 입히고 시전자가 은신 태세에 돌입합니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.50));
      return result;
    }

    // 15. 💀⚖️ [영혼 분리 흡수 (Soul Harvest)]: 공격 약화 + 암흑/흡혈 (dark / drain)
    if (atkDebuff && (hasTag('dark') || hasTag('drain'))) {
      result.triggered = true;
      result.comboName = '영혼 분리 흡수 (Soul Harvest)';
      result.icon = '💀⚖️';
      result.bannerColor = '#311b92';
      result.desc = '약화된 적의 영혼 정수를 갈취하여 30% 피해를 가하고 시전자의 마나를 25 회복했습니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.30));

      attacker.currentMp = Math.min(attacker.maxMp, attacker.currentMp + 25);
      result.bonusLogs.push(`🔮 [영혼 정수] ${attacker.name}의 MP가 25 회복되었습니다!`);
      return result;
    }

    // 16. 🔥💥 [열압력 열폭 (Thermal Compression)]: 화상 + 강타/방패파쇄 (crush / shield_break)
    if (burnEffect && (hasTag('crush') || hasTag('shield_break'))) {
      result.triggered = true;
      result.comboName = '열압력 열폭 (Thermal Compression)';
      result.icon = '🔥💥';
      result.bannerColor = '#ff3d00';
      result.desc = '불타는 적을 둔기로 내리찍어 열압력 폭발을 일으켜 주변 적들에게도 불꽃 파편을 날립니다!';
      result.extraDamage = Math.max(1, Math.floor(baseDamageDealt * 0.40));

      const compDmg = Math.max(1, Math.floor(baseDamageDealt * 0.35));
      allMonsters.forEach(otherMon => {
        if (otherMon.id !== targetMon.id && otherMon.currentHp > 0) {
          otherMon.currentHp = Math.max(0, otherMon.currentHp - compDmg);
          result.bonusLogs.push(`💥 [열압력 파편] ${otherMon.data.name}에게 ${compDmg} 화염 파편 피해!`);
        }
      });
      return result;
    }

    return result;
  };

  const [isBossBattle, setIsBossBattle] = useState(false);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [skillCutIn, setSkillCutIn] = useState<{
    id: string;
    skillName: string;
    icon: string;
    isEnemy: boolean;
    bannerType?: 'skill' | 'assist' | 'extra' | 'guard' | 'counter' | 'detonation' | 'break' | 'fever';
    heroName?: string;
    subText?: string;
    quote?: string;
    isWeaknessPursuit?: boolean;
    feverSynergyName?: string;
    feverColor?: string;
    feverBg?: string;
    feverBorderColor?: string;
  } | null>(null);
  // 🌟 채비실/원정대에서 조율했던 전투 시작 전 원래 진형 스냅샷 보존
  const initialPositionsRef = useRef<Record<string, 'front' | 'mid' | 'back'>>({});
  const [showFullLogModal, setShowFullLogModal] = useState(false);
  const [screenFlash, setScreenFlash] = useState<'ally' | 'enemy' | null>(null);
  // 👾 마물 공격 돌진 연출 상태 (공격 중인 몬스터 ID)
  const [attackingMonsterId, setAttackingMonsterId] = useState<string | null>(null);

  const triggerScreenShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }, []);

  const triggerVFX = useCallback((event: Omit<VFXEvent, 'id'>) => {
    const id = `vfx_${Date.now()}_${Math.random()}`;
    const newVfx: VFXEvent = { ...event, id };
    setVfxList(prev => [...prev, newVfx]);
    if (event.isCrit) {
      triggerHaptic('critical');
    }
    if (event.isCrit || event.type === 'heavy_slash' || event.type === 'claw') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  }, []);

  // ── 🎯 피아 타겟별 체력 바 상단 VFX 위치 계산 헬퍼 ────────────────────────
  const getMonsterVfxPos = useCallback((monsterIdx: number, totalMonsters?: number, isSingleTarget = false) => {
    // 🌟 단일 타겟 공격(기본 공격, 단일 스킬)의 경우 화면 중앙의 몬스터 일러스트 패널 중심(X: 50%, Y: 16%)을 정타겟
    if (isSingleTarget || totalMonsters === 1) {
      return { x: 50, y: 16 };
    }
    const total = Math.max(1, totalMonsters ?? monstersRef.current.length ?? 1);
    const safeIdx = Math.max(0, Math.min(monsterIdx, total - 1));
    const padPct = 3.5;
    const availableWidth = 100 - (padPct * 2);
    const slotWidth = availableWidth / total;
    // 각 몬스터 슬롯의 정확한 수평 중심 X%
    const x = padPct + slotWidth * (safeIdx + 0.5);
    // 몬스터 체력 게이지 및 카드 상단 Y% (약 26%)
    const y = 26;
    return { x, y };
  }, []);

  const getHeroVfxPos = useCallback((heroIdx: number, isEnemyTurn = false, totalHeroes?: number) => {
    const total = Math.max(1, totalHeroes ?? gm.party.length ?? 1);
    const safeIdx = Math.max(0, Math.min(heroIdx, total - 1));
    // 아군 영웅 행(HeroRow) 체력 바 중심 X% (약 50%)
    const x = 50;
    // 🌟 스킬 패널 개폐 여부에 따른 Y 좌표 보정:
    // - 적군 턴(isEnemyTurn=true): 아군 스킬 패널이 닫혀서 파티 영역이 최하단으로 내려감 (Y: 79% ~ 91%)
    // - 아군 턴(isEnemyTurn=false): 하단에 스킬 패널이 열려 있어서 파티 영역이 중간에 위치 (Y: 62% ~ 74%)
    const baseY = isEnemyTurn ? 79 : 62;
    const gapY = isEnemyTurn ? 5.8 : 5.2;
    const y = baseY + (safeIdx * gapY);
    return { x, y };
  }, [gm.party.length]);

  const handleFinishVFX = useCallback((id: string) => {
    setVfxList(prev => prev.filter(v => v.id !== id));
  }, []);


  const hasInitializedRef = useRef(false);
  const guardianShieldUsedRef = useRef<Record<string, boolean>>({});
  const endureUsedRef = useRef<Record<string, boolean>>({});
  const valkyrieReviveUsedRef = useRef<Record<string, boolean>>({});
  const lastTickedTurnIdxRef = useRef<number>(-1);

  // ── 전투 초기화 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    gm.sortPartyByPosition();
    gm.syncAllHeroesStats();
    const party = gm.party;

    // 🌟 채비실에서 조율했던 원래 진형 스냅샷 저장
    const origPosSnapshot: Record<string, 'front' | 'mid' | 'back'> = {};
    party.forEach(h => {
      origPosSnapshot[h.id] = h.position || 'mid';
    });
    initialPositionsRef.current = origPosSnapshot;
    // 탐험에서 부여받은 버프/디버프(여신의 가호, 여신의 저주, 출혈 등) 보존
    party.forEach(h => {
      if (!Array.isArray(h.statusEffects)) h.statusEffects = [];
    });

    // 🌀 전투 스냅샷 복원 체크 (3분 이내 복귀 하이브리드 세션)
    const battleSnap = gm.getBattleSnapshot();
    if (
      battleSnap &&
      Array.isArray(battleSnap.monsters) &&
      battleSnap.monsters.length > 0 &&
      battleSnap.monsters.some((m: any) => m.currentHp > 0) &&
      Array.isArray(battleSnap.turnQueue) &&
      battleSnap.turnQueue.length > 0 &&
      typeof battleSnap.turnIdx === 'number' &&
      battleSnap.turnIdx >= 0
    ) {
      console.log('[BattleScreen] 이전 전투 세션 복원:', battleSnap);
      const restoredMonsters = battleSnap.monsters.map((m: any) => {
        const isEnraged = m.isEnraged || m.data?.name?.includes('광폭화') || m.data?.name?.includes('광폭');
        let cleanName = (m.data?.name || '')
          .replace(/\[\s*(정예\s*)?광폭화?\s*\]/g, '')
          .replace(/\[\s*무간의\s*광폭\s*보스\s*\]/g, '')
          .replace(/\[\s*정예\s*\]/g, '')
          .trim();
        return {
          ...m,
          isEnraged,
          data: { ...m.data, name: cleanName }
        };
      });
      monstersRef.current = restoredMonsters;
      setMonsters(restoredMonsters);
      setTargetedMonsterIdx(battleSnap.targetedMonsterIdx ?? 0);
      turnQueueRef.current = battleSnap.turnQueue;
      setTurnQueue(battleSnap.turnQueue);
      isAutoBattleRef.current = !!battleSnap.isAutoBattle;
      setIsAutoBattle(!!battleSnap.isAutoBattle);
      heroCooldownsRef.current = battleSnap.heroCooldowns || {};
      setHeroCooldowns(battleSnap.heroCooldowns || {});
      const hasBoss = !!battleSnap.isBossBattle;
      setIsBossBattle(hasBoss);
      setBattleEnded(false);
      setBattleResult(null);
      battleEndedRef.current = false;
      isProcessingRef.current = false;
      lastLoggedRoundRef.current = Math.floor(Math.max(0, battleSnap.turnIdx) / Math.max(1, battleSnap.turnQueue.length)) + 1;

      // 영웅 체력/마나/상태이상 복원
      if (Array.isArray(battleSnap.party)) {
        battleSnap.party.forEach((sp: any) => {
          const h = gm.party.find(p => p.id === sp.id);
          if (h) {
            h.currentHp = sp.currentHp;
            h.currentMp = sp.currentMp;
            if (Array.isArray(sp.statusEffects)) h.statusEffects = sp.statusEffects;
          }
        });
        gm.emit('partyUpdated');
      }

      // 이미 이 턴에서 틱 처리가 끝났으므로 중복 틱 방지
      lastTickedTurnIdxRef.current = battleSnap.turnIdx;
      turnIdxRef.current = battleSnap.turnIdx;
      setTurnIdx(battleSnap.turnIdx);

      // 영웅 턴인 경우 해당 영웅 선택 보장
      const curTurn = battleSnap.turnQueue[battleSnap.turnIdx % battleSnap.turnQueue.length];
      if (curTurn && curTurn.type === 'hero') {
        const hIdx = gm.party.findIndex(h => h.id === curTurn.id);
        if (hIdx !== -1) setSelectedHeroIdx(hIdx);
      }

      SoundManager.getInstance().playBgm(hasBoss ? 'boss' : 'battle');
      gm.addLog(`🔄 [전투 재개] 중단되었던 전투 세션(턴 ${battleSnap.turnIdx + 1})을 이어서 진행합니다.`, 'system');
      return;
    }

    const hasBoss = gm.currentMonsters.some(m => m.type === 'boss');
    setIsBossBattle(hasBoss);

    // 🌟 보스 몬스터가 포함되어 있는 경우 항상 가장 후열(배열의 마지막 슬롯)에 배치되도록 정렬 보장
    const sortedMonsters = [...gm.currentMonsters].sort((a, b) => {
      if (a.type === 'boss' && b.type !== 'boss') return 1;
      if (a.type !== 'boss' && b.type === 'boss') return -1;
      return 0;
    });

    const initMonsters: MonsterState[] = sortedMonsters.map((md, idx) => {
      const isOvc = gm.isOvercharged || md.name.includes('광폭화') || md.name.includes('광폭');
      const mult = isOvc ? 1.3 : 1.0;
      // 🌟 이름 정제: [광폭화], [정예] 태그를 텍스트에서 완전히 제거 (상단 ELITE / 광폭화 뱃지로 표시)
      let cleanName = md.name
        .replace(/\[\s*(정예\s*)?광폭화?\s*\]/g, '')
        .replace(/\[\s*무간의\s*광폭\s*보스\s*\]/g, '')
        .replace(/\[\s*정예\s*\]/g, '')
        .trim();

      return {
        id: `mon_${idx}_${Date.now()}`,
        data: { ...md, name: cleanName },
        maxHp: Math.floor(md.maxHp * mult),
        currentHp: Math.floor(md.maxHp * mult),
        atk: Math.floor(md.atk * mult),
        def: Math.floor(md.def * mult),
        spd: Math.floor(md.spd * mult),
        luck: Math.floor((md.luck || 10) * (isOvc ? 1.2 : 1.0)),
        statusEffects: [],
        isEnraged: isOvc,
      };
    });

    monstersRef.current = initMonsters;
    setMonsters(initMonsters);
    setBattleEnded(false);
    setBattleResult(null);
    isProcessingRef.current = false;
    battleEndedRef.current = false;
    turnSkippedRef.current = false;
    isAutoBattleRef.current = false;
    heroCooldownsRef.current = {};
    setHeroCooldowns({});
    setShowLootModal(false);
    gm.clearBattleLogs();
    lastLoggedRoundRef.current = 0;

    const entries: { type: 'hero' | 'monster'; id: string; spd: number }[] = [
      ...party.map(h => ({ type: 'hero' as const, id: h.id, spd: gm.getHeroEffectiveStats(h).spd })),
      ...initMonsters.map(m => ({ type: 'monster' as const, id: m.id, spd: m.spd })),
    ];
    entries.sort((a, b) => b.spd - a.spd);
    const q = entries.map(e => ({ type: e.type, id: e.id }));
    turnQueueRef.current = q;
    setTurnQueue(q);

    // 💖 영혼의 결속 (Bond 100) 체크: 유대 100 달성자 MP 30% 회복 (파티 전원 상호 최대 유대 시 50% 회복)
    let isAllPartyFullBond = party.length >= 2;
    if (isAllPartyFullBond) {
      for (let i = 0; i < party.length; i++) {
        for (let j = i + 1; j < party.length; j++) {
          if (gm.getBond(party[i].id, party[j].id) < 100) {
            isAllPartyFullBond = false;
            break;
          }
        }
        if (!isAllPartyFullBond) break;
      }
    }

    if (isAllPartyFullBond) {
      party.forEach(h => {
        const recoverMp = Math.round(h.maxMp * 0.5);
        h.currentMp = Math.min(h.maxMp, h.currentMp + recoverMp);
      });
      gm.addLog(`✨ [영혼의 결속] 파티 전원이 상호 최고조 유대(Bond 100)를 달성하여 특별 공명 보너스로 마나(MP)가 50% 회복된 상태로 전투를 시작합니다!`, 'reward');
    } else {
      const soulboundHeroes = party.filter(h => {
        return party.some(p => p.id !== h.id && gm.getBond(h.id, p.id) >= 100);
      });
      if (soulboundHeroes.length > 0) {
        soulboundHeroes.forEach(h => {
          const recoverMp = Math.round(h.maxMp * 0.3);
          h.currentMp = Math.min(h.maxMp, h.currentMp + recoverMp);
        });
        const names = soulboundHeroes.map(h => h.name).join(', ');
        gm.addLog(`✨ [영혼의 결속] 최고조 유대를 맺은 [${names}]의 마나(MP)가 30% 회복된 상태로 전투를 시작합니다!`, 'reward');
      }
    }

    // 🌟 [원정대 시너지] 전투 개시 시 보호막(startBattleShieldPct) 적용
    const activeSynergies = gm.getActiveSynergies();
    activeSynergies.forEach(syn => {
      if (syn.buffs.startBattleShieldPct) {
        const shieldPct = syn.buffs.startBattleShieldPct;
        const shieldTurns = syn.buffs.startBattleShieldTurns || 3;
        party.forEach(h => {
          const shieldAmt = Math.max(1, Math.round(h.maxHp * shieldPct));
          applyStatusEffect(h, {
            type: 'shield',
            turnsLeft: shieldTurns,
            totalTurns: shieldTurns,
            magnitude: shieldAmt,
            source: syn.name
          });
        });
        const turnText = syn.buffs.startBattleShieldTurns ? ` (전투 첫 ${syn.buffs.startBattleShieldTurns}턴 한정)` : '';
        gm.addLog(`🛡️ [${syn.name}] 파티 전체에 최대 HP의 ${Math.round(shieldPct * 100)}% 전투 개시 보호막 전개!${turnText}`, 'reward');
      }
    });

    // 👑 [보스 3세트 완성 효과] 전투 개시 효과 적용
    party.forEach(h => {
      const bossSet = getHeroEquippedBossSet(h);
      if (!bossSet) return;
      if (bossSet.effectType === 'barrier') {
        const shieldAmt = Math.max(1, Math.round(h.maxHp * 0.25));
        applyStatusEffect(h, {
          type: 'shield',
          turnsLeft: 5,
          totalTurns: 5,
          magnitude: shieldAmt,
          source: bossSet.setName
        });
        gm.addLog(`👑 [${bossSet.setName}] ${h.name}에게 최대 HP의 25%(🛡️${shieldAmt}) 거암 결계 보호막 전개!`, 'reward');
      } else if (bossSet.effectType === 'buff_def_crit') {
        gm.addLog(`👑 [${bossSet.setName}] ${h.name}에게 침묵의 주시(방어력+15%, 행운+10) 상시 활성!`, 'reward');
      } else if (bossSet.effectType === 'asmodeus_wrath') {
        gm.addLog(`👑 [${bossSet.setName}] ${h.name}에게 종말의 심연 군주 권능(올스탯 +30%) 발현!`, 'reward');
      }
    });

    // 🛡️ [방어구 강화 에테르 방벽 시스템] 1강당 최대 HP의 2% 에테르 방벽 자동 전개 (10강 = 최대 HP의 20% 보호막)
    party.forEach(h => {
      const armor = h.equipment?.armor;
      const armorEnhance = armor?.enhanceLevel || 0;
      if (armorEnhance > 0 && h.currentHp > 0) {
        const barrierPct = armorEnhance * 0.02; // 1강당 2% (10강 = 20%)
        const barrierAmt = Math.max(1, Math.round(h.maxHp * barrierPct));
        applyStatusEffect(h, {
          type: 'shield',
          turnsLeft: 5,
          totalTurns: 5,
          magnitude: barrierAmt,
          source: `+${armorEnhance}강 에테르 방벽`
        });
        gm.addLog(`🛡️✨ [+${armorEnhance}강 방어구] ${h.name}에게 최대 HP의 ${Math.round(barrierPct * 100)}%(🛡️${barrierAmt}) 에테르 방벽 전개!`, 'reward');
      }
    });

    guardianShieldUsedRef.current = {};
    endureUsedRef.current = {};
    setFeverBadges([]);
    feverBadgesRef.current = [];

    const isBossBattle = sortedMonsters.some(m => m.type === 'boss');
    SoundManager.getInstance().playBgm(isBossBattle ? 'boss' : 'battle');
    gm.addLog(`⚔️ [전투 개시] 속도순 턴 시작`, 'danger');
    if (gm.isOvercharged) {
      gm.addLog('💀⚡ [심연 오버차지] 광폭화 결계 발동! 결전 중 철수할 수 없습니다! (EXP +30%, 전리품 +50%)', 'danger');
    }
    
    // 👑 보스 몬스터 조우 시 시네마틱 오버레이 컷씬 재생 후 턴 진행, 일반 전투는 즉시 턴 시작
    const mainBossData = sortedMonsters.find(m => m.type === 'boss');
    if (mainBossData) {
      setBossForCutscene(mainBossData);
      setShowBossCutscene(true);
    } else {
      setTimeout(() => advanceTurn(), 100);
    }
  }, []);

  // 🔄 전투 종료 시 채비실에서 조율했던 원래 진형으로 복원하는 헬퍼
  const restoreOriginalPositions = useCallback(() => {
    let restored = false;
    gm.party.forEach(h => {
      const orig = initialPositionsRef.current[h.id];
      if (orig && h.position !== orig) {
        h.position = orig;
        restored = true;
      }
    });
    if (restored) {
      gm.emit('partyUpdated', gm.party);
    }
  }, [gm]);

  // ⚡ [전투 속도 제어 헬퍼]: 자동 전투 시 모든 대기/연출 딜레이를 1.5배 가속
  const getBattleDelay = useCallback((ms: number) => {
    return isAutoBattleRef.current ? Math.max(35, Math.round(ms / 1.5)) : ms;
  }, []);

  const checkBattleOutcome = useCallback((currentMonsters: MonsterState[]) => {
    if (battleEndedRef.current) return true;
    // 🛡️ [NaN 방어]: 몬스터 및 아군 체력이 NaN이 되는 예외 상황을 0으로 교정
    currentMonsters.forEach(m => {
      if (isNaN(m.currentHp)) m.currentHp = 0;
    });
    gm.party.forEach(h => {
      if (isNaN(h.currentHp)) h.currentHp = 0;
    });
    const allMonstersDown = currentMonsters.every(m => m.currentHp <= 0);
    const allHeroesDown = gm.party.every(h => h.currentHp <= 0);

    if (allMonstersDown) {
      battleEndedRef.current = true;
      isProcessingRef.current = true;
      setIsProcessing(true);

      const delayMs = getBattleDelay(450); // 전투 종료 승리 완료 체크 시간 절반 단축 (900ms -> 450ms, 자동전투 시 300ms)
      setTimeout(() => {
        restoreOriginalPositions();
        setBattleEnded(true);
        setBattleResult('win');
        gm.clearBattleSnapshot();
        SoundManager.getInstance().play('victory');
        
        const isBoss = currentMonsters.some(m => m.data.type === 'boss');
        if (isBoss) {
          gm.portalAppeared = true;
        }

        // 🌟 전체 몬스터 편대 보상 통합 정산 (최대 4종류 자원 엄격 제한 적용)
        const res = gm.claimSquadBattleRewards(currentMonsters.map(m => m.data));

        setVictorySummary({
          gold: res.gold,
          ether: res.ether,
          guaranteedResource: res.guaranteedResource,
          exp: res.exp,
          resources: res.resources,
          equipment: res.equipment,
          skillBooks: res.skillBooks,
          levelUps: res.levelUps
        });

        const gRes = res.guaranteedResource;
        const gResText = gRes ? `${gRes.icon} ${gRes.amount} ${gRes.name}` : `✨ ${res.ether} 에테르`;
        gm.addLog(`🎉 전투 승리! (획득: 🪙 ${res.gold}G, ${gResText}, ⚔️ ${res.exp} EXP)`, 'reward');
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, delayMs);
      return true;
    } else if (allHeroesDown) {
      battleEndedRef.current = true;
      isProcessingRef.current = true;
      setIsProcessing(true);

      const delayMs = getBattleDelay(375); // 전투 종료 패배 완료 체크 시간 절반 단축 (750ms -> 375ms, 자동전투 시 250ms)
      setTimeout(() => {
        restoreOriginalPositions();
        setBattleEnded(true);
        setBattleResult('lose');
        gm.clearBattleSnapshot();
        SoundManager.getInstance().play('defeat');
        gm.addLog('💀 전투 패배...', 'danger');
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, delayMs);
      return true;
    }
    return false;
  }, [gm, restoreOriginalPositions, getBattleDelay]);

  // ── 🌀 전투 실시간 세션 스냅샷 저장 ──────────────────────────────────
  const persistBattleSnapshot = useCallback((overrideTurnIdx?: number) => {
    if (battleEndedRef.current) return;
    const q = turnQueueRef.current;
    if (!q || q.length === 0) return;
    const currentIdx = overrideTurnIdx !== undefined ? overrideTurnIdx : turnIdxRef.current;
    if (currentIdx < 0) return;

    gm.saveBattleSnapshot({
      monsters: monstersRef.current,
      targetedMonsterIdx,
      turnQueue: q,
      turnIdx: currentIdx,
      heroCooldowns: heroCooldownsRef.current,
      isAutoBattle: isAutoBattleRef.current,
      isBossBattle,
      party: gm.party.map(h => ({
        id: h.id,
        name: h.name,
        currentHp: h.currentHp,
        currentMp: h.currentMp,
        maxHp: h.maxHp,
        maxMp: h.maxMp,
        statusEffects: h.statusEffects || [],
      }))
    });
  }, [gm, targetedMonsterIdx, isBossBattle]);

  // ── 턴 진행 로직 (상태이상 틱 처리 및 라운드 전환 보호막 만료 처리) ─────────
  const advanceTurn = useCallback(() => {
    if (battleEndedRef.current) return;

    // 🌟 [안전망] 턴 전환 시 모든 몬스터가 쓰러졌다면 즉시 전투 승리 처리하고 턴 진행 중단
    if (monstersRef.current.length > 0 && monstersRef.current.every(m => m.currentHp <= 0)) {
      checkBattleOutcome(monstersRef.current);
      return;
    }
    // 🌟 [안전망] 파티 전원 사망 시 즉시 패배 처리
    if (gm.party.every(h => h.currentHp <= 0)) {
      checkBattleOutcome(monstersRef.current);
      return;
    }

    const q = turnQueueRef.current;
    if (q.length === 0) return;
    
    let nextIdx = turnIdxRef.current + 1;
    let attempts = 0;

    // 🌟 이미 사망한 액터(영웅/몬스터)는 턴 로그 없이 건너뛰며 다음 살아있는 액터의 인덱스를 탐색
    while (attempts < q.length) {
      // 🚩 [돌격 배수진] 첫 라운드(전투 첫 턴 큐 순환) 종료 시점에 1턴 한정 보호막 만료
      if (nextIdx === q.length) {
        let expiredCount = 0;
        gm.party.forEach(h => {
          if (h.statusEffects) {
            const beforeLen = h.statusEffects.length;
            h.statusEffects = h.statusEffects.filter(se => {
              if (se.type === 'shield' && se.source?.includes('돌격 배수진')) {
                return false;
              }
              return true;
            });
            if (h.statusEffects.length < beforeLen) expiredCount++;
          }
        });
        if (expiredCount > 0) {
          gm.addLog('🚩 [돌격 배수진] 전투 첫 턴(1라운드)이 종료되어 돌격 보호막이 소멸했습니다.', 'normal');
        }
      }

      // 💀 [사경 카운트다운] 라운드(참가자 전원 1턴 순환)가 지날 때마다 사경 상태인 영웅의 남은 턴 1 감소
      if (nextIdx > 0 && nextIdx % q.length === 0) {
        gm.party.forEach(h => {
          if (h.currentHp <= 0 && !h.isPermanentlyDead) {
            if (h.deathCountdown === undefined) {
              h.deathCountdown = 3;
            }
            h.deathCountdown -= 1;
            if (h.deathCountdown <= 0) {
              h.isPermanentlyDead = true;
              gm.addLog(`⚰️ [영면] 차가운 심연의 바닥에서 ${h.name} 대원의 맥박이 완전히 멎었습니다... 동료의 영혼이 영겁의 어둠 속으로 흩어집니다.`, 'danger');
            } else {
              gm.addLog(`💀 [임종의 위기] ${h.name} 대원의 호흡이 옅어지고 심장 박동이 희미해져 갑니다! 남은 시간이 얼마 없습니다!`, 'danger');
            }
          }
        });
      }

      const candidate = q[nextIdx % q.length];
      if (!candidate) break;

      const isDead = candidate.type === 'hero'
        ? (gm.party.find(h => h.id === candidate.id)?.currentHp ?? 0) <= 0
        : (monstersRef.current.find(m => m.id === candidate.id)?.currentHp ?? 0) <= 0;

      if (!isDead) {
        break; // 살아있는 액터 발견
      }

      nextIdx++;
      attempts++;
    }

    turnIdxRef.current = nextIdx;
    setTurnIdx(nextIdx);
    persistBattleSnapshot(nextIdx);
  }, [persistBattleSnapshot, gm, checkBattleOutcome]);

  // ── 턴 시작 시 로직 (상태이상 발동 및 결빙/기절 행동불가 턴 스킵 완벽 제어) ──
  useEffect(() => {
    if (turnIdxRef.current < 0 || battleEndedRef.current) return;

    // 🌟 [안전망] 턴 시작 시 모든 몬스터 처치 완료 여부 즉시 검사
    if (monstersRef.current.length > 0 && monstersRef.current.every(m => m.currentHp <= 0)) {
      checkBattleOutcome(monstersRef.current);
      return;
    }

    const q = turnQueueRef.current;
    const currentTurn = q[turnIdxRef.current % q.length];
    if (!currentTurn) return;

    // 🌟 이미 사망한 액터는 턴 로그 출력 없이 즉시 advanceTurn
    const isActorDead = currentTurn.type === 'hero'
      ? (gm.party.find(h => h.id === currentTurn.id)?.currentHp ?? 0) <= 0
      : (monstersRef.current.find(m => m.id === currentTurn.id)?.currentHp ?? 0) <= 0;

    if (isActorDead) {
      if (checkBattleOutcome(monstersRef.current)) return;
      advanceTurn();
      return;
    }

    if (lastTickedTurnIdxRef.current === turnIdxRef.current) {
      if (currentTurn.type === 'hero') {
        const heroIdx = gm.party.findIndex(h => h.id === currentTurn.id);
        if (heroIdx !== -1) {
          setSelectedHeroIdx(heroIdx);
        }
      }
      return;
    }
    lastTickedTurnIdxRef.current = turnIdxRef.current;

    const roundNum = Math.floor(turnIdxRef.current / Math.max(1, q.length)) + 1;
    const totalTurnNum = turnIdxRef.current + 1;

    // 턴의 주인 이름 판정 (영웅 또는 몬스터)
    let actorName = '';
    if (currentTurn.type === 'hero') {
      const hero = gm.party.find(h => h.id === currentTurn.id);
      actorName = hero ? hero.name : '아군 영웅';
    } else {
      const mon = monstersRef.current.find(m => m.id === currentTurn.id);
      actorName = mon ? mon.data.name : '적 몬스터';
    }

    // 🚩 라운드 시작 뱃지 로그 (사망 액터 스킵으로 0번 인덱스를 지나쳐도 새 라운드 1회 정상 출력)
    if (lastLoggedRoundRef.current !== roundNum) {
      lastLoggedRoundRef.current = roundNum;
      gm.addLog(`🚩 ${roundNum}라운드`, 'round_divider', 'battle', {
        round: roundNum,
        turn: totalTurnNum,
        actorName,
      });
    }

    // ⏳ 매 턴 시작 로그 (살아있는 대상의 턴만 기록)
    gm.addLog(`⏳ [${actorName}] (${totalTurnNum}턴)`, 'turn_divider', 'battle', {
      round: roundNum,
      turn: totalTurnNum,
      actorName,
    });

    turnSkippedRef.current = false;
    let shouldSkipTurn = false;
    const logs: string[] = [];

    // 대상 찾기 및 틱 처리
    if (currentTurn.type === 'hero') {
      const heroIdx = gm.party.findIndex(h => h.id === currentTurn.id);
      if (heroIdx !== -1) {
        const hero = gm.party[heroIdx];
        if (hero.currentHp <= 0) {
          advanceTurn();
          return;
        }
        
        // 턴 영웅 자동 선택!
        setSelectedHeroIdx(heroIdx);

        const heroPos = getHeroVfxPos(heroIdx, true, gm.party.length);
        const heroSkipReasons: string[] = [];

        hero.statusEffects = hero.statusEffects.filter(se => {
          if (se.type === 'freeze') {
            const dot = Math.max(1, Math.round(hero.maxHp * 0.04));
            hero.currentHp = Math.max(0, hero.currentHp - dot);
            logs.push(`${hero.name} ❄️[동상] 최대 HP 4% 결빙 동상 피해 (-${dot}) [방어력 +40%]`);
            heroSkipReasons.push('❄️ 빙결');
            shouldSkipTurn = true;
            SoundManager.getInstance().play('ice');
            triggerVFX({ type: 'status_freeze', x: heroPos.x, y: heroPos.y, damage: dot, statusEffect: 'freeze' });
          } else if (se.type === 'bleed') {
            const dot = Math.max(1, Math.round(hero.maxHp * 0.07));
            hero.currentHp = Math.max(0, hero.currentHp - dot);
            logs.push(`${hero.name} 🩸[출혈] 최대 HP 7% 지속 피해 (-${dot}) [공격력 -40%]`);
            triggerVFX({ type: 'status_bleed', x: heroPos.x, y: heroPos.y, damage: dot, statusEffect: 'bleed' });
          } else if (se.type === 'poison') {
            const dot = Math.max(1, Math.round(hero.maxHp * 0.14));
            hero.currentHp = Math.max(0, hero.currentHp - dot);
            logs.push(`${hero.name} ☠️[맹독] 최대 HP 14% 치명적 중독 피해 (-${dot}) [최대 DoT]`);
            triggerVFX({ type: 'status_poison', x: heroPos.x, y: heroPos.y, damage: dot, statusEffect: 'poison' });
          } else if (se.type === 'burn') {
            const dot = Math.max(1, Math.round(hero.maxHp * 0.08));
            hero.currentHp = Math.max(0, hero.currentHp - dot);
            logs.push(`${hero.name} 🔥[화상] 최대 HP 8% 화염 피해 (-${dot}) [방어력 -50%]`);
            triggerVFX({ type: 'status_burn', x: heroPos.x, y: heroPos.y, damage: dot, statusEffect: 'burn' });
          } else if (se.type === 'regen') {
            const heal = Math.max(1, Math.round(hero.maxHp * 0.08));
            hero.currentHp = Math.min(hero.maxHp, hero.currentHp + heal);
            logs.push(`${hero.name} 💚[재생] 체력 회복 (+${heal})`);
            triggerVFX({ type: 'holy_heal', x: heroPos.x, y: heroPos.y, damage: heal, isHeal: true });
          } else if (se.type === 'stun') {
            heroSkipReasons.push('💫 기절');
            shouldSkipTurn = true;
            SoundManager.getInstance().play('stun');
            triggerVFX({ type: 'status_stun', x: heroPos.x, y: heroPos.y, statusEffect: 'stun' });
          }
          // 🚩 돌격 배수진의 1턴 보호막은 영웅 턴 시작 시 즉시 차감 소멸되지 않고 첫 라운드(1턴) 동안 피해를 온전히 흡수 (라운드 1 종료 시 만료)
          if (se.type === 'shield' && se.source?.includes('돌격 배수진')) {
            return se.magnitude > 0;
          }
          se.turnsLeft -= 1;
          return se.turnsLeft > 0 && (se.type !== 'shield' || se.magnitude > 0);
        });

        // ⚠️ 행동 불가 사유 명시 로그 출력
        if (shouldSkipTurn && heroSkipReasons.length > 0) {
          logs.push(`⚠️ [행동 불가] ${hero.name}이(가) [${heroSkipReasons.join(', ')}] 상태로 인해 아무 행동도 하지 못하고 턴을 넘깁니다.`);
        }

        // 🌟 [원정대 시너지] 매 턴 지속 체력 회복(hpRegenPct) 및 마나 회복(mpRegenPerTurn) 처리
        const activeSynergies = gm.getActiveSynergies();
        let totalSynergyRegen = 0;
        let totalSynergyMpRegen = 0;
        const regenSynNames: string[] = [];
        const mpRegenSynNames: string[] = [];
        activeSynergies.forEach(syn => {
          if (syn.buffs.hpRegenPct) {
            totalSynergyRegen += syn.buffs.hpRegenPct;
            regenSynNames.push(syn.name);
          }
          if (syn.buffs.mpRegenPerTurn) {
            totalSynergyMpRegen += syn.buffs.mpRegenPerTurn;
            mpRegenSynNames.push(syn.name);
          }
        });
        if (totalSynergyRegen > 0 && hero.currentHp > 0 && hero.currentHp < hero.maxHp) {
          const synHeal = Math.max(1, Math.round(hero.maxHp * totalSynergyRegen));
          hero.currentHp = Math.min(hero.maxHp, hero.currentHp + synHeal);
          logs.push(`✨ [${regenSynNames.join(', ')}] ${hero.name} 시너지 체력 회복 (+${synHeal})`);
        }
        if (totalSynergyMpRegen > 0 && hero.currentHp > 0 && hero.currentMp < hero.maxMp) {
          const actualGained = Math.min(hero.maxMp - hero.currentMp, totalSynergyMpRegen);
          if (actualGained > 0) {
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualGained);
            logs.push(`💧 [${mpRegenSynNames.join(', ')}] ${hero.name} 시너지 마나 회복 (+${actualGained} MP)`);
          }
        }
        // 🌀 [클래스 고유 패시브] 턴 시작 자동 마나 회복
        if (hero.classId === 'apprentice' && hero.currentHp > 0 && hero.currentMp < hero.maxMp) {
          const actualGained = Math.min(hero.maxMp - hero.currentMp, 5);
          if (actualGained > 0) {
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualGained);
            logs.push(`🌀 [마나 순환] ${hero.name} 고유 패시브 마나 회복 (+${actualGained} MP)`);
          }
        }
        if ((hero.classId === 'chronomancer' || hero.classId === 'chrono_master') && hero.currentHp > 0 && hero.currentMp < hero.maxMp) {
          const actualGained = Math.min(hero.maxMp - hero.currentMp, 15);
          if (actualGained > 0) {
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualGained);
            logs.push(`⏳ [차원 조율] ${hero.name} 고유 패시브 마나 회복 (+${actualGained} MP)`);
          }
        }
        // ✝️ [전투 사제 / 성전 심판관 패시브: 전투 신앙] 턴 시작 시 5% 확률로 파티 전체 치유
        if ((hero.classId === 'war_priest' || hero.classId === 'warpriest' || hero.classId === 'crusader_lord' || hero.classId === 'crusade_judge') && hero.currentHp > 0 && Math.random() < 0.05) {
          const healAmt = Math.max(1, Math.floor(hero.maxHp * 0.20));
          gm.party.filter(p => p.currentHp > 0).forEach(p => {
            p.currentHp = Math.min(p.maxHp, p.currentHp + healAmt);
          });
          logs.push(`✝️✨ [전투 신앙 기적] ${hero.name}의 신앙으로 파티 전원 체력 +${healAmt} 치유!`);
        }
        // 👑 [보스 세트 효과] 턴 시작 MP 회복
        const heroBossSet = getHeroEquippedBossSet(hero);
        if (heroBossSet?.effectType === 'mana_regen_spd' && hero.currentHp > 0 && hero.currentMp < hero.maxMp) {
          const actualGained = Math.min(hero.maxMp - hero.currentMp, 15);
          if (actualGained > 0) {
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualGained);
            logs.push(`🌀 [${heroBossSet.setName}] 시공 왜곡장 발동: ${hero.name} 마나 즉시 회복 (+${actualGained} MP)`);
          }
        }
        if (heroBossSet?.effectType === 'asmodeus_wrath' && hero.currentHp > 0) {
          const qLen = turnQueueRef.current.length || 1;
          const currentRound = Math.floor(turnIdxRef.current / qLen) + 1;
          if (currentRound > 0 && currentRound % 3 === 0) {
            logs.push(`🪐 [${heroBossSet.setName}] 종말의 심연 폭발! 모든 적에게 광역 파멸 피해!`);
            monstersRef.current.forEach(m => {
              if (m.currentHp > 0) {
                const blastDmg = Math.max(10, Math.round(m.maxHp * 0.15));
                m.currentHp = Math.max(0, m.currentHp - blastDmg);
                logs.push(`💥 ${m.data.name} 심연 파멸타격 (-${blastDmg})`);
              }
            });
          }
        }

        if (shouldSkipTurn) {
          const nextCooldowns = { ...heroCooldownsRef.current };
          Object.keys(nextCooldowns).forEach(k => {
            if (k.startsWith(hero.id + '_') && nextCooldowns[k] > 0) {
              nextCooldowns[k] = Math.max(0, nextCooldowns[k] - 1);
            }
          });
          heroCooldownsRef.current = nextCooldowns;
          setHeroCooldowns(nextCooldowns);
        }

        if (logs.length > 0) gm.emit('partyUpdated');

        if (hero.currentHp <= 0) {
          hero.currentHp = 0;
          hero.statusEffects = [];
          triggerHaptic('heroDeath');
          logs.push(`💀 [사망] ${hero.name}이(가) 지속 피해로 쓰러졌습니다!`);
          gm.emit('partyUpdated');
          if (logs.length > 0) {
            setTimeout(() => logs.forEach(msg => gm.addLog(msg, 'system')), 0);
          }
          if (checkBattleOutcome(monstersRef.current)) return;
          advanceTurn();
          return;
        }
      }
    } else {
      let currentMonsters = [...monstersRef.current];
      const mIdx = currentMonsters.findIndex(m => m.id === currentTurn.id);
      if (mIdx !== -1) {
        const m = currentMonsters[mIdx];
        if (m.currentHp <= 0) {
          if (checkBattleOutcome(currentMonsters)) return;
          advanceTurn();
          return;
        }

        let hpChanged = false;
        const monPos = getMonsterVfxPos(mIdx, currentMonsters.length, currentMonsters.length === 1);
        const monSkipReasons: string[] = [];

        m.statusEffects = m.statusEffects.filter(se => {
          if (se.type === 'freeze') {
            const dot = Math.max(1, Math.round(m.maxHp * 0.04));
            m.currentHp = Math.max(0, m.currentHp - dot);
            logs.push(`${m.data.name} ❄️[동상] 최대 HP 4% 결빙 동상 지속 피해 (-${dot}) [방어력 +40%]`);
            monSkipReasons.push('❄️ 빙결');
            shouldSkipTurn = true;
            hpChanged = true;
            SoundManager.getInstance().play('ice');
            triggerVFX({
              type: 'status_freeze',
              x: monPos.x,
              y: monPos.y,
              damage: dot,
              isCrit: false,
              statusEffect: 'freeze',
            });
          } else if (se.type === 'bleed') {
            const dot = Math.max(1, Math.round(m.maxHp * 0.07));
            m.currentHp = Math.max(0, m.currentHp - dot);
            logs.push(`${m.data.name} 🩸[출혈] 최대 HP 7% 지속 피해 (-${dot}) [공격력 -40%]`);
            hpChanged = true;
            triggerVFX({
              type: 'status_bleed',
              x: monPos.x,
              y: monPos.y,
              damage: dot,
              isCrit: false,
              statusEffect: 'bleed',
            });
          } else if (se.type === 'poison') {
            const dot = Math.max(1, Math.round(m.maxHp * 0.14));
            m.currentHp = Math.max(0, m.currentHp - dot);
            logs.push(`${m.data.name} ☠️[맹독] 최대 HP 14% 치명적 중독 피해 (-${dot}) [최대 DoT]`);
            hpChanged = true;
            triggerVFX({
              type: 'status_poison',
              x: monPos.x,
              y: monPos.y,
              damage: dot,
              isCrit: false,
              statusEffect: 'poison',
            });
          } else if (se.type === 'burn') {
            const dot = Math.max(1, Math.round(m.maxHp * 0.08));
            m.currentHp = Math.max(0, m.currentHp - dot);
            logs.push(`${m.data.name} 🔥[화상] 최대 HP 8% 화염 피해 (-${dot}) [방어력 -50%]`);
            hpChanged = true;
            triggerVFX({
              type: 'status_burn',
              x: monPos.x,
              y: monPos.y,
              damage: dot,
              isCrit: false,
              statusEffect: 'burn',
            });
          } else if (se.type === 'regen') {
            const heal = Math.max(1, Math.round(m.maxHp * 0.08));
            m.currentHp = Math.min(m.maxHp, m.currentHp + heal);
            logs.push(`${m.data.name} 💚[재생] 체력 회복 (+${heal})`);
            hpChanged = true;
            triggerVFX({
              type: 'holy_heal',
              x: monPos.x,
              y: monPos.y,
              damage: heal,
              isHeal: true,
            });
          } else if (se.type === 'stun') {
            monSkipReasons.push('💫 기절');
            shouldSkipTurn = true;
            SoundManager.getInstance().play('stun');
            triggerVFX({
              type: 'status_stun',
              x: monPos.x,
              y: monPos.y,
              statusEffect: 'stun',
            });
          }
          se.turnsLeft -= 1;
          return se.turnsLeft > 0 && (se.type !== 'shield' || se.magnitude > 0);
        });

        // ⚠️ 행동 불가 사유 명시 로그 출력
        if (shouldSkipTurn && monSkipReasons.length > 0) {
          logs.push(`⚠️ [행동 불가] ${m.data.name}이(가) [${monSkipReasons.join(', ')}] 상태로 인해 아무 행동도 하지 못하고 턴을 넘깁니다.`);
        }
        
        if (hpChanged) {
          monstersRef.current = currentMonsters;
          setMonsters(currentMonsters);
        }

        if (m.currentHp <= 0) {
          m.currentHp = 0;
          m.statusEffects = [];
          logs.push(`💀 [사망] ${m.data.name}이(가) 지속 피해로 쓰러졌습니다!`);
          monstersRef.current = currentMonsters;
          setMonsters(currentMonsters);
          if (logs.length > 0) {
            setTimeout(() => logs.forEach(msg => gm.addLog(msg, 'system')), 0);
          }
          if (checkBattleOutcome(currentMonsters)) return;
          advanceTurn();
          return;
        }
      }
    }

    if (logs.length > 0) {
      setTimeout(() => logs.forEach(msg => gm.addLog(msg, 'system')), 0);
    }

    if (checkBattleOutcome(monstersRef.current)) return;

    persistBattleSnapshot();

    if (shouldSkipTurn) {
      turnSkippedRef.current = true;
      isProcessingRef.current = true;
      setIsProcessing(true);

      const skipTimer = setTimeout(() => {
        if (battleEndedRef.current) return;
        turnSkippedRef.current = false;
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (!checkBattleOutcome(monstersRef.current)) {
          advanceTurn();
        }
      }, 900);
      return () => clearTimeout(skipTimer);
    }
  }, [turnIdx, persistBattleSnapshot]);


  // 🌟 [스킬/원호/추가타 컷인 배너 자동 해제 안전 타이머]: 오버레이 연출 잔류 및 화면 멈춤 원천 방지
  useEffect(() => {
    if (!skillCutIn) return;
    const timer = setTimeout(() => {
      setSkillCutIn(null);
    }, getBattleDelay(850));
    return () => clearTimeout(timer);
  }, [skillCutIn?.id, getBattleDelay]);

  // ── 스킬/공격 실행 ──────────────────────────────────────────────────
  const executeSkill = useCallback((hero: Mercenary, skillInput: Skill | 'basic', targetMonsterIdx: number) => {
    try {
      if (isProcessingRef.current || battleEndedRef.current || turnSkippedRef.current) return;
      if (hero.currentHp <= 0) return;
      const hasCC = (hero.statusEffects || []).some(se => se.type === 'freeze' || se.type === 'stun');
      if (hasCC || turnSkippedRef.current) {
        gm.addLog(`${hero.name}은(는) 결빙/기절 상태이므로 행동할 수 없습니다!`, 'danger');
        return;
      }

    let skill = skillInput;
    const weaponEnchantSkill = hero.equipment?.weapon?.prefix?.grantedSkill;
    const isEnchantBasicTrigger = skillInput === 'basic' && Boolean(weaponEnchantSkill);
    if (skillInput === 'basic' && weaponEnchantSkill) {
      const weaponCost = gm.getSkillManaCost(weaponEnchantSkill.manaCost, undefined, hero);
      if (hero.currentMp >= weaponCost) {
        skill = weaponEnchantSkill;
      } else {
        skill = 'basic';
        gm.addLog(`💧 [마나 부족] ${hero.name}의 마나가 부족하여 [${weaponEnchantSkill.name}] 대신 기본 공격을 시전합니다.`, 'normal');
      }
    }

    const isEnchantSkill = skill !== 'basic' && (
      skill.id?.startsWith('skill_enc_') ||
      Boolean(hero.equipment?.weapon?.prefix?.grantedSkill?.id === skill.id)
    );
    // 기본 공격이거나, 인챈트로 인해 기본 공격이 스킬로 대체된 액션인지 여부
    const isBasicOrEnchantBasic = skill === 'basic' || isEnchantBasicTrigger || isEnchantSkill;

    let requiredMp = skill !== 'basic' ? gm.getSkillManaCost(skill.manaCost, undefined, hero) : 0;
    if (skill !== 'basic' && hero.currentMp < requiredMp) {
      gm.addLog(`MP가 부족합니다! (필요 MP: ${requiredMp}, 보유 MP: ${hero.currentMp})`, 'danger');
      return;
    }

    if (skill !== 'basic') {
      const cdLeft = heroCooldownsRef.current[`${hero.id}_${skill.id}`] || 0;
      if (cdLeft > 0) {
        gm.addLog(`[쿨다운 중] ${skill.name}은(는) 아직 재사용할 수 없습니다! (남은 쿨다운: ${cdLeft}턴)`, 'danger');
        return;
      }
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    
    // 📚 [비전 학자 패시브: 지식의 힘] 15% 확률로 마나 소모 없이 시전
    let isFreeCast = false;
    if (skill !== 'basic' && (hero.classId === 'arcane_scholar' || hero.classId === 'scholar') && Math.random() < 0.15) {
      isFreeCast = true;
      gm.addLog(`📚✨ [지식의 힘] ${hero.name}의 비전 지식으로 마나 소모 없이 [${skill.name}]을(를) 시전합니다! (소모 MP 0)`, 'reward');
    }

    if (skill !== 'basic' && !isFreeCast) hero.currentMp -= requiredMp;

    const stats = gm.getHeroEffectiveStats(hero);
    let critChance = gm.getCritChance(stats.luck);
    let heroCritMult = stats.critDmg + (stats.luck * 0.005);

    // 🔥 [궁극기 판정 및 전술 모멘텀 FEVER 시너지 연동]
    // ⚠️ 인챈트 스킬은 절대로 궁극기로 취급되지 않으며, 피버 게이지는 오직 캐릭터 본연의 궁극기에만 터집니다.
    const isUltimate = !isEnchantSkill && skill !== 'basic' && (
      Boolean(skill.name?.includes('궁극기')) ||
      Boolean(skill.id?.endsWith('_ultimate')) ||
      Object.values(CHARACTER_CLASSES).some(c => c.specialSkill?.id === skill.id)
    );

    let feverSynergy: FeverSynergyResult | null = null;
    if (isUltimate) {
      const currentBadges = [...feverBadgesRef.current];
      if (currentBadges.length >= 5) {
        feverSynergy = evaluateFeverSynergy(currentBadges, gm.party);
        // FEVER 뱃지 소모 및 게이지 초기화
        setFeverBadges([]);
        feverBadgesRef.current = [];
        gm.addLog(`🔥⚡ [FEVER 궁극기 폭발] ${hero.name}의 궁극기에 【${feverSynergy.name}】 시너지 방출! - ${feverSynergy.summary.replace(/\([^)]*\)/g, '').trim()}`, 'reward');
        SoundManager.getInstance().play('fever_burst');
        triggerHaptic('heavy');
      }
    }

    if (feverSynergy) {
      critChance += (feverSynergy.critRateBonus * 100);
      heroCritMult += feverSynergy.critDamageBonus;
    }

    const qLen = turnQueueRef.current?.length || 1;
    const currentRound = Math.floor(Math.max(0, turnIdxRef.current) / qLen) + 1;

    // 🎯 [치명타 관련 클래스 패시브]
    if (hero.classId === 'rogue' && currentRound === 1) {
      critChance = 100;
    }
    if (hero.classId === 'gunner' && hero.position === 'back') {
      critChance += 15;
    }
    if (hero.classId === 'ghost_sniper' && hero.position === 'back') {
      critChance += 25;
      heroCritMult += 0.50;
    }
    if (hero.classId === 'shadow_phantom') {
      heroCritMult += 0.80;
    }

    // ✨ [신성 마법 특성: 치명타율 +30%]
    const magicSchool = skill === 'basic' ? undefined : getSkillMagicSchool(skill);
    if (magicSchool === 'holy') {
      critChance += 30;
      gm.addLog(`✨ [신성 마법] 성광의 축복으로 치명타 확률이 +30% 상승합니다! (치명타율: ${Math.min(100, Math.round(critChance))}%)`, 'story');
    }

    const current = monstersRef.current;
    const logs: string[] = [];
    const posBonus = skill === 'basic' ? undefined : (skill.positionBonus || getEffectivePositionBonus(skill));
    let cooldownReductionTarget: 'none' | 'self' | 'all' = 'none';
    let resetAllPartyCooldowns = false;

    // 효과 적용 대상 선정 (피아 식별 무결성 보장)
    let targetIds: string[] = [];
    const isEnemySkill = skill === 'basic' || 
      skill.targetType === 'all_enemies' || 
      skill.targetType === 'single_enemy' ||
      skill.id === 'duel_blade_waltz' ||
      ['damage', 'bleed', 'stun', 'debuff', 'drain', 'poison'].includes(skill.effectType || '') ||
      !['all_allies', 'single_ally', 'self'].includes(skill.targetType || '');

    if (isEnemySkill) {
      const isAoeAttack = (skill !== 'basic' && (
        skill.targetType === 'all_enemies' ||
        skill.id === 'duel_blade_waltz' ||
        (skill.description && (
          skill.description.includes('전체') ||
          skill.description.includes('모든 적') ||
          skill.description.includes('적 일렬') ||
          skill.description.includes('광역')
        ) && !skill.targetType?.includes('allies') && !['skill_boss_chrono_warp', 'skill_boss_blood_monarch'].includes(skill.id))
      )) || Boolean(feverSynergy?.isForceAoe);

      if (isAoeAttack) {
        // 적 전체 광역 공격 (환영 난무 왈츠 등): 살아있는 모든 몬스터 타겟팅
        targetIds = current.filter(m => m.currentHp > 0).map(m => m.id);
        if (targetIds.length === 0 && current.length > 0) {
          const first = current.find(m => m.currentHp > 0);
          if (first) targetIds.push(first.id);
        }
      } else {
        // 단일 적 대상 공격
        if (posBonus === 'front') {
          if (targetMonsterIdx < 2 && current[targetMonsterIdx] && current[targetMonsterIdx].currentHp > 0) {
            targetIds.push(current[targetMonsterIdx].id);
          } else {
            const aliveFront = current.find((m, idx) => idx < 2 && m.currentHp > 0);
            if (aliveFront) {
              targetIds.push(aliveFront.id);
            } else {
              const first = current.find(m => m.currentHp > 0);
              if (first) targetIds.push(first.id);
            }
          }
        } else if (posBonus === 'back') {
          if (targetMonsterIdx >= 2 && current[targetMonsterIdx] && current[targetMonsterIdx].currentHp > 0) {
            targetIds.push(current[targetMonsterIdx].id);
          } else {
            const aliveBack = current.find((m, idx) => idx >= 2 && m.currentHp > 0);
            if (aliveBack) {
              targetIds.push(aliveBack.id);
            } else {
              const first = current.find(m => m.currentHp > 0);
              if (first) targetIds.push(first.id);
            }
          }
        } else {
          if (current[targetMonsterIdx] && current[targetMonsterIdx].currentHp > 0) {
            targetIds.push(current[targetMonsterIdx].id);
          } else {
            const first = current.find(m => m.currentHp > 0);
            if (first) targetIds.push(first.id);
          }
        }
      }
    }

    // 🌟 스킬 공격일 경우 화면을 가로지르는 스킬 컷인 배너 실행 (FEVER 궁극기 폭발 시 전용 극적 연출 적용)
    const isSkillAttack = skill !== 'basic';
    if (skill !== 'basic') {
      if (feverSynergy) {
        const isTacticalBurst = feverSynergy.id === 'tactical_burst';
        const cleanSummary = feverSynergy.summary.replace(/\([^)]*\)/g, '').trim();
        setSkillCutIn({
          id: String(Date.now()),
          skillName: skill.name,
          icon: feverSynergy.icon.split(' ')[0] || skill.icon || '🔥',
          isEnemy: false,
          bannerType: 'fever',
          heroName: hero.name,
          subText: isTacticalBurst ? '전술 파동 발동' : `${feverSynergy.name} ${cleanSummary}`.trim(),
          feverSynergyName: feverSynergy.name,
          feverColor: feverSynergy.color,
          feverBg: feverSynergy.bg,
          feverBorderColor: feverSynergy.borderColor,
          quote: isTacticalBurst ? '전술 파동 발동!' : `${feverSynergy.name} 발동!`
        });
      } else {
        setSkillCutIn({
          id: String(Date.now()),
          skillName: skill.name,
          icon: skill.icon || '⚔️',
          isEnemy: false,
        });
      }
    }

    const delayMs = feverSynergy ? 650 : isSkillAttack ? 380 : 0;

    setTimeout(() => {
      try {
        // 1. 공격 스킬 / 기본 공격 처리
      const effectType = skill === 'basic' ? 'damage' : skill.effectType;
      let nextMonsters = [...monstersRef.current];
      let anyCritLanded = false;

      if (effectType === 'damage' || effectType === 'bleed' || effectType === 'stun' || effectType === 'debuff' || effectType === 'drain' || effectType === 'poison') {
        const skillName = skill === 'basic' ? '기본 공격' : skill.name;

        // 🌟 [실명(Blind) 및 명중률 저하에 따른 아군 공격 빗나감 (MISS) 판정 - 행운으로 완화]
        const heroBlind = hero.statusEffects?.find(s => s.type === 'blind');
        if (heroBlind) {
          const blindPenalty = Math.max(0.15, (heroBlind.magnitude || 0.50) - (stats.luck * 0.003));
          const targetFirstIdx = targetIds.length > 0 ? nextMonsters.findIndex(m => m.id === targetIds[0]) : targetMonsterIdx;
          const isSingle = targetIds.length <= 1;
          const missPos = getMonsterVfxPos(targetFirstIdx >= 0 ? targetFirstIdx : targetMonsterIdx, nextMonsters.length, isSingle);
          if (Math.random() < blindPenalty) {
            triggerVFX({
              type: 'evade',
              x: missPos.x,
              y: missPos.y,
              damage: 0,
              text: '💨 MISS',
            });
            SoundManager.getInstance().play('evade');
            logs.push(`💨 [빗나감 / MISS] 실명 상태인 ${hero.name}의 시야가 가려져 [${skillName}] 공격이 빗나갔습니다!`);
            setTimeout(() => { logs.forEach(msg => gm.addLog(msg, 'danger')); }, 0);
            setTimeout(() => {
              setSkillCutIn(null);
              if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
              isProcessingRef.current = false;
              setIsProcessing(false);
            }, isSkillAttack ? 400 : 300);
            return;
          }
        }

        let powerMultiplier = skill === 'basic' ? 1.0 : (skill.power || 1.0);
        // 🔥 [궁극기 FEVER 시너지 배율 적용]: 기존 레벨 곱연산 공식 폐기 및 FEVER 시너지 위력 배율 반영
        if (isUltimate && feverSynergy) {
          powerMultiplier = Number((powerMultiplier * feverSynergy.powerMult).toFixed(2));
        }
        let finalAtk = stats.atk;

        // ⚔️ [공격력 관련 클래스 패시브]
        if (hero.classId === 'vanguard' && hero.currentHp <= hero.maxHp * 0.5) {
          finalAtk = Math.floor(finalAtk * 1.25); // 용병 검사: 체력 50% 이하 시 공격력 25% 증가
        }
        if ((hero.classId === 'crusader_lord' || hero.classId === 'crusade_judge') && (hero.position === 'front' || (hero.position as string) === 'vanguard')) {
          finalAtk = Math.floor(finalAtk * 1.30); // 성전의 심판관: 전열 배치 시 공격력 30% 증폭
        }
        if (hero.classId === 'iron_marshal') {
          finalAtk = Math.floor(finalAtk * 1.20); // 철혈의 패황: 기본 공격력 20% 추가 상승
        }

        if (stats.damageBonus > 0) {
          finalAtk = Math.floor(finalAtk * (1 + stats.damageBonus / 100));
        }
        const atkBuff = hero.statusEffects.find(s => s.type === 'buff_atk');
        if (atkBuff) finalAtk = Math.floor(finalAtk * (1 + atkBuff.magnitude));
        const atkDebuffs = hero.statusEffects.filter(s => s.type === 'debuff_atk');
        const totalAtkDebuff = atkDebuffs.reduce((sum, s) => sum + (s.magnitude || 0), 0);
        if (totalAtkDebuff > 0) finalAtk = Math.max(1, Math.floor(finalAtk * (1 - Math.min(0.85, totalAtkDebuff))));
        
        let efficiency = 1.0;
        if (skill !== 'basic') {
          let skillAffinity: string[] | undefined = undefined;
          const bookDef = ALL_SKILL_BOOKS.find(sb => sb.skill.id === skill.id || sb.id === skill.id);
          if (bookDef?.affinity) {
            skillAffinity = bookDef.affinity;
          } else if ((skill as any).affinity) {
            skillAffinity = (skill as any).affinity;
          } else if (hero.equippedSkillBooks) {
            const eb = hero.equippedSkillBooks.find((b: any) => b.skill?.id === skill.id || b.bookId === skill.id || b.id === skill.id);
            if (eb?.affinity) skillAffinity = eb.affinity;
          }

          const heroRole = CHARACTER_CLASSES[hero.classId]?.role;
          const isAffinityMatch = checkSkillAffinityMatch(skillAffinity, heroRole, hero.classId);
          if (!isAffinityMatch) {
            efficiency = 0.5;
            const affMeta = getSkillAffinityMeta(skillAffinity);
            logs.push(`⚠️ [계열 부조화] ${hero.name}의 클래스와 맞지 않는 [${affMeta.name}] 스킬로 인해 위력이 50% 반감됩니다!`);
          }
        }
        
        let rawDmg = Math.floor(finalAtk * powerMultiplier * efficiency);
        // 광역 공격(다수 타겟) 시 분산 감쇠 보정 (과도한 전체 피해 폭증 억제)
        if (targetIds.length > 1) {
          rawDmg = Math.floor(rawDmg * 0.85);
        }

        // 👥 [은신 기습 일격 (Stealth Strike)]: 은신 상태에서 공격 시 대미지 폭증 (+70%~100%) 및 은신 해제
        const stealthEffect = (hero.statusEffects || []).find(se => se.type === 'stealth');
        if (stealthEffect) {
          const stealthBonus = stealthEffect.magnitude || 0.70;
          rawDmg = Math.floor(rawDmg * (1 + stealthBonus));
          logs.push(`👥⚡ [은신 기습 일격] ${hero.name}이(가) 그림자 은신 상태에서 기습 공격을 감행하여 위력이 ${Math.round(stealthBonus * 100)}% 폭증했습니다!`);
          hero.statusEffects = (hero.statusEffects || []).filter(se => se.type !== 'stealth');
        }

        // 신성 스킬 판정
        const isHolySkill = skill !== 'basic' && (
          skill.id === 'acolyte_smite' ||
          skill.id === 'paladin_judgment' ||
          skill.id === 'valk_spear' ||
          skill.id === 'warpriest_smite_crusade' ||
          skill.id === 'skill_epic_aegis_judgment' ||
          skill.id === 'skill_epic_divine_grace' ||
          (skill.name && skill.name.includes('신성')) ||
          (skill.description && skill.description.includes('신성'))
        );

        // 스킬별 티어 계산 (기본=0, 1차승격=1, 2차각성/특수기=2)
        const heroClassTier = CHARACTER_CLASSES[hero.classId]?.tier ?? 0;
        const skillTier: 0 | 1 | 2 = skill === 'basic' ? 0 : ((skill.isSpecial || skill.power >= 2.0 || heroClassTier >= 2) ? 2 : (heroClassTier >= 1 ? 1 : 0));

        // 🌟 [광역기 분기 판정]: 대상이 2체 이상이거나 광역 스킬인 경우 광역 전용 VFX로 매핑
        const isMultiTargetAttack = targetIds.length > 1 || (skill !== 'basic' && (
          skill.targetType === 'all_enemies' ||
          skill.id === 'duel_blade_waltz' ||
          (Boolean(skill.description) && (
            skill.description.includes('전체') ||
            skill.description.includes('모든 적') ||
            skill.description.includes('적 일렬') ||
            skill.description.includes('광역')
          ) && !skill.targetType?.includes('allies') && !['skill_boss_chrono_warp', 'skill_boss_blood_monarch'].includes(skill.id))
        ));

        // 🌟 스킬 태그 및 클래스 기반 통합 VFX/SFX 1:1 결정
        const resolvedCombatPair = resolveCombatVfxAndSfx(skill, hero, isMultiTargetAttack, skillTier);
        let vfxType: VFXType = resolvedCombatPair.vfx;

        let anyHitLanded = false;
        const hitReports: string[] = [];

        // 🌟 [흡혈(Life Steal / Drain) 스킬 판정]
        const isDrainSkill = skill !== 'basic' && (
          skill.effectType === 'drain' ||
          (skill.description && (skill.description.includes('흡혈') || skill.description.includes('생명력 흡수') || skill.description.includes('피해의 일부')))
        );

        let anyDied = false;
        let totalActualDamageDealt = 0;
        let aetherMeisterMpCharged = false;
        let assistAttackTriggered = false;
        const hasAliveFront = nextMonsters.slice(0, 2).some(mon => mon.currentHp > 0);

        nextMonsters = nextMonsters.map(m => {
          if (!targetIds.includes(m.id)) return m;
          const mIdx = nextMonsters.findIndex(mon => mon.id === m.id);
          const isSingle = targetIds.length <= 1;
          const monPos = getMonsterVfxPos(mIdx, nextMonsters.length, isSingle);
          
          // 🌟 [행운 기반 적중 & 회피 판정]: 공격자 행운(+0.2%) vs 방어자 회피보정(-0.3%, 최대 70% 캡)
          const monsterEvadeBonus = Math.min(70, ((m.luck || 10) * 0.3));
          const hitChance = clamp(90 + (stats.luck * 0.2) - monsterEvadeBonus, 30, 99);
          if (Math.random() * 100 > hitChance) {
            triggerVFX({
              type: 'evade',
              x: monPos.x,
              y: monPos.y,
              damage: 0,
              text: '💨 EVADE',
            });
            SoundManager.getInstance().play('evade');
            logs.push(`💨 [회피 / EVADE] ${m.data.name}이(가) 높은 행운(🍀${m.luck})으로 ${hero.name}의 [${skillName}] 공격을 회피했습니다!`);
            return m;
          }

          anyHitLanded = true;

          // 🏷️ [무기 계열 고유 특성 분석 (검: 베기, 창: 방어 파쇄, 활: 급소, 총: 연사, 단검: 암습, 지팡이: 공명)]
          const heroWpn = hero.equipment?.weapon;
          const heroWpnTrait = heroWpn ? (heroWpn.weaponTrait || getWeaponTrait(heroWpn)) : undefined;
          const isSword = heroWpnTrait?.weaponType === 'sword';
          const isSpear = heroWpnTrait?.weaponType === 'spear';
          const isBow = heroWpnTrait?.weaponType === 'bow';
          const isGun = heroWpnTrait?.weaponType === 'gun';
          const isDagger = heroWpnTrait?.weaponType === 'dagger';

          let targetRawDmg = rawDmg;

          // ⚡ [단검 계열 특성: 암습 (속도 우위)] 기본 공격 또는 인챈트 기본 공격 시 상대보다 속도가 빠를수록 피해량 최대 20% 증폭
          if (isDagger && isBasicOrEnchantBasic) {
            const monSpd = m.spd ?? (m.data as any)?.stats?.spd ?? m.data?.spd ?? 10;
            const heroSpd = stats.spd || 10;
            const spdDiff = Math.max(0, heroSpd - monSpd);
            const daggerAmp = Math.min(0.20, spdDiff * 0.02); // 속도 1 우위당 +2%, 최대 +20%
            if (daggerAmp > 0) {
              targetRawDmg = Math.floor(targetRawDmg * (1 + daggerAmp));
              logs.push(`⚡ [암습] ${hero.name}의 속도 우위(+ ${spdDiff})로 ${m.data.name}에게 피해량이 ${Math.round(daggerAmp * 100)}% 증폭되었습니다!`);
            }
          }

          const isTargetFront = mIdx < 2;

          // 🌟 [타겟 개별 크리티컬 판정]: 몹마다 독립적인 치명타 롤링 (활: 치명타율 +5%, 후열 저격 적중 시 치명타율 +20% 보너스)
          let skillCritBonus = 0;
          if (skill !== 'basic') {
            if (skill.id === 'sharp_headshot') skillCritBonus += 60; // 치명적 헤드샷 (+60%)
            else if (skill.id === 'sniper_death_sentence') skillCritBonus += 70; // 영혼 저격 사형선고 (+70%)
          }
          const backRowCritBonus = (posBonus === 'back' && !isTargetFront) ? 20 : 0;
          const effectiveCritRate = critChance + ((isBow && isBasicOrEnchantBasic) ? 5 : 0) + skillCritBonus + backRowCritBonus;
          let targetIsCrit = Math.random() * 100 < effectiveCritRate;
          // ⚡ [암영 난무] 확정 치명타 강제 (단일 고유 특수 스킬)
          const isShadowDance = skill !== 'basic' && skill.id === 'rogue_shadow_dance';
          if (isShadowDance) targetIsCrit = true;
          if (targetIsCrit) {
            anyCritLanded = true;
          }

          // 🌟 [마법 계열 상성 추가 피해 판정]
          // 1) 신성 마법: 언데드(undead), 타락(corrupted) 계열 몬스터에게 20% 추가 데미지
          // 2) 암흑 마법: 마물(beast) 계열 몬스터에게 20% 추가 데미지
          const monFaction = m.data?.faction || 'beast';
          if (magicSchool === 'holy' || isHolySkill) {
            if (monFaction === 'undead' || monFaction === 'corrupted') {
              const factionBonus = Math.max(1, Math.floor(targetRawDmg * 0.20));
              targetRawDmg += factionBonus;
              logs.push(`✨ [신성 정화] 신성 마법이 ${m.data.name}(${monFaction === 'undead' ? '💀언데드' : '👁️타락'})에게 팩션 상성 추가 피해 +${factionBonus.toLocaleString()} (+20%)를 입힙니다!`);
            }
          } else if (magicSchool === 'dark') {
            if (monFaction === 'beast') {
              const factionBonus = Math.max(1, Math.floor(targetRawDmg * 0.20));
              targetRawDmg += factionBonus;
              logs.push(`🔮 [암흑 잠식] 암흑 마법이 ${m.data.name}(🐾마물)에게 팩션 상성 추가 피해 +${factionBonus.toLocaleString()} (+20%)를 입힙니다!`);
            }
          }

          // 1) 전열 특화 스킬: 전열 적 타격 시 +25% 피해 증폭
          if (posBonus === 'front') {
            if (isTargetFront) {
              targetRawDmg = Math.floor(targetRawDmg * 1.25);
              logs.push(`💥 [전열 분쇄] ${m.data.name}(전열)에게 25% 증폭 피해!`);
            }
          }
          // 2) 후열 저격 스킬: 후열 적 타격 시 +20% 피해 증폭 (치명타율 보너스 +20%는 롤링 연산에 반영)
          else if (posBonus === 'back') {
            if (!isTargetFront) {
              targetRawDmg = Math.floor(targetRawDmg * 1.20);
              logs.push(`🎯 [후열 저격] ${m.data.name}(후열) 약점 관통 저격! (+20% 피해 증폭${targetIsCrit ? ' & 치명타 적중!' : ''})`);
            }
          }
          // 3) 일반 공격 또는 근접 단일기가 살아있는 전열을 넘어 후열을 칠 때 페널티 (-25%)
          else if (!isTargetFront && hasAliveFront && posBonus !== 'any') {
            targetRawDmg = Math.max(1, Math.floor(targetRawDmg * 0.75));
            logs.push(`🛡️ [전열 방호선] 적 전열의 엄호로 인해 ${m.data.name}(후열) 타격 피해가 25% 감소합니다.`);
          }

          // 🌟 [원정대 시너지] 빈사(HP <= 30%) 마물 처형 피해 증폭 (lowHpExecuteBonus)
          if (m.currentHp / m.maxHp <= 0.30) {
            const activeSyns = gm.getActiveSynergies();
            let executeBonus = 0;
            activeSyns.forEach(syn => {
              if (syn.buffs.lowHpExecuteBonus) executeBonus += syn.buffs.lowHpExecuteBonus;
            });
            if (executeBonus > 0) {
              targetRawDmg = Math.floor(targetRawDmg * (1 + executeBonus));
              logs.push(`🩸 [처형 일격] 빈사의 ${m.data.name}에게 +${Math.round(executeBonus * 100)}% 처형 증폭 피해!`);
            }
          }

          // 🔱 창(Spear): 방어 파쇄로 보호막에 50% 추가 데미지 (기본 공격 및 인챈트 기본 공격 한정)
          const spearShieldBreak = (isSpear && isBasicOrEnchantBasic) ? 1.5 : 1;
          // 🏹 활(Bow): 치명타 피해 5% 추가 (+0.05) (기본 공격 및 인챈트 기본 공격 한정)
          let finalCritMult = heroCritMult + ((isBow && isBasicOrEnchantBasic) ? 0.05 : 0);
          // ⚡ [암영 난무] 치명타 배율 200% 고정 override
          if (isShadowDance) finalCritMult = 2.0;
          // 🎯 [샤프슈터 패시브: 헤드헌터] 체력 100%인 적 공격 시 치명타 피해량 60% 추가 증폭
          if (hero.classId === 'sharpshooter' && m.currentHp >= m.maxHp) {
            finalCritMult += 0.60;
          }

          // 🎯 방어 관통율 계산: 스킬 기본 관통율 + 영웅 스탯 관통율 + 패시브 보너스 + FEVER 시너지 + 암흑 마법
          let heroPiercePct = (stats.defPenetration || 0);
          if (skill !== 'basic' && skill.piercePct) {
            heroPiercePct += skill.piercePct;
          }
          if (magicSchool === 'dark') {
            heroPiercePct += 20; // 🔮 암흑 마법 기본 20% 방어 관통
          }
          if (isUltimate && feverSynergy && feverSynergy.armorPenetration > 0) {
            heroPiercePct += Math.round(feverSynergy.armorPenetration * 100);
          }
          // 마도 탄도학 마스터 (하이퍼 레인저): 치명타 적중 시 방어력을 50% 관통 및 마나 15 충전 (행동 1회당 1번만 충전)
          if (hero.classId === 'aether_gun_meister' && targetIsCrit) {
            heroPiercePct += 50;
            if (!aetherMeisterMpCharged && hero.currentMp < hero.maxMp) {
              aetherMeisterMpCharged = true;
              const actualGained = Math.min(hero.maxMp - hero.currentMp, 15);
              hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualGained);
              logs.push(`🔋 [마도 탄도학] 치명타 적중으로 ${m.data.name}의 방어력을 50% 추가 관통하고 마나 +${actualGained} MP를 충전합니다.`);
            }
          }
          heroPiercePct = Math.min(100, Math.max(0, heroPiercePct));

          // 🗡️ [무기 강화 단계 비례 순수 피해율]: 1강당 1% (10강이면 10%의 순수 관통 피해)
          const weaponEnhance = hero.equipment?.weapon?.enhanceLevel || 0;
          const trueDmgRate = weaponEnhance * 0.01;

          const { actualDamage, absorbed, isBlock, isBlockedByDef, trueDamage } = calculateDamage(
            targetRawDmg,
            m.def,
            m.statusEffects,
            targetIsCrit,
            finalCritMult,
            heroPiercePct,
            spearShieldBreak,
            m.isGroggy || false,
            trueDmgRate
          );
          if (trueDamage > 0) {
            logs.push(`🗡️✨ [+${weaponEnhance}강 순수 피해] 방어 무시 ${trueDamage} 피해 직격!`);
          }
          if (isSpear && isBasicOrEnchantBasic && (m.statusEffects || []).some(s => s.type === 'shield')) {
            logs.push(`🔱 [방어 파쇄] ${hero.name}의 창끝이 ${m.data.name}의 보호막에 50% 증폭 피해를 입혔습니다!`);
          }
          
          m.currentHp = Math.max(0, m.currentHp - actualDamage);
          totalActualDamageDealt += actualDamage;

          // 🌟 [6대 상태이상 폭발 콤보 체인 검사]
          let comboResult = checkStatusDetonationCombo(hero, m, nextMonsters, skill, actualDamage);
          if (comboResult.triggered) {
            addFeverBadge('extra');
            m.currentHp = Math.max(0, m.currentHp - comboResult.extraDamage);
            totalActualDamageDealt += comboResult.extraDamage;

            // 콤보 유형별 전용 VFX 및 사운드 매핑
            let comboVfxType: VFXType = 'arcane_nova';
            if (comboResult.comboName.includes('빙결') || comboResult.comboName.includes('초전도')) {
              comboVfxType = 'blizzard_storm';
              SoundManager.getInstance().play('ice');
            } else if (comboResult.comboName.includes('출혈') || comboResult.comboName.includes('낙인') || comboResult.comboName.includes('기습')) {
              comboVfxType = 'blood_bleed';
              SoundManager.getInstance().play('bleed');
            } else if (comboResult.comboName.includes('독성') || comboResult.comboName.includes('산성') || comboResult.comboName.includes('마비')) {
              comboVfxType = 'dark_curse';
              SoundManager.getInstance().play('poison');
            } else if (comboResult.comboName.includes('붕괴') || comboResult.comboName.includes('열폭')) {
              comboVfxType = 'heavy_slash';
              SoundManager.getInstance().play('shield_break');
            } else if (comboResult.comboName.includes('신성') || comboResult.comboName.includes('성염')) {
              comboVfxType = 'divine_smite';
              SoundManager.getInstance().play('holy_spell');
            } else if (comboResult.comboName.includes('폭풍')) {
              comboVfxType = 'arcane_nova';
              SoundManager.getInstance().play('wind_storm');
            } else if (comboResult.comboName.includes('화염')) {
              comboVfxType = 'fire';
              SoundManager.getInstance().play('fire');
            } else {
              SoundManager.getInstance().play('crit');
            }

            triggerScreenShake();
            triggerHaptic('heavy');

            triggerVFX({
              type: comboVfxType,
              x: monPos.x,
              y: monPos.y,
              damage: comboResult.extraDamage,
              isCrit: true,
              text: `⚡${comboResult.comboName.split(' ')[0]}`,
            });
            logs.push(`💥⚡ [연계 콤보 폭발!] ${comboResult.icon} [${comboResult.comboName}] 발동! ${comboResult.desc}`);
            comboResult.bonusLogs.forEach(bLog => logs.push(bLog));
            setSkillCutIn({
              id: String(Date.now()),
              skillName: `${comboResult.icon} ${comboResult.comboName}`,
              icon: comboResult.icon,
              isEnemy: false,
              bannerType: 'detonation',
              heroName: hero.name,
              subText: comboResult.desc,
            });
          }

          // 🗡️ [검 계열 특성: 베기 (출혈 부여)] 기본 공격 및 인챈트 기본 공격 시 대상에게 1턴간 [출혈] 상태이상 부여
          if (isSword && isBasicOrEnchantBasic && m.currentHp > 0) {
            applyStatusEffect(m, {
              type: 'bleed',
              turnsLeft: 1,
              totalTurns: 1,
              magnitude: 0.08, // 턴당 최대 체력 8% 출혈 피해
              source: `${hero.name}(베기)`
            });
            logs.push(`🗡️ [베기] ${hero.name}의 예리한 검격이 ${m.data.name}에게 1턴간 [출혈] 상태이상을 부여했습니다!`);
            triggerVFX({
              type: 'blood_bleed',
              x: monPos.x,
              y: monPos.y,
              damage: 0,
              isCrit: false,
              text: '🩸출혈!'
            });
            SoundManager.getInstance().play('bleed');
          }

          // 🔫 [총 계열 특성: 마도 연사] 기본 공격 또는 인챈트 기본 공격 시 기본 15%에 행운(🍀) 보정을 받아 추가 점사 탄환(공격력의 45% 위력) 격발
          if (isGun && isBasicOrEnchantBasic && m.currentHp > 0) {
            const burstRate = 15 + Math.min(30, (stats.luck || 0) * 0.5); // 기본 15% + 행운 보정 (최대 45%)
            if (Math.random() * 100 < burstRate) {
              const rawBurstAtk = Math.max(1, Math.floor(finalAtk * 0.45));
              const { actualDamage: burstDmg } = calculateDamage(
                rawBurstAtk,
                m.def,
                m.statusEffects,
                false,
                1.0,
                heroPiercePct,
                1,
                m.isGroggy || false,
                trueDmgRate
              );
              m.currentHp = Math.max(0, m.currentHp - burstDmg);
              totalActualDamageDealt += burstDmg;
              logs.push(`🔫 [마도 연사] 기본 15%와 행운(🍀${stats.luck})의 가호로 추가 점사 탄환(공격력 45% 위력)이 격발되어 ${m.data.name}에게 ${burstDmg} 추가 피해!`);
              triggerVFX({
                type: 'bullet',
                x: monPos.x + 10,
                y: monPos.y - 10,
                damage: burstDmg,
                isCrit: false,
                text: '🔫점사!'
              });
              SoundManager.getInstance().play('gunshot');
            }
          }

          // 👑 [7층 보스 세트 효과] 공격 시 25% 확률로 적에게 1턴간 [빙결] 부여
          const heroBossSetAttacking = getHeroEquippedBossSet(hero);
          if (heroBossSetAttacking?.effectType === 'stun_chance' && m.currentHp > 0 && Math.random() < 0.25) {
            applyStatusEffect(m, {
              type: 'freeze',
              turnsLeft: 1,
              totalTurns: 1,
              magnitude: 1,
              source: heroBossSetAttacking.setName
            });
            logs.push(`⛓️ [${heroBossSetAttacking.setName}] 원혼의 속박 발동: ${m.data.name} 1턴간 [빙결] 행동 불능!`);
            SoundManager.getInstance().play('ice');
          }

          // 🎯 [전술 사격수 패시브: 약점 분석] 적 타격 시 40% 확률로 적의 방어력 -15% 디버프 중첩
          if (hero.classId === 'tactical_gunner' && m.currentHp > 0 && Math.random() < 0.40) {
            applyStatusEffect(m, {
              type: 'debuff_def',
              turnsLeft: 2,
              totalTurns: 2,
              magnitude: 0.15,
              source: `${hero.name}(약점 분석)`
            });
            logs.push(`🎯 [약점 분석] ${hero.name}의 사격으로 ${m.data.name}의 방어력이 15% 분쇄되었습니다!`);
          }

          // 🔥 [발할라의 도살자 패시브: 광전사의 화신] 치명타 발생 시 아군 전체 공격력 15% 1턴간 강화
          if (hero.classId === 'valhalla_blade' && targetIsCrit) {
            gm.party.filter(p => p.currentHp > 0).forEach(p => {
              applyStatusEffect(p, {
                type: 'buff_atk',
                turnsLeft: 1,
                totalTurns: 1,
                magnitude: 0.15,
                source: `${hero.name}(광전사의 화신)`
              });
            });
            logs.push(`🔥 [광전사의 화신] ${hero.name}의 치명타로 파티 전원 공격력 15% 강화!`);
          }

          // 🌟 [차징 저지 & 브레이크 판정]
          if (m.chargingState && m.currentHp > 0) {
            const totalDmgAgainstCharge = actualDamage + (comboResult.triggered ? comboResult.extraDamage : 0);
            m.chargingState.remainingBreakDmg -= totalDmgAgainstCharge;
            const hasStunOrFreeze = (m.statusEffects || []).some(se => se.type === 'stun' || se.type === 'freeze');
            if (hasStunOrFreeze || m.chargingState.remainingBreakDmg <= 0) {
              m.chargingState = null;
              m.isGroggy = true;
              addFeverBadge('break');
              SoundManager.getInstance().play('shield_break');
              triggerVFX({
                type: 'boss_cataclysm',
                x: monPos.x,
                y: monPos.y,
                damage: 0,
                text: 'BREAK!',
                isCrit: true,
              });
              logs.push(`💥⚡ [차징 파쇄] ${hero.name}의 맹공으로 ${m.data.name}의 차징이 분쇄되었습니다! (1턴간 받는 피해 +50% 그로기 돌입)`);
              setSkillCutIn({
                id: String(Date.now() + 1),
                skillName: `💥 [${m.data.name}] 차징 붕괴!`,
                icon: '💥⚡',
                isEnemy: false,
                bannerType: 'break',
                heroName: hero.name,
                subText: '1턴간 그로기 (받는 피해 +50%)'
              });

              // 💥 [추가타 상황 1: 브레이크 파쇄 성공 시 아군 총공격 추격타]
              const livingAllies = gm.party.filter(p => p.currentHp > 0);
              if (livingAllies.length > 0 && m.currentHp > 0) {
                const totalPartyAtk = livingAllies.reduce((sum, a) => {
                  const effectiveAtk = gm.getHeroEffectiveStats(a).atk || a.stats?.atk || 20;
                  return sum + (isNaN(effectiveAtk) ? 20 : effectiveAtk);
                }, 0);
                const rawAllOutDmg = Math.max(25, Math.floor((totalPartyAtk / livingAllies.length) * 1.5 * (1 + livingAllies.length * 0.15)));
                const allOutDmg = isNaN(rawAllOutDmg) ? 25 : rawAllOutDmg;
                m.currentHp = Math.max(0, m.currentHp - allOutDmg);
                if (isNaN(m.currentHp)) m.currentHp = 0;
                totalActualDamageDealt += allOutDmg;

                setTimeout(() => {
                  SoundManager.getInstance().play('crit');
                  triggerScreenShake();
                  triggerVFX({
                    type: 'crit_slash',
                    x: monPos.x - 10,
                    y: monPos.y + 10,
                    damage: allOutDmg,
                    isCrit: true,
                    text: '💥총공격!',
                  });
                }, getBattleDelay(300));

                logs.push(`👑💥 [총공격 추격타!] 방어가 무너진 ${m.data.name}에게 전 파티원이 일제히 쇄도하여 ${allOutDmg}의 궤멸적 그로기 추격타를 꽂아넣었습니다!`);
              }
            } else {
              logs.push(`⚠️ [차징 저지 중] ${m.data.name} 남은 브레이크 요구치: ${Math.max(0, m.chargingState.remainingBreakDmg)} / ${m.chargingState.maxBreakDmg}`);
            }
          }


          // 📜 [아이디어 7: 장비 인챈트 특수 효과 프록 추가타 (Equipment Proc)]
          if (m.currentHp > 0) {
            try {
              const equipProc = checkEquipmentProc(hero);
              if (equipProc && equipProc.triggered) {
                const rawProcActualDmg = Math.max(1, Math.floor((equipProc.extraDamage || 10) * (100 / (100 + ((m.def ?? m.data?.def ?? 0) * 0.3)))));
                const procActualDmg = isNaN(rawProcActualDmg) ? 10 : rawProcActualDmg;
                m.currentHp = Math.max(0, m.currentHp - procActualDmg);
                if (isNaN(m.currentHp)) m.currentHp = 0;
                totalActualDamageDealt += procActualDmg;

                setTimeout(() => {
                  SoundManager.getInstance().play('spell');
                  triggerVFX({
                    type: 'arcane_nova',
                    x: monPos.x - 15,
                    y: monPos.y - 15,
                    damage: procActualDmg,
                    isCrit: true,
                    text: `✨${equipProc.procName.split(' ')[0]}`,
                  });
                }, getBattleDelay(350));

                logs.push(`📜✨ [장비 마도 공명!] ${hero.name}의 ${equipProc.desc} → ${m.data.name}에게 ${procActualDmg} 추가 마도 피해!`);
              }
            } catch (procErr) {
              console.warn('Equipment proc calculation error:', procErr);
            }
          }

          if (m.currentHp <= 0) {
            anyDied = true;
            // 🩸 [광전사 패시브: 피의 축제] 적 처치 시 공격력 +10% 버프 (최대 5회 중첩)
            if (hero.classId === 'berserker') {
              applyStatusEffect(hero, {
                type: 'buff_atk',
                turnsLeft: 5,
                totalTurns: 5,
                magnitude: 0.10,
                source: '피의 축제'
              });
              logs.push(`🩸 [피의 축제] ${hero.name}이(가) 적을 처치하여 공격력 +10% 상승!`);
            }
          }

          let logMsg = '';
          if (isBlock) {
            logMsg = `▶ 🛡️ [보호막 방어 / Block!] ${hero.name} [${skillName}] → ${m.data.name}의 보호막이 공격을 완전히 흡수했습니다! (보호막 ${absorbed} 흡수)`;
          } else {
            logMsg = `▶ ⚔️ ${hero.name} [${skillName}]${targetIsCrit ? ' 💥[크리티컬!]' : ''} → ${m.data.name} ${actualDamage} 피해`;
            if (isBlockedByDef) logMsg += ` 🛡️(방어 감쇄: 최소 피해 1)`;
            if (absorbed > 0) logMsg += ` (보호막 ${absorbed} 흡수)`;
          }

          let appliedStatus: string | undefined = undefined;
          if (skill !== 'basic') {
            const sDesc = (skill.description || '').toLowerCase();
            if (skill.effectType === 'bleed' || sDesc.includes('출혈')) appliedStatus = 'bleed';
            else if (skill.effectType === 'poison' || sDesc.includes('중독')) appliedStatus = 'poison';
            else if (skill.effectType === 'stun' || sDesc.includes('기절')) appliedStatus = 'stun';
            else if (sDesc.includes('동상') || sDesc.includes('결빙') || sDesc.includes('냉각')) appliedStatus = 'freeze';
            else if (sDesc.includes('화상')) appliedStatus = 'burn';
            else if (sDesc.includes('실명')) appliedStatus = 'blind';
            else if (skill.effectType === 'debuff' || sDesc.includes('약화') || sDesc.includes('분쇄')) appliedStatus = 'debuff_def';
          }

          // 몬스터 체력 바 상단 영역에 이펙트 & 플로팅 데미지 렌더링
          const targetVfxType = isBlock ? 'shield' : vfxType;
          triggerVFX({
            type: targetVfxType,
            x: monPos.x,
            y: monPos.y,
            damage: actualDamage,
            isCrit: targetIsCrit && !isBlock,
            isBlock,
            text: isBlock ? 'Block!' : undefined,
            tier: skillTier,
            sourceType: 'hero',
            statusEffect: appliedStatus,
            scale: skillTier === 2 ? 1.5 : skillTier === 1 ? 1.25 : 1.0,
          });
          logs.push(logMsg);

          // 🌟 상태이상 저항 판정 헬퍼: 대상 몬스터의 행운(luck)에 비례하여 CC/디버프 무효화
          const checkMonResist = (effectName: string): boolean => {
            const resistChance = Math.min(50, (m.luck || 10) * 0.35);
            if (Math.random() * 100 < resistChance) {
              logs.push(`🛡️ [저항(RESIST)] ${m.data.name}이(가) 높은 행운(🍀${m.luck})으로 [${effectName}] 효과를 완전히 저항해냈습니다!`);
              return true;
            }
            return false;
          };

          // 상태이상 부여 (냉각/출혈/중독/화상/기절/실명/공방 디버프 정밀 판정 및 복합 효과 동시 부여)
          if (skill !== 'basic') {
            const sName = (skill.name || '').toLowerCase();
            const sId = (skill.id || '').toLowerCase();
            const sDesc = (skill.description || '').toLowerCase();
            const baseSk = ALL_SKILLS_MAP[skill.id] || skill;
            const skillScale = (skill.power && baseSk.power) ? Math.max(1, skill.power / baseSk.power) : 1;

            // 1. 👁️ 실명 / 명중률 저하 (신성 광휘 / 연막탄 / 섬광탄 등)
            const isBlind = sId === 'acolyte_smite' || sDesc.includes('실명') || sId.includes('smoke') || sName.includes('연막') || sId.includes('flashbang') || sName.includes('섬광');
            if (isBlind && !checkMonResist('실명/명중저하')) {
              const dur = skill.statusDuration || (sId.includes('smoke') ? 3 : 2);
              const mag = sId.includes('smoke') ? 0.40 : (sId === 'acolyte_smite' ? 0.50 : 0.35);
              applyStatusEffect(m, {
                type: 'blind',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: mag,
                source: hero.name
              });
              logs.push(`👁️‍🗨️ [실명/명중저하] ${m.data.name}에게 ${dur}턴간 명중률 ${Math.round(mag * 100)}% 저하를 부여했습니다!`);
            }

            // 2. 🔥 화상 (화염 / 메테오 / 폭발 등)
            const isBurn = sId.includes('flame') || sId.includes('burn') || sId.includes('eruption') || sId.includes('meteor') || sName.includes('화염') || sName.includes('화상') || sName.includes('메테오') || sDesc.includes('화염') || sDesc.includes('화상');
            if (isBurn && !checkMonResist('화상')) {
              const dur = skill.statusDuration || 3;
              const burnMag = Number((0.08 * skillScale).toFixed(2));
              applyStatusEffect(m, {
                type: 'burn',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: burnMag,
                source: hero.name
              });
              logs.push(`🔥 [화상 부여] ${m.data.name}에게 ${dur}턴간 화상(매 턴 ${Math.round(burnMag * 100)}% 지속 피해)을 부여했습니다!`);
            }

            // 3. 🩸 출혈 (혈풍참 / 급소 찌르기 등)
            const isBleed = skill.effectType === 'bleed' || sName.includes('출혈') || sId.includes('blood_rend') || sId === 'rogue_slash' || sDesc.includes('출혈');
            if (isBleed && !checkMonResist('출혈')) {
              const dur = skill.statusDuration || 3;
              const bleedMag = Number((0.07 * skillScale).toFixed(2));
              applyStatusEffect(m, {
                type: 'bleed',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: bleedMag,
                source: hero.name
              });
              logs.push(`🩸 [출혈 유발] ${m.data.name}에게 ${dur}턴간 출혈 효과를 부여했습니다!`);
            }

            // 4. ☠️ 중독 (맹독 / 독무 등)
            const isPoison = skill.effectType === 'poison' || sId.includes('poison') || sName.includes('독') || sDesc.includes('중독');
            if (isPoison && !checkMonResist('맹독')) {
              const dur = skill.statusDuration || 3;
              const poisonMag = Number((0.14 * skillScale).toFixed(2));
              applyStatusEffect(m, {
                type: 'poison',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: poisonMag,
                source: hero.name
              });
              logs.push(`☠️ [맹독 주입] ${m.data.name}에게 ${dur}턴간 맹독(매 턴 최대 HP ${Math.round(poisonMag * 100)}% 치명 피해)을 주입했습니다!`);
            }

            // 5. ❄️ 빙결 / 냉각 / 동상
            const isFreeze = sId.includes('blizzard') || sId.includes('freeze') || sId.includes('colossus_core') || sName.includes('눈보라') || sName.includes('빙결') || sName.includes('혹한') || sName.includes('냉각') || sName.includes('영구동결') || sDesc.includes('빙결') || sDesc.includes('냉각') || sDesc.includes('동상');
            if (isFreeze && !checkMonResist('빙결/냉각')) {
              applyStatusEffect(m, {
                type: 'freeze',
                turnsLeft: 1,
                totalTurns: 1,
                magnitude: 0.04,
                source: hero.name
              });
              logs.push(`❄️ [빙결/냉각] ${m.data.name}에게 1턴간 빙결(행동 불가 & 4% 동상 피해)을 부여했습니다!`);
            }

            // 6. 💫 기절 / 속박
            const isStun = skill.effectType === 'stun' || sDesc.includes('기절') || sDesc.includes('속박');
            if (isStun && !checkMonResist('기절')) {
              const dur = skill.statusDuration || 1;
              applyStatusEffect(m, {
                type: 'stun',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: 0,
                source: hero.name
              });
              logs.push(`💫 [기절 부여] ${m.data.name}에게 ${dur}턴간 기절을 부여했습니다!`);
            }

            // 7. ⚔️⬇️ 공격력 약화
            const isAtkDebuff = (skill.effectType === 'debuff' || sDesc.includes('감소') || sDesc.includes('약화')) && (sDesc.includes('공격력') || sDesc.includes('공격'));
            if (isAtkDebuff && !checkMonResist('공격력 약화')) {
              const dur = skill.statusDuration || 2;
              const atkDebuffMag = Number((0.30 * skillScale).toFixed(2));
              applyStatusEffect(m, {
                type: 'debuff_atk',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: atkDebuffMag,
                source: hero.name
              });
              logs.push(`⚔️⬇️ [공격력 약화] ${m.data.name}의 공격력을 ${dur}턴간 ${Math.round(atkDebuffMag * 100)}% 감소시켰습니다!`);
            }

            // 8. 🛡️⬇️ 방어력 분쇄 / 감소
            const isDefDebuff = (skill.effectType === 'debuff' || sDesc.includes('분쇄') || sDesc.includes('파쇄') || sDesc.includes('감소')) && (sDesc.includes('방어력') || sDesc.includes('방어'));
            if (isDefDebuff && !checkMonResist('방어력 분쇄')) {
              const dur = skill.statusDuration || 3;
              const defDebuffMag = Number((0.35 * skillScale).toFixed(2));
              applyStatusEffect(m, {
                type: 'debuff_def',
                turnsLeft: dur,
                totalTurns: dur,
                magnitude: defDebuffMag,
                source: hero.name
              });
              logs.push(`🛡️⬇️ [방어력 분쇄] ${m.data.name}의 방어력을 ${dur}턴간 ${Math.round(defDebuffMag * 100)}% 감소시켰습니다!`);
            }

            // 9. 🔮 [원소 마법 고유 효과]: 해당 계열 원소 상태 이상 추가 부여
            if (magicSchool === 'elemental' && m.currentHp > 0) {
              const elemSubtype = getElementalSubtype(skill);
              const hasBurn = (m.statusEffects || []).some(se => se.type === 'burn');
              const hasFreeze = (m.statusEffects || []).some(se => se.type === 'freeze');
              const hasStun = (m.statusEffects || []).some(se => se.type === 'stun');

              if (elemSubtype === 'fire') {
                if (!hasBurn && !checkMonResist('원소:화상')) {
                  applyStatusEffect(m, {
                    type: 'burn',
                    turnsLeft: 2,
                    totalTurns: 2,
                    magnitude: 0.08,
                    source: `${hero.name}(원소:화염)`
                  });
                  logs.push(`🔥 [원소 마법: 화상] ${m.data.name}에게 2턴간 원소 화상(매 턴 8% 피해)을 추가 부여했습니다!`);
                }
              } else if (elemSubtype === 'ice') {
                if (!hasFreeze && !checkMonResist('원소:빙결')) {
                  applyStatusEffect(m, {
                    type: 'freeze',
                    turnsLeft: 1,
                    totalTurns: 1,
                    magnitude: 0.04,
                    source: `${hero.name}(원소:빙결)`
                  });
                  logs.push(`❄️ [원소 마법: 빙결] ${m.data.name}에게 1턴간 원소 빙결(행동 불가)을 추가 부여했습니다!`);
                }
              } else if (elemSubtype === 'lightning') {
                if (!hasStun && !checkMonResist('원소:감전기절')) {
                  applyStatusEffect(m, {
                    type: 'stun',
                    turnsLeft: 1,
                    totalTurns: 1,
                    magnitude: 1,
                    source: `${hero.name}(원소:감전)`
                  });
                  logs.push(`⚡ [원소 마법: 감전] ${m.data.name}에게 1턴간 원소 감전 기절을 추가 부여했습니다!`);
                }
              } else {
                if (!hasBurn && !checkMonResist('원소:화상')) {
                  applyStatusEffect(m, {
                    type: 'burn',
                    turnsLeft: 2,
                    totalTurns: 2,
                    magnitude: 0.08,
                    source: `${hero.name}(원소)`
                  });
                  logs.push(`🔥 [원소 마법: 화상] ${m.data.name}에게 2턴간 원소 화상을 추가 부여했습니다!`);
                }
              }
            }
          }
          return m;
        });

        // 🌟 [타격 효과음 및 화면 연출]: 최소 1체 이상의 대상에게 타격이 적중했을 때만 스킬 고유 SFX 및 화면 흔들림 발동
        if (anyHitLanded) {
          triggerScreenShake();
          setScreenFlash('ally');
          setTimeout(() => setScreenFlash(null), 250);
          SoundManager.getInstance().play(resolvedCombatPair.sfx);
        }

        // 🔥 [전술 모멘텀 CRIT 뱃지 연동] 치명타가 1회 이상 적중한 경우 치명 뱃지 적립
        if (anyCritLanded) {
          addFeverBadge('crit');
        }

        // 🌟 아군 포지션 연계 보너스 처리 (광역 다중 타겟 여부와 무관하게 스킬 시전당 1회만 정확히 적용)
        if (posBonus === 'front' && (hero.position === 'front' || hero.position === undefined) && totalActualDamageDealt > 0) {
          const shieldAmt = Math.max(1, Math.floor(totalActualDamageDealt * 0.25));
          applyStatusEffect(hero, {
            type: 'shield',
            turnsLeft: 2,
            totalTurns: 2,
            magnitude: shieldAmt,
            source: `${hero.name} (전열 연계)`
          });
          logs.push(`🛡️ [전열 돌격 방벽] ${hero.name}이(가) 전열 연계로 ${shieldAmt} 보호막을 획득했습니다!`);
        } else if (posBonus === 'back' && hero.position === 'back' && skill !== 'basic') {
          const actualCost = gm.getSkillManaCost(skill.manaCost, undefined, hero);
          const refundMp = Math.max(1, Math.floor(actualCost * 0.35));
          const actualRefund = Math.min(hero.maxMp - hero.currentMp, refundMp);
          if (actualRefund > 0) {
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + actualRefund);
            logs.push(`✨ [후열 전술 사격] ${hero.name}이(가) 후열 연계로 마나 +${actualRefund} MP를 환급받았습니다!`);
          }
        }

        // 🌟 [보스 전용 비전서 및 특수 복합 스킬 고유 효과 정밀 발동]
        if (skill !== 'basic' && totalActualDamageDealt > 0) {
          const sid = skill.id;

          // 그림자 결투사: 환영의 반격 (2턴간 회피율 +60% 및 피격 시 즉시 130% 환영 반격)
          if (sid === 'duel_riposte') {
            applyStatusEffect(hero, {
              type: 'riposte',
              turnsLeft: 2,
              totalTurns: 2,
              magnitude: 0.60,
              source: '환영의 반격'
            });
            logs.push(`⚔️💨 [환영 반격 태세] ${hero.name}이(가) 2턴간 회피율 60% 상승 및 피격 시 즉시 130% 환영 반격 태세를 전개했습니다!`);
          }
          // 그림자 결투사: 환영 난무 왈츠 (적 전체 130% 참격 & 2턴간 적들의 공격력 30% 감소)
          else if (sid === 'duel_blade_waltz') {
            const scale = skill.power ? skill.power / 1.3 : 1;
            const atkDebuffMag = Number((0.30 * scale).toFixed(2));
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'debuff_atk',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: atkDebuffMag,
                  source: `${hero.name} (환영 난무 왈츠)`
                });
              }
            });
            logs.push(`🌪️⚔️ [환영 난무 왈츠] ${hero.name}의 화려한 분신 검무가 적 전체를 난도질하고 공격력을 2턴간 ${Math.round(atkDebuffMag * 100)}% 약화시켰습니다!`);
          }
          // 전술 지휘관: 전열 압도 (적 전체 2턴 공격력 30% 감소 & 모든 아군 최대 HP 25% 보호막)
          else if (sid === 'warlord_overwhelm') {
            const scale = skill.power ? skill.power / 1.2 : 1;
            const debuffMag = Number((0.30 * scale).toFixed(2));
            const shieldRate = 0.25 * scale;
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'debuff_atk',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: debuffMag,
                  source: hero.name
                });
              }
            });
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const shAmt = Math.max(1, Math.floor(ally.maxHp * shieldRate));
              applyStatusEffect(ally, {
                type: 'shield',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: shAmt,
                source: `${hero.name} (전열 압도)`
              });
            });
            logs.push(`🚩🛡️ [전열 압도] 적 전체의 공격력을 ${Math.round(debuffMag * 100)}% 약화시키고 아군 전원에게 최대 HP ${Math.round(shieldRate * 100)}% 보호막을 부여했습니다!`);
          }
          // 그림자 수련생: 연막탄 (시전자 3턴 회피율 40% 버프)
          if (sid.includes('smoke') || (skill.name && skill.name.includes('연막'))) {
            applyStatusEffect(hero, {
              type: 'riposte',
              turnsLeft: 3,
              totalTurns: 3,
              magnitude: 0.40,
              source: '연막 회피'
            });
            logs.push(`💨👤 [연막 회피 태세] ${hero.name}이(가) 연막 속으로 몸을 숨겨 3턴간 회피율 40% 상승 상태에 들어갔습니다!`);
          }
          // 철혈의 패황: 철갑 방진 돌파 (적 전열 방어력 60% 분쇄)
          if (sid === 'marshal_phalanx_crush' || (skill.description && skill.description.includes('철갑 방진'))) {
            const scale = skill.power ? skill.power / 2.6 : 1;
            const defShred = Number((0.60 * scale).toFixed(2));
            nextMonsters.slice(0, 2).forEach(fMon => {
              if (fMon.currentHp > 0) {
                applyStatusEffect(fMon, {
                  type: 'debuff_def',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: defShred,
                  source: `${hero.name} (방진 돌파)`
                });
              }
            });
            logs.push(`🛡️⚡ [철갑 방진 돌파] 적 전열의 방어력을 2턴간 ${Math.round(defShred * 100)}% 분쇄했습니다!`);
          }
          // 전술 포수: 전술 드론 호출 (적 전체 2턴 화상)
          else if (sid === 'tac_drone_strike') {
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'burn',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: 0.08,
                  source: hero.name
                });
              }
            });
            logs.push(`🛰️🔥 [전술 드론 폭격] 드론 폭격으로 적 전체에 2턴간 지속 화상을 부여했습니다!`);
          }
          // 1F 보스: 흑핵의 영구동결 (전열 아군 150% 보호막)
          else if (sid === 'skill_boss_colossus_core') {
            const frontShield = Math.max(1, Math.floor(stats.atk * 1.5 * efficiency));
            gm.party.filter(h => h.currentHp > 0 && (h.position === 'front' || h.position === undefined)).forEach(fHero => {
              applyStatusEffect(fHero, {
                type: 'shield',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: frontShield,
                source: `${hero.name} (흑핵 방벽)`
              });
            });
            logs.push(`❄️🛡️ [흑핵 방벽] 절대 영도의 에너지로 전열 아군에게 보호막(${frontShield})을 부여했습니다!`);
          }
          // 2F 보스: 사령의 영혼 수확 (총 피해량 35% 파티 전원 흡혈 치유)
          else if (sid === 'skill_boss_deathknight_reap') {
            const partyHealAmt = Math.max(1, Math.floor(totalActualDamageDealt * 0.35));
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + partyHealAmt);
            });
            logs.push(`💀✨ [사령의 영혼 수확] 가한 총 피해(${totalActualDamageDealt})의 35%인 +${partyHealAmt} HP를 파티 전원에게 치유로 환원했습니다!`);
          }
          // 3F 보스: 광맥의 마도 분출 (방어 50% 분쇄 & 화상 부여)
          else if (sid === 'skill_boss_behemoth_eruption') {
            nextMonsters.forEach(m => {
              if (targetIds.includes(m.id) && m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'debuff_def',
                  turnsLeft: 3,
                  totalTurns: 3,
                  magnitude: 0.5,
                  source: hero.name
                });
              }
            });
            logs.push(`🌋🔥 [광맥 분출] 고열 폭발로 대상의 방어력을 50% 분쇄하고 3턴간 화상을 부여했습니다!`);
          }
          // 4F 보스: 시공간 차원 붕괴 (적 전체 2턴 속도 40% 감속/행동력 저하)
          else if (sid === 'skill_boss_chrono_warp') {
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'debuff_atk',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: 0.4,
                  source: hero.name
                });
              }
            });
            logs.push(`⏳🌀 [시공간 차원 붕괴] 적 전체의 시간 축을 왜곡하여 2턴간 행동력을 40% 저하시켰습니다!`);
          }
          // 5F 보스: 원초의 공허 묵시록 (아군 디버프 전원 정화 & 1턴 무적 결계)
          else if (sid === 'skill_boss_void_cataclysm') {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.statusEffects = (ally.statusEffects || []).filter(s => s.type !== 'debuff_def' && s.type !== 'debuff_atk' && s.type !== 'bleed' && s.type !== 'stun' && s.type !== 'freeze');
              applyStatusEffect(ally, {
                type: 'shield',
                turnsLeft: 1,
                totalTurns: 1,
                magnitude: 9999,
                source: '공허의 묵시록 결계'
              });
            });
            logs.push(`🔮✨ [공허 묵시록] 아군 전원의 모든 디버프를 완전 정화하고 1턴간 절대 무적 결계를 전개했습니다!`);
          }
          // 6F 보스: 진홍의 피의 지배 (입힌 피해 50% 자가 흡혈 + 적 전체 3턴 치명 출혈)
          else if (sid === 'skill_boss_blood_monarch') {
            const selfHeal = Math.max(1, Math.floor(totalActualDamageDealt * 0.5));
            hero.currentHp = Math.min(hero.maxHp, hero.currentHp + selfHeal);
            nextMonsters.forEach(otherM => {
              if (otherM.currentHp > 0) {
                applyStatusEffect(otherM, {
                  type: 'bleed',
                  turnsLeft: 3,
                  totalTurns: 3,
                  magnitude: 0.07,
                  source: hero.name
                });
              }
            });
            logs.push(`🍷 [진홍의 피의 지배] 흡혈로 HP +${selfHeal} 자가 회복 및 적 전체에게 3턴간 치명 출혈을 확산시켰습니다!`);
          }
          // 7F 보스: 망각의 사신 낫 (전열 적 2턴 침묵/기절)
          else if (sid === 'skill_boss_oblivion_scythe') {
            nextMonsters.slice(0, 2).forEach(fMon => {
              if (fMon.currentHp > 0) {
                applyStatusEffect(fMon, {
                  type: 'stun',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: 0,
                  source: hero.name
                });
              }
            });
            logs.push(`⛓️💫 [망각의 사슬] 적 전열 마물들에게 2턴간 사신의 침묵과 완전 기절을 부여했습니다!`);
          }
          // 9F 보스: 만화경 환영 폭풍 (2턴간 아군 전체 방어/회피 50% 버프)
          else if (sid === 'skill_boss_mirror_kaleidoscope') {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              applyStatusEffect(ally, {
                type: 'buff_def',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: 0.5,
                source: hero.name
              });
            });
            logs.push(`🪞✨ [만화경 환영] 수억 개의 거울 환영을 펼쳐 아군 전체 방어/회피력을 50% 상승시켰습니다!`);
          }
          // 10F 보스: 종말의 심연 아마게돈 (적 전체 1턴 기절 & 5턴 공허 침식)
          else if (sid === 'skill_boss_asmodeus_armageddon') {
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'stun',
                  turnsLeft: 1,
                  totalTurns: 1,
                  magnitude: 0,
                  source: hero.name
                });
                applyStatusEffect(m, {
                  type: 'debuff_atk',
                  turnsLeft: 5,
                  totalTurns: 5,
                  magnitude: 0.5,
                  source: hero.name
                });
                applyStatusEffect(m, {
                  type: 'debuff_def',
                  turnsLeft: 5,
                  totalTurns: 5,
                  magnitude: 0.5,
                  source: hero.name
                });
              }
            });
            logs.push(`🪐💥 [아마게돈 종말] 적 전체 1턴 기절 및 5턴간 공허 침식(공격력/방어력 50% 대폭 감소)을 부여했습니다!`);
          }
          // 👥 그림자 망령 (적 후열 타격 후 은신)
          if (sid === 'shadow_phantom' || (skill.description && skill.description.includes('은신') && !hero.statusEffects.some(se => se.type === 'stealth'))) {
            applyStatusEffect(hero, {
              type: 'stealth',
              turnsLeft: skill.statusDuration || 2,
              totalTurns: skill.statusDuration || 2,
              magnitude: 0.70,
              source: skill.name
            });
            logs.push(`👥 [그림자 은신] ${hero.name}이(가) 공격 직후 그림자 속으로 은신했습니다!`);
          }

          // ✝️ 전투 사제: 성전 타격 (적 1체 타격 후 자신 체력 23% 회복)
          if (sid === 'warpriest_smite_crusade' || sid === 'war_priest' || (skill.description && skill.description.includes('자신 체력') && skill.description.includes('회복'))) {
            const scale = skill.power ? skill.power / 1.61 : 1;
            const basePct = (skill.description && skill.description.includes('23%')) ? 0.23 : 0.20;
            const healPct = basePct * scale;
            const healAmt = Math.max(1, Math.floor(hero.maxHp * healPct));
            hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmt);
            logs.push(`✝️✨ [성전 타격 치유] 공격의 신성력으로 ${hero.name}의 체력이 +${healAmt}(${Math.round(healPct * 100)}%) 회복되었습니다!`);
            const heroIdx = gm.party.findIndex(h => h.id === hero.id);
            const heroPos = getHeroVfxPos(heroIdx >= 0 ? heroIdx : 0, false, gm.party.length);
            triggerVFX({ type: 'holy_heal', x: heroPos.x, y: heroPos.y, damage: healAmt, isHeal: true });
          }

          // ⚖️ 성전의 심판관: 성전의 심판관 (가한 총 피해의 50%만큼 파티 전체 체력 회복)
          if (sid === 'crusader_lord' || sid === 'crusader_judgment_hammer' || (skill.description && skill.description.includes('파티 전체 체력 회복'))) {
            const partyHeal = Math.max(1, Math.floor(totalActualDamageDealt * 0.50));
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + partyHeal);
            });
            logs.push(`⚖️✨ [심판관의 성전] 가한 총 피해의 50%인 +${partyHeal} HP를 파티 전원에게 치유로 환원했습니다!`);
          }

          // ✝️ [궁극기] 천벌의 성십자가: 적 전체 타격 및 생존 아군 HP 46% 치유 (FEVER 시너지 배율 연동)
          if (sid === 'crusader_ultimate' || (skill.description && skill.description.includes('천벌') && skill.description.includes('치유'))) {
            const ultPowerMult = feverSynergy ? feverSynergy.powerMult : 1.0;
            const healPct = Math.min(1.0, 0.46 * ultPowerMult);
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const healAmt = Math.max(1, Math.floor(ally.maxHp * healPct));
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
            });
            logs.push(`✝️✨ [천벌의 성십자가] 신성 성광의 은총으로 생존 아군 전원의 체력이 +${Math.round(healPct * 100)}% 치유되었습니다!`);
          }

          // 🚩 [궁극기] 군단 총진격: 적 전체 260% 짓밟고 모든 아군 최대 HP 40% 보호막 (FEVER 시너지 배율 연동)
          if (sid === 'marshal_ultimate' || (skill.description && skill.description.includes('군단 총진격') && skill.description.includes('보호막'))) {
            const ultPowerMult = feverSynergy ? feverSynergy.powerMult : 1.0;
            const shieldPct = Math.min(1.0, 0.40 * ultPowerMult);
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const shAmt = Math.max(1, Math.floor(ally.maxHp * shieldPct));
              applyStatusEffect(ally, {
                type: 'shield',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: shAmt,
                source: `${hero.name} (군단 총진격)`
              });
            });
            logs.push(`🚩🛡️ [군단 총진격] 무적의 군세 보호막으로 파티 전원에게 최대 HP ${Math.round(shieldPct * 100)}% 흡수 방벽을 전개했습니다!`);
          }

          // 🪞 [궁극기] 만화경 환영검무: 적 전체 180% 난무 & 2턴간 공격력 40% 약화
          if (sid === 'dancer_ultimate') {
            const scale = skill.power ? skill.power / 1.8 : 1;
            const debuffMag = Number((0.40 * scale).toFixed(2));
            nextMonsters.forEach(m => {
              if (m.currentHp > 0) {
                applyStatusEffect(m, {
                  type: 'debuff_atk',
                  turnsLeft: 2,
                  totalTurns: 2,
                  magnitude: debuffMag,
                  source: `${hero.name} (만화경 환영검무)`
                });
              }
            });
            logs.push(`🪞⚔️ [만화경 환영검무] 적 전체의 공격력을 2턴간 ${Math.round(debuffMag * 100)}% 약화시켰습니다!`);
          }
          // 🩸 [영웅 흡혈 스탯 (stats.drainPercent - 목걸이 강화 등) 및 흡혈 스킬 처리]
          const heroDrainPct = (stats.drainPercent || 0) + (effectType === 'drain' ? 50 : 0);
          if (heroDrainPct > 0 && totalActualDamageDealt > 0 && hero.currentHp > 0 && hero.currentHp < hero.maxHp) {
            const drainHeal = Math.max(1, Math.floor(totalActualDamageDealt * (heroDrainPct / 100)));
            const actualHealed = Math.min(hero.maxHp - hero.currentHp, drainHeal);
            if (actualHealed > 0) {
              hero.currentHp += actualHealed;
              logs.push(`🩸 [생명력 흡수] 가한 피해의 ${heroDrainPct}%를 흡혈하여 체력 +${actualHealed} 회복!`);
            }
          }

          // 🔥 [FEVER 궁극기 부가 전술 효과 종합 발동]
          if (isUltimate && feverSynergy) {
            // 1. 🩸 기사회생 / 부활
            if (feverSynergy.reviveFallen) {
              let revivedCount = 0;
              gm.party.forEach(ally => {
                const isDead = ally.currentHp <= 0 || ally.deathCountdown !== undefined || ally.isPermanentlyDead;
                if (isDead && (!feverSynergy!.reviveSingle || revivedCount < 1)) {
                  revivedCount++;
                  const revHp = Math.max(1, Math.floor(ally.maxHp * (feverSynergy!.reviveHpPct || 0.5)));
                  ally.currentHp = revHp;
                  ally.deathCountdown = undefined;
                  ally.isPermanentlyDead = false;
                  ally.statusEffects = [];
                  logs.push(`🩸🕊️ [${feverSynergy!.name}] 쓰러졌던 ${ally.name}이(가) 기적처럼 HP ${revHp}로 부활했습니다!`);
                }
              });
            }
            // 2. 💖 파티 전원 체력 회복 (100% 완전 회복 또는 partyHealPct 비율 회복)
            if (feverSynergy.partyFullHeal) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                ally.currentHp = ally.maxHp;
              });
              logs.push(`💖✨ [${feverSynergy.name}] 생존 아군 전원의 체력이 100% 완전 회복되었습니다!`);
            } else if (feverSynergy.partyHealPct && feverSynergy.partyHealPct > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                const healAmt = Math.max(1, Math.floor(ally.maxHp * feverSynergy!.partyHealPct!));
                ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
              });
              logs.push(`💖✨ [${feverSynergy.name}] 생존 아군 전원의 체력을 ${Math.round(feverSynergy.partyHealPct * 100)}% 회복했습니다!`);
            }
            // 3. 🛡️ 파티 에테르 방벽 부여
            if (feverSynergy.partyShieldPct > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                const shAmt = Math.max(1, Math.floor(ally.maxHp * feverSynergy!.partyShieldPct));
                applyStatusEffect(ally, {
                  type: 'shield',
                  turnsLeft: 3,
                  totalTurns: 3,
                  magnitude: shAmt,
                  source: `FEVER: ${feverSynergy!.name}`
                });
              });
              logs.push(`🛡️✨ [${feverSynergy.name}] 파티 전원에게 최대 HP ${Math.round(feverSynergy.partyShieldPct * 100)}% 에테르 방벽을 전개했습니다!`);
            }
            // 4. 🕊️ 디버프 완전 정화
            if (feverSynergy.cleanseDebuffs) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                ally.statusEffects = (ally.statusEffects || []).filter(s => !['bleed', 'poison', 'burn', 'frostbite', 'stun', 'blind', 'debuff_atk', 'debuff_def'].includes(s.type));
              });
              logs.push(`🕊️✨ [${feverSynergy.name}] 파티 전원의 모든 해로운 상태이상을 완전히 정화했습니다!`);
            }
            // 5. 🛡️ 상태이상 면역 결계
            if (feverSynergy.immunityTurns > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                applyStatusEffect(ally, {
                  type: 'immunity',
                  turnsLeft: feverSynergy!.immunityTurns,
                  totalTurns: feverSynergy!.immunityTurns,
                  magnitude: 1,
                  source: feverSynergy!.name
                });
              });
              logs.push(`🛡️✨ [${feverSynergy.name}] 파티 전원에게 ${feverSynergy.immunityTurns}턴간 절대 면역 결계를 부여했습니다!`);
            }
            // 6. ⚔️ 환영 반격 결계
            if (feverSynergy.riposteTurns > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                applyStatusEffect(ally, {
                  type: 'riposte',
                  turnsLeft: feverSynergy!.riposteTurns,
                  totalTurns: feverSynergy!.riposteTurns,
                  magnitude: 0.60,
                  source: feverSynergy!.name
                });
              });
              logs.push(`⚔️💨 [${feverSynergy.name}] 파티 전원에게 ${feverSynergy.riposteTurns}턴간 100% 환영 반격 결계를 전개했습니다!`);
            }
            // 7. 💫 적 전체 그로기
            if (feverSynergy.stunTurns > 0) {
              nextMonsters.filter(m => m.currentHp > 0).forEach(m => {
                applyStatusEffect(m, {
                  type: 'stun',
                  turnsLeft: feverSynergy!.stunTurns,
                  totalTurns: feverSynergy!.stunTurns,
                  magnitude: 1,
                  source: feverSynergy!.name
                });
              });
              logs.push(`💫👑 [${feverSynergy.name}] 적 전체에게 ${feverSynergy.stunTurns}턴간 완전 그로기(기절)를 부여했습니다!`);
            }
            // 8. 🔋 파티 MP 회복
            if (feverSynergy.rechargePartyMp) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                ally.currentMp = ally.maxMp;
              });
              logs.push(`🔋👑 [${feverSynergy.name}] 파티 전원의 마나(MP)를 100% 즉시 완충했습니다!`);
            } else if (feverSynergy.rechargePartyMpPct && feverSynergy.rechargePartyMpPct > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                const mpAmt = Math.max(1, Math.floor(ally.maxMp * feverSynergy!.rechargePartyMpPct!));
                ally.currentMp = Math.min(ally.maxMp, ally.currentMp + mpAmt);
              });
              logs.push(`🔋👑 [${feverSynergy.name}] 파티 전원의 마나(MP)를 ${Math.round(feverSynergy.rechargePartyMpPct * 100)}% 회복했습니다!`);
            }
            // 9. 🎯 파티 전체 명중력 증가
            if (feverSynergy.hitRateBonus && feverSynergy.hitRateBonus > 0) {
              gm.party.filter(h => h.currentHp > 0).forEach(ally => {
                applyStatusEffect(ally, {
                  type: 'buff_hit' as any,
                  turnsLeft: 3,
                  totalTurns: 3,
                  magnitude: feverSynergy!.hitRateBonus!,
                  source: feverSynergy!.name
                });
              });
              logs.push(`🎯🌀 [${feverSynergy.name}] 파티 전원의 명중력이 3턴간 +${Math.round(feverSynergy.hitRateBonus * 100)}% 증가했습니다!`);
            }
            // 9. 🍷 흡혈 회복
            if (feverSynergy.lifestealPct > 0 && totalActualDamageDealt > 0) {
              const lifestealHeal = Math.max(1, Math.floor(totalActualDamageDealt * feverSynergy.lifestealPct));
              const livingParty = gm.party.filter(h => h.currentHp > 0);
              if (livingParty.length > 0) {
                const healPerHero = Math.max(1, Math.floor(lifestealHeal / livingParty.length));
                livingParty.forEach(ally => {
                  ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healPerHero);
                });
                logs.push(`🍷✨ [${feverSynergy.name} 흡혈] 가한 피해의 ${Math.round(feverSynergy.lifestealPct * 100)}%(+${lifestealHeal} HP)를 파티 전원에게 치유로 환원했습니다!`);
              }
            }
          }
        }

        if (anyDied) {
          setTimeout(() => SoundManager.getInstance().play('monster_death'), 100);
        }
      } else if (skill !== 'basic') {
        // ── 버프 / 힐 / 보호막 (아군 대상 스킬: all_allies / single_ally / self) ──
        const targetType = skill.targetType || 'self';
        const isReviveSkill = skill.id === 'saint_ultimate' || skill.id === 'acolyte_revive' || skill.id === 'acolyte_blessing' || (skill.description && (skill.description.includes('부활') || skill.description.includes('소생')));
        const isAllAllies = targetType === 'all_allies' || (skill.description && (
          skill.description.includes('아군 전체') ||
          skill.description.includes('모든 아군') ||
          skill.description.includes('파티 전원') ||
          skill.description.includes('파티 전체')
        ));
        let targetAllies: Mercenary[] = [];

        if (isAllAllies) {
          // 🕊️ 부활 스킬은 사망/사경 중인 아군을 포함한 파티 전체 대상! 일반 치유는 살아있는 아군만 대상
          targetAllies = isReviveSkill ? [...gm.party] : gm.party.filter(h => h.currentHp > 0);
        } else if (targetType === 'single_ally') {
          if (isReviveSkill) {
            // 🕊️ 부활/소생 스킬: 사망 또는 사경(사망 임박) 아군 1명을 최우선 타겟팅!
            const dyingOrDead = gm.party.filter(h => h.currentHp <= 0 || h.deathCountdown !== undefined || h.isPermanentlyDead);
            if (dyingOrDead.length > 0) {
              // 사경 카운트다운이 가장 적게 남은(사망에 가장 임박한) 아군 1명 선택
              const mostUrgent = dyingOrDead.reduce((prev, curr) => (curr.deathCountdown ?? 3) < (prev.deathCountdown ?? 3) ? curr : prev, dyingOrDead[0]);
              targetAllies = [mostUrgent];
            } else {
              // 사망/사경 아군이 없다면 체력 비율이 가장 낮은 생존 아군
              const alive = gm.party.filter(h => h.currentHp > 0);
              if (alive.length > 0) {
                const lowest = alive.reduce((prev, curr) => (curr.currentHp / curr.maxHp) < (prev.currentHp / prev.maxHp) ? curr : prev, alive[0]);
                targetAllies = [lowest];
              } else {
                targetAllies = [hero];
              }
            }
          } else {
            // 일반 단일 치유: 가장 체력 비율이 낮은 생존 아군
            const alive = gm.party.filter(h => h.currentHp > 0);
            if (alive.length > 0) {
              const lowest = alive.reduce((prev, curr) => (curr.currentHp / curr.maxHp) < (prev.currentHp / prev.maxHp) ? curr : prev, alive[0]);
              targetAllies = [lowest];
            } else {
              targetAllies = [hero];
            }
          }
        } else {
          // self
          targetAllies = [hero];
        }

        let efficiency = 1.0;
        let skillAffinity: string[] | undefined = undefined;
        const bookDef = ALL_SKILL_BOOKS.find(sb => sb.skill.id === skill.id || sb.id === skill.id);
        if (bookDef?.affinity) {
          skillAffinity = bookDef.affinity;
        } else if ((skill as any).affinity) {
          skillAffinity = (skill as any).affinity;
        } else if (hero.equippedSkillBooks) {
          const eb = hero.equippedSkillBooks.find((b: any) => b.skill?.id === skill.id || b.bookId === skill.id || b.id === skill.id);
          if (eb?.affinity) skillAffinity = eb.affinity;
        }

        const heroRole = CHARACTER_CLASSES[hero.classId]?.role;
        const isAffinityMatch = checkSkillAffinityMatch(skillAffinity, heroRole, hero.classId);
        if (!isAffinityMatch) {
          efficiency = 0.5;
          const affMeta = getSkillAffinityMeta(skillAffinity);
          logs.push(`⚠️ [계열 부조화] ${hero.name}의 클래스와 맞지 않는 [${affMeta.name}] 스킬로 인해 지원/치유 효율이 50% 반감됩니다!`);
        }

        // 🌟 궁극기 FEVER 시너지 위력 배율 (버프/치유/보호막에 그대로 100% 적용)
        const ultMult = (isUltimate && feverSynergy) ? (feverSynergy.powerMult || 1.0) : 1.0;

        if (skill.effectType === 'heal') {
          SoundManager.getInstance().play('heal');
          const healReports: string[] = [];
          let anyRevived = false;

          targetAllies.forEach((ally) => {
            const wasDead = ally.currentHp <= 0 || ally.deathCountdown !== undefined || ally.isPermanentlyDead;

            // 🕊️✨ [기사회생] 사망/사경 아군 부활 처리!
            if (wasDead && isReviveSkill) {
              anyRevived = true;
              let reviveHp = Math.max(1, Math.floor(ally.maxHp * 0.50 * ultMult));
              if (skill.id === 'acolyte_revive' || skill.id === 'acolyte_blessing') {
                // 🕊️ 견습 사제 궁극기: 사망 임박 용병 1명을 체력 1로 회복
                reviveHp = 1;
              }
              ally.currentHp = reviveHp;
              ally.deathCountdown = undefined;
              ally.isPermanentlyDead = false;
              ally.statusEffects = []; // 해로운 상태이상 초기화

              healReports.push(`🕊️${ally.name} [소생! HP +${reviveHp}]`);

              const allyIdx = gm.party.findIndex(h => h.id === ally.id);
              const heroPos = getHeroVfxPos(allyIdx, false, gm.party.length);
              triggerVFX({
                type: 'divine_smite',
                x: heroPos.x,
                y: heroPos.y,
                damage: reviveHp,
                isHeal: true,
                text: 'REVIVE!',
              });
            } else if (!wasDead) {
              // 💖 생존 중인 아군 치유
              let healAmt = 0;
              if (skill.id === 'saint_ultimate') {
                // [궁극기] 부활의 성가: 생존 아군 체력 100% 완전 회복!
                healAmt = ally.maxHp - ally.currentHp;
                ally.currentHp = ally.maxHp;
              } else if (skill.id === 'chrono_ultimate' || (skill.description && skill.description.includes('시공 역류'))) {
                // [궁극기] 시공 역류: 아군 체력과 마나 58% 회복 (FEVER 시너지 위력 배율 연동)
                const healRate = Math.min(1.0, 0.58 * ultMult);
                healAmt = Math.max(1, Math.floor(ally.maxHp * healRate));
                ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
                const mpAmt = Math.max(1, Math.floor(ally.maxMp * healRate));
                ally.currentMp = Math.min(ally.maxMp, ally.currentMp + mpAmt);
                resetAllPartyCooldowns = true;
              } else if (skill.id === 'acolyte_revive' || skill.id === 'acolyte_blessing') {
                // 사망/사경 아군이 없을 때 사용 시, 소폭 체력 회복
                healAmt = Math.max(1, Math.floor(ally.maxHp * 0.20 * efficiency * ultMult));
                ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
              } else {
                healAmt = skill.power <= 1.0
                  ? Math.max(1, Math.floor(ally.maxHp * skill.power * efficiency * ultMult))
                  : Math.max(1, Math.floor((stats.atk * (skill.power * 0.5 * ultMult) + ally.maxHp * 0.15) * efficiency));
                ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
              }

              // 정화/면역 스킬인 경우 모든 해로운 상태이상 일괄 해제
              const isCleanseSkill = skill.id.includes('sanctuary') || skill.id.includes('purify') || skill.id.includes('ultimate') || skill.id.includes('sacred_veil') || skill.id.includes('purifying_light') || skill.id.includes('holy_wave') || skill.id.includes('sacred_ground') || (skill.description && (skill.description.includes('정화') || skill.description.includes('면역') || skill.description.includes('해제') || skill.description.includes('제거')));
              if (isCleanseSkill) {
                const prevEffects = ally.statusEffects || [];
                ally.statusEffects = prevEffects.filter(s => s.type !== 'debuff_def' && s.type !== 'debuff_atk' && s.type !== 'bleed' && s.type !== 'stun' && s.type !== 'freeze' && s.type !== 'poison' && s.type !== 'burn' && s.type !== 'blind');
              }

              // 디버프 면역(immunity) 결계 부여
              const isImmunitySkill = skill.id.includes('purifying_light') || skill.id.includes('sacred_veil') || skill.id.includes('saint_purify') || skill.id.includes('acolyte_blessing') || skill.id.includes('holy_wave') || skill.id.includes('sacred_ground') || (skill.description && skill.description.includes('면역'));
              if (isImmunitySkill) {
                const immTurns = skill.statusDuration || 2;
                applyStatusEffect(ally, {
                  type: 'immunity',
                  turnsLeft: immTurns,
                  totalTurns: immTurns,
                  magnitude: 1,
                  source: `${hero.name} [${skill.name}]`
                });
              }

              healReports.push(`${ally.name} HP +${healAmt}${isImmunitySkill ? ' [면역결계]' : ''}`);

              // 아군 개별 행 체력 바 상단 힐 이펙트
              const allyIdx = gm.party.findIndex(h => h.id === ally.id);
              const heroPos = getHeroVfxPos(allyIdx, false, gm.party.length);
              triggerVFX({
                type: targetAllies.length > 1 ? 'holy_heal_aoe' : 'holy_heal',
                x: heroPos.x,
                y: heroPos.y,
                damage: healAmt,
                isHeal: true,
              });
            }
          });

          // 🌟 추가 후속 효과: 시공 역류 / 신성 집결 / 불굴의 결의 / 성전 결계
          if (skill.id === 'chrono_ultimate' || (skill.description && skill.description.includes('시공 역류'))) {
            logs.push(`⌛💫 [시공 역류] 시간의 흐름을 되돌려 파티 전원의 체력과 마나를 회복하고 모든 스킬 쿨다운을 완전 초기화했습니다!`);
          }
          if (skill.id === 'bishop_holy_assembly' || (skill.description && skill.description.includes('신성 집결'))) {
            const defMag = Number((0.20 * (skill.power ? (skill.power / 0.46) : 1) * efficiency * ultMult).toFixed(2));
            targetAllies.forEach(ally => {
              applyStatusEffect(ally, {
                type: 'buff_def',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: defMag,
                source: '신성 집결 (피해 경감)'
              });
            });
            logs.push(`🛡️✨ [신성 집결] 2턴간 파티 전체가 받는 피해를 ${Math.round(defMag * 100)}% 경감합니다!`);
          }
          if (skill.id === 'squire_resolute' || (skill.description && skill.description.includes('방어 태세'))) {
            const defMag = Number((0.50 * (skill.power ? (skill.power / 0.30) : 1) * efficiency * ultMult).toFixed(2));
            applyStatusEffect(hero, {
              type: 'buff_def',
              turnsLeft: 1,
              totalTurns: 1,
              magnitude: defMag,
              source: '불굴의 결의'
            });
            logs.push(`🏰 [방어 태세] ${hero.name}이(가) 1턴간 방어 태세(방어력 +${Math.round(defMag * 100)}%)를 취합니다!`);
          }
          if (skill.id === 'crusader_holy_sanctuary_field' || (skill.description && skill.description.includes('성전 결계'))) {
            const buffMag = Number((0.35 * (skill.power ? (skill.power / 0.92) : 1) * efficiency * ultMult).toFixed(2));
            targetAllies.forEach(ally => {
              applyStatusEffect(ally, {
                type: 'buff_atk',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: buffMag,
                source: '성전 결계'
              });
              applyStatusEffect(ally, {
                type: 'buff_def',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: buffMag,
                source: '성전 결계'
              });
            });
            logs.push(`⚔️🔰 [성전 결계 전개] 3턴간 아군 전체의 공격력과 방어력이 ${Math.round(buffMag * 100)}% 증폭되었습니다!`);
          }
          if (skill.id === 'warpriest_sacred_ground' || (skill.description && skill.description.includes('성지') && skill.description.includes('매 턴'))) {
            const regenMag = Number((0.09 * (skill.power ? (skill.power / 0.09) : 1) * efficiency * ultMult).toFixed(2));
            targetAllies.forEach(ally => {
              applyStatusEffect(ally, {
                type: 'regen',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: regenMag,
                source: `${hero.name} (성지 결계)`
              });
            });
            logs.push(`💚✨ [성지 정화 결계] 3턴간 파티 전체에 매 턴 체력 ${Math.round(regenMag * 100)}% 지속 재생을 부여했습니다!`);
          }

          if (anyRevived) {
            SoundManager.getInstance().play('holy_spell');
            const isAcolyteSkill = skill.id === 'acolyte_revive' || skill.id === 'acolyte_blessing';
            setSkillCutIn({
              id: String(Date.now() + 1),
              skillName: `🕊️✨ [기사회생] ${skill.name}`,
              icon: '🕊️✨',
              isEnemy: false,
              bannerType: 'extra',
              heroName: hero.name,
              subText: isAcolyteSkill ? '사망 임박(사경) 동료 기적의 소생!' : '사망 아군 부활 및 생존 아군 완전 치유!'
            });
            if (isAcolyteSkill) {
              logs.push(`🕊️✨ ${hero.name} [${skill.name}] 강림! 기적의 기도로 사경을 헤매던 ${targetAllies.map(a => a.name).join(', ')}을(를) 체력 1로 극적 소생시켰습니다! ➔ [${healReports.join(', ')}]`);
            } else {
              logs.push(`🕊️✨ ${hero.name} [${skill.name}] 강림! 기적의 권능으로 사망한 동료를 부활시키고 파티를 완전 치유했습니다! ➔ [${healReports.join(', ')}]`);
            }
          } else if (targetType === 'all_allies') {
            logs.push(`✨ ${hero.name} [${skill.name}] → 파티 전원 치유! [${healReports.join(', ')}]`);
          } else {
            logs.push(`✨ ${hero.name} [${skill.name}] → ${healReports.join(', ')}`);
          }

          // 💖 [전술 모멘텀 HEAL 뱃지 획득]: 회복이나 재생으로 자신 이외 아군을 치료해주는 경우 획득
          const healsOtherAlly = targetAllies.some(a => a.id !== hero.id);
          if (healsOtherAlly) {
            addFeverBadge('heal');
          }

          gm.emit('partyUpdated', gm.party);
        } else if (skill.effectType === 'shield') {
          addFeverBadge('guard');
          SoundManager.getInstance().play('shield');
          const shieldReports: string[] = [];

          targetAllies.forEach((ally) => {
            const shieldAmt = skill.power <= 1.0
              ? Math.max(1, Math.floor(ally.maxHp * skill.power * efficiency * ultMult))
              : Math.max(1, Math.floor(stats.atk * skill.power * efficiency * ultMult));

            // 정화/면역 결계 스킬 (e.g. 축복의 베일)
            const isCleanseSkill = skill.id.includes('sacred_veil') || (skill.description && (skill.description.includes('정화') || skill.description.includes('해제') || skill.description.includes('제거')));
            if (isCleanseSkill) {
              const prevEffects = ally.statusEffects || [];
              ally.statusEffects = prevEffects.filter(s => s.type !== 'debuff_def' && s.type !== 'debuff_atk' && s.type !== 'bleed' && s.type !== 'stun' && s.type !== 'freeze' && s.type !== 'poison' && s.type !== 'burn' && s.type !== 'blind');
            }

            applyStatusEffect(ally, {
              type: 'shield',
              turnsLeft: skill.statusDuration || 2,
              totalTurns: skill.statusDuration || 2,
              magnitude: shieldAmt,
              source: hero.name
            });

            // 8F 보스: 단죄의 칠흑 성역 (3턴간 공격력 40% 증폭 버프 동시 부여, 부조화 시 20%)
            if (skill.id === 'skill_boss_judgment_sanctum') {
              const buffMag = Number((0.4 * efficiency).toFixed(2));
              applyStatusEffect(ally, {
                type: 'buff_atk',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: buffMag,
                source: `${hero.name} (칠흑 성역)`
              });
            }

            // 🏰 [궁극기] 절대 요새의 성역 (1턴 무적 및 2턴간 파티 전체 받는 피해 50% 경감)
            if (skill.id === 'fortress_ultimate' || (skill.description && skill.description.includes('절대 요새'))) {
              const defMag = Number((0.50 * (skill.power ? (skill.power / 0.50) : 1) * efficiency * ultMult).toFixed(2));
              applyStatusEffect(ally, {
                type: 'immunity',
                turnsLeft: 1,
                totalTurns: 1,
                magnitude: 1,
                source: '절대 요새 (무적)'
              });
              applyStatusEffect(ally, {
                type: 'buff_def',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: defMag,
                source: '절대 요새 (피해 50% 경감)'
              });
            }

            // 💚 신의 가호 (지속 치유 동시 부여)
            if (skill.id === 'valk_divine_shield' || (skill.description && skill.description.includes('지속 치유'))) {
              const regenMag = Number((0.08 * (skill.power ? (skill.power / 0.40) : 1) * efficiency * ultMult).toFixed(2));
              applyStatusEffect(ally, {
                type: 'regen',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: regenMag,
                source: `${hero.name} (신의 가호)`
              });
            }

            // ⚔️ 발할라의 불멸 (공격력 +50% 버프 동시 부여)
            if (skill.id === 'book_valhalla_aegis' || (skill.description && skill.description.includes('발할라의 불멸'))) {
              applyStatusEffect(ally, {
                type: 'buff_atk',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: Number((0.50 * ultMult).toFixed(2)),
                source: '발할라의 불멸'
              });
            }

            shieldReports.push(`${ally.name}(${shieldAmt})`);

            // 아군 개별 행 체력 바 상단 보호막 이펙트
            const allyIdx = gm.party.findIndex(h => h.id === ally.id);
            const heroPos = getHeroVfxPos(allyIdx, false, gm.party.length);
            triggerVFX({
              type: 'shield',
              x: heroPos.x,
              y: heroPos.y,
              damage: shieldAmt,
              isShield: true,
            });
          });

          if (targetType === 'all_allies') {
            logs.push(`🛡️ ${hero.name} [${skill.name}] → 파티 전원 보호막 전개! [${shieldReports.join(', ')}]`);
            if (skill.id === 'skill_boss_judgment_sanctum') {
              logs.push(`🏰⚔️ [칠흑 성역] 파티 전원의 공격력이 3턴간 ${Math.round(40 * efficiency)}% 상승했습니다!`);
            }
            if (skill.id === 'fortress_ultimate' || (skill.description && skill.description.includes('절대 요새'))) {
              logs.push(`🏰🌟 [절대 요새의 성역] 아군 전원 1턴 완전 무적 및 2턴간 받는 피해 50% 절대 경감 결계를 전개했습니다!`);
            }
          } else {
            logs.push(`🛡️ ${hero.name} [${skill.name}] → ${shieldReports.join(', ')} 보호막 부여`);
          }
        } else if (skill.effectType === 'buff') {
          const sDesc = (skill.description || '').toLowerCase();
          const sid = skill.id || '';
          const isDefBuff = sDesc.includes('방어') || sDesc.includes('철벽') || sDesc.includes('성역') || sDesc.includes('피해 경감');
          const isRegen = sDesc.includes('재생') || sDesc.includes('지속 치유') || (sDesc.includes('결계') && sDesc.includes('치유'));
          const isAtkBuff = sDesc.includes('공격') || sDesc.includes('피해 증폭') || (!isDefBuff && !isRegen);
          const isStealth = sid.includes('stealth') || sid.includes('camouflage') || sDesc.includes('은신');
          const isTimeOrMp = sid.includes('time') || sid.includes('reload') || sid.includes('mana') || sDesc.includes('쿨다운') || sDesc.includes('마나');

          if (isStealth) {
            SoundManager.getInstance().play('evade');
          } else if (isTimeOrMp) {
            SoundManager.getInstance().play('holy_spell');
          } else if (isAtkBuff) {
            SoundManager.getInstance().play('crit');
          } else {
            SoundManager.getInstance().play('shield');
          }

          // 👥 [그림자 위장술 / 심연 은신술 / 은신 계열 버프]
          if (sid === 'sharp_camouflage' || sid === 'sniper_shadow_meld' || sDesc.includes('은신')) {
            const isSniperMeld = sid === 'sniper_shadow_meld' || sDesc.includes('100%');
            const stealthMag = Number(((isSniperMeld ? 1.0 : 0.70) * ultMult).toFixed(2));
            applyStatusEffect(hero, {
              type: 'stealth',
              turnsLeft: 2,
              totalTurns: 2,
              magnitude: stealthMag,
              source: skill.name
            });
            logs.push(`👥 [그림자 은신] ${hero.name}이(가) 그림자 속으로 숨어들어 은신했습니다! (다음 공격 위력 +${Math.round(stealthMag * 100)}%)`);
          }

          // ⚡💨 [신기루 검무: 환영 반격]
          if (sid === 'dancer_mirage_dance' || sDesc.includes('환영 반격') || sDesc.includes('신기루 검무')) {
            applyStatusEffect(hero, {
              type: 'riposte',
              turnsLeft: 3,
              totalTurns: 3,
              magnitude: Number((0.50 * ultMult).toFixed(2)),
              source: '신기루 검무'
            });
            logs.push(`⚡💨 [신기루 검무] 3턴간 회피율 50% 증폭 및 회피 성공 시마다 140% 환영 반격 태세를 전개했습니다!`);
          }

          // ✨🔋 [에테르 과충전: 마나 20 회복 + 다음 마법 100% 증폭]
          if (sid === 'apprentice_mana_burst' || (sDesc.includes('마나') && sDesc.includes('20 회복'))) {
            const addMp = Math.floor(20 * ultMult);
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + addMp);
            applyStatusEffect(hero, {
              type: 'buff_atk',
              turnsLeft: 1,
              totalTurns: 1,
              magnitude: Number((1.0 * ultMult).toFixed(2)),
              source: '에테르 과충전'
            });
            logs.push(`✨🔋 [에테르 과충전] 마나 +${addMp} MP를 회복하고 다음 공격력이 ${Math.round(100 * ultMult)}% 폭풍 증폭되었습니다!`);
          }

          // 🚩🔋 [전사의 함성: 공 25% + 마나 10 회복]
          if (sid === 'van_warcry' || (sDesc.includes('전사의 함성') && sDesc.includes('마나'))) {
            const addMp = Math.floor(10 * ultMult);
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + addMp);
            logs.push(`🚩🔋 [전사의 함성] 사기를 북돋아 마나 +${addMp} MP를 충전했습니다!`);
          }

          // ⏳✨ [시공 왜곡: 전원 쿨다운 1턴 단축 & 마나 28 회복]
          if (sid === 'scholar_time_warp' || sDesc.includes('시공 왜곡')) {
            const addMp = Math.floor(28 * ultMult);
            targetAllies.forEach(ally => {
              ally.currentMp = Math.min(ally.maxMp, ally.currentMp + addMp);
            });
            cooldownReductionTarget = 'all';
            logs.push(`⏳✨ [시공 왜곡] 아군 전체 마나 +${addMp} MP 회복 및 모든 스킬 쿨다운을 1턴 즉시 단축했습니다!`);
          }

          // ⚙️🎯 [오버클럭 리로드: 아군 전체 쿨다운 1턴 단축 & 치명타 50% 증폭]
          if (sid === 'gun_tactical_reload' || sDesc.includes('오버클럭 리로드')) {
            cooldownReductionTarget = 'all';
            applyStatusEffect(hero, {
              type: 'buff_atk',
              turnsLeft: 3,
              totalTurns: 3,
              magnitude: Number((0.50 * ultMult).toFixed(2)),
              source: '오버클럭 리로드'
            });
            logs.push(`⚙️🎯 [오버클럭 리로드] 아군 전체 스킬 쿨다운 1턴 단축 및 3턴간 치명 공격력 ${Math.round(50 * ultMult)}% 증폭!`);
          }

          // ✝️🔥 [성전 선포: HP 20% 희생하여 아군 공격력 46% 증폭]
          if (sid === 'warpriest_holy_proclamation' || sDesc.includes('성전 선포')) {
            const hpCost = Math.floor(hero.maxHp * 0.20);
            hero.currentHp = Math.max(1, hero.currentHp - hpCost);
            logs.push(`✝️🔥 [성전 선포] 자신의 체력 -${hpCost}(20%)를 봉헌하여 아군을 강화합니다!`);
          }

          // 🚩⚔️ [철혈의 패황: 공격력 45% 증폭]
          if (sid === 'iron_marshal' || sDesc.includes('철혈의 패황')) {
            logs.push(`🚩⚔️ [철혈의 패황] 파티 전체의 공격력을 3턴간 ${Math.round(45 * ultMult)}% 증폭했습니다!`);
          }

          // 범용 마나 회복 보정 (기타 비전서/스킬 설명에 마나/mp 회복이 명시된 경우)
          if (!['apprentice_mana_burst', 'van_warcry', 'scholar_time_warp'].includes(sid) && (sDesc.includes('마나') || sDesc.includes('mp')) && sDesc.includes('회복')) {
            const mpMatch = sDesc.match(/마나\s*(\d+)\s*회복|(\d+)\s*mp\s*회복/);
            const rawMp = mpMatch ? parseInt(mpMatch[1] || mpMatch[2], 10) : 15;
            const mpAmt = Math.floor(rawMp * ultMult);
            if (targetType === 'all_allies') {
              targetAllies.forEach(ally => { ally.currentMp = Math.min(ally.maxMp, ally.currentMp + mpAmt); });
              logs.push(`💧 [마나 회복] 파티 전원의 마나가 +${mpAmt} MP 회복되었습니다.`);
            } else {
              hero.currentMp = Math.min(hero.maxMp, hero.currentMp + mpAmt);
              logs.push(`💧 [마나 회복] ${hero.name}의 마나가 +${mpAmt} MP 회복되었습니다.`);
            }
          }

          const buffSummaryList: string[] = [];
          if (isAtkBuff) buffSummaryList.push('공격력');
          if (isDefBuff) buffSummaryList.push('방어력');
          if (isRegen) buffSummaryList.push('지속 재생');
          const buffSummary = buffSummaryList.join('/') || '강화';

          targetAllies.forEach(ally => {
            if (isAtkBuff) {
              applyStatusEffect(ally, {
                type: 'buff_atk',
                turnsLeft: skill.statusDuration || 3,
                totalTurns: skill.statusDuration || 3,
                magnitude: Number(((skill.power || 0.25) * efficiency * ultMult).toFixed(2)),
                source: hero.name
              });
            }
            if (isDefBuff) {
              applyStatusEffect(ally, {
                type: 'buff_def',
                turnsLeft: skill.statusDuration || 3,
                totalTurns: skill.statusDuration || 3,
                magnitude: Number(((skill.power || 0.35) * efficiency * ultMult).toFixed(2)),
                source: hero.name
              });
            }
            if (isRegen) {
              applyStatusEffect(ally, {
                type: 'regen',
                turnsLeft: skill.statusDuration || 3,
                totalTurns: skill.statusDuration || 3,
                magnitude: Number(((skill.power ? Math.min(skill.power * ultMult, 0.40) : 0.08 * ultMult) * efficiency).toFixed(2)),
                source: hero.name
              });
            }
          });
          if (targetType === 'all_allies') {
            logs.push(`⚡ ${hero.name} [${skill.name}] → 파티 전원 [${buffSummary}] 증폭 효과 부여!`);
          } else {
            logs.push(`⚡ ${hero.name} [${skill.name}] → ${targetAllies.map(a => a.name).join(', ')}에게 [${buffSummary}] 증폭 효과 부여`);
          }
        }

        // 🔥 [비공격 지원/치유 궁극기 FEVER 부가 전술 효과 종합 발동]
        if (isUltimate && feverSynergy) {
          if (ultMult > 1.0) {
            logs.push(`🔥⚡ [FEVER 위력 증폭] 【${feverSynergy.name}】 시너지로 지원/치유/버프 효과가 +${Math.round((ultMult - 1) * 100)}% 대폭 강화되었습니다!`);
          }
          // 1. 🩸 기사회생 / 부활
          if (feverSynergy.reviveFallen) {
            let revivedCount = 0;
            gm.party.forEach(ally => {
              const isDead = ally.currentHp <= 0 || ally.deathCountdown !== undefined || ally.isPermanentlyDead;
              if (isDead && (!feverSynergy!.reviveSingle || revivedCount < 1)) {
                revivedCount++;
                const revHp = Math.max(1, Math.floor(ally.maxHp * (feverSynergy!.reviveHpPct || 0.5)));
                ally.currentHp = revHp;
                ally.deathCountdown = undefined;
                ally.isPermanentlyDead = false;
                ally.statusEffects = [];
                logs.push(`🩸🕊️ [${feverSynergy!.name}] 쓰러졌던 ${ally.name}이(가) 기적처럼 HP ${revHp}로 부활했습니다!`);
              }
            });
          }
          // 2. 💖 파티 전원 체력 회복 (100% 완전 회복 또는 partyHealPct 비율 회복)
          if (feverSynergy.partyFullHeal) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.currentHp = ally.maxHp;
            });
            logs.push(`💖✨ [${feverSynergy.name}] 생존 아군 전원의 체력이 100% 완전 회복되었습니다!`);
          } else if (feverSynergy.partyHealPct && feverSynergy.partyHealPct > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const healAmt = Math.max(1, Math.floor(ally.maxHp * feverSynergy!.partyHealPct!));
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
            });
            logs.push(`💖✨ [${feverSynergy.name}] 생존 아군 전원의 체력을 ${Math.round(feverSynergy.partyHealPct * 100)}% 회복했습니다!`);
          }
          // 3. 🛡️ 파티 에테르 방벽 부여
          if (feverSynergy.partyShieldPct > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const shAmt = Math.max(1, Math.floor(ally.maxHp * feverSynergy!.partyShieldPct));
              applyStatusEffect(ally, {
                type: 'shield',
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: shAmt,
                source: `FEVER: ${feverSynergy!.name}`
              });
            });
            logs.push(`🛡️✨ [${feverSynergy.name}] 파티 전원에게 최대 HP ${Math.round(feverSynergy.partyShieldPct * 100)}% 에테르 방벽을 전개했습니다!`);
          }
          // 4. 🕊️ 디버프 완전 정화
          if (feverSynergy.cleanseDebuffs) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.statusEffects = (ally.statusEffects || []).filter(s => !['bleed', 'poison', 'burn', 'frostbite', 'stun', 'blind', 'debuff_atk', 'debuff_def'].includes(s.type));
            });
            logs.push(`🕊️✨ [${feverSynergy.name}] 파티 전원의 모든 해로운 상태이상을 완전히 정화했습니다!`);
          }
          // 5. 🛡️ 상태이상 면역 결계
          if (feverSynergy.immunityTurns > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              applyStatusEffect(ally, {
                type: 'immunity',
                turnsLeft: feverSynergy!.immunityTurns,
                totalTurns: feverSynergy!.immunityTurns,
                magnitude: 1,
                source: feverSynergy!.name
              });
            });
            logs.push(`🛡️✨ [${feverSynergy.name}] 파티 전원에게 ${feverSynergy.immunityTurns}턴간 절대 면역 결계를 부여했습니다!`);
          }
          // 6. ⚔️ 환영 반격 결계
          if (feverSynergy.riposteTurns > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              applyStatusEffect(ally, {
                type: 'riposte',
                turnsLeft: feverSynergy!.riposteTurns,
                totalTurns: feverSynergy!.riposteTurns,
                magnitude: 0.60,
                source: feverSynergy!.name
              });
            });
            logs.push(`⚔️💨 [${feverSynergy.name}] 파티 전원에게 ${feverSynergy.riposteTurns}턴간 100% 환영 반격 결계를 전개했습니다!`);
          }
          // 7. 💫 적 전체 그로기
          if (feverSynergy.stunTurns > 0) {
            nextMonsters.filter(m => m.currentHp > 0).forEach(m => {
              applyStatusEffect(m, {
                type: 'stun',
                turnsLeft: feverSynergy!.stunTurns,
                totalTurns: feverSynergy!.stunTurns,
                magnitude: 1,
                source: feverSynergy!.name
              });
            });
            logs.push(`💫👑 [${feverSynergy.name}] 적 전체에게 ${feverSynergy.stunTurns}턴간 완전 그로기(기절)를 부여했습니다!`);
          }
          // 8. 🔋 파티 MP 회복
          if (feverSynergy.rechargePartyMp) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              ally.currentMp = ally.maxMp;
            });
            logs.push(`🔋👑 [${feverSynergy.name}] 파티 전원의 마나(MP)를 100% 즉시 완충했습니다!`);
          } else if (feverSynergy.rechargePartyMpPct && feverSynergy.rechargePartyMpPct > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              const mpAmt = Math.max(1, Math.floor(ally.maxMp * feverSynergy!.rechargePartyMpPct!));
              ally.currentMp = Math.min(ally.maxMp, ally.currentMp + mpAmt);
            });
            logs.push(`🔋👑 [${feverSynergy.name}] 파티 전원의 마나(MP)를 ${Math.round(feverSynergy.rechargePartyMpPct * 100)}% 회복했습니다!`);
          }
          // 9. 🎯 파티 전체 명중력 증가
          if (feverSynergy.hitRateBonus && feverSynergy.hitRateBonus > 0) {
            gm.party.filter(h => h.currentHp > 0).forEach(ally => {
              applyStatusEffect(ally, {
                type: 'buff_hit' as any,
                turnsLeft: 3,
                totalTurns: 3,
                magnitude: feverSynergy!.hitRateBonus!,
                source: feverSynergy!.name
              });
            });
            logs.push(`🎯🌀 [${feverSynergy.name}] 파티 전원의 명중력이 3턴간 +${Math.round(feverSynergy.hitRateBonus * 100)}% 증가했습니다!`);
          }
        }
        gm.emit('partyUpdated');
      }

      nextMonsters.forEach(m => {
        if (m.currentHp <= 0) {
          m.currentHp = 0;
          m.statusEffects = [];
        }
      });
      monstersRef.current = nextMonsters;
      setMonsters(nextMonsters);

      // 쿨다운 갱신: 이 영웅의 다른 스킬 쿨다운 1턴 감소 및 이번 사용 스킬 쿨다운 적용
      const nextCooldowns = { ...heroCooldownsRef.current };
      if (resetAllPartyCooldowns) {
        Object.keys(nextCooldowns).forEach(k => { nextCooldowns[k] = 0; });
      } else if (cooldownReductionTarget === 'all') {
        Object.keys(nextCooldowns).forEach(k => {
          if (nextCooldowns[k] > 0) nextCooldowns[k] = Math.max(0, nextCooldowns[k] - 1);
        });
      } else if (cooldownReductionTarget === 'self') {
        Object.keys(nextCooldowns).forEach(k => {
          if (k.startsWith(hero.id + '_') && nextCooldowns[k] > 0) {
            nextCooldowns[k] = Math.max(0, nextCooldowns[k] - 1);
          }
        });
      } else {
        Object.keys(nextCooldowns).forEach(k => {
          if (k.startsWith(hero.id + '_') && nextCooldowns[k] > 0) {
            nextCooldowns[k] = Math.max(0, nextCooldowns[k] - 1);
          }
        });
      }

      if (skill !== 'basic') {
        const cdKey = `${hero.id}_${skill.id}`;
        let rawCd = (skill.isSpecial || skill.isUnique)
          ? (skill.cooldown || 0)
          : Math.max(1, skill.cooldown ?? 1);
        // ⏳ [시공의 조율사 패시브: 차원 조율] 파티 전원 스킬 쿨다운 상시 1턴 단축
        if (gm.party.some(p => (p.classId === 'chronomancer' || p.classId === 'chrono_master') && p.currentHp > 0)) {
          rawCd = Math.max(1, rawCd - 1);
        }
        nextCooldowns[cdKey] = rawCd;
      }
      heroCooldownsRef.current = nextCooldowns;
      setHeroCooldowns(nextCooldowns);

      // 💖 [성령의 구원자 패시브: 생명의 샘] 아군이 턴을 소모할 때마다 자동으로 대상의 체력 10% 회복
      if (gm.party.some(p => p.classId === 'high_saintess' && p.currentHp > 0) && hero.currentHp > 0 && hero.currentHp < hero.maxHp) {
        const saintHeal = Math.max(1, Math.floor(hero.maxHp * 0.10));
        hero.currentHp = Math.min(hero.maxHp, hero.currentHp + saintHeal);
        logs.push(`💖 [생명의 샘] 성령의 은총으로 ${hero.name} 체력 +${saintHeal} 회복!`);
      }

      // ✝️ [주교 패시브: 축복의 은혜] 아군 스킬 시전 시 자신의 체력 5% 자동 회복
      if (skill !== 'basic') {
        gm.party.forEach(p => {
          if (p.classId === 'bishop' && p.currentHp > 0 && p.currentHp < p.maxHp) {
            const bishopHeal = Math.max(1, Math.floor(p.maxHp * 0.05));
            p.currentHp = Math.min(p.maxHp, p.currentHp + bishopHeal);
            logs.push(`✝️✨ [축복의 은혜] ${p.name}이(가) 스킬 시전에 공명하여 체력 +${bishopHeal} 회복!`);
          }
        });
      }

      // ✝️ [전투 사제 패시브: 전투 신앙] 공격 시 5% 확률로 즉시 치유
      const isOffensive = effectType === 'damage' || effectType === 'bleed' || effectType === 'stun' || effectType === 'debuff' || effectType === 'drain' || effectType === 'poison' || skill === 'basic';
      if ((hero.classId === 'war_priest' || hero.classId === 'warpriest') && isOffensive && hero.currentHp > 0 && hero.currentHp < hero.maxHp && Math.random() < 0.05) {
        const wpHeal = Math.max(1, Math.floor(hero.maxHp * 0.15));
        hero.currentHp = Math.min(hero.maxHp, hero.currentHp + wpHeal);
        logs.push(`✝️ [전투 신앙 기적] ${hero.name}의 신앙으로 체력 +${wpHeal} 즉시 치유!`);
      }

      // 타겟이 사망한 경우 살아있는 다른 몬스터로 자동 타겟 전환
      if (nextMonsters[targetMonsterIdx] && nextMonsters[targetMonsterIdx].currentHp <= 0) {
        const nextLiveIdx = nextMonsters.findIndex(m => m.currentHp > 0);
        if (nextLiveIdx !== -1) setTargetedMonsterIdx(nextLiveIdx);
      }
      persistBattleSnapshot();

      setTimeout(() => { logs.forEach(msg => gm.addLog(msg, 'reward')); }, 0);

      const anyMonstersAlive = nextMonsters.some(m => m.currentHp > 0);

      // 🌟 [원호 공격 / 약점 추격 / 시너지 연계 / 암살자 고유 패시브 추가 공격 발동 검사]
      let triggeredAssistHero: Mercenary | null = null;
      let assistTitle = '';
      let assistIcon = '⚔️';
      let assistBannerType: 'assist' | 'extra' = 'assist';
      let assistVfx: VFXType = 'slash';
      let assistQuote = '';
      let isWeaknessPursuit = false;
      let weaknessAssistDef: AssistAttackDef | null = null;

      if (isOffensive && anyMonstersAlive) {
        // 🎯 1. [약점 추격 원호 (Weakness Pursuit Assist)]: 치명타 적중 시 다른 아군이 노출된 급소를 포착하여 맹공 (70% 확률)
        if (anyCritLanded && Math.random() < 0.70) {
          const pursuitHero = selectAssistHero(gm.party, hero.id);
          if (pursuitHero) {
            weaknessAssistDef = getHeroAssistDef(pursuitHero);
            triggeredAssistHero = pursuitHero;
            assistTitle = `[${pursuitHero.name}] ${weaknessAssistDef.skillName}`;
            assistIcon = weaknessAssistDef.icon || '🎯⚡';
            assistBannerType = 'assist';
            assistVfx = (weaknessAssistDef.vfx as VFXType) || 'phantom_slash';
            assistQuote = weaknessAssistDef.quote || '빈틈이다. 급소 포착!';
            isWeaknessPursuit = true;
          }
        }

        // 2. 약점 추격 원호가 발동하지 않은 경우: 암살자 치명적 본능 / 유대 원호 / 시너지 연계 검사
        if (!triggeredAssistHero) {
          // 0. 암살자 고유 패시브 [치명적 본능]: 치명타 적중 시 30% 확률 (+행운 보정)로 즉시 추가 공격
          const isAssassin = hero.classId === 'assassin';
          if (isAssassin && anyCritLanded) {
            const luckBonus = (stats.luck || 0) * 0.25;
            const assassinFollowUpRate = Math.min(80, Math.max(30, 30 + luckBonus));
            if (Math.random() * 100 < assassinFollowUpRate) {
              triggeredAssistHero = hero;
              assistTitle = `[치명적 본능] ${hero.name}의 그림자 연격!`;
              assistIcon = '🗡️';
              assistBannerType = 'extra';
              assistVfx = 'crit_slash';
              assistQuote = '어둠 속에서 숨통을 끊는다!';
              logs.push(`⚡🗡️ [치명적 본능] ${hero.name}(암살자)의 치명타 적중으로 그림자 추가 연격이 발동했습니다! (발동 확률: ${Math.round(assassinFollowUpRate)}% [기본 30% + 행운 🍀${Math.round(stats.luck)}])`);
            }
          }

          if (!triggeredAssistHero) {
            const otherAllies = gm.party.filter(p => p.id !== hero.id && p.currentHp > 0);
            // 1. 유대 2단계 (전술적 호흡: Bond >= 40) - 25% 확률로 원호 공격
            const bondAllies = otherAllies.filter(p => gm.getBond(hero.id, p.id) >= 40);
            if (bondAllies.length > 0 && Math.random() < 0.25) {
              triggeredAssistHero = bondAllies[Math.floor(Math.random() * bondAllies.length)];
              const cls = CHARACTER_CLASSES[triggeredAssistHero.classId];
              const isGunner = cls?.role === 'gunner';
              const isMage = cls?.role === 'dealer_mag';
              assistTitle = `[${triggeredAssistHero.name}]의 원호!`;
              assistIcon = cls?.skills?.[0]?.icon || (isGunner ? '🔫' : isMage ? '🔮' : '⚔️');
              assistBannerType = 'assist';
              assistVfx = isGunner ? 'bullet' : isMage ? 'lightning' : 'slash';
              assistQuote = isGunner ? '원호 사격 개시!' : isMage ? '마력 지원 들어간다!' : '내가 엄호하마!';
            } 
            // 2. 시너지 연계/추가 공격 (거너 화망, 암영 연격, 중화기 폭격 등)
            else if (otherAllies.length > 0) {
              const activeSyns = gm.getActiveSynergies();
              const gunnerAllies = otherAllies.filter(p => CHARACTER_CLASSES[p.classId]?.role === 'gunner');
              const meleeAllies = otherAllies.filter(p => CHARACTER_CLASSES[p.classId]?.role === 'dealer_phy' || CHARACTER_CLASSES[p.classId]?.role === 'berserker');
              const mageAllies = otherAllies.filter(p => CHARACTER_CLASSES[p.classId]?.role === 'dealer_mag');

              if (gunnerAllies.length > 0 && activeSyns.some(s => s.id === 'syn_bullet_hell' || s.id === 'syn_orbital_annihilation' || s.id === 'syn_aegis_sniper') && Math.random() < 0.30) {
                triggeredAssistHero = gunnerAllies[Math.floor(Math.random() * gunnerAllies.length)];
                assistTitle = `[${triggeredAssistHero.name}]의 원호 사격!`;
                assistIcon = '🎯';
                assistBannerType = 'assist';
                assistVfx = 'bullet';
                assistQuote = '화망 전개! 일제 사격!';
              } else if (meleeAllies.length > 0 && activeSyns.some(s => s.id === 'syn_shadow_blood' || s.id === 'syn_rearguard' || s.id === 'syn_vanguard') && Math.random() < 0.25) {
                triggeredAssistHero = meleeAllies[Math.floor(Math.random() * meleeAllies.length)];
                assistTitle = `[${triggeredAssistHero.name}]의 추가 공격!`;
                assistIcon = '🗡️';
                assistBannerType = 'extra';
                assistVfx = 'slash';
                assistQuote = '틈을 놓칠 순 없지!';
              } else if (mageAllies.length > 0 && activeSyns.some(s => s.id === 'syn_magitek' || s.id === 'syn_spellblade') && Math.random() < 0.25) {
                triggeredAssistHero = mageAllies[Math.floor(Math.random() * mageAllies.length)];
                assistTitle = `[${triggeredAssistHero.name}]의 비전 원호!`;
                assistIcon = '🔮';
                assistBannerType = 'assist';
                assistVfx = 'lightning';
                assistQuote = '비전의 빛이여, 꿰뚫어라!';
              }
            }
          }
        }
      }

      setTimeout(() => {
        try {
          setSkillCutIn(null);

          if (triggeredAssistHero && anyMonstersAlive && !checkBattleOutcome(monstersRef.current)) {
            // 🌟 원호 / 약점 추격 오버레이 연출 (대사 화면 가로지르기 포함) 및 타격 실행
            setTimeout(() => {
              try {
                const assistHero = triggeredAssistHero!;
                // [1단계: 오버레이 컷인 & 대사 화면 가로지르기 연출 먼저 발동]
                setSkillCutIn({
                  id: String(Date.now()),
                  skillName: assistTitle,
                  icon: assistIcon,
                  isEnemy: false,
                  bannerType: assistBannerType,
                  heroName: assistHero.name,
                  subText: isWeaknessPursuit && weaknessAssistDef ? `${weaknessAssistDef.typeName} 약점 추격 원호!` : undefined,
                  quote: assistQuote,
                  isWeaknessPursuit
                });
                SoundManager.getInstance().play(isWeaknessPursuit ? 'crit' : (assistVfx === 'bullet' ? 'slash' : assistVfx === 'lightning' ? 'spell' : 'slash'));
                addFeverBadge(assistBannerType === 'extra' ? 'extra' : 'assist');

                // [2단계: 대사가 화면 중심을 가로지르는 동안(딜레이 후) 실제 타격 감행]
                const strikeDelay = isWeaknessPursuit ? getBattleDelay(480) : getBattleDelay(320);

                setTimeout(() => {
                  try {
                    // 대상 몬스터 선정 (주 공격 대상 우선 및 살아있는 대상 우선)
                    const currentMonsters = monstersRef.current;
                    const targetM = (targetIds.length > 0 && currentMonsters.find(m => m.id === targetIds[0] && m.currentHp > 0))
                      || (currentMonsters[targetMonsterIdx] && currentMonsters[targetMonsterIdx].currentHp > 0
                        ? currentMonsters[targetMonsterIdx]
                        : currentMonsters.find(m => m.currentHp > 0));

                    if (targetM) {
                      const targetMIdx = currentMonsters.findIndex(m => m.id === targetM.id);
                      const monPos = getMonsterVfxPos(targetMIdx >= 0 ? targetMIdx : 0, currentMonsters.length, true);
                      const aStats = gm.getHeroEffectiveStats(assistHero);
                      const effectiveAtk = aStats.atk || assistHero.stats?.atk || 20;

                      if (isWeaknessPursuit && weaknessAssistDef) {
                        // 🎯 [약점 추격 전용 타격 로직]
                        const pursuitRatio = weaknessAssistDef.ratio || 1.0;
                        const rawPursuitDmg = Math.max(1, Math.floor(effectiveAtk * pursuitRatio * (0.95 + Math.random() * 0.15)));
                        const assistWeaponEnhance = assistHero.equipment?.weapon?.enhanceLevel || 0;
                        const assistTrueDmgRate = assistWeaponEnhance * 0.01;
                        const { actualDamage: rawActualDamage, absorbed, isBlock, isBlockedByDef } = calculateDamage(
                          rawPursuitDmg,
                          targetM.def,
                          targetM.statusEffects || [],
                          true, // 약점 추격: 치명타 확정
                          1.5 + (aStats.luck * 0.005),
                          0,
                          1,
                          false,
                          assistTrueDmgRate
                        );
                        const actualDamage = isNaN(rawActualDamage) ? Math.max(1, Math.floor(effectiveAtk * 0.6)) : rawActualDamage;

                        targetM.currentHp = Math.max(0, targetM.currentHp - actualDamage);
                        if (isNaN(targetM.currentHp) || targetM.currentHp <= 0) {
                          targetM.currentHp = 0;
                          targetM.statusEffects = [];
                        }
                        monstersRef.current = [...currentMonsters];
                        setMonsters([...currentMonsters]);
                        persistBattleSnapshot();

                        // 💥 타격 이펙트 및 피드백 (플래시 + 스크린 쉐이크 + 사운드 + VFX)
                        setScreenFlash('ally');
                        setTimeout(() => setScreenFlash(null), 250);
                        triggerScreenShake();
                        SoundManager.getInstance().play(weaknessAssistDef.sound === 'crit' ? 'crit' : weaknessAssistDef.sound === 'shield' ? 'shield' : weaknessAssistDef.sound === 'spell' ? 'spell' : 'slash');

                        triggerVFX({
                          type: isBlock ? 'shield' : ((weaknessAssistDef.vfx as VFXType) || 'phantom_slash'),
                          x: monPos.x + 10,
                          y: monPos.y - 10,
                          damage: actualDamage,
                          isCrit: !isBlock,
                          isBlock,
                          text: isBlock ? 'Block!' : `🎯약점 원호: ${weaknessAssistDef.skillName}`
                        });

                        let logSuffix = '';
                        if (isBlockedByDef) logSuffix += ` 🛡️(방어력 감쇄)`;
                        if (absorbed > 0) logSuffix += ` (보호막 ${absorbed} 흡수)`;
                        gm.addLog(`▶ 🎯⚡ [약점 추격 원호!] ${assistHero.name} (${weaknessAssistDef.typeName}): "${assistQuote}" [${weaknessAssistDef.skillName}] → ${targetM.data.name}에게 ${actualDamage} 치명 피해! (${weaknessAssistDef.desc})${logSuffix}`, 'reward');

                        // 계열별 고유 특수 효과 적용 (주 공격 선언 후 부가 효과 순차 출력)
                        if (weaknessAssistDef.effectType === 'shield') {
                          const shieldVal = Math.max(10, Math.floor(assistHero.maxHp * 0.12));
                          gm.party.forEach(p => {
                            if (p.currentHp > 0) p.currentHp = Math.min(p.maxHp, p.currentHp + Math.floor(shieldVal * 0.5));
                          });
                          gm.addLog(`🛡️ [원호 보호막] ${assistHero.name}의 엄호로 파티 전원 보호막 +${Math.floor(shieldVal * 0.5)} 부여!`, 'reward');
                        } else if (weaknessAssistDef.effectType === 'bleed') {
                          applyStatusEffect(targetM, {
                            type: 'bleed',
                            turnsLeft: 2,
                            totalTurns: 2,
                            magnitude: 0.08,
                            source: `원호: ${assistHero.name}`
                          });
                          gm.addLog(`🩸 [원호 출혈] ${targetM.data.name}에게 2턴간 출혈 효과를 부여했습니다!`, 'reward');
                        } else if (weaknessAssistDef.effectType === 'mana') {
                          gm.party.forEach(p => {
                            if (p.currentHp > 0) p.currentMp = Math.min(p.maxMp, p.currentMp + 8);
                          });
                          gm.addLog(`✨ [원호 마나 공급] ${assistHero.name}의 지원으로 파티 전원 마나 +8 MP 회복!`, 'reward');
                        } else if (weaknessAssistDef.effectType === 'heal') {
                          const lowest = [...gm.party].filter(p => p.currentHp > 0).sort((a,b)=>(a.currentHp/a.maxHp)-(b.currentHp/b.maxHp))[0];
                          if (lowest) {
                            const hAmt = Math.max(1, Math.floor(lowest.maxHp * 0.25));
                            lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + hAmt);
                            gm.addLog(`💖 [원호 응급치유] ${assistHero.name}의 치유 기도로 ${lowest.name} 체력 +${hAmt} 회복!`, 'reward');
                          }
                        } else if (weaknessAssistDef.effectType === 'debuff_atk') {
                          applyStatusEffect(targetM, {
                            type: 'debuff_atk',
                            turnsLeft: 2,
                            totalTurns: 2,
                            magnitude: 0.25,
                            source: `원호: ${assistHero.name}`
                          });
                          gm.addLog(`⚔️⬇️ [원호 공격력 약화] ${targetM.data.name}의 공격력이 2턴간 25% 감소했습니다!`, 'reward');
                        } else if (weaknessAssistDef.effectType === 'debuff_def') {
                          applyStatusEffect(targetM, {
                            type: 'debuff_def',
                            turnsLeft: 2,
                            totalTurns: 2,
                            magnitude: 0.30,
                            source: `원호: ${assistHero.name}`
                          });
                          gm.addLog(`🛡️⬇️ [원호 방어력 분쇄] ${targetM.data.name}의 방어력이 2턴간 30% 분쇄되었습니다!`, 'reward');
                        }
                      } else {
                        // 🤝 [일반 원호 / 시너지 / 암살자 추가 공격 타격 로직]
                        const monsterEvadeBonus = Math.min(70, ((targetM.luck || 10) * 0.3));
                        const hitChance = clamp(90 + (aStats.luck * 0.2) - monsterEvadeBonus, 30, 99);
                        const isHit = Math.random() * 100 <= hitChance;

                        if (!isHit) {
                          triggerVFX({
                            type: 'evade',
                            x: monPos.x,
                            y: monPos.y,
                            damage: 0,
                            text: '💨 EVADE',
                          });
                          SoundManager.getInstance().play('evade');
                          if (assistHero.id === hero.id && assistHero.classId === 'assassin') {
                            gm.addLog(`💨 [회피 / EVADE] ${targetM.data.name}이(가) ${hero.name}의 [치명적 본능] 추가 연격을 회피했습니다!`, 'reward');
                          } else {
                            gm.addLog(`💨 [회피 / EVADE] ${targetM.data.name}이(가) ${assistHero.name}의 ${assistTitle} 공격을 회피했습니다!`, 'reward');
                          }
                        } else {
                          const isCrit = Math.random() * 100 < gm.getCritChance(aStats.luck);
                          const critMult = 1.5 + (aStats.luck * 0.005);
                          const rawAssistDmg = Math.max(1, Math.floor(effectiveAtk * 0.80));
                          const assistWeaponEnhance = assistHero.equipment?.weapon?.enhanceLevel || 0;
                          const assistTrueDmgRate = assistWeaponEnhance * 0.01;
                          const { actualDamage: rawActualDamage, absorbed, isBlock, isBlockedByDef } = calculateDamage(
                            rawAssistDmg,
                            targetM.def,
                            targetM.statusEffects || [],
                            isCrit,
                            critMult,
                            0,
                            1,
                            false,
                            assistTrueDmgRate
                          );
                          const actualDamage = isNaN(rawActualDamage) ? Math.max(1, Math.floor(effectiveAtk * 0.4)) : rawActualDamage;

                          targetM.currentHp = Math.max(0, targetM.currentHp - actualDamage);
                          if (isNaN(targetM.currentHp) || targetM.currentHp <= 0) {
                            targetM.currentHp = 0;
                            targetM.statusEffects = [];
                          }
                          monstersRef.current = [...currentMonsters];
                          setMonsters([...currentMonsters]);
                          persistBattleSnapshot();

                          triggerScreenShake();
                          const targetVfxType = isBlock ? 'shield' : (isCrit ? 'crit_slash' : assistVfx);
                          triggerVFX({
                            type: targetVfxType,
                            x: monPos.x,
                            y: monPos.y,
                            damage: actualDamage,
                            isCrit: isCrit && !isBlock,
                            isBlock,
                            text: isBlock ? 'Block!' : undefined,
                          });

                          if (isBlock) {
                            SoundManager.getInstance().play('shield');
                            gm.addLog(`🛡️ [보호막 방어 / Block!] ${assistTitle} → ${targetM.data.name}의 보호막이 공격을 완전히 흡수했습니다! (보호막 ${absorbed} 흡수)`, 'reward');
                          } else {
                            let logSuffix = '';
                            if (isBlockedByDef) logSuffix += ` 🛡️(방어력 감쇄: 최소 피해 1)`;
                            if (absorbed > 0) logSuffix += ` (보호막 ${absorbed} 흡수)`;

                            if (assistHero.id === hero.id && assistHero.classId === 'assassin') {
                              gm.addLog(`▶ ⚡🗡️ [치명적 본능] ${hero.name}의 그림자 추가 연격${isCrit ? ' 💥[크리티컬!]' : ''} → ${targetM.data.name}에게 ${actualDamage} 치명 피해!${logSuffix}`, 'reward');
                            } else {
                              gm.addLog(`▶ 🤝 [원호/추가 공격] ${assistTitle}${isCrit ? ' 💥[크리티컬!]' : ''} → ${targetM.data.name}에게 ${actualDamage} 피해!${logSuffix}`, 'reward');
                            }

                            // 🌟 상태이상 판정 (암살자 출혈 등 부가효과 적용)
                            if (targetM.currentHp > 0 && actualDamage > 0) {
                              const checkMonResist = (_effectName: string): boolean => {
                                const resistChance = Math.min(50, (targetM.luck || 10) * 0.35);
                                return Math.random() * 100 < resistChance;
                              };
                              if (assistHero.classId === 'assassin' && Math.random() < 0.35 && !checkMonResist('출혈')) {
                                applyStatusEffect(targetM, {
                                  type: 'bleed',
                                  turnsLeft: 2,
                                  totalTurns: 2,
                                  magnitude: 0.07,
                                  source: `${assistHero.name} (치명적 본능)`
                                });
                                gm.addLog(`🩸 [출혈 유발] ${targetM.data.name}에게 2턴간 출혈 효과를 부여했습니다!`, 'reward');
                              }
                            }
                          }
                        }
                      }
                    }

                    setTimeout(() => {
                      setSkillCutIn(null);
                      if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
                      isProcessingRef.current = false;
                      setIsProcessing(false);
                    }, getBattleDelay(isWeaknessPursuit ? 700 : 800));
                  } catch (err) {
                    console.error('Assist strike error:', err);
                    setSkillCutIn(null);
                    if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                  }
                }, strikeDelay);
              } catch (assistErr) {
                console.error('Assist attack execution error:', assistErr);
                setSkillCutIn(null);
                isProcessingRef.current = false;
                setIsProcessing(false);
                if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
              }
            }, getBattleDelay(320));
          } else {
            if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
            isProcessingRef.current = false;
            setIsProcessing(false);
          }
        } catch (postErr) {
          console.error('Post attack execution error:', postErr);
          if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
          isProcessingRef.current = false;
          setIsProcessing(false);
        }
      }, getBattleDelay(isSkillAttack ? 400 : 300));
    } catch (skillErr) {
      console.error('Skill main execution error:', skillErr);
      setSkillCutIn(null);
      isProcessingRef.current = false;
      setIsProcessing(false);
      if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
    }
  }, delayMs);
} catch (outerErr) {
  console.error('executeSkill outer error:', outerErr);
  setSkillCutIn(null);
  isProcessingRef.current = false;
  setIsProcessing(false);
  advanceTurn();
}
  }, [gm, advanceTurn, checkBattleOutcome, persistBattleSnapshot]);

  // ── 몬스터 공격 및 스킬 실행 (자가 힐/보호막/광역/단일 지원 및 멈춤 방지) ──
  const executeMonsterAttack = useCallback((monsterId: string) => {
    if (isProcessingRef.current || battleEndedRef.current || turnSkippedRef.current) return;
    const currentMonsters = [...monstersRef.current];
    const monsterIdx = currentMonsters.findIndex(m => m.id === monsterId);
    if (monsterIdx === -1 || currentMonsters[monsterIdx].currentHp <= 0) {
      if (checkBattleOutcome(currentMonsters)) return;
      advanceTurn();
      return;
    }

    const monster = currentMonsters[monsterIdx];
    const selfMonPos = getMonsterVfxPos(monsterIdx, currentMonsters.length, currentMonsters.length === 1);

    // 💫 그로기 상태 회복
    if (monster.isGroggy) {
      monster.isGroggy = false;
      gm.addLog(`💫 ${monster.data.name}이(가) 그로기 상태에서 회복했습니다.`, 'system');
    }

    // 동상/결빙 또는 기절 상태인 경우 행동 완전 차단 (차징 중이었다면 차징 해제)
    const ccEffects = (monster.statusEffects || []).filter(se => se.type === 'freeze' || se.type === 'stun');
    if (ccEffects.length > 0 || turnSkippedRef.current) {
      if (monster.chargingState) {
        monster.chargingState = null;
        monster.isGroggy = true;
        gm.addLog(`💥 [차징 취소] 결빙/기절로 인해 ${monster.data.name}의 차징이 붕괴되었습니다!`, 'reward');
      }
      if (turnSkippedRef.current) {
        return;
      }
      const ccReasons = ccEffects.map(se => se.type === 'freeze' ? '❄️ 빙결' : '💫 기절');
      const reasonStr = ccReasons.length > 0 ? ccReasons.join(', ') : '행동 불가';
      gm.addLog(`⚠️ [행동 불가] ${monster.data.name}이(가) [${reasonStr}] 상태로 인해 아무 행동도 하지 못하고 턴을 넘깁니다.`, 'system');
      advanceTurn();
      return;
    }

    const aliveHeroes = gm.party.filter(h => h.currentHp > 0);
    if (aliveHeroes.length === 0) {
      advanceTurn();
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setAttackingMonsterId(monster.id);

    try {
      // 랜덤 스킬 또는 기본 공격 선택 (차징 상태 우선 처리)
      const skillList = monster.data.skills || [];
      let selectedSkill: MonsterSkill | null = null;
      let isReleasingCharge = false;

      if (monster.chargingState) {
        selectedSkill = monster.chargingState.skill;
        monster.chargingState = null;
        isReleasingCharge = true;
        gm.addLog(`💥⚠️ [차징 완료!] ${monster.data.name}이(가) 응축된 힘을 폭발시키며 [${selectedSkill.name}]을(를) 방출합니다! (확정 치명타 & 방어 관통 50%)`, 'danger');
      } else {
        // 차징 스킬 시전 확률 상향 (차징 스킬이 있는 경우 55% 확률로 차징 스킬 우선 고려)
        const chargeSkills = skillList.filter(s => s.isCharge);
        if (chargeSkills.length > 0 && Math.random() < 0.55) {
          selectedSkill = chargeSkills[Math.floor(Math.random() * chargeSkills.length)];
        } else {
          selectedSkill = skillList.length > 0 && Math.random() > 0.25 ? skillList[Math.floor(Math.random() * skillList.length)] : null;
        }
      }

      // ⚡ [차징 스킬 감지 시 차징 모드 돌입]
      if (selectedSkill && selectedSkill.isCharge && !isReleasingCharge) {
        const breakGauge = selectedSkill.breakGauge || Math.max(100, Math.floor(monster.maxHp * 0.25));
        monster.chargingState = {
          skillName: selectedSkill.name,
          remainingBreakDmg: breakGauge,
          maxBreakDmg: breakGauge,
          skill: selectedSkill,
        };
        monstersRef.current = currentMonsters;
        setMonsters([...currentMonsters]);

        gm.addLog(`⚠️ [위기 경고] ${monster.data.name}이(가) 강력한 일격 [${selectedSkill.name}] 시전을 위해 힘을 모으기 시작합니다! (브레이크 저지 요구치: ${breakGauge} 피해 또는 기절/빙결)`, 'danger');
        setSkillCutIn({
          id: String(Date.now()),
          skillName: `⚠️ [차징 경고] ${selectedSkill.name}`,
          icon: '⚡⚠️',
          isEnemy: true,
          bannerType: 'skill',
          subText: `브레이크 저지 요구 피해: ${breakGauge}`
        });
        SoundManager.getInstance().play('charge');
        triggerVFX({
          type: 'boss_abyss_vortex',
          x: selfMonPos.x,
          y: selfMonPos.y,
          damage: 0,
          text: 'CHARGING!',
        });

        // 💨 [아이디어 5: 적 특수 차징 시전 시 아군의 '시전 요격 추가타 (Intercept Assist)']
        const livingAllies = gm.party.filter(p => p.currentHp > 0);
        const interceptor = livingAllies.find(p => ['gunner', 'rogue', 'apprentice', 'elementalist', 'assassin', 'duelist'].includes(p.classId)) || livingAllies[0];
        if (interceptor && monster.chargingState) {
          const interceptorStats = gm.getHeroEffectiveStats(interceptor);
          const effectiveInterAtk = interceptorStats.atk || interceptor.stats?.atk || 20;
          const interceptBaseDmg = Math.max(15, Math.floor(effectiveInterAtk * 0.75));
          const breakCut = Math.min(monster.chargingState.remainingBreakDmg, Math.max(40, Math.floor(breakGauge * 0.20)));
          monster.chargingState.remainingBreakDmg -= breakCut;
          monster.currentHp = Math.max(1, monster.currentHp - interceptBaseDmg);
          if (isNaN(monster.currentHp)) monster.currentHp = 1;

          setTimeout(() => {
            setSkillCutIn({
              id: String(Date.now() + 3),
              skillName: `[${interceptor.name}] 시전 요격 사격!`,
              icon: '💨🎯',
              isEnemy: false,
              bannerType: 'assist',
              heroName: interceptor.name,
              subText: `브레이크 요구치 -${breakCut} 선제 파쇄!`
            });
            SoundManager.getInstance().play('crit');
            addFeverBadge('assist');
            triggerVFX({
              type: 'bullet_trail',
              x: selfMonPos.x,
              y: selfMonPos.y - 15,
              damage: interceptBaseDmg,
              isCrit: true,
              text: '🎯INTERCEPT!',
            });
            gm.addLog(`▶ 💨🎯 [시전 요격 추가타!] ${interceptor.name}: "차징을 끊어라! 선제 사격!" ${monster.data.name}에게 ${interceptBaseDmg} 요격 피해 및 브레이크 요구치 -${breakCut} 선제 파쇄!`, 'reward');
          }, getBattleDelay(350));
        }

        setTimeout(() => {
          setSkillCutIn(null);
          setAttackingMonsterId(null);
          isProcessingRef.current = false;
          setIsProcessing(false);
          if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
        }, getBattleDelay(interceptor ? 950 : 650));
        return;
      }

      // 🌟 1. 몬스터 힐 / 아군 치유 스킬 (e.g. 타락한 사제의 피의 의식, 촉수괴수의 흑무 흡수, 대지의 고동)
      if (selectedSkill && selectedSkill.effectType === 'heal') {
        setSkillCutIn({
          id: String(Date.now()),
          skillName: selectedSkill.name,
          icon: '💚',
          isEnemy: true,
        });
        SoundManager.getInstance().play('spell');

        setTimeout(() => {
          SoundManager.getInstance().play('heal');

          // 살아있는 몬스터들 중 체력 비율이 가장 낮은 대상 선정 (아군 치유 지원)
          const livingMonsters = currentMonsters.filter(m => m.currentHp > 0);
          let targetHealMon = monster;
          if (livingMonsters.length > 1) {
            targetHealMon = livingMonsters.reduce((lowest, curr) => {
              const lowestRatio = lowest.currentHp / lowest.maxHp;
              const currRatio = curr.currentHp / curr.maxHp;
              return currRatio < lowestRatio ? curr : lowest;
            }, monster);
          }

          // 힐량 계산: power가 0.5 초과인 과도한 수치 방지 (최대 28~30% 적정 캡)
          const rawPower = selectedSkill?.power || 0.25;
          const safePower = rawPower > 0.5 ? 0.28 : rawPower;
          const healAmt = Math.max(1, Math.floor(targetHealMon.maxHp * safePower));

          targetHealMon.currentHp = Math.min(targetHealMon.maxHp, targetHealMon.currentHp + healAmt);

          if (selectedSkill?.description?.includes('방어력') || selectedSkill?.description?.includes('방어')) {
            applyStatusEffect(targetHealMon, { type: 'buff_def', turnsLeft: 2, totalTurns: 2, magnitude: 0.2, source: monster.data.name });
          }

          monstersRef.current = currentMonsters;
          setMonsters([...currentMonsters]);

          const targetHealMonIdx = currentMonsters.findIndex(m => m.id === targetHealMon.id);
          const healVfxPos = getMonsterVfxPos(targetHealMonIdx >= 0 ? targetHealMonIdx : monsterIdx, currentMonsters.length);

          triggerVFX({
            type: 'holy_heal',
            x: healVfxPos.x,
            y: healVfxPos.y,
            damage: healAmt,
            isHeal: true,
          });

          if (targetHealMon.id === monster.id) {
            gm.addLog(`💚 ${monster.data.name} [${selectedSkill?.name}] → 자신 체력 +${healAmt} 회복!`, 'system');
          } else {
            gm.addLog(`💚 ${monster.data.name} [${selectedSkill?.name}] → 부상당한 아군 ${targetHealMon.data.name} 체력 +${healAmt} 치유!`, 'system');
          }

          setTimeout(() => {
            setSkillCutIn(null);
            setAttackingMonsterId(null);
            isProcessingRef.current = false;
            setIsProcessing(false);
            if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
          }, getBattleDelay(350));
        }, getBattleDelay(380));
        return;
      }

      // 🌟 2. 몬스터 자가 보호막 스킬 (e.g. 데스나이트 방벽, 수호자 방진)
      if (selectedSkill && selectedSkill.effectType === 'shield') {
        setSkillCutIn({
          id: String(Date.now()),
          skillName: selectedSkill.name,
          icon: '🛡️',
          isEnemy: true,
        });
        SoundManager.getInstance().play('spell');

        setTimeout(() => {
          SoundManager.getInstance().play('shield');
          const shieldAmt = Math.max(1, Math.floor(monster.maxHp * (selectedSkill?.power || 0.3)));
          applyStatusEffect(monster, {
            type: 'shield',
            turnsLeft: selectedSkill?.statusDuration || 2,
            totalTurns: selectedSkill?.statusDuration || 2,
            magnitude: shieldAmt,
            source: monster.data.name
          });

          monstersRef.current = currentMonsters;
          setMonsters([...currentMonsters]);

          triggerVFX({
            type: 'shield',
            x: selfMonPos.x,
            y: selfMonPos.y,
            damage: shieldAmt,
            isShield: true,
          });

          gm.addLog(`🛡️ ${monster.data.name} [${selectedSkill?.name}] → 보호막(${shieldAmt}) 전개!`, 'system');

          setTimeout(() => {
            setSkillCutIn(null);
            setAttackingMonsterId(null);
            isProcessingRef.current = false;
            setIsProcessing(false);
            if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
          }, 350);
        }, 380);
        return;
      }

      // 🌟 3. 공격 스킬 (광역 AoE 또는 단일 공격)
      const isAoE = Boolean(selectedSkill && (selectedSkill.description.includes('전체') || selectedSkill.name.includes('전체') || selectedSkill.description.includes('광역')));
      
      // 대상 선정: 광역이면 생존 전원, 단일이면 위치 가중치(전열 50%, 중열 35%, 후열 15%)
      let targetHeroes: Mercenary[] = [];
      if (isAoE) {
        targetHeroes = aliveHeroes;
      } else {
        // 👥 [은신 (Stealth) 대상 제외]: 은신 상태인 아군은 다른 아군이 살아있는 한 타겟팅 대상에서 제외
        const unstealthed = aliveHeroes.filter(h => !(h.statusEffects || []).some(se => se.type === 'stealth'));
        const candidates = unstealthed.length > 0 ? unstealthed : aliveHeroes;
        const weights = candidates.map(h => h.position === 'front' ? 5 : h.position === 'mid' ? 3 : 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let singleTarget = candidates[0];
        for (let i = 0; i < candidates.length; i++) {
          if (rand < weights[i]) { singleTarget = candidates[i]; break; }
          rand -= weights[i];
        }
        targetHeroes = [singleTarget];
      }

      if (selectedSkill) {
        setSkillCutIn({
          id: String(Date.now()),
          skillName: selectedSkill.name,
          icon: monster.data.type === 'boss' ? '👑' : monster.data.type === 'elite' ? '⭐' : '👾',
          isEnemy: true,
        });
      }

      const delayMs = selectedSkill ? 380 : 0;

      setTimeout(() => {
        const { vfx: monVfx, sfx: monSfx } = resolveCombatVfxAndSfx(selectedSkill || 'basic', monster.data, isAoE);
        let heroHitLanded = false;

        // 공격력 보정 (공격력 디버프 누적 연산)
        let atk = monster.atk;
        const atkDebuffs = monster.statusEffects?.filter(s => s.type === 'debuff_atk') || [];
        const totalAtkDebuff = atkDebuffs.reduce((sum, s) => sum + (s.magnitude || 0), 0);
        if (totalAtkDebuff > 0) atk = Math.max(1, Math.floor(atk * (1 - Math.min(0.85, totalAtkDebuff))));

        const hitReports: string[] = [];

        targetHeroes.forEach((target) => {
          const targetPartyIdx = gm.party.findIndex(h => h.id === target.id);
          const heroPos = getHeroVfxPos(targetPartyIdx >= 0 ? targetPartyIdx : 0, true, gm.party.length);
          const heroStats = gm.getHeroEffectiveStats(target);
          const monLuck = monster.luck || 10;

          // 🌟 [실명(Blind) 및 명중률 저하에 따른 몬스터 공격 빗나감 (MISS) 판정]
          const blindEffect = monster.statusEffects?.find(s => s.type === 'blind');
          if (blindEffect) {
            const missChance = blindEffect.magnitude || 0.50;
            if (Math.random() < missChance) {
              triggerVFX({
                type: 'evade',
                x: heroPos.x,
                y: heroPos.y,
                damage: 0,
                text: '💨 MISS'
              });
              SoundManager.getInstance().play('evade');
              hitReports.push(`[${target.name}] 💨빗나감(MISS)`);
              return;
            }
          }

          // 🌟 [원정대 시너지] 중열 회피율 보너스(midRowEvasionBonus)
          const activeSyns = gm.getActiveSynergies();
          let extraEvadePct = 0;
          if (target.position === 'mid') {
            activeSyns.forEach(syn => {
              if (syn.buffs.midRowEvasionBonus) extraEvadePct += syn.buffs.midRowEvasionBonus;
            });
          }

          // 🌟 [환영의 반격 (Riposte) 버프 확인: 회피율 +60%]
          const riposteBuff = (target.statusEffects || []).find(s => s.type === 'riposte');
          const riposteEvadeBonus = riposteBuff ? (riposteBuff.magnitude || 0.60) : 0;

          // 🌟 [행운 기반 아군 회피 판정]: 몬스터 행운(+0.2%) vs 아군 행운(-0.3%) - 중열 회피 보너스 - 반격 회피 보너스 (회피 보정 최대 70% 캡)
          const heroEvadeBonus = Math.min(70, (heroStats.luck * 0.3) + ((extraEvadePct + riposteEvadeBonus) * 100));
          const hitChance = clamp(90 + (monLuck * 0.2) - heroEvadeBonus, 30, 99);
          if (Math.random() * 100 > hitChance) {
            addFeverBadge('evade');
            triggerVFX({
              type: 'evade',
              x: heroPos.x,
              y: heroPos.y,
              damage: 0,
              text: '💨 EVADE'
            });
            SoundManager.getInstance().play('evade');

            // 🌟 [그림자 결투사 패시브: 결투의 호흡] 회피 성공 시 다음 턴 공격력 +35% & 마나 10 회복
            const isDuelist = target.classId === 'duelist' || target.classId === 'rogue' || target.classId === 'shadow_phantom';
            if (isDuelist) {
              applyStatusEffect(target, {
                type: 'buff_atk',
                turnsLeft: 2,
                totalTurns: 2,
                magnitude: 0.35,
                source: `${target.name} (결투의 호흡)`
              });
              target.currentMp = Math.min(target.maxMp, target.currentMp + 10);
            }

            // 🌟 [환영의 반격 발동]: 회피 시에도 즉시 130% 반격 일격
            if (riposteBuff) {
              addFeverBadge('counter');
              const riposteDmg = Math.max(1, Math.floor(heroStats.atk * 1.30));
              monster.currentHp = Math.max(0, monster.currentHp - riposteDmg);
              if (monster.currentHp <= 0) {
                monster.currentHp = 0;
                monster.statusEffects = [];
              }
              monstersRef.current = currentMonsters;
              setMonsters([...currentMonsters]);
              triggerVFX({
                type: 'crit_slash',
                x: selfMonPos.x,
                y: selfMonPos.y,
                damage: riposteDmg,
                isCrit: true,
              });
              SoundManager.getInstance().play('slash');
              hitReports.push(`[${target.name}] 💨회피(EVADE) ➔ ⚔️⚡[환영 반격!] -${riposteDmg}`);
            } else {
              const evadeMsg = extraEvadePct > 0 ? `[${target.name}] 💨[중열 기동] 회피(EVADE)` : `[${target.name}] 💨회피(EVADE)`;
              hitReports.push(isDuelist ? `${evadeMsg} (결투의 호흡)` : evadeMsg);
            }
            return;
          }

          // 🌟 [타격 적중 시에만 몬스터 공격 사운드 및 피격 화면 효과 발동]
          if (!heroHitLanded) {
            heroHitLanded = true;
            triggerScreenShake();
            setScreenFlash('enemy');
            setTimeout(() => setScreenFlash(null), 250);
            SoundManager.getInstance().play(monSfx);
          }

          // 🌟 [몬스터 크리티컬 판정]: 몬스터 행운 기반 (차징 방출 시 확정 치명타)
          const monCritChance = gm.getCritChance(monLuck);
          const isMonsterCrit = isReleasingCharge ? true : (Math.random() * 100 < monCritChance);
          const monsterCritMult = 1.5 + (monLuck * 0.005);

          let rawDmg = selectedSkill ? Math.floor(atk * selectedSkill.power) : atk;
          if (target.position === 'front') rawDmg = Math.max(1, Math.floor(rawDmg * 0.9));

          // 👥 [은신 (Stealth) 중 광역 피해 50% 회피/경감]
          if (isAoE && (target.statusEffects || []).some(se => se.type === 'stealth')) {
            rawDmg = Math.max(1, Math.floor(rawDmg * 0.5));
            hitReports.push(`[${target.name}] 👥[은신 회피] 광역 피해 50% 경감`);
          }

          // 🌟 [원정대 시너지] 전열의 후열 수호 엄호(frontlineGuardPct): 후열 피격 시 생존한 전열 아군이 개입하여 피해 경감
          let guardedFrontHero: Mercenary | null = null;
          let guardSharedRawDmg = 0;
          if (target.position === 'back') {
            const aliveFrontHero = gm.party.find(p => p.position === 'front' && p.currentHp > 0);
            if (aliveFrontHero) {
              let guardPct = 0;
              activeSyns.forEach(syn => {
                if (syn.buffs.frontlineGuardPct) {
                  guardPct = Math.max(guardPct, syn.buffs.frontlineGuardPct);
                }
              });
              // 원호나 엄호로 대신 받는 데미지를 50%로 조정
              if (guardPct > 0 || aliveFrontHero) {
                guardPct = 0.50;
                guardSharedRawDmg = Math.max(1, Math.floor(rawDmg * guardPct));
                rawDmg = Math.max(1, rawDmg - guardSharedRawDmg);
                guardedFrontHero = aliveFrontHero;

                addFeverBadge('guard');
                setSkillCutIn({
                  id: String(Date.now()),
                  skillName: `[${aliveFrontHero.name}]의 수호 엄호!`,
                  icon: '🛡️',
                  isEnemy: false,
                  bannerType: 'guard',
                  heroName: aliveFrontHero.name,
                });
                SoundManager.getInstance().play('shield');
              }
            }
          }

          // 🌟 [원정대 시너지 & 심연의 백과 & 클래스 방어 패시브] 받는 피해 감소(damageReductionPct) 적용
          let totalDmgRed = 0;
          activeSyns.forEach(syn => {
            if (syn.buffs.damageReductionPct) totalDmgRed += syn.buffs.damageReductionPct;
          });
          const codexRed = gm.getCodexBonus().dmgReduction;
          if (codexRed > 0) {
            totalDmgRed += (codexRed / 100);
          }

          // 🛡️ [클래스 고유 방어 패시브]
          if (gm.party.some(p => p.classId === 'paladin' && p.currentHp > 0)) {
            totalDmgRed += 0.15; // 성기사: 파티 전체 받는 피해 15% 경감
          }
          if (gm.party.some(p => p.classId === 'warlord' && p.currentHp > 0 && (p.position === 'front' || (p.position as string) === 'vanguard'))) {
            totalDmgRed += 0.12; // 전쟁 군주: 전열 배치 시 파티 전체 받는 피해 12% 경감
          }
          if (target.classId === 'squire' && (target.position === 'front' || (target.position as string) === 'vanguard')) {
            totalDmgRed += 0.10; // 견습 기사: 전열 배치 시 받는 피해 10% 경감
          }
          if (target.classId === 'fortress' && (target.position === 'front' || (target.position as string) === 'vanguard')) {
            totalDmgRed += 0.30; // 포트리스: 전열 배치 시 받는 피해 30% 경감
          }
          if (target.classId === 'guardian' && Math.random() < 0.30) {
            totalDmgRed += 0.70; // 중장 보병: 피격 시 30% 확률로 70% 무효화
            hitReports.push(`🛡️[중장갑 방벽 70% 무효화]`);
          }

          if (totalDmgRed > 0) {
            rawDmg = Math.max(1, Math.floor(rawDmg * (1 - Math.min(0.75, totalDmgRed))));
          }

          let piercePct = selectedSkill?.piercePct || monster.data.piercePct || 0;
          if (isReleasingCharge) {
            piercePct = Math.min(100, piercePct + 50); // 차징 완료 방출 시 방어 관통 50% 부여
            hitReports.push(`💥⚠️[차징 방출: 확정 치명타 & 방어 관통 50%!]`);
          }
          const shieldBreakMult = monster.data.shieldBreakMult || 1.0;
          const rawDrainPct = selectedSkill?.drainPct || monster.data.drainPct || (selectedSkill?.effectType === 'drain' ? 50 : 0);
          const drainPct = rawDrainPct <= 1 ? rawDrainPct * 100 : rawDrainPct;
          const disruptPos = selectedSkill?.disruptPosition;

          const { actualDamage, absorbed, isBlock, isBlockedByDef } = calculateDamage(
            rawDmg,
            heroStats.def,
            target.statusEffects || [],
            isMonsterCrit,
            monsterCritMult,
            piercePct,
            shieldBreakMult,
            false
          );

          // 🛡️ [피격 대상 보호막 실시간 소모 및 소멸 정리]
          if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(se => !(se.type === 'shield' && (se.magnitude || 0) <= 0));
          }

          // 🩸 [피해 흡혈 (Life Drain) 실제 체력 회복 - 이미 쓰러진 몬스터의 좀비 부활 방지]
          if (monster.currentHp > 0 && drainPct > 0 && actualDamage > 0) {
            const drainHeal = Math.max(1, Math.floor(actualDamage * (drainPct / 100)));
            monster.currentHp = Math.min(monster.maxHp, monster.currentHp + drainHeal);
            monstersRef.current = currentMonsters;
            setMonsters([...currentMonsters]);
            triggerVFX({
              type: 'holy_heal',
              x: selfMonPos.x,
              y: selfMonPos.y,
              damage: drainHeal,
              isHeal: true,
            });
            hitReports.push(`🩸[흡혈 +${drainHeal} HP 회복]`);
          }

          // 🌀 [진형 흔들기 (Disruption: knockback / pull / shuffle) 및 실시간 진형 시너지 변동]
          if (disruptPos && target.currentHp > 0) {
            const prevFormationSyn = gm.getActiveSynergies().find(s => s.category === 'formation');
            const oldPos = target.position || 'mid';
            let newPos: 'front' | 'mid' | 'back' = oldPos;

            if (disruptPos === 'knockback') {
              if (oldPos === 'front') newPos = 'mid';
              else if (oldPos === 'mid') newPos = 'back';
              else newPos = 'back';
            } else if (disruptPos === 'pull') {
              if (oldPos === 'back') newPos = 'mid';
              else if (oldPos === 'mid') newPos = 'front';
              else newPos = 'front';
            } else if (disruptPos === 'shuffle') {
              if (oldPos === 'front') newPos = 'back';
              else if (oldPos === 'back') newPos = 'front';
              else newPos = Math.random() > 0.5 ? 'front' : 'back';
            }

            if (newPos !== oldPos) {
              target.position = newPos;
              const posLabel = newPos === 'front' ? '전열' : newPos === 'mid' ? '중열' : '후열';
              const actionLabel = disruptPos === 'knockback' ? '넉백 밀림' : disruptPos === 'pull' ? '그랩 당겨짐' : '포지션 교란';
              hitReports.push(`🌀[${actionLabel}! ${posLabel}로 이동]`);
              setTimeout(() => gm.addLog(`🌀 [진형 붕괴] ${target.name}이(가) ${actionLabel}되어 [${posLabel}]로 이동했습니다!`, 'danger'), 0);

              // 🌟 진형 변동에 따른 진형 시너지(formation) 실시간 갱신 및 시각 배너 표출
              const newFormationSyn = gm.getActiveSynergies().find(s => s.category === 'formation');
              if (prevFormationSyn?.id !== newFormationSyn?.id) {
                if (newFormationSyn) {
                  addFeverBadge('extra');
                  setTimeout(() => gm.addLog(`⚡ [진형 시너지 변경] 진형 변동으로 [${newFormationSyn.name}] (${newFormationSyn.icon}) 시너지가 즉시 활성화되었습니다! (${newFormationSyn.description})`, 'reward'), 0);
                  setSkillCutIn({
                    id: String(Date.now() + 2),
                    skillName: `⚡ [진형 시너지 전환] ${newFormationSyn.name}`,
                    icon: newFormationSyn.icon,
                    isEnemy: false,
                    bannerType: 'extra',
                    heroName: target.name,
                    subText: newFormationSyn.description
                  });
                } else if (prevFormationSyn) {
                  setTimeout(() => gm.addLog(`⚠️ [진형 시너지 해제] 진형이 무너져 [${prevFormationSyn.name}] 시너지가 해제되었습니다!`, 'danger'), 0);
                }
              }
              gm.emit('partyUpdated', gm.party);
            }
          }
          // ⚠️💥 [적(몬스터)의 아군 대상 상태이상 연계 공격 (Enemy Status Detonation)]
          let enemyComboExtraDmg = 0;
          if (actualDamage > 0 && target.currentHp > 0) {
            const enemyCombo = checkMonsterStatusComboOnHero(monster.data.name, target, actualDamage);
            if (enemyCombo.triggered) {
              enemyComboExtraDmg = enemyCombo.extraDamage;
              hitReports.push(`⚠️💥[적 연계 폭발! ${enemyCombo.icon} ${enemyCombo.comboName}] -${enemyComboExtraDmg}`);

              setTimeout(() => {
                SoundManager.getInstance().play('crit');
                triggerScreenShake();
                triggerHaptic('heavy');
                triggerVFX({
                  type: 'dark_curse',
                  x: heroPos.x + 10,
                  y: heroPos.y - 10,
                  damage: enemyComboExtraDmg,
                  isCrit: true,
                  text: `⚠️${enemyCombo.comboName.split(' ')[0]}`,
                });
              }, 250);

              setTimeout(() => {
                gm.addLog(`⚠️💥 [적의 상태이상 연계!] ${monster.data.name}의 ${enemyCombo.icon} [${enemyCombo.comboName}] 발동! ${enemyCombo.desc}`, 'danger');
              }, 0);

              setSkillCutIn({
                id: String(Date.now() + 2),
                skillName: `⚠️ [적 연계] ${enemyCombo.comboName}`,
                icon: enemyCombo.icon,
                isEnemy: true,
                bannerType: 'detonation',
                subText: enemyCombo.desc,
              });

              // 적 연계 부가 상태이상 처리
              if (enemyCombo.effectType === 'stun') {
                applyStatusEffect(target, { type: 'stun', turnsLeft: 1, totalTurns: 1, magnitude: 0, source: enemyCombo.comboName });
              } else if (enemyCombo.effectType === 'vuln') {
                applyStatusEffect(target, { type: 'debuff_def', turnsLeft: 2, totalTurns: 2, magnitude: 0.25, source: enemyCombo.comboName });
              } else if (enemyCombo.effectType === 'mana_drain') {
                target.currentMp = Math.max(0, target.currentMp - 15);
              } else if (enemyCombo.effectType === 'drain') {
                if (monster.currentHp > 0) {
                  monster.currentHp = Math.min(monster.maxHp, monster.currentHp + enemyComboExtraDmg);
                }
              } else if (enemyCombo.effectType === 'poison_splash') {
                const otherAlly = gm.party.find(p => p.id !== target.id && p.currentHp > 0);
                if (otherAlly) {
                  applyStatusEffect(otherAlly, { type: 'poison', turnsLeft: 2, totalTurns: 2, magnitude: 0.05, source: '맹독 비산' });
                  hitReports.push(`☣️ [독액 비산] ${otherAlly.name}에게 중독이 튀었습니다!`);
                }
              }
            }
          }

          // 👑 [보스 세트 효과] 방어 및 회피 발동
          let finalDmgToHero = actualDamage;
          let finalComboExtraDmg = enemyComboExtraDmg;
          const targetBossSet = getHeroEquippedBossSet(target);
          if (targetBossSet?.effectType === 'evade_chance' && Math.random() < 0.20) {
            finalDmgToHero = 0;
            finalComboExtraDmg = 0;
            setTimeout(() => gm.addLog(`🪞 [${targetBossSet.setName}] 환영 굴절 발동! ${target.name}이(가) 적의 공격을 완전히 투영 회피했습니다!`, 'reward'), 0);
          } else if (targetBossSet?.effectType === 'dmg_reduction') {
            finalDmgToHero = Math.round(finalDmgToHero * 0.80);
          }

          let newHp = target.currentHp - (finalDmgToHero + finalComboExtraDmg);

          // 💖 [유대 Lv.4: 사선의 맹세] (Bond >= 80)
          if (newHp <= 0 && !endureUsedRef.current[target.id]) {
            const hasBond80 = gm.party.some(p => p.id !== target.id && p.currentHp > 0 && gm.getBond(target.id, p.id) >= 80);
            if (hasBond80) {
              newHp = 1;
              endureUsedRef.current[target.id] = true;
              SoundManager.getInstance().play('shield');
              setTimeout(() => gm.addLog(`💖 [사선의 맹세] 동료들과 맺은 굳건한 맹세의 결속이 빛을 발하며, ${target.name} 대원이 불굴의 투지로 죽음의 턱밑에서 버텨냅니다!`, 'story'), 0);
            }
          }
          target.currentHp = Math.max(0, newHp);

          // ✝️ [전투 사제 패시브: 전투 신앙] 피격 피해를 입을 때마다 마나 5 회복
          if ((target.classId === 'war_priest' || target.classId === 'warpriest') && (finalDmgToHero + finalComboExtraDmg > 0) && target.currentHp > 0 && target.currentMp < target.maxMp) {
            const actualGained = Math.min(target.maxMp - target.currentMp, 5);
            if (actualGained > 0) {
              target.currentMp = Math.min(target.maxMp, target.currentMp + actualGained);
              hitReports.push(`✝️[전투 신앙 MP +${actualGained}]`);
            }
          }
          // ✝️ [성전 심판관 패시브: 심판자의 은총] 피격 시 파티 전체 체력 8% 즉시 회복
          if ((target.classId === 'crusader_lord' || target.classId === 'crusade_judge') && (finalDmgToHero + finalComboExtraDmg > 0) && target.currentHp > 0) {
            const partyHeal = Math.max(1, Math.floor(target.maxHp * 0.08));
            gm.party.filter(p => p.currentHp > 0).forEach(p => {
              p.currentHp = Math.min(p.maxHp, p.currentHp + partyHeal);
            });
            hitReports.push(`✝️[심판자의 은총 파티 치유 +${partyHeal}]`);
          }

          if (target.currentHp <= 0) {
            // 🕊️ [발키리 패시브: 불멸의 수호] (자신 사망 시 파티 전원 100% 회복 및 1회 자동 부활)
            if (target.classId === 'aegis_valkyrie' && !valkyrieReviveUsedRef.current[target.id]) {
              valkyrieReviveUsedRef.current[target.id] = true;
              addFeverBadge('guard');
              target.currentHp = Math.floor(target.maxHp * 0.5);
              target.deathCountdown = undefined;
              target.isPermanentlyDead = false;
              target.statusEffects = [];
              gm.party.forEach(h => {
                if (h.currentHp > 0) h.currentHp = h.maxHp;
              });
              SoundManager.getInstance().play('heal');
              setSkillCutIn({
                id: String(Date.now()),
                skillName: `🕊️ [불멸의 수호] ${target.name} 기사회생!`,
                icon: '🕊️👑',
                isEnemy: false,
                bannerType: 'guard',
                heroName: target.name,
                subText: '파티 전원 체력 100% 회복 및 자동 부활'
              });
              setTimeout(() => gm.addLog(`🕊️👑 [불멸의 수호] 발키리 ${target.name}이(가) 쓰러지는 순간 기적의 빛으로 부활하며 생존 파티원의 상처를 치유했습니다!`, 'reward'), 0);
            } else {
              target.currentHp = 0;
              target.statusEffects = [];
              if (target.deathCountdown === undefined && !target.isPermanentlyDead) {
                target.deathCountdown = 3;
                setTimeout(() => gm.addLog(`💀 [사경의 위기] 치명상을 입은 ${target.name} 대원이 의식을 잃고 차가운 바닥에 쓰러졌습니다! 숨결이 완전히 멎기 전에 마물을 베어 넘기거나 성스러운 구원의 손길을 뻗어야 합니다!`, 'danger'), 0);
              }
              triggerHaptic('heroDeath');
            }
          }

          // 💖 [유대 Lv.3: 수호의 결속] (Bond >= 60)
          if (target.currentHp > 0 && target.currentHp <= Math.floor(target.maxHp * 0.25) && !guardianShieldUsedRef.current[target.id]) {
            const guardian = gm.party.find(p => p.id !== target.id && p.currentHp > 0 && gm.getBond(target.id, p.id) >= 60);
            if (guardian) {
              guardianShieldUsedRef.current[target.id] = true;
              addFeverBadge('guard');
              applyStatusEffect(target, { type: 'shield', turnsLeft: 2, totalTurns: 2, magnitude: 50, source: guardian.name });
              SoundManager.getInstance().play('shield');
              setSkillCutIn({
                id: String(Date.now()),
                skillName: `[${guardian.name}]의 수호의 결속!`,
                icon: '💖',
                isEnemy: false,
                bannerType: 'guard',
                heroName: guardian.name,
              });
              setTimeout(() => gm.addLog(`🛡️ [수호의 결속] ${guardian.name}이(가) 빈사의 ${target.name}을(를) 지키기 위해 [보호막 50]을 전개했습니다!`, 'reward'), 0);
            }
          }

          // 몬스터 및 보스 스킬 분위기 & 스케일 차별화
          const isBossMonster = monster.data.type === 'boss';
          const isEliteMonster = monster.data.type === 'elite';
          const isAoeSkill = targetHeroes.length > 1;
          const sName = (selectedSkill?.name || '').toLowerCase();
          const sDesc = (selectedSkill?.description || '').toLowerCase();

          let monsterVfxType: VFXType = 'claw';
          if (isBlock) {
            monsterVfxType = 'shield';
          } else if (isBossMonster) {
            if (sName.includes('종말') || sName.includes('파멸') || sName.includes('대재앙') || sDesc.includes('전체') || monster.isEnraged) {
              monsterVfxType = 'boss_apocalypse';
            } else if (sName.includes('공허') || sName.includes('블랙홀') || sName.includes('심연') || sDesc.includes('중력')) {
              monsterVfxType = 'boss_abyss_vortex';
            } else if (sName.includes('브레스') || sName.includes('숨결') || sName.includes('화염') || sDesc.includes('화염')) {
              monsterVfxType = 'boss_dragon_breath';
            } else if (sName.includes('격진') || sName.includes('분쇄') || sName.includes('지진')) {
              monsterVfxType = 'boss_cataclysm';
            } else if (selectedSkill?.effectType === 'drain' || sDesc.includes('흡혈')) {
              monsterVfxType = 'necrotic_drain';
            } else {
              monsterVfxType = monVfx || 'abyssal_claw';
            }
          } else {
            // 일반 / 엘리트 마물: 스킬/태그로 확정된 VFX를 일관되게 유지
            monsterVfxType = monVfx;
          }

          let appliedMonStatus: string | undefined = undefined;
          if (selectedSkill?.effectType === 'bleed' || sDesc.includes('출혈')) appliedMonStatus = 'bleed';
          else if (selectedSkill?.effectType === 'poison' || sDesc.includes('중독')) appliedMonStatus = 'poison';
          else if (selectedSkill?.effectType === 'stun' || sDesc.includes('기절')) appliedMonStatus = 'stun';
          else if (sDesc.includes('화상')) appliedMonStatus = 'burn';
          else if (sDesc.includes('실명')) appliedMonStatus = 'blind';

          triggerVFX({
            type: monsterVfxType,
            x: heroPos.x,
            y: heroPos.y,
            damage: actualDamage,
            isCrit: isMonsterCrit && !isBlock,
            isBlock,
            text: isBlock ? 'Block!' : undefined,
            tier: isBossMonster ? 3 : isEliteMonster ? 2 : 1,
            sourceType: isBossMonster ? 'boss' : 'monster',
            statusEffect: appliedMonStatus,
            fullScreen: isBossMonster && (isAoeSkill || monster.isEnraged || (selectedSkill?.power || 1) >= 1.4),
            scale: isBossMonster ? 2.4 : isEliteMonster ? 1.4 : 1.05,
          });
          if (isBlock) {
            SoundManager.getInstance().play('shield');
          }

          // 🛡️ [전열 엄호 분담 피해 처리] 엄호로 나눠받은 50% 데미지를 엄호 영웅 본인이 받은 데미지로 계산하여 처리
          if (guardedFrontHero && guardSharedRawDmg > 0 && guardedFrontHero.currentHp > 0) {
            let frontDmgRed = 0;
            activeSyns.forEach(syn => {
              if (syn.buffs.damageReductionPct) frontDmgRed += syn.buffs.damageReductionPct;
            });
            if (codexRed > 0) frontDmgRed += (codexRed / 100);
            if (gm.party.some(p => p.classId === 'paladin' && p.currentHp > 0)) frontDmgRed += 0.15;
            if (gm.party.some(p => p.classId === 'warlord' && p.currentHp > 0 && (p.position === 'front' || (p.position as string) === 'vanguard'))) frontDmgRed += 0.12;
            if (guardedFrontHero.classId === 'squire') frontDmgRed += 0.10;
            if (guardedFrontHero.classId === 'fortress') frontDmgRed += 0.30;
            if (guardedFrontHero.classId === 'guardian' && Math.random() < 0.30) frontDmgRed += 0.70;

            let frontAdjustedRawDmg = guardSharedRawDmg;
            if (frontDmgRed > 0) {
              frontAdjustedRawDmg = Math.max(1, Math.floor(frontAdjustedRawDmg * (1 - Math.min(0.75, frontDmgRed))));
            }

            const frontStats = gm.getHeroEffectiveStats(guardedFrontHero);
            const frontCalc = calculateDamage(
              frontAdjustedRawDmg,
              frontStats.def,
              guardedFrontHero.statusEffects || [],
              isMonsterCrit,
              monsterCritMult,
              piercePct,
              shieldBreakMult,
              false
            );

            let frontFinalDmg = frontCalc.actualDamage;
            const frontBossSet = getHeroEquippedBossSet(guardedFrontHero);
            if (frontBossSet?.effectType === 'evade_chance' && Math.random() < 0.20) {
              frontFinalDmg = 0;
            } else if (frontBossSet?.effectType === 'dmg_reduction') {
              frontFinalDmg = Math.round(frontFinalDmg * 0.80);
            }

            let frontNewHp = guardedFrontHero.currentHp - frontFinalDmg;
            if (frontNewHp <= 0 && !endureUsedRef.current[guardedFrontHero.id]) {
              const hasBond80 = gm.party.some(p => p.id !== guardedFrontHero!.id && p.currentHp > 0 && gm.getBond(guardedFrontHero!.id, p.id) >= 80);
              if (hasBond80) {
                frontNewHp = 1;
                endureUsedRef.current[guardedFrontHero.id] = true;
                SoundManager.getInstance().play('shield');
                setTimeout(() => gm.addLog(`💖 [사선의 맹세] 동료를 지키기 위해 ${guardedFrontHero!.name} 대원이 불굴의 투지로 버텨냅니다!`, 'story'), 0);
              }
            }

            guardedFrontHero.currentHp = Math.max(0, frontNewHp);
            if (guardedFrontHero.currentHp <= 0) {
              guardedFrontHero.isDead = true;
              guardedFrontHero.deathCountdown = 0;
            }

            // 🛡️ [엄호자의 보호막(Shield) 버프 실시간 소모 및 소멸 정리]
            if (guardedFrontHero.statusEffects) {
              guardedFrontHero.statusEffects = guardedFrontHero.statusEffects.filter(se => !(se.type === 'shield' && (se.magnitude || 0) <= 0));
            }
            gm.emit('partyUpdated', gm.party);

            const frontPartyIdx = gm.party.findIndex(p => p.id === guardedFrontHero!.id);
            const frontHeroVfxPos = getHeroVfxPos(frontPartyIdx >= 0 ? frontPartyIdx : 0, true, gm.party.length);

            setTimeout(() => {
              triggerVFX({
                type: 'shield',
                x: frontHeroVfxPos.x,
                y: frontHeroVfxPos.y,
                damage: frontFinalDmg,
                isCrit: false,
                isBlock: frontCalc.isBlock,
                text: frontCalc.isBlock ? 'Block!' : `-${frontFinalDmg} 🛡️엄호 분담`,
              });
            }, 120);

            hitReports.push(`🛡️ [전열 수호] ${guardedFrontHero.name}이(가) 후열 ${target.name} 엄호 (-50% 경감, 분담 피해 -${frontFinalDmg})`);
            setTimeout(() => gm.addLog(`🛡️ [전열 엄호] ${guardedFrontHero!.name}이(가) 후열 ${target.name}의 피해를 50% 대신 받아 ${frontFinalDmg}의 피해를 감내했습니다!`, 'reward'), 0);
          } else if (guardedFrontHero) {
            hitReports.push(`🛡️ [전열 수호] ${guardedFrontHero.name}이(가) 후열 ${target.name} 엄호 (-50% 경감)`);
          }

          // 🌟 상태이상 면역 및 저항 판정 헬퍼
          // 1) 대상 영웅에게 immunity (디버프 면역 결계) 버프가 있는 경우 100% 완전 차단
          // 2) 대상 영웅의 행운(luck)에 비례하여 CC/디버프 무효화 저항 판정
          const checkHeroImmuneOrResist = (effectName: string): boolean => {
            const hasImmunity = (target.statusEffects || []).some(se => se.type === 'immunity' && se.turnsLeft > 0);
            if (hasImmunity) {
              setTimeout(() => gm.addLog(`✨🛡️ [면역 결계] ${target.name}의 성스러운 정화 결계가 [${effectName}] 효과를 완전히 차단했습니다!`, 'reward'), 0);
              return true;
            }
            const resistChance = Math.min(50, heroStats.luck * 0.35);
            if (Math.random() * 100 < resistChance) {
              setTimeout(() => gm.addLog(`🛡️ [저항(RESIST)] ${target.name}이(가) 높은 행운(🍀${heroStats.luck})으로 [${effectName}] 효과를 완전히 저항해냈습니다!`, 'reward'), 0);
              return true;
            }
            return false;
          };

          // 상태이상 부여 (생존 시에만 부여)
          if (target.currentHp > 0) {
            // 0. 화염 강타 등 화상+출혈 복합 스킬: 1턴씩 동시 부여
            if (selectedSkill?.name?.includes('화염 강타') || ((selectedSkill?.name?.includes('화염') || selectedSkill?.description?.includes('화상')) && selectedSkill?.description?.includes('출혈'))) {
              if (!checkHeroImmuneOrResist('화상')) {
                applyStatusEffect(target, {
                  type: 'burn',
                  turnsLeft: selectedSkill.statusDuration || 1,
                  totalTurns: selectedSkill.statusDuration || 1,
                  magnitude: 0.08,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`🔥 [화상] ${target.name}에게 ${selectedSkill.statusDuration || 1}턴간 화상이 부여되었습니다! (매 턴 8% 피해, 방어력 50% 분쇄)`, 'danger'), 0);
              }
              if (!checkHeroImmuneOrResist('출혈')) {
                applyStatusEffect(target, {
                  type: 'bleed',
                  turnsLeft: selectedSkill.statusDuration || 1,
                  totalTurns: selectedSkill.statusDuration || 1,
                  magnitude: 0.07,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`🩸 [출혈] ${target.name}에게 ${selectedSkill.statusDuration || 1}턴간 출혈이 발생했습니다! (매 턴 7% 지속 피해, 공격력 -40%)`, 'danger'), 0);
              }
            }
            // 1. 빙결/냉각/한기: 1턴 행동불가 & 지속 중 외피 동결 방어력 +40%
            else if (selectedSkill?.name?.includes('빙결') || selectedSkill?.name?.includes('냉각') || selectedSkill?.name?.includes('한기') || selectedSkill?.description?.includes('빙결') || selectedSkill?.description?.includes('냉각') || selectedSkill?.description?.includes('한기')) {
              if (!checkHeroImmuneOrResist('빙결/냉각')) {
                applyStatusEffect(target, {
                  type: 'freeze',
                  turnsLeft: selectedSkill.statusDuration || 1,
                  totalTurns: selectedSkill.statusDuration || 1,
                  magnitude: 0.04,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`❄️ [냉각 동결] ${target.name}에게 빙결/냉각이 부여되었습니다! (1턴 행동불가, 지속 중 외피 동결 방어력 +40%)`, 'system'), 0);
              }
            } 
            // 2. 화상: 매 턴 8% 화염 피해 & 방어력 -50%
            else if (selectedSkill?.name?.includes('화상') || selectedSkill?.name?.includes('화염') || selectedSkill?.name?.includes('불길') || selectedSkill?.description?.includes('화상') || selectedSkill?.description?.includes('화염')) {
              if (!checkHeroImmuneOrResist('화상')) {
                applyStatusEffect(target, {
                  type: 'burn',
                  turnsLeft: selectedSkill.statusDuration || 3,
                  totalTurns: selectedSkill.statusDuration || 3,
                  magnitude: 0.08,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`🔥 [화상] ${target.name}에게 화상이 부여되었습니다! (매 턴 8% 피해, 방어력 50% 분쇄)`, 'danger'), 0);
              }
            } 
            // 3. 맹독: 매 턴 14% 치명적 독 피해
            else if (selectedSkill?.effectType === 'poison' || selectedSkill?.name?.includes('독') || selectedSkill?.description?.includes('독')) {
              if (!checkHeroImmuneOrResist('맹독')) {
                applyStatusEffect(target, {
                  type: 'poison',
                  turnsLeft: selectedSkill.statusDuration || 3,
                  totalTurns: selectedSkill.statusDuration || 3,
                  magnitude: 0.14,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`☠️ [맹독] ${target.name}에게 맹독이 중독되었습니다! (매 턴 14% 치명적 독 피해)`, 'danger'), 0);
              }
            } 
            // 4. 출혈: 매 턴 7% 지속 피해 & 공격력 -40%
            else if (selectedSkill?.effectType === 'bleed' || selectedSkill?.name?.includes('출혈') || selectedSkill?.description?.includes('출혈')) {
              if (!checkHeroImmuneOrResist('출혈')) {
                applyStatusEffect(target, {
                  type: 'bleed',
                  turnsLeft: selectedSkill.statusDuration || 3,
                  totalTurns: selectedSkill.statusDuration || 3,
                  magnitude: 0.07,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`🩸 [출혈] ${target.name}에게 출혈이 발생했습니다! (매 턴 7% 지속 피해, 공격력 -40%)`, 'danger'), 0);
              }
            } 
            // 5. 방어력 약화 (debuff_def)
            else if (selectedSkill?.effectType === 'debuff_def' || (selectedSkill?.effectType === 'debuff' && (selectedSkill?.name?.includes('방어') || selectedSkill?.description?.includes('방어') || selectedSkill?.description?.includes('방어력')))) {
              if (!checkHeroImmuneOrResist('방어력 감소')) {
                const defRedPct = (selectedSkill.power && selectedSkill.power > 0 && selectedSkill.power < 1) ? selectedSkill.power : 0.30;
                applyStatusEffect(target, {
                  type: 'debuff_def',
                  turnsLeft: selectedSkill.statusDuration || 2,
                  totalTurns: selectedSkill.statusDuration || 2,
                  magnitude: defRedPct,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`🛡️⬇️ [방어력 약화] ${target.name}의 방어력이 ${Math.round(defRedPct * 100)}% 감소했습니다!`, 'danger'), 0);
              }
            } 
            // 6. 공격력 약화 (debuff_atk)
            else if (selectedSkill?.effectType === 'debuff_atk' || (selectedSkill?.effectType === 'debuff' && !selectedSkill?.description?.includes('방어'))) {
              if (!checkHeroImmuneOrResist('공격력 약화')) {
                const atkRedPct = (selectedSkill.power && selectedSkill.power > 0 && selectedSkill.power < 1) ? selectedSkill.power : 0.30;
                applyStatusEffect(target, {
                  type: 'debuff_atk',
                  turnsLeft: selectedSkill.statusDuration || 2,
                  totalTurns: selectedSkill.statusDuration || 2,
                  magnitude: atkRedPct,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`⚔️⬇️ [공격력 약화] ${target.name}의 공격력이 ${Math.round(atkRedPct * 100)}% 감소했습니다!`, 'danger'), 0);
              }
            } 
            // 7. 실명 (blind)
            else if (selectedSkill?.effectType === 'blind' || selectedSkill?.name?.includes('실명') || selectedSkill?.name?.includes('암흑') || selectedSkill?.description?.includes('실명')) {
              if (!checkHeroImmuneOrResist('실명')) {
                applyStatusEffect(target, {
                  type: 'blind',
                  turnsLeft: selectedSkill.statusDuration || 2,
                  totalTurns: selectedSkill.statusDuration || 2,
                  magnitude: 0.50,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`👁️❌ [실명] ${target.name}의 시야가 가려져 명중률이 50% 급감했습니다!`, 'danger'), 0);
              }
            } 
            // 8. 기절 (stun)
            else if (selectedSkill?.effectType === 'stun' || selectedSkill?.name?.includes('기절') || selectedSkill?.description?.includes('기절')) {
              if (!checkHeroImmuneOrResist('기절')) {
                applyStatusEffect(target, {
                  type: 'stun',
                  turnsLeft: selectedSkill.statusDuration || 1,
                  totalTurns: selectedSkill.statusDuration || 1,
                  magnitude: 0,
                  source: monster.data.name
                });
                setTimeout(() => gm.addLog(`💫 [기절] ${target.name}이(가) 충격으로 기절했습니다! (1턴 행동 불가)`, 'danger'), 0);
              }
            }
          }

          if (isBlock) {
            addFeverBadge('guard');
            hitReports.push(`[${target.name}] 🛡️[Block!]${absorbed > 0 ? ` (보호막 ${absorbed} 흡수)` : isBlockedByDef ? ' (방어력 차단)' : ''}`);
          } else {
            hitReports.push(`[${target.name}] ${isMonsterCrit ? '💥[치명타] ' : ''}-${actualDamage}${absorbed > 0 ? ` (보호막 ${absorbed} 흡수)` : ''}`);
          }

          // 🌟 [환영의 반격 발동]: 피격 즉시 130% 반격 일격
          if (riposteBuff && target.currentHp > 0) {
            addFeverBadge('counter');
            const riposteDmg = Math.max(1, Math.floor(heroStats.atk * 1.30));
            monster.currentHp = Math.max(0, monster.currentHp - riposteDmg);
            if (monster.currentHp <= 0) {
              monster.currentHp = 0;
              monster.statusEffects = [];
            }
            monstersRef.current = currentMonsters;
            setMonsters([...currentMonsters]);
            triggerVFX({
              type: 'crit_slash',
              x: selfMonPos.x,
              y: selfMonPos.y,
              damage: riposteDmg,
              isCrit: true,
            });
            SoundManager.getInstance().play('slash');
            setSkillCutIn({
              id: String(Date.now()),
              skillName: `[${target.name}]의 환영 반격!`,
              icon: '⚔️⚡',
              isEnemy: false,
              bannerType: 'counter',
              heroName: target.name,
            });
            hitReports.push(`[${target.name}] ⚔️⚡[피격 환영 반격!] -${riposteDmg}`);
          }
        });

        monstersRef.current = currentMonsters;
        setMonsters([...currentMonsters]);

        const actionName = selectedSkill ? selectedSkill.name : '공격';
        const logMsg = isAoE
          ? `▶ 👾 ${monster.data.name} [${actionName}] 광역 강타! ➔ ${hitReports.join(' | ')}`
          : `▶ 👾 ${monster.data.name} [${actionName}] ➔ ${hitReports.join(' | ')}`;

        gm.emit('partyUpdated');
        persistBattleSnapshot();
        setTimeout(() => gm.addLog(logMsg, 'danger'), 0);

        // 🌟 방어 연출(전열 수호 엄호)이나 환영 반격이 발동했을 때는 컷인과 연출을 충분히 감상할 수 있도록 시간 확보
        const hasCounterOrGuard = hitReports.some(r => r.includes('전열 수호') || r.includes('환영 반격'));
        const postAttackDelay = hasCounterOrGuard ? 850 : (selectedSkill ? 450 : 350);

        setTimeout(() => {
          setSkillCutIn(null);
          setAttackingMonsterId(null);
          isProcessingRef.current = false;
          setIsProcessing(false);
          if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
        }, getBattleDelay(postAttackDelay));
      }, getBattleDelay(delayMs));
    } catch (err) {
      console.error('executeMonsterAttack error:', err);
      setSkillCutIn(null);
      setAttackingMonsterId(null);
      isProcessingRef.current = false;
      setIsProcessing(false);
      advanceTurn();
    }
  }, [gm, advanceTurn, checkBattleOutcome, persistBattleSnapshot]);

  // ── 전투 중 철수 시도 (행운 및 속도 보정 적용) ──────────────────
  const handleFleeAttempt = useCallback(() => {
    if (isProcessingRef.current || battleEndedRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    const hasBoss = monstersRef.current.some(m => m.data.type === 'boss');
    const hasElite = monstersRef.current.some(m => m.data.type === 'elite');
    
    let baseChance = hasBoss ? 0.15 : hasElite ? 0.30 : 0.45;
    const aliveHeroes = gm.party.filter(h => h.currentHp > 0);
    const aliveMonsters = monstersRef.current.filter(m => m.currentHp > 0);
    const avgHeroSpd = aliveHeroes.reduce((sum, h) => sum + gm.getHeroEffectiveStats(h).spd, 0) / Math.max(1, aliveHeroes.length);
    const avgMonSpd = aliveMonsters.reduce((sum, m) => sum + m.spd, 0) / Math.max(1, aliveMonsters.length);
    const spdBonus = (avgHeroSpd - avgMonSpd) * 0.02;

    const avgHeroLuck = aliveHeroes.reduce((sum, h) => sum + gm.getHeroEffectiveStats(h).luck, 0) / Math.max(1, aliveHeroes.length);
    const avgMonLuck = aliveMonsters.reduce((sum, m) => sum + (m.luck || 10), 0) / Math.max(1, aliveMonsters.length);
    const luckBonus = (avgHeroLuck - avgMonLuck) * 0.005;

    const finalFleeRate = Math.max(0.15, Math.min(0.85, baseChance + spdBonus + luckBonus));
    const isSuccess = Math.random() < finalFleeRate;

    if (isSuccess) {
      restoreOriginalPositions();
      battleEndedRef.current = true;
      setBattleEnded(true);
      gm.clearBattleSnapshot();

      // 🛡️ 철수 성공 시 파티원 상태 정합성 보장: 생존 대원 사경/전사 플래그 해제 및 사경 대원 긴급 생환
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          h.isPermanentlyDead = false;
          h.deathCountdown = undefined;
        } else if (h.deathCountdown !== undefined && h.deathCountdown > 0) {
          h.currentHp = 1;
          h.deathCountdown = undefined;
        }
        h.statusEffects = [];
      });
      gm.emit('partyUpdated', gm.party);
      gm.saveGame();

      gm.addLog(`🏃 [전투 철수 성공!] 적의 추격을 뿌리치고 안전하게 후퇴했습니다. (탈출 확률: ${Math.floor(finalFleeRate * 100)}%, 행운 보정: ${luckBonus >= 0 ? '+' : ''}${Math.round(luckBonus * 100)}%)`, 'system');
      setTimeout(() => {
        navigateTo('exploration');
      }, 500);
    } else {
      SoundManager.getInstance().play('heavy_hit');
      gm.addLog(`⚠️ [전투 철수 실패!] 퇴로가 막혀 도주에 실패했습니다! (성공률: ${Math.floor(finalFleeRate * 100)}% 실패, 적 반격 턴)`, 'danger');
      
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (aliveMonsters.length > 0) {
          executeMonsterAttack(aliveMonsters[0].id);
        }
      }, 600);
    }
  }, [gm, navigateTo, executeMonsterAttack]);

  // ── 자동 전투 및 턴 스케줄러 (무한 멈춤 방지 워치독 탑재) ──────────────────
  useEffect(() => {
    isAutoBattleRef.current = isAutoBattle;
  }, [isAutoBattle]);

  useEffect(() => {
    if (battleEndedRef.current || turnIdx < 0 || turnSkippedRef.current || isProcessingRef.current || isProcessing) return;
    const q = turnQueueRef.current;
    if (q.length === 0) return;
    const currentTurn = q[turnIdx % q.length];
    if (!currentTurn) return;

    if (currentTurn.type === 'monster') {
      const timer = setTimeout(() => {
        if (battleEndedRef.current || turnSkippedRef.current || isProcessingRef.current) return;
        executeMonsterAttack(currentTurn.id);
      }, getBattleDelay(600));
      return () => clearTimeout(timer);
    } else {
      if (!isAutoBattle) return;
      const timer = setTimeout(() => {
        if (!isAutoBattleRef.current || battleEndedRef.current || turnSkippedRef.current || isProcessingRef.current) return;

        const heroIdx = gm.party.findIndex(h => h.id === currentTurn.id);
        const alive = monstersRef.current;
        const aliveWithIndex = alive
          .map((m, idx) => ({ monster: m, idx }))
          .filter(item => item.monster.currentHp > 0);

        if (aliveWithIndex.length === 0) {
          if (checkBattleOutcome(alive)) return;
          advanceTurn();
          return;
        }

        if (heroIdx >= 0 && gm.party[heroIdx].currentHp <= 0) {
          advanceTurn();
          return;
        }

        if (heroIdx >= 0 && aliveWithIndex.length > 0 && gm.party[heroIdx].currentHp > 0) {
          const hero = gm.party[heroIdx];
          const hasCC = (hero.statusEffects || []).some(se => se.type === 'freeze' || se.type === 'stun');
          if (hasCC) {
            advanceTurn();
            return;
          }

          const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === hero.classId);
          const allHeroSkills: Skill[] = [];
          if (cls) {
            if (cls.specialSkill) {
              const resSpec = gm.resolveSkillData(cls.specialSkill.id, hero);
              allHeroSkills.push(resSpec || cls.specialSkill);
            }
            (hero.equippedSkills || []).forEach(sid => {
              const resolved = gm.resolveSkillData(sid, hero);
              if (resolved && !allHeroSkills.some(s => s.id === resolved.id)) {
                allHeroSkills.push(resolved);
              }
            });
            cls.skills.forEach(s => {
              if (allHeroSkills.length < 3 && !allHeroSkills.some(existing => existing.id === s.id)) {
                const resNormal = gm.resolveSkillData(s.id, hero);
                allHeroSkills.push(resNormal || s);
              }
            });
          }
          const availableSkills = allHeroSkills.filter(s => {
            const cd = heroCooldownsRef.current[`${hero.id}_${s.id}`] || 0;
            const cost = gm.getSkillManaCost(s.manaCost, undefined, hero);
            return hero.currentMp >= cost && cd === 0;
          });

          // 기본 타겟: 보스/엘리트 몬스터가 있으면 우선 타겟, 없으면 첫 번째 생존 몬스터
          let chosenTargetIdx = aliveWithIndex[0].idx;
          const bossOrElite = aliveWithIndex.find(item => item.monster.data.type === 'boss' || item.monster.data.type === 'elite');
          if (bossOrElite) {
            chosenTargetIdx = bossOrElite.idx;
          }

          // 영웅 스탯 및 일반 공격 예상 피해량 산출
          const heroStats = gm.getHeroEffectiveStats(hero);
          const targetMonster = alive[chosenTargetIdx];
          const targetDef = targetMonster?.def || 0;
          const estimatedBasicDmg = Math.max(1, Math.floor(heroStats.atk * (100 / (100 + targetDef))));

          // 🎯 [1. 일반 공격 마무리(Killable) 검사]:
          // 타겟 몬스터가 일반 공격으로 확실하게 처치 가능한 잔여 체력(예상 피해량 이하 또는 체력 12% 이하)인 경우
          // 마나 및 스킬 쿨다운을 아끼기 위해 일반 공격('basic')을 적극 사용!
          const canKillTargetWithBasic = targetMonster && (
            targetMonster.currentHp <= estimatedBasicDmg * 1.15 ||
            targetMonster.currentHp <= Math.max(10, Math.floor(targetMonster.maxHp * 0.12))
          );

          // 다른 잡몹 중 일반 공격 1방으로 정리 가능한 딸피 몬스터가 있는지도 검사
          const killableMinion = aliveWithIndex.find(item =>
            item.monster.currentHp <= estimatedBasicDmg * 1.15 && item.monster.data.type !== 'boss'
          );

          // ⚡ [2. 스킬 연계(Combo) 최우선 탐색]:
          // 살아있는 몬스터들 중 상태이상이 걸려 있어 즉시 [상태이상 연계 콤보]를 터뜨릴 수 있는 스킬 전수 탐색!
          let bestComboSkill: Skill | null = null;
          let bestComboTargetIdx: number = chosenTargetIdx;

          for (const s of availableSkills) {
            if (s.targetType === 'all_allies' || s.targetType === 'single_ally' || s.targetType === 'self') continue;

            const comboMatch = isComboReadyForBattleTarget(s, monsters, chosenTargetIdx);
            if (comboMatch) {
              bestComboSkill = s;
              bestComboTargetIdx = comboMatch.targetIndex;
              break;
            }
          }

          // 🛡️ [3. 아군 위기 구호 스킬 탐색]: 파티원 중 체력 45% 이하인 인원이 있을 때
          const alliesInDanger = gm.party.filter(p => p.currentHp > 0 && (p.currentHp / p.maxHp) <= 0.45);
          const healSkill = availableSkills.find(s => s.effectType === 'heal' || s.description?.includes('치유') || s.description?.includes('회복'));
          const shieldSkill = availableSkills.find(s => s.effectType === 'shield' || s.description?.includes('보호막'));
          const deadOrDyingAllies = gm.party.filter(p => p.currentHp <= 0 || p.deathCountdown !== undefined || p.isPermanentlyDead);
          const reviveSkill = availableSkills.find(s => s.id === 'saint_ultimate' || s.id === 'acolyte_revive' || s.id === 'acolyte_blessing' || s.description?.includes('부활') || s.description?.includes('소생'));

          let chosenAction: Skill | 'basic' = 'basic';

          if (deadOrDyingAllies.length > 0 && reviveSkill) {
            // 🕊️ [최우선] 사경/사망 아군 발생 시 즉각 부활/소생 스킬 시전!
            chosenAction = reviveSkill;
          } else if (canKillTargetWithBasic) {
            // ⭐ 딸피 적은 일반 공격으로 마나 절약하며 신속 처치!
            chosenAction = 'basic';
          } else if (killableMinion && availableSkills.length === 0) {
            // 스킬이 없고 딸피 미니언이 있다면 미니언 먼저 일반 공격으로 제거
            chosenTargetIdx = killableMinion.idx;
            chosenAction = 'basic';
          } else if (bestComboSkill) {
            // ⭐ [스킬 연계 최우선 발동!] 상태이상이 걸린 적에게 콤보 폭발을 터뜨려 극대 피해 및 연계 효과 창출!
            chosenAction = bestComboSkill;
            chosenTargetIdx = bestComboTargetIdx;
          } else if (alliesInDanger.length > 0 && (healSkill || shieldSkill)) {
            // 아군 위기 시 치유/보호막
            chosenAction = (healSkill || shieldSkill)!;
          } else if (availableSkills.length > 0) {
            // 광역기 또는 계수가 높은 스킬 우선 선택 (상태이상 유발 스킬에 우선권 부여)
            const aoeSkill = availableSkills.find(s => s.targetType === 'all_enemies' || s.description?.includes('전체') || s.description?.includes('광역'));
            if (aoeSkill && aliveWithIndex.length >= 2) {
              chosenAction = aoeSkill;
            } else {
              const sortedSkills = [...availableSkills].sort((a, b) => {
                const aInflicts = (a.effectType && ['freeze', 'stun', 'bleed', 'poison', 'burn'].includes(a.effectType)) ? 1 : 0;
                const bInflicts = (b.effectType && ['freeze', 'stun', 'bleed', 'poison', 'burn'].includes(b.effectType)) ? 1 : 0;
                if (bInflicts !== aInflicts) return bInflicts - aInflicts;
                return (b.power || 1) - (a.power || 1);
              });
              chosenAction = sortedSkills[0];
            }
          } else {
            // 사용 가능한 스킬 없음 -> 일반 공격
            chosenAction = 'basic';
          }

          executeSkill(hero, chosenAction, chosenTargetIdx);
        } else {
          advanceTurn();
        }
      }, getBattleDelay(600));
      return () => clearTimeout(timer);
    }
  }, [isAutoBattle, turnIdx, isProcessing, executeMonsterAttack, executeSkill, advanceTurn, gm]);

  // 🛡️ [멈춤 방지 워치독]: 만약 어떤 이유로든 2.5초 이상 처리가 멈춰 있으면 자동 복구
  useEffect(() => {
    if (!isProcessing || battleEndedRef.current) return;
    const watchdogTimer = setTimeout(() => {
      if (isProcessingRef.current && !battleEndedRef.current) {
        console.warn('⚠️ [전투 멈춤 감지 워치독] 응답 없음 감지 -> 강제 복구 및 턴 진행');
        setSkillCutIn(null);
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (!checkBattleOutcome(monstersRef.current)) advanceTurn();
      }
    }, isAutoBattle ? 3500 : 5000);
    return () => clearTimeout(watchdogTimer);
  }, [isProcessing, isAutoBattle, advanceTurn, checkBattleOutcome]);

  // ── 렌더 계산 ──────────────────────────────────────────────────────────
  const q = turnQueueRef.current;
  const currentTurn = q.length > 0 && turnIdx >= 0 ? q[turnIdx % q.length] : null;
  const isHeroTurn = currentTurn?.type === 'hero';
  const currentHeroId = isHeroTurn ? currentTurn?.id : null;
  const currentHeroPartyIdx = currentHeroId ? gm.party.findIndex(h => h.id === currentHeroId) : -1;
  const selectedHero = gm.party[selectedHeroIdx];

  const heroSkills: Skill[] = selectedHero ? (() => {
    const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === selectedHero.classId);
    if (!cls) return [];
    const skills: Skill[] = [];

    // 1. 고유기 / 궁극기 (클래스 특수기)를 1번째로 추가하여 기본 공격 바로 옆(상단 우측)에 배치
    if (cls.specialSkill) {
      const resSpec = gm.resolveSkillData(cls.specialSkill.id, selectedHero);
      skills.push(resSpec || cls.specialSkill);
    }

    // 2. 일반 전술 장착 스킬 1, 2 (또는 직업 기본 스킬 1, 2)를 하단열에 배치
    if (selectedHero.equippedSkills && selectedHero.equippedSkills.length > 0) {
      selectedHero.equippedSkills.forEach(sid => {
        const resolved = gm.resolveSkillData(sid, selectedHero);
        if (resolved && !skills.some(s => s.id === resolved.id)) {
          skills.push(resolved);
        }
      });
    }

    // 전술 스킬이 부족할 경우 클래스 기본 스킬 보충 (고유기 포함 총 3개)
    cls.skills.forEach(s => {
      if (skills.length < 3 && !skills.some(existing => existing.id === s.id)) {
        const resNormal = gm.resolveSkillData(s.id, selectedHero);
        skills.push(resNormal || s);
      }
    });

    return skills;
  })() : [];

  const aliveMonsters = monsters.filter(m => m.currentHp > 0);
  const firstAliveMonsterIdx = monsters.findIndex(m => m.currentHp > 0);
  const roundNum = q.length > 0 ? Math.floor(Math.max(0, turnIdx) / q.length) + 1 : 1;

  // 스킬 버튼 색상 구분 헬퍼
  const getSkillBtnStyle = (skill: Skill | 'basic') => {
    if (skill === 'basic') return { borderColor: '#8b9bb4', color: '#e2e8f0', label: '일반 공격' };
    if (skill.isSpecial) return { borderColor: '#ffd54f', color: '#ffe57f', label: skill.name.includes('[궁극기]') ? '궁극기' : '고유기', shadow: '0 0 10px #ffd54f55' };
    if (['heal', 'shield', 'regen', 'buff'].includes(skill.effectType || '')) return { borderColor: '#26a69a', color: '#b2dfdb', label: '지원/마법' };
    return { borderColor: '#ef5350', color: '#ffcdd2', label: '전투 스킬' };
  };

  return (
    <div className={`flex-1 min-h-0 w-full flex flex-col relative bg-transparent overflow-hidden ${isShaking ? 'animate-screen-shake' : ''}`}>
      {/* ── ⚔️ 전투 오버레이 시각 이펙트 & 플로팅 텍스트 ── */}
      <BattleVFXOverlay vfxList={vfxList} onFinish={handleFinishVFX} isShaking={isShaking} />

      {/* ── 🌟 스킬 발동 / 원호 / 추가공격 / 엄호 컷인 배너 ── */}
      {skillCutIn && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* 스피드 라인 레이어 */}
          <div className={`absolute inset-0 opacity-30 ${
            skillCutIn.isEnemy
              ? 'bg-red-900/40'
              : skillCutIn.bannerType === 'fever'
              ? 'bg-amber-600/50'
              : skillCutIn.bannerType === 'assist' || skillCutIn.bannerType === 'extra'
              ? 'bg-amber-900/40'
              : skillCutIn.bannerType === 'guard'
              ? 'bg-emerald-900/40'
              : skillCutIn.bannerType === 'counter'
              ? 'bg-purple-900/40'
              : 'bg-cyan-900/40'
          } animate-skill-speedlines`} />

          {/* 슬래시 컷인 배너 바 */}
          <div className={`relative w-[130%] py-3.5 px-6 flex items-center justify-center shadow-2xl border-y-2 transform -rotate-3 animate-skill-banner ${
            skillCutIn.isEnemy
              ? 'bg-gradient-to-r from-transparent via-[#200813f5] via-50% to-transparent border-[#ff1744] shadow-[#ff1744aa]'
              : skillCutIn.bannerType === 'fever'
              ? 'bg-gradient-to-r from-transparent via-[#2a1a05f5] via-50% to-transparent border-[#ffd54f] shadow-[0_0_35px_rgba(255,213,79,0.7)]'
              : skillCutIn.bannerType === 'assist' || skillCutIn.bannerType === 'extra'
              ? 'bg-gradient-to-r from-transparent via-[#251d08f5] via-50% to-transparent border-[#ffd54f] shadow-[#ffd54faa]'
              : skillCutIn.bannerType === 'guard'
              ? 'bg-gradient-to-r from-transparent via-[#082218f5] via-50% to-transparent border-[#38ef7d] shadow-[#38ef7daa]'
              : skillCutIn.bannerType === 'counter'
              ? 'bg-gradient-to-r from-transparent via-[#1c0c28f5] via-50% to-transparent border-[#ce93d8] shadow-[#ce93d8aa]'
              : skillCutIn.bannerType === 'detonation'
              ? 'bg-gradient-to-r from-transparent via-[#330d00f5] via-50% to-transparent border-[#ff6d00] shadow-[#ff6d00aa]'
              : skillCutIn.bannerType === 'break'
              ? 'bg-gradient-to-r from-transparent via-[#2b1f00f5] via-50% to-transparent border-[#ffd600] shadow-[#ffd600aa]'
              : 'bg-gradient-to-r from-transparent via-[#09152af5] via-50% to-transparent border-[#00d2ff] shadow-[#00d2ffaa]'
          }`}
          style={skillCutIn.bannerType === 'fever' && skillCutIn.feverBorderColor ? { borderColor: skillCutIn.feverBorderColor } : undefined}
          >
            <div className="flex items-center gap-3.5">
              <div className={`text-2xl sm:text-3xl p-2 rounded-xl border-2 shadow-xl shrink-0 ${
                skillCutIn.isEnemy
                  ? 'bg-[#2b0c1b] border-[#ff1744] shadow-[#ff1744]'
                  : skillCutIn.bannerType === 'fever'
                  ? 'bg-[#3b2408] border-[#ffd54f] shadow-[#ffd54f] animate-bounce'
                  : skillCutIn.bannerType === 'assist' || skillCutIn.bannerType === 'extra'
                  ? 'bg-[#33250a] border-[#ffd54f] shadow-[#ffd54f]'
                  : skillCutIn.bannerType === 'guard'
                  ? 'bg-[#0a2e1d] border-[#38ef7d] shadow-[#38ef7d]'
                  : skillCutIn.bannerType === 'counter'
                  ? 'bg-[#271038] border-[#ce93d8] shadow-[#ce93d8]'
                  : 'bg-[#0c1f38] border-[#00d2ff] shadow-[#00d2ff]'
              }`}>
                {skillCutIn.icon}
              </div>
              <div className="flex flex-col">
                {skillCutIn.bannerType === 'fever' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black text-[#ffd54f] tracking-widest uppercase animate-pulse">
                      🔥 TACTICAL FEVER BURST 🔥
                    </span>
                    {skillCutIn.subText && (
                      <span className="text-[9px] sm:text-[10px] text-[#ffecb3] font-bold">
                        {skillCutIn.subText}
                      </span>
                    )}
                  </div>
                )}
                {skillCutIn.bannerType === 'assist' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black text-[#ffd54f] tracking-widest uppercase animate-pulse">
                      {skillCutIn.isWeaknessPursuit ? '🎯 WEAKNESS PURSUIT ASSIST ⚡' : '★ ASSIST ATTACK ★'}
                    </span>
                    {skillCutIn.subText && (
                      <span className="text-[9px] sm:text-[10px] text-[#a7ffeb] font-semibold">
                        {skillCutIn.subText}
                      </span>
                    )}
                  </div>
                )}
                {skillCutIn.bannerType === 'extra' && (
                  <span className="text-[10px] sm:text-xs font-bold text-[#ff9800] tracking-widest uppercase animate-pulse">
                    ★ SYNERGY COMBO ★
                  </span>
                )}
                {skillCutIn.bannerType === 'guard' && (
                  <span className="text-[10px] sm:text-xs font-bold text-[#38ef7d] tracking-widest uppercase animate-pulse">
                    🛡️ GUARDIAN INTERVENTION 🛡️
                  </span>
                )}
                {skillCutIn.bannerType === 'counter' && (
                  <span className="text-[10px] sm:text-xs font-bold text-[#ce93d8] tracking-widest uppercase animate-pulse">
                    ⚔️ COUNTER RIPOSTE ⚔️
                  </span>
                )}
                <div className="text-xl sm:text-3xl font-black text-white tracking-wider flex items-center gap-2 drop-shadow-[0_0_18px_rgba(255,255,255,0.95)]">
                  <span>{skillCutIn.skillName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 💬 원호 / 약점 추격 대사 화면 중심 횡단 연출 ── */}
          {skillCutIn.quote && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden py-3">
              {/* 대사 배경 빛의 궤적 스트라이프 */}
              <div className="absolute inset-x-0 h-16 sm:h-20 bg-gradient-to-r from-transparent via-[#060e1fdc] via-50% to-transparent border-y border-[#ffd54f66] shadow-[0_0_25px_rgba(255,213,79,0.35)] animate-quote-streak" />
              
              {/* 쏜살같이 화면 중심을 가로지르는 대사 텍스트 */}
              <div className="relative w-full max-w-4xl px-4 flex flex-col items-center justify-center animate-quote-fly">
                <div className="flex items-center gap-2 mb-1 drop-shadow-md">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#0b0d13] ${
                    skillCutIn.bannerType === 'fever'
                      ? 'bg-[#ffd54f] shadow-[0_0_16px_#ffd54f] animate-pulse'
                      : 'bg-[#ffd54f] shadow-[0_0_12px_#ffd54f]'
                  }`}>
                    {skillCutIn.bannerType === 'fever' ? '🔥 TACTICAL FEVER' : skillCutIn.isWeaknessPursuit ? '🎯 WEAKNESS PURSUIT' : '🤝 ASSIST'}
                  </span>
                  {skillCutIn.heroName && (
                    <span className="text-xs sm:text-sm font-black text-[#80d8ff] drop-shadow-[0_0_8px_rgba(128,216,255,0.8)]">
                      {skillCutIn.heroName}
                    </span>
                  )}
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#fff9c4] via-[#ffd54f] to-[#ffecb3] drop-shadow-[0_0_22px_rgba(255,213,79,0.95)] text-center px-4">
                  {skillCutIn.quote.startsWith('"') ? skillCutIn.quote : `"${skillCutIn.quote}"`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 💥 화면 타격 번쩍임 플래시 (Flash Overlay) ── */}
      {screenFlash && (
        <div className={`absolute inset-0 pointer-events-none z-50 animate-impact-flash ${
          screenFlash === 'enemy' ? 'bg-[#ff174444]' : 'bg-[#00d2ff35]'
        }`} />
      )}

      {/* ── 몬스터 일러스트 패널 (현재 타겟팅된 몬스터 또는 공격 중인 몬스터 연출) ── */}
      {(() => {
        const attackingMon = attackingMonsterId ? monsters.find(m => m.id === attackingMonsterId) : undefined;
        const currentTargetMon = monsters[targetedMonsterIdx] || monsters.find(m => m.currentHp > 0) || monsters[0];
        const displayMon = attackingMon || currentTargetMon;
        return (
          <MonsterImagePanel 
            targetMonster={displayMon} 
            totalCount={monsters.length}
            isAttacking={Boolean(attackingMon && attackingMon.id === displayMon?.id)}
          />
        );
      })()}

      {/* ── ⚔️ 상단 이미지창 바로 아래부터 하단까지 채우는 컨테이너 ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto overflow-x-hidden relative">
        {/* ── 👾 적군 마물 편대 슬롯 그리드 (적의 수 1~5인에 맞춰 화면 폭을 정확히 균등 분할) ── */}
        <div className="px-3 pt-5 sm:pt-6 shrink-0 relative z-20">
          <div 
            className="grid gap-1.5 w-full"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, monsters.length)}, minmax(0, 1fr))`
          }}
        >
          {monsters.map((m, idx) => {
            const isAlive = m.currentHp > 0;
            const isTargeted = isAlive && idx === targetedMonsterIdx;
            const hpPct = isAlive ? clamp((m.currentHp / m.maxHp) * 100, 0, 100) : 0;

            return (
              <LongPressBox
                key={m.id}
                onLongPress={() => isAlive && setInspectedMonster(m)}
                onClick={() => isAlive && setTargetedMonsterIdx(idx)}
                className={`relative p-1.5 sm:p-2 rounded-lg transition-all border flex flex-col justify-center h-[38px] sm:h-[40px] min-w-0 select-none ${
                  !isAlive
                    ? 'border-[#18202d] bg-[#0c101a] opacity-30 grayscale cursor-not-allowed shadow-none'
                    : isTargeted
                    ? 'border-[#ff4444] bg-[#ff444425] shadow-[0_0_12px_rgba(255,68,68,0.4)] scale-[1.02] cursor-pointer'
                    : (m.statusEffects || []).some(s => s.type === 'freeze')
                    ? 'border-[#80d8ff] bg-[#80d8ff18] shadow-[0_0_8px_rgba(128,216,255,0.35)] cursor-pointer'
                    : 'border-[#24334a] bg-[#111726dd] hover:border-[#3d5378] cursor-pointer'
                }`}
              >
                {/* 💫 패널 위, 상단 이미지 쪽으로 쌓여 올라가는 버프 / 디버프 및 상태이상 (생존 시) */}
                {isAlive && (m.isGroggy || m.statusEffects.length > 0) && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 z-20 flex gap-0.5 flex-wrap items-center pointer-events-none">
                    {m.isGroggy && (
                      <span className="text-[8px] px-1 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] animate-pulse">
                        💫 그로기
                      </span>
                    )}
                    {m.statusEffects.map((se, i) => {
                      const meta = STATUS_EFFECT_META[se.type] || { icon: '✨', label: se.type, color: '#00d2ff' };
                      return (
                        <span
                          key={i}
                          className="text-[9px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5"
                          style={{ background: `${meta.color}33`, color: meta.color, border: `1px solid ${meta.color}44` }}
                          title={`${meta.label} (${se.turnsLeft}턴)`}
                        >
                          <GameIcon name={se.type} icon={meta.icon} size={10} />
                          <span>{se.turnsLeft}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* ⚡ 패널 상단 브레이크 뱃지 (체력 게이지처럼 내부 색이 줄어들며 퍼센트 표기) */}
                {isAlive && m.chargingState && (() => {
                  const breakPct = Math.max(0, Math.min(100, Math.round((m.chargingState.remainingBreakDmg / m.chargingState.maxBreakDmg) * 100)));
                  return (
                    <div className="absolute -top-3.5 right-1 z-30 h-4.5 px-2 rounded-full overflow-hidden border border-[#ff9800] bg-[#1a0800] shadow-[0_0_10px_rgba(255,152,0,0.7)] flex items-center justify-center animate-pulse">
                      {/* 체력 게이지처럼 내부 색이 줄어드는 바 */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#ff3d00] via-[#ff9100] to-[#ffd600] transition-all duration-300 pointer-events-none"
                        style={{ width: `${breakPct}%` }}
                      />
                      {/* 전면 텍스트: 퍼센트 표기 & 스킬명 제외 */}
                      <div className="relative z-10 flex items-center gap-1 text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-none">
                        <span>⚡ 차징</span>
                        <span className="font-mono text-[#fffde7]">BREAK {breakPct}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 🌟 체력 게이지 (배경 그라데이션 바) */}
                {isAlive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg overflow-hidden transition-all duration-300 pointer-events-none opacity-30"
                    style={{
                      width: `${hpPct}%`,
                      background: hpPct > 50 
                        ? 'linear-gradient(90deg, #11998e, #38ef7d)' 
                        : hpPct > 25 
                        ? 'linear-gradient(90deg, #f2994a, #f2c94c)' 
                        : 'linear-gradient(90deg, #cb2d3e, #ef473a)',
                    }}
                  />
                )}

                {/* 이름 및 체력 수치 */}
                <div className="relative z-10 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {isTargeted && <span className="text-[10px] text-[#ff4444] font-bold animate-pulse">🎯</span>}
                    <span
                      className="text-[9px] px-1 py-0.2 rounded font-bold shrink-0"
                      style={{
                        background: !isAlive ? '#26323822' : idx < 2 ? '#ef535022' : '#42a5f522',
                        color: !isAlive ? '#607d8b' : idx < 2 ? '#ef5350' : '#42a5f5',
                        border: `1px solid ${!isAlive ? '#26323844' : idx < 2 ? '#ef535044' : '#42a5f544'}`
                      }}
                    >
                      {idx < 2 ? '전열' : '후열'}
                    </span>
                    <span
                      className="font-bold text-xs truncate"
                      style={{
                        color: !isAlive ? '#607d8b' : isTargeted ? '#ffffff' : '#cfd8dc',
                        textShadow: isAlive && isTargeted ? '0 0 6px #ff4444' : undefined,
                        textDecoration: !isAlive ? 'line-through' : undefined
                      }}
                    >
                      {m.data.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{
                        color: !isAlive ? '#607d8b' : hpPct > 50 ? '#38ef7d' : hpPct > 25 ? '#ffd54f' : '#ef5350'
                      }}
                    >
                      {isAlive ? `${Math.round(m.currentHp)}` : '💀 사망'}
                    </span>
                    {isAlive && (
                      <button
                        type="button"
                        className="text-[10px] text-[#8b9bb4] hover:text-[#00d2ff] p-0.5"
                        title="몬스터 정보 (홀드로도 확인 가능)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedMonster(m);
                        }}
                      >
                        ℹ️
                      </button>
                    )}
                  </div>
                </div>
              </LongPressBox>
            );
          })}
        </div>
      </div>

      {/* ── 📜 전투 로그 패널 (상세 로그 팝업 아이콘 연동) ── */}
      <div className="px-3 pt-1 flex-1 min-h-0 relative">
        <div className="relative">
          <LogPanel logs={state.battleLogs || []} isBattle maxHeight={148} emptyMessage="기록된 전투 로그가 없습니다." />
          <button
            type="button"
            className="absolute top-1.5 right-2 px-2 py-0.5 rounded text-[11px] font-bold bg-[#141a27e0] hover:bg-[#1e273dee] text-[#00d2ff] hover:text-white border border-[#00d2ff44] shadow-md transition-all flex items-center gap-1 z-10"
            title="전체 전투 상세 기록 모달 열기"
            onClick={() => setShowFullLogModal(true)}
          >
            <span>📜</span>
            <span className="text-[10px]">상세 로그</span>
          </button>
        </div>
      </div>

      <div className="px-3 pb-2 pt-1 shrink-0">
        {/* 🔥 파티 공유 전술 모멘텀 FEVER 게이지 바 */}
        <div className="mb-1.5">
          <FeverGaugeBar badges={feverBadges} party={gm.party} />
        </div>

        <div className="flex flex-col gap-1 mb-2">
          {gm.party.map((hero, i) => (
            <HeroRow
              key={hero.id} hero={hero} gm={gm}
              isCurrentTurn={currentHeroPartyIdx === i}
              isSelected={selectedHeroIdx === i}
              onClick={() => setSelectedHeroIdx(i)}
              onInspect={(h) => setInspectedHero(h)}
            />
          ))}
        </div>

        {/* ── 행동 선택 창 (균일 높이 그리드 & 설명 제거 & 홀드 상세 모달 연동) ── */}
        {!battleEnded && !battleEndedRef.current && aliveMonsters.length > 0 && isHeroTurn && currentHeroPartyIdx === selectedHeroIdx && selectedHero && selectedHero.currentHp > 0 && (
          <div className="panel p-2 mb-2 animate-slide-up" style={{ background: '#0b0d13dd', border: '1px solid #00d2ff44' }}>
            <div className="text-xs text-[#00d2ff] font-bold mb-1.5 border-b border-[#00d2ff22] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#00d2ff55] bg-[#1a2333] flex items-center justify-center">
                  {(() => {
                    const selCls = Object.values(CHARACTER_CLASSES).find(c => c.id === selectedHero.classId);
                    const selPortrait = CustomAssetService.getInstance().getMercenaryOverride(selectedHero.classId)
                      || (selCls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(selCls.promptKey) : undefined)
                      || (selectedHero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(selectedHero.portraitPromptKey) : undefined)
                      || CustomAssetService.getInstance().getMercenaryOverride(selectedHero.id)
                      || CustomAssetService.getInstance().getMercenaryOverride(selectedHero.name);
                    return selPortrait ? (
                      <img src={selPortrait} alt={selectedHero.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>⚔️</span>
                    );
                  })()}
                </span>
                <span>{selectedHero.name}</span>
                <span className="text-[10px] text-[#00d2ff] font-medium">{CHARACTER_CLASSES[selectedHero.classId]?.name || selectedHero.classId}</span>
                <span className="text-[10px] text-[#ffd54f] font-mono font-bold">Lv.{selectedHero.level}</span>
                <span className="text-[10px] font-normal text-[#8b9bb4]">({selectedHero.position === 'front' ? '전열' : selectedHero.position === 'mid' ? '중열' : '후열'})</span>
              </span>
              <span className="text-[10px] text-[#00d2ff] font-medium">(길게 눌러 스킬 상세)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* 기본 공격 또는 무기 접두사 인챈트 대체 스킬 */}
              {(() => {
                const weaponEnchantSkill = selectedHero.equipment?.weapon?.prefix?.grantedSkill;
                const hasWeaponSkill = !!weaponEnchantSkill;
                const weaponMpCost = hasWeaponSkill ? gm.getSkillManaCost(weaponEnchantSkill.manaCost, undefined, selectedHero) : 0;
                const hasMp = hasWeaponSkill ? selectedHero.currentMp >= weaponMpCost : true;

                const displayName = hasWeaponSkill ? weaponEnchantSkill.name : '기본 공격';
                const displayIcon = hasWeaponSkill ? (weaponEnchantSkill.icon || '✨') : '⚔️';
                const displayMpText = hasWeaponSkill 
                  ? (hasMp ? `${weaponMpCost} MP` : '0 MP (부족)')
                  : '0 MP';
                const displaySubLabel = hasWeaponSkill
                  ? (hasMp ? '✨ 인챈트 스킬 공격' : '💧 마나 부족: 일반 공격')
                  : '기본 물리 공격';

                const modalSkillInfo: Skill = hasWeaponSkill ? weaponEnchantSkill : {
                  id: 'basic_attack',
                  name: '기본 공격',
                  description: '적 1체에게 기본 물리 공격을 가합니다. (마나 소모 없음)',
                  manaCost: 0,
                  cooldown: 0,
                  power: 1.0,
                  effectType: 'damage',
                  targetType: 'single_enemy',
                  icon: '⚔️'
                };

                return (
                  <LongPressBox
                    onLongPress={() => setSelectedSkillForModal(modalSkillInfo)}
                    onClick={() => executeSkill(selectedHero, 'basic', targetedMonsterIdx)}
                    className={`btn btn-ghost flex flex-col justify-between p-2 sm:p-2.5 h-[80px] bg-transparent border relative select-none ${
                      hasWeaponSkill ? 'shadow-[0_0_8px_rgba(0,210,255,0.15)]' : ''
                    }`}
                    style={{
                      borderColor: hasWeaponSkill ? (hasMp ? '#00d2ff' : '#ffd54f88') : getSkillBtnStyle('basic').borderColor,
                      borderRadius: 10
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="shrink-0 flex items-center justify-center">
                          <GameIcon name={hasWeaponSkill ? weaponEnchantSkill.id : 'basic_attack'} icon={displayIcon} size={20} />
                        </span>
                        <span
                          className="text-sm font-bold truncate"
                          style={{ color: hasWeaponSkill ? (hasMp ? '#00e5ff' : '#ffd54f') : getSkillBtnStyle('basic').color }}
                        >
                          {displayName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-[11px] text-[#8b9bb4] truncate max-w-[140px]">{displaySubLabel}</span>
                      <span
                        className="text-[11px] font-mono font-bold shrink-0 ml-1"
                        style={{ color: hasWeaponSkill ? (hasMp ? '#64b5f6' : '#ffb74d') : '#8b9bb4' }}
                      >
                        {displayMpText}
                      </span>
                    </div>
                  </LongPressBox>
                );
              })()}
              
              {/* 스킬 목록 */}
              {heroSkills.map(skill => {
                const style = getSkillBtnStyle(skill);
                const cdLeft = heroCooldowns[`${selectedHero.id}_${skill.id}`] || 0;
                const mpCost = gm.getSkillManaCost(skill.manaCost, undefined, selectedHero);
                const hasEnoughMp = selectedHero.currentMp >= mpCost;
                const canUse = hasEnoughMp && cdLeft === 0 && !isProcessing && aliveMonsters.length > 0;
                const targetLabel = skill.targetType === 'all_enemies' ? '적 전체' : skill.targetType === 'all_allies' ? '아군 전체' : skill.targetType === 'single_ally' ? '단일 아군' : skill.targetType === 'self' ? '자신' : '단일 적';
                const nameLen = skill.name.length;
                const nameStyle = nameLen > 12 
                  ? { fontSize: '10px', lineHeight: '1.15' }
                  : nameLen > 8 
                  ? { fontSize: '11px', lineHeight: '1.2' }
                  : nameLen > 5 
                  ? { fontSize: '12px', lineHeight: '1.25' }
                  : { fontSize: '13.5px', lineHeight: '1.3' };

                // ⚡ [포지션 및 상태이상 연계 콤보 정밀 감지]:
                // 스킬의 실제 공격 포지션(전열/후열/광역)을 고려하여 실제 타격 대상 적에게 상태이상이 있을 때만 뱃지 표시
                const comboMatch = canUse ? isComboReadyForBattleTarget(skill, monsters, targetedMonsterIdx) : null;
                const readyCombo = comboMatch?.combo || null;
                const tags = getSkillTags(skill);

                return (
                  <LongPressBox
                    key={skill.id}
                    onLongPress={() => setSelectedSkillForModal(skill)}
                    onClick={() => canUse && executeSkill(selectedHero, skill, targetedMonsterIdx)}
                    className={`btn btn-ghost flex flex-col justify-between p-2 sm:p-2.5 h-[80px] bg-transparent border relative select-none ${!canUse ? 'opacity-40 cursor-not-allowed' : ''} ${
                      readyCombo ? 'animate-pulse shadow-[0_0_12px_rgba(255,213,79,0.45)]' : ''
                    }`}
                    style={{
                      borderColor: readyCombo ? '#ffd54f' : cdLeft > 0 ? '#ff704355' : style.borderColor,
                      borderRadius: 10,
                      boxShadow: readyCombo ? '0 0 14px rgba(255,213,79,0.5)' : (cdLeft > 0 ? undefined : style.shadow)
                    }}
                  >
                    {/* ⚡ 연계 발동 가능 뱃지 (실제 공격 대상 포지션 일치 시에만 등장) */}
                    {readyCombo && comboMatch && (
                      <span
                        className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md flex items-center gap-0.5 animate-bounce z-10"
                        title={`⚡ [${readyCombo.comboName}] 연계 폭발 가능! 대상: ${comboMatch.targetMonster.data?.name || '적'}(${comboMatch.isAoe ? '광역' : comboMatch.isFrontTarget ? '전열' : '후열'})`}
                      >
                        <span>⚡</span>
                        <span>연계!{comboMatch.isAoe ? '' : comboMatch.isFrontTarget ? '(전열)' : '(후열)'}</span>
                      </span>
                    )}

                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1 mr-1">
                        <span className="shrink-0 mt-0.5 flex items-center justify-center">
                          <GameIcon name={skill.id} icon={skill.icon} size={20} />
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className="font-bold line-clamp-2 break-keep tracking-tight"
                              style={{
                                color: readyCombo ? '#ffe57f' : (cdLeft > 0 ? '#90a4ae' : style.color),
                                ...nameStyle
                              }}
                            >
                              {skill.name}
                            </span>
                            {/* 대표 특성 태그 뱃지 */}
                            {tags.slice(0, 2).map(t => (
                              <span
                                key={t.id}
                                className="text-[7.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                              >
                                {t.label}
                              </span>
                            ))}
                            {skill.positionBonus === 'front' && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ef535022] text-[#ef5350] border border-[#ef535044] shrink-0">
                                전열
                              </span>
                            )}
                            {skill.positionBonus === 'back' && (
                              <span className="text-[8px] px-1 py-0.2 rounded font-bold bg-[#42a5f522] text-[#42a5f5] border border-[#42a5f544] shrink-0">
                                후열
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-[11px] text-[#8b9bb4] truncate max-w-[60%] flex items-center gap-1">
                        <span>{targetLabel}</span>
                        <span>•</span>
                        <span>{Math.round((skill.power || 1.0) * 100)}%</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {cdLeft > 0 ? (
                          <span className="text-[10px] text-[#ff7043] font-bold px-1.5 py-0.5 rounded bg-[#ff704322] border border-[#ff704344]">
                            ⏳ {cdLeft}턴
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold" style={{ color: hasEnoughMp ? '#64b5f6' : '#ef5350' }}>
                            {mpCost} MP
                          </span>
                        )}
                      </div>
                    </div>
                  </LongPressBox>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <ActionButton
            label={isAutoBattle ? (dict.battle.auto_battle_stop || '⏸ 자동전투 중지') : (dict.battle.auto_battle_start || '▶ 자동전투 시작')}
            variant={isAutoBattle ? 'ghost' : 'primary'}
            className="flex-1"
            disabled={battleEnded}
            onClick={() => {
              setIsAutoBattle(v => {
                const next = !v;
                isAutoBattleRef.current = next;
                setTimeout(() => persistBattleSnapshot(), 0);
                return next;
              });
            }}
          />
          {gm.isOvercharged ? (
            <ActionButton
              label={dict.battle.flee_locked || '🔒 철수 불가'}
              variant="danger"
              disabled={true}
              onClick={() => gm.addLog('⚠️ 광폭화된 심연 결계로 인해 전투에서 철수할 수 없습니다!', 'danger')}
            />
          ) : (
            <ActionButton
              label={dict.battle.flee || '⚠️ 전투 철수'}
              variant="ghost"
              disabled={isProcessing || battleEnded}
              onClick={() => handleFleeAttempt()}
            />
          )}
        </div>
      </div>
      </div>

      {battleResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
          <div className="panel-accent p-6 text-center mx-6 w-full max-w-[320px] animate-scale-up border" style={{ borderColor: isBossBattle ? '#a742f5' : '#333d4e' }}>
            <div className="text-5xl mb-3 flex items-center justify-center">
              {battleResult === 'win' ? (
                <GameIcon name="battle_victory" icon={isBossBattle ? '👑' : '🎉'} size={52} inline={false} />
              ) : (
                '💀'
              )}
            </div>
            <div className={`text-2xl font-bold font-cinzel mb-2 ${battleResult === 'win' ? (isBossBattle ? 'text-[#e0b0ff]' : 'text-[#66bb6a]') : 'text-[#ef5350]'}`}>
              {battleResult === 'win'
                ? (isBossBattle ? (dict.battle.boss_victory || '👑 보스 토벌 대승리!') : (dict.battle.victory || '🎉 전투 승리!'))
                : (dict.battle.defeat || '💀 전투 패배...')}
            </div>
            {battleResult === 'win' && (
              <div className="flex flex-col gap-2 my-2.5 text-left">
                {/* 획득 자원 및 경험치 종합 패널 */}
                <div className="panel p-2.5 bg-[#0d1424] border border-[#1e2d45] rounded-xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-[#00d2ff] border-b border-[#1e2d45] pb-1 flex items-center justify-between">
                    <span>전투 전리품 및 경험치</span>
                    {victorySummary?.exp ? (
                      <span className="text-[10px] text-[#38ef7d] font-mono">+{victorySummary.exp} EXP</span>
                    ) : null}
                  </div>

                  {/* 골드 / 층별 확정 자원(석재/철광석/에테르/공허파편) / 경험치 */}
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
                    <div className="bg-[#11192e] p-1.5 rounded-lg border border-[#22324f]">
                      <span className="text-[9px] text-[#ffd54f] block font-bold">골드</span>
                      <span className="text-xs text-white font-bold">+{victorySummary?.gold || 0}G</span>
                    </div>
                    <div className="bg-[#11192e] p-1.5 rounded-lg border border-[#22324f]">
                      <span
                        className="text-[9px] block font-bold flex items-center justify-center gap-0.5 truncate"
                        style={{
                          color:
                            victorySummary?.guaranteedResource?.key === 'stone'
                              ? '#b0bec5'
                              : victorySummary?.guaranteedResource?.key === 'iron'
                              ? '#90caf9'
                              : victorySummary?.guaranteedResource?.key === 'void_shard'
                              ? '#ce93d8'
                              : '#42a5f5',
                        }}
                      >
                        <span>{victorySummary?.guaranteedResource?.icon || '✨'}</span>
                        <span>{victorySummary?.guaranteedResource?.name || '에테르'}</span>
                      </span>
                      <span className="text-xs text-white font-bold">
                        +{victorySummary?.guaranteedResource?.amount ?? victorySummary?.ether ?? 0}
                      </span>
                    </div>
                    <div className="bg-[#11192e] p-1.5 rounded-lg border border-[#22324f]">
                      <span className="text-[9px] text-[#38ef7d] block font-bold">EXP</span>
                      <span className="text-xs text-white font-bold">+{victorySummary?.exp || 0}</span>
                    </div>
                  </div>

                  {/* 레벨업 알림 */}
                  {victorySummary?.levelUps && victorySummary.levelUps.length > 0 && (
                    <div className="bg-[#ffd54f15] p-2 rounded-lg border border-[#ffd54f33] text-xs text-[#ffd54f] font-bold flex flex-col gap-0.5">
                      {victorySummary.levelUps.map((lvl, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span>🎉</span>
                          <span>{lvl} 레벨 달성!</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 획득 자원 및 재료 */}
                  {victorySummary?.resources && Object.keys(victorySummary.resources).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {Object.entries(victorySummary.resources).map(([rKey, amt]) => {
                        const meta = GameManager.getResourceMeta(rKey) || RES_NAME_MAP[rKey] || { name: rKey, icon: '📦' };
                        return (
                          <span key={rKey} className="text-[10px] px-1.5 py-0.5 rounded bg-[#162035] border border-[#273859] text-[#cfd8dc] font-mono flex items-center gap-1">
                            <GameIcon name={rKey} icon={meta.icon} size={14} />
                            <span>{meta.name}</span>
                            <span className="text-[#38ef7d] font-bold">+{amt}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 획득 장비 */}
                  {victorySummary?.equipment && victorySummary.equipment.length > 0 && (
                    <div className="flex flex-col gap-1 mt-0.5">
                      {victorySummary.equipment.map((eq, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-[#1e1528] border border-[#ffd54f55]">
                          <span className="text-base">{eq.icon}</span>
                          <span className="text-xs text-[#ffd54f] font-bold truncate">{eq.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 📜 획득 신화/보스 비전서 */}
                  {victorySummary?.skillBooks && victorySummary.skillBooks.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-0.5">
                      <div className="text-[11px] font-bold text-[#ffd54f] flex items-center gap-1">
                        <span>📜</span>
                        <span>보스 비전서 획득!</span>
                      </div>
                      {victorySummary.skillBooks.map((sb, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-[#2a1b3d] border border-[#ffd54f] flex flex-col gap-0.5 shadow-[0_0_8px_rgba(255,213,79,0.25)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                              <GameIcon name={sb.bookId || sb.id || sb.skill.id} icon={sb.icon || sb.skill.icon || '📖'} size={16} />
                              <span>{sb.name}</span>
                            </div>
                            <span className="text-[9px] px-1 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44]">
                              {(sb.grade || sb.rank || 'mythic').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#ce93d8] leading-tight">
                            [{sb.skill.name}] {sb.skill.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isBossBattle && (
                  <div className="text-xs text-[#ce93d8] text-center font-medium mt-1">
                    '🌀 성채로 통하는 차원 귀환 포탈이 개방되었습니다!'
                  </div>
                )}

                {gm.pendingLoot.length > 0 && (
                  <div className="bg-[#ff416c1a] border border-[#ff416c55] p-2 rounded-lg text-xs text-[#ff80ab] flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1 font-bold">
                      <span>⚠️</span>
                      <span>배낭 슬롯 부족</span> ({gm.pendingLoot.length})
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <ActionButton 
                label="📜 전투 상세 기록 확인 (전체 로그)"
                variant="ghost"
                size="md"
                onClick={() => setShowFullLogModal(true)}
              />
              <ActionButton 
                label={
                  battleResult === 'win'
                    ? (gm.pendingLoot.length > 0
                        ? `📦 전리품 정리 (${gm.pendingLoot.length})`
                        : (isBossBattle ? '🌀 포탈을 타고 계속 탐험' : '탐험 계속하기'))
                    : '성채로 귀환'
                } 
                size="lg" 
                variant={battleResult === 'win' && gm.pendingLoot.length > 0 ? 'success' : (isBossBattle ? 'primary' : 'primary')}
                onClick={() => {
                  if (battleResult === 'win') {
                    // 승리 시 처리:
                    // 1. 완전 사망자: 즉시 파티에서 삭제하지 않고 isPermanentlyDead=true, currentHp=0으로 유지하여 던전 용병 관리(긴급 이송)에서 영주로 유해 운구 및 후방 지원 가능
                    // 2. 사경을 헤매다 간신히 생환한 영웅: 1 HP 기사회생 및 동료들과의 유대감 30% 하락 (사경 트라우마)
                    const survivorsWithTrauma: Mercenary[] = [];
                    gm.party.forEach(h => {
                      if (h.isPermanentlyDead || (h.deathCountdown !== undefined && h.deathCountdown <= 0)) {
                        h.isPermanentlyDead = true;
                        h.currentHp = 0;
                        h.deathCountdown = 0;
                      } else if (h.deathCountdown !== undefined || h.currentHp <= 0) {
                        h.currentHp = 1;
                        h.deathCountdown = undefined;
                        h.isPermanentlyDead = false;
                        survivorsWithTrauma.push(h);
                      } else {
                        // 🛡️ 온전한 생존자: 사경/사망 플래그 완벽 초기화
                        h.deathCountdown = undefined;
                        h.isPermanentlyDead = false;
                      }
                      h.statusEffects = [];
                    });

                    // 사경 생환자들의 동료 유대감 30% 하락 및 등급 강등 적용
                    survivorsWithTrauma.forEach(sh => {
                      gm.applyNearDeathTraumaBondDrop(sh.id);
                    });

                    gm.emit('partyUpdated', gm.party);
                    gm.saveGame();

                    if (gm.pendingLoot.length > 0) {
                      setShowLootModal(true);
                    } else {
                      navigateTo('exploration');
                    }
                  } else {
                    // 패배 후 성채 복귀 시 전멸 처리 (차원의 호각 여부, 전리품 정산, 성채 귀환 일괄 처리)
                    gm.resolvePartyWipeout('전투 패배');
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 🎒 전투 후 배낭 가득 참 전리품 선별 2개 모달 (배낭 목록 & 미수령 템 목록) ── */}
      <LootSelectionModal
        open={showLootModal}
        onClose={() => {
          setShowLootModal(false);
          navigateTo('exploration');
        }}
        completeButtonText="✅ 정리 완료 (탐험으로 이동)"
        onComplete={() => {
          setShowLootModal(false);
          navigateTo('exploration');
        }}
      />

      {/* ── 🔍 스킬 상세 정보 모달 (홀드 / ℹ️ 클릭 시 오픈) ── */}
      <SkillDetailModal
        skill={selectedSkillForModal}
        hero={selectedHero}
        gm={gm}
        canCast={
          selectedHero && selectedSkillForModal
            ? (selectedHero.currentMp >= gm.getSkillManaCost(selectedSkillForModal.manaCost, undefined, selectedHero) &&
               (heroCooldowns[`${selectedHero.id}_${selectedSkillForModal.id}`] || 0) === 0 &&
               !isProcessing && aliveMonsters.length > 0)
            : false
        }
        onCast={() => {
          if (selectedHero && selectedSkillForModal) {
            executeSkill(selectedHero, selectedSkillForModal, targetedMonsterIdx);
          }
        }}
        onClose={() => setSelectedSkillForModal(null)}
      />

      {/* ── 👾 몬스터 상세 정보 모달 (체력바 홀드 / ℹ️ 클릭 시 오픈) ── */}
      <MonsterDetailModal
        monster={inspectedMonster}
        onClose={() => setInspectedMonster(null)}
      />

      {/* ── 🛡️ 아군 용병 상세 정보 모달 (아군 행 홀드 / ℹ️ 클릭 시 오픈) ── */}
      <HeroDetailModal
        hero={inspectedHero}
        gm={gm}
        onClose={() => setInspectedHero(null)}
      />

      

      {/* ── 👑 보스 방 조우 시네마틱 비디오 오버레이 컷씬 ── */}
      {showBossCutscene && bossForCutscene && (
        <BossEntranceCutscene
          boss={bossForCutscene}
          isOvercharged={gm.isOvercharged}
          onComplete={handleBossCutsceneComplete}
        />
      )}

      {/* ── 📜 전체 상세 전투 로그 팝업 모달 ── */}
      {showFullLogModal && (
        <Modal
          title="📜 전투 상세 기록 (전체 로그)"
          open={showFullLogModal}
          zIndex="z-[70]"
          onClose={() => setShowFullLogModal(false)}
          footer={
            <button
              className="btn btn-ghost text-xs px-4 py-1.5"
              onClick={() => setShowFullLogModal(false)}
            >
              닫기
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[#8b9bb4] flex items-center justify-between border-b border-[#1f2738] pb-1.5">
              <span>총 <span className="text-[#00d2ff] font-bold font-mono">{(state.battleLogs || []).length}</span>건의 전투 기록</span>
              <span className="text-[10px] text-[#00d2ff]">스크롤하여 이전 기록을 확인할 수 있습니다.</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <LogPanel logs={state.battleLogs || []} isBattle maxHeight={520} emptyMessage="기록된 전투 로그가 없습니다." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
