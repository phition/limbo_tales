import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { ActionButton } from '../components/ActionButton';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { SoundManager } from '../managers/SoundManager';
import { Skill, StatusEffect, Mercenary, NemesisPartId, LogEntry } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import {
  NEMESIS_BOSS_CONFIG,
  NEMESIS_MILESTONES,
  NEMESIS_LEADERBOARD_MOCK,
  NemesisBossSkill
} from '../data/nemesis';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { GameDataService } from '../services/GameDataService';
import { gameDialog } from '../services/DialogService';
import { LogPanel } from '../components/LogPanel';
import { CustomAssetService } from '../services/CustomAssetService';
import { resolveCombatVfxAndSfx, getSkillTags, getEffectivePositionBonus, isComboReadyForBattleTarget, isComboReadyForMonster } from '../utils/skillComboUtils';
import { GameIcon } from '../components/GameIcon';
import { SkillDetailModal } from '../components/SkillDetailModal';
import { Modal } from '../components/Modal';

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
    >
      {children}
    </div>
  );
};

// ── 아군 영웅 전투 런타임 상태 ──────────────────────────────────────────────
interface RaidHeroCombatant {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  level: number;
  position: 'front' | 'mid' | 'back';
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  skills: Skill[];
  cooldowns: Record<string, number>;
  statusEffects: StatusEffect[];
  icon: string;
  damageDealt: number;
  originalHero?: Mercenary;
}

// ── 부위별 절멸기 차징 상태 ────────────────────────────────────────────────
interface PartChargingState {
  skillName: string;
  remainingBreakDmg: number;
  maxBreakDmg: number;
  skill: NemesisBossSkill;
  originalLuck?: number;
}

// ── 3대 부위 전투 런타임 상태 ──────────────────────────────────────────────
interface NemesisCombatPart {
  id: NemesisPartId;
  name: string;
  position: 'front' | 'mid' | 'back';
  archetype: string;
  currentHp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  icon: string;
  isDefeated: boolean;
  isGroggy?: boolean;
  chargingState?: PartChargingState | null;
  skills: NemesisBossSkill[];
  statusEffects: StatusEffect[];
}

// ── 스킬 컷인 상태 ────────────────────────────────────────────────────────
interface SkillCutInState {
  id: string;
  skillName: string;
  icon: string;
  isEnemy: boolean;
  heroName?: string;
  subText?: string;
  isUltimate?: boolean;
}

// ── 용병 상태 행 (PVE 감성 HeroRow) ────────────────────────────────────────
const HeroRow: React.FC<{
  hero: RaidHeroCombatant;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ hero, isCurrentTurn, isSelected, onClick }) => {
  const isAlive = hero.currentHp > 0;
  const hpPct = isAlive ? Math.max(0, Math.min(100, (hero.currentHp / hero.maxHp) * 100)) : 0;
  const mpPct = isAlive ? Math.max(0, Math.min(100, (hero.currentMp / hero.maxMp) * 100)) : 0;
  const posMeta = {
    front: { label: '전열', color: '#ef5350' },
    mid:   { label: '중열', color: '#ffd54f' },
    back:  { label: '후열', color: '#42a5f5' },
  }[hero.position || 'mid'];
  const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

  return (
    <div
      onClick={onClick}
      className={`panel px-2.5 py-1 sm:py-1.5 cursor-pointer transition-all select-none relative ${
        !isAlive ? 'opacity-35 grayscale bg-[#0c101a] border-[#18202d] shadow-none' : ''
      }`}
      style={{
        borderColor: !isAlive ? '#18202d' : isCurrentTurn ? '#00d2ff' : isSelected ? '#38ef7d' : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#00d2ff55] bg-[#1a2333] flex items-center justify-center relative shadow-xs">
          {customPortrait ? (
            <img src={customPortrait} alt={hero.name} className={`w-full h-full object-cover ${!isAlive ? 'grayscale' : ''}`} />
          ) : (
            <span className="text-xs">{hero.icon || '⚔️'}</span>
          )}
          {!isAlive && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">💀</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="font-bold text-xs" style={{ color: !isAlive ? '#607d8b' : undefined, textDecoration: !isAlive ? 'line-through' : undefined }}>
              {hero.name}
            </span>
            <span className="text-[10px] text-[#00d2ff] font-medium shrink-0">{hero.className}</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: !isAlive ? '#607d8b' : '#ffd54f' }}>Lv.{hero.level}</span>
            <span
              className="text-[9px] px-1 py-0.2 rounded font-bold"
              style={{ color: !isAlive ? '#607d8b' : posMeta.color, background: !isAlive ? '#26323822' : `${posMeta.color}22`, border: `1px solid ${!isAlive ? '#26323844' : `${posMeta.color}44`}` }}
            >
              [{posMeta.label}]
            </span>
            {isAlive && isCurrentTurn && <span className="text-[9px] bg-[#00d2ff22] text-[#00d2ff] px-1 rounded font-bold border border-[#00d2ff44]">▶ 내 턴</span>}
            {isAlive && hero.statusEffects && hero.statusEffects.length > 0 && (
              <span className="flex items-center gap-0.5 ml-1">
                {hero.statusEffects.map((se, sIdx) => {
                  const sIcon = se.type === 'shield' ? '🛡️' : se.type === 'buff_atk' ? '⚔️' : se.type === 'buff_def' ? '🛡️' : '✨';
                  return (
                    <span key={sIdx} className="text-[8px] px-1 py-0.2 rounded bg-black/60 border border-white/20 font-mono text-[#69f0ae]">
                      {sIcon}{se.type === 'shield' && se.magnitude ? `${Math.round(se.magnitude)}` : `${se.turnsLeft}턴`}
                    </span>
                  );
                })}
              </span>
            )}
          </div>
          <div className="bar-track" style={{ height: 5 }}><div className="bar-fill-hp h-full" style={{ width: `${hpPct}%` }} /></div>
          <div className="bar-track mt-0.5" style={{ height: 4 }}><div className="bar-fill-mp h-full" style={{ width: `${mpPct}%` }} /></div>
        </div>
        <div className="text-right text-[10px] text-[#8b9bb4] shrink-0 font-mono flex flex-col items-end">
          <span style={{ color: !isAlive ? '#607d8b' : '#ef5350' }}>
            {isAlive ? `${Math.round(hero.currentHp)}/${Math.round(hero.maxHp)}` : '💀 전투불능'}
          </span>
          <span className="text-[#00d2ff] text-[9px]">
            {isAlive ? `${Math.round(hero.currentMp)}/${Math.round(hero.maxMp)}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

type NemesisTab = 'hub' | 'milestones' | 'ranking';

export const NemesisView: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const [, setGdsVersion] = useState(0);
  useEffect(() => {
    return GameDataService.getInstance().onUpdate(() => {
      setGdsVersion(v => v + 1);
    });
  }, []);

  const gateLevel = state.buildings['arenaGate']?.level || 0;
  const isGateUnlocked = gm.isMasterAccount || gateLevel >= 3;
  const [nemesisTab, setNemesisTab] = useState<NemesisTab>('hub');

  // ── ⚔️ 레이드 전투 상태 ──────────────────────────────────────────────
  const [inBattle, setInBattle] = useState(false);
  const [battleTurn, setBattleTurn] = useState(1);
  const [maxTurns] = useState(15);
  const [heroes, setHeroes] = useState<RaidHeroCombatant[]>([]);
  const [selectedHeroIdx, setSelectedHeroIdx] = useState(0);

  // 3대 부위 전투 런타임 상태
  const [bossParts, setBossParts] = useState<Record<NemesisPartId, NemesisCombatPart>>({
    head: { ...NEMESIS_BOSS_CONFIG.parts.head, currentHp: 4000000, isDefeated: false, statusEffects: [] },
    body: { ...NEMESIS_BOSS_CONFIG.parts.body, currentHp: 5000000, isDefeated: false, statusEffects: [] },
    tail: { ...NEMESIS_BOSS_CONFIG.parts.tail, currentHp: 3500000, isDefeated: false, statusEffects: [] },
  });
  const [targetedPart, setTargetedPart] = useState<NemesisPartId>('head');
  const [attackingPartId, setAttackingPartId] = useState<NemesisPartId | null>(null);

  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 1.5 | 2>(2);
  const [activeHeroTurnId, setActiveHeroTurnId] = useState<string | null>(null);
  const [isHeroTurn, setIsHeroTurn] = useState(false);
  const [selectedSkillForModal, setSelectedSkillForModal] = useState<Skill | null>(null);

  const [bossHp, setBossHp] = useState(state.nemesisState?.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp);
  const [totalBattleDmg, setTotalBattleDmg] = useState(0);

  // 연출 & VFX 상태
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [skillCutIn, setSkillCutIn] = useState<SkillCutInState | null>(null);
  const [screenFlash, setScreenFlash] = useState<'enemy' | 'player' | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // 📜 PVE 표준 LogPanel 연동 전투 로그
  const [battleLogs, setBattleLogs] = useState<LogEntry[]>([]);
  const [showFullLogModal, setShowFullLogModal] = useState(false);

  // 👑 전술 오퍼레이터 상태 (3선발 + 1오퍼레이터 체계)
  const [operatorHero, setOperatorHero] = useState<Mercenary | null>(null);

  // 📊 전투 상세 딜미터기 상태
  const [combatMetrics, setCombatMetrics] = useState<CombatantMetrics[]>([]);
  const combatMetricsRef = useRef<Record<string, CombatantMetrics>>({});

  // ── 정산 모달 ────────────────────────────────────────────────────────
  const [settlement, setSettlement] = useState<{
    damage: number;
    coins: number;
    ether: number;
    isNewRecord: boolean;
    bossPhaseChanged: boolean;
    partDamages: { head: number; body: number; tail: number };
  } | null>(null);

  // ── 비동기 Ref 제어 ──────────────────────────────────────────────────
  const isProcessingRef = useRef(false);
  const heroesRef = useRef<RaidHeroCombatant[]>([]);
  const bossPartsRef = useRef(bossParts);
  const targetedPartRef = useRef<NemesisPartId>(targetedPart);
  const isAutoBattleRef = useRef(isAutoBattle);
  const battleSpeedRef = useRef(battleSpeed);
  const bossHpRef = useRef(bossHp);
  const totalBattleDmgRef = useRef(0);
  const battleTurnRef = useRef(battleTurn);

  // 라운드 내 행동 큐 Ref
  const turnQueueRef = useRef<Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }>>([]);
  const turnIndexRef = useRef(0);
  const initialPartHpsRef = useRef<{ head: number; body: number; tail: number }>({ head: 4000000, body: 5000000, tail: 3500000 });

  useEffect(() => { heroesRef.current = heroes; }, [heroes]);
  useEffect(() => { bossPartsRef.current = bossParts; }, [bossParts]);
  useEffect(() => { targetedPartRef.current = targetedPart; }, [targetedPart]);
  useEffect(() => { isAutoBattleRef.current = isAutoBattle; }, [isAutoBattle]);
  useEffect(() => { battleSpeedRef.current = battleSpeed; }, [battleSpeed]);
  useEffect(() => { bossHpRef.current = bossHp; }, [bossHp]);
  useEffect(() => { totalBattleDmgRef.current = totalBattleDmg; }, [totalBattleDmg]);
  useEffect(() => { battleTurnRef.current = battleTurn; }, [battleTurn]);

  // ── 사운드 재생 ─────────────────────────────────────────────────────
  const playSfx = useCallback((type: 'hit' | 'crit' | 'shield' | 'shield_break' | 'victory' | 'defeat' | 'cast') => {
    try {
      const sm = SoundManager.getInstance();
      if (type === 'hit') sm.play('slash');
      else if (type === 'crit') sm.play('crit');
      else if (type === 'shield') sm.play('shield');
      else if (type === 'shield_break') sm.play('shield_break');
      else if (type === 'victory') sm.play('victory');
      else if (type === 'defeat') sm.play('defeat');
      else if (type === 'cast') sm.play('spell');
    } catch (_) {}
  }, []);

  // ── PVE 스타일 로그 기록기 ───────────────────────────────────────────
  const addLog = useCallback((text: string, type: 'normal' | 'reward' | 'danger' | 'story' | 'system' = 'normal') => {
    const entry: LogEntry = {
      id: `nemesis_log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      text,
      type,
    };
    setBattleLogs(prev => [...prev.slice(-40), entry]);
  }, []);

  // ── VFX 발생기 ───────────────────────────────────────────────────────
  const triggerVfx = useCallback((type: VFXType, x: number, y: number, text?: string, isCrit?: boolean) => {
    const ev: VFXEvent = { id: `vfx_${Date.now()}_${Math.random()}`, type, x, y, text, isCrit };
    setVfxList(prev => [...prev.slice(-8), ev]);
  }, []);

  const handleVfxComplete = useCallback((id: string) => {
    setVfxList(prev => prev.filter(v => v.id !== id));
  }, []);

  const getDelay = useCallback((ms: number) => {
    return Math.max(150, Math.round(ms / battleSpeedRef.current));
  }, []);

  // ── 레이드 종료 및 정산 처리 ─────────────────────────────────────────
  const finalizeRaidBattle = useCallback(() => {
    isProcessingRef.current = true;
    setIsHeroTurn(false);
    setActiveHeroTurnId(null);

    const initHps = initialPartHpsRef.current;
    const finalParts = bossPartsRef.current;

    const headDmg = Math.max(0, initHps.head - finalParts.head.currentHp);
    const bodyDmg = Math.max(0, initHps.body - finalParts.body.currentHp);
    const tailDmg = Math.max(0, initHps.tail - finalParts.tail.currentHp);
    const finalDmg = headDmg + bodyDmg + tailDmg;

    const res = gm.recordNemesisDamage(finalDmg, heroesRef.current.map(h => h.id), {
      head: headDmg,
      body: bodyDmg,
      tail: tailDmg,
    });

    setCombatMetrics(Object.values(combatMetricsRef.current));
    setSettlement({
      damage: finalDmg,
      coins: res.coinsEarned,
      ether: res.etherEarned,
      isNewRecord: res.isNewRecord,
      bossPhaseChanged: res.bossPhaseChanged,
      partDamages: { head: headDmg, body: bodyDmg, tail: tailDmg },
    });
    playSfx('victory');
  }, [gm, playSfx]);

  // ── 턴 진행 순서 실행기 (processNextAction) ───────────────────────────
  const processNextActionRef = useRef<() => void>(() => {});

  const processNextAction = useCallback(() => {
    if (settlement || !inBattle) return;

    // 생존 영웅 및 생존 부위 확인
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    const alivePartKeys = (['head', 'body', 'tail'] as const).filter(
      k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0
    );

    // 종료 조건 1: 모든 아군 전멸
    if (liveHeroes.length === 0) {
      addLog('💀 파티원 전원이 전투 불능 상태가 되었습니다! 긴급 퇴각을 개시합니다.', 'danger');
      finalizeRaidBattle();
      return;
    }

    // 종료 조건 2: 네메시스 전 부위 패퇴
    if (alivePartKeys.length === 0) {
      addLog('👑 [네메시스 완전 격파!] 네메시스의 모든 부위가 산산조각 났습니다!', 'reward');
      finalizeRaidBattle();
      return;
    }

    // 종료 조건 3: 최대 턴(15턴) 도달
    if (battleTurnRef.current > maxTurns) {
      addLog('⌛ [차원의 한계] 15턴이 경과하여 시공간 균열이 붕괴되었습니다. 전장을 이탈합니다.', 'system');
      finalizeRaidBattle();
      return;
    }

    // 턴 큐 확인
    const queue = turnQueueRef.current;
    if (turnIndexRef.current >= queue.length) {
      // 새로운 라운드 시작
      const nextTurn = battleTurnRef.current + 1;
      setBattleTurn(nextTurn);
      battleTurnRef.current = nextTurn;

      if (nextTurn > maxTurns) {
        addLog('⌛ 15턴 작전 시간이 만료되었습니다.', 'system');
        finalizeRaidBattle();
        return;
      }

      // 쿨다운 및 지속 버프/상태이상 턴 감소
      heroesRef.current.forEach(h => {
        Object.keys(h.cooldowns).forEach(k => {
          if (h.cooldowns[k] > 0) h.cooldowns[k] -= 1;
        });
        h.statusEffects = (h.statusEffects || []).map(se => ({ ...se, turnsLeft: se.turnsLeft - 1 })).filter(se => se.turnsLeft > 0);
      });
      setHeroes([...heroesRef.current]);

      // 새 턴 큐 구성 (SPD 순 정렬)
      const newQueue: Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }> = [
        ...liveHeroes.map(h => ({ type: 'hero' as const, id: h.id, spd: h.spd, luck: h.luck })),
        ...alivePartKeys.map(k => ({ type: 'part' as const, id: k, spd: bossPartsRef.current[k].spd, luck: bossPartsRef.current[k].luck }))
      ];
      newQueue.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
      turnQueueRef.current = newQueue;
      turnIndexRef.current = 0;
    }

    const currentTurn = turnQueueRef.current[turnIndexRef.current];
    turnIndexRef.current += 1;

    if (!currentTurn) {
      processNextActionRef.current();
      return;
    }

    if (currentTurn.type === 'hero') {
      const hero = heroesRef.current.find(h => h.id === currentTurn.id);
      if (!hero || hero.currentHp <= 0) {
        processNextActionRef.current();
        return;
      }

      setActiveHeroTurnId(hero.id);
      const hIdx = heroesRef.current.findIndex(h => h.id === hero.id);
      if (hIdx >= 0) setSelectedHeroIdx(hIdx);

      if (isAutoBattleRef.current) {
        // 자동 전투: 사용 가능한 스킬(궁극기 우선) 시전 후 턴 넘김
        setIsHeroTurn(false);
        const timer = setTimeout(() => {
          if (!isAutoBattleRef.current) return;
          const usableSkill = hero.skills.find(s => hero.currentMp >= s.manaCost && (hero.cooldowns[s.id] || 0) === 0);
          executeHeroCombat(hero, usableSkill || null);
        }, getDelay(400));
        return () => clearTimeout(timer);
      } else {
        // 수동 조작: 플레이어 입력 대기
        setIsHeroTurn(true);
      }
    } else {
      // 보스 부위 행동
      const partKey = currentTurn.id as NemesisPartId;
      const part = bossPartsRef.current[partKey];
      if (!part || part.isDefeated || part.currentHp <= 0) {
        processNextActionRef.current();
        return;
      }

      setIsHeroTurn(false);
      setActiveHeroTurnId(null);
      setAttackingPartId(partKey);

      const timer = setTimeout(() => {
        executePartCombat(part);
      }, getDelay(350));
      return () => clearTimeout(timer);
    }
  }, [addLog, finalizeRaidBattle, getDelay, inBattle, maxTurns, settlement]);

  useEffect(() => {
    processNextActionRef.current = processNextAction;
  }, [processNextAction]);

  // ── 아군 영웅 공격/스킬 실행 (PVE 동일 스킬 효과 & VFX 연동) ─────────
  const executeHeroCombat = useCallback((hero: RaidHeroCombatant, skill: Skill | null) => {
    isProcessingRef.current = true;
    setIsHeroTurn(false);

    // 타겟 부위 확인 (패퇴 시 다른 생존 부위 자동 타겟)
    let targetKey = targetedPartRef.current;
    if (bossPartsRef.current[targetKey].isDefeated || bossPartsRef.current[targetKey].currentHp <= 0) {
      const alive = (['head', 'body', 'tail'] as const).filter(
        k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0
      );
      if (alive.length === 0) {
        finalizeRaidBattle();
        return;
      }
      targetKey = alive[0];
      setTargetedPart(targetKey);
      targetedPartRef.current = targetKey;
    }

    const useSkill = skill !== null;
    const isUltimate = useSkill && (
      Boolean(skill.isSpecial) ||
      Boolean(skill.name?.includes('궁극기')) ||
      Boolean(skill.id?.endsWith('_ultimate')) ||
      Boolean(CHARACTER_CLASSES[hero.classId]?.specialSkill?.id === skill.id)
    );

    // 1. MP 차감 및 쿨다운 설정
    if (useSkill) {
      hero.currentMp = Math.max(0, hero.currentMp - skill.manaCost);
      hero.cooldowns[skill.id] = skill.cooldown;
      setSkillCutIn({
        id: String(Date.now()),
        skillName: skill.name,
        icon: skill.icon || '⚔️',
        isEnemy: false,
        heroName: hero.name,
        subText: isUltimate ? '★ CLASS ULTIMATE ★' : `${hero.className} 전술 스킬`,
        isUltimate,
      });

      if (isUltimate) {
        try { SoundManager.getInstance().play('fever_burst'); } catch (_) {}
      }
    }

    // 2. 스킬 고유 VFX/SFX 판별
    const isMultiTargetAttack = useSkill && (skill.targetType === 'all_enemies' || isUltimate);
    const heroClassTier = CHARACTER_CLASSES[hero.classId]?.tier ?? 0;
    const skillTier: 0 | 1 | 2 = !useSkill ? 0 : ((isUltimate || (skill.power || 1) >= 2.0 || heroClassTier >= 2) ? 2 : (heroClassTier >= 1 ? 1 : 0));
    const fxInfo = resolveCombatVfxAndSfx(useSkill ? skill : 'basic', (hero.originalHero || hero) as unknown as Mercenary, isMultiTargetAttack, skillTier);

    // 3. 🛡️ 지원/치유 스킬인 경우 (heal, regen, shield, buff, cleanse)
    const isSupport = useSkill && ['heal', 'regen', 'shield', 'buff', 'cleanse'].includes(skill.effectType || '');
    if (isSupport) {
      let targetAllies: RaidHeroCombatant[] = [];
      if (skill.targetType === 'single_ally') {
        const alive = heroesRef.current.filter(h => h.currentHp > 0);
        if (alive.length > 0) {
          const lowest = alive.reduce((prev, curr) => (curr.currentHp / curr.maxHp) < (prev.currentHp / prev.maxHp) ? curr : prev, alive[0]);
          targetAllies = [lowest];
        } else {
          targetAllies = [hero];
        }
      } else if (skill.targetType === 'self') {
        targetAllies = [hero];
      } else {
        targetAllies = heroesRef.current.filter(h => h.currentHp > 0);
      }

      if (skill.effectType === 'heal' || skill.effectType === 'regen') {
        const healReports: string[] = [];
        targetAllies.forEach(ally => {
          let healAmt = 0;
          if (skill.id === 'saint_ultimate') {
            healAmt = ally.maxHp - ally.currentHp;
            ally.currentHp = ally.maxHp;
          } else if (skill.id === 'chrono_ultimate' || skill.description?.includes('시공 역류')) {
            const healRate = 0.58;
            healAmt = Math.max(1, Math.floor(ally.maxHp * healRate));
            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
            const mpAmt = Math.max(1, Math.floor(ally.maxMp * healRate));
            ally.currentMp = Math.min(ally.maxMp, ally.currentMp + mpAmt);
            heroesRef.current.forEach(h => { h.cooldowns = {}; });
          } else {
            healAmt = (skill.power || 1.2) <= 1.0
              ? Math.max(1, Math.floor(ally.maxHp * (skill.power || 0.4)))
              : Math.max(1, Math.floor(hero.atk * ((skill.power || 1.2) * 0.5) + ally.maxHp * 0.15));
            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
          }
          healReports.push(`${ally.name} +${healAmt.toLocaleString()}`);
          const aIdx = heroesRef.current.findIndex(h => h.id === ally.id);
          triggerVfx(targetAllies.length > 1 ? 'holy_heal_aoe' : 'holy_heal', 30 + aIdx * 20, 72, `+${healAmt.toLocaleString()}`);
        });

        // 정화 스킬 체크
        if (skill.id.includes('purify') || skill.id.includes('sanctuary') || skill.description?.includes('정화')) {
          targetAllies.forEach(ally => {
            ally.statusEffects = (ally.statusEffects || []).filter(s => !['bleed', 'poison', 'burn', 'stun', 'freeze', 'debuff_atk', 'debuff_def'].includes(s.type));
          });
        }

        try { SoundManager.getInstance().play('heal'); } catch (_) { playSfx('cast'); }
        addLog(`✨ [${hero.name}] [${skill.name}] 시전! (${healReports.join(', ')})`, 'reward');
      } else if (skill.effectType === 'shield') {
        targetAllies.forEach(ally => {
          const shAmt = Math.max(1, Math.floor(hero.atk * (skill.power || 1.2) + ally.maxHp * 0.10));
          const existing = ally.statusEffects.find(s => s.type === 'shield');
          if (existing) {
            existing.turnsLeft = 2;
            existing.magnitude = Math.max(existing.magnitude || 0, shAmt);
          } else {
            ally.statusEffects.push({ type: 'shield', turnsLeft: 2, totalTurns: 2, magnitude: shAmt, source: `${hero.name} [${skill.name}]` });
          }
          const aIdx = heroesRef.current.findIndex(h => h.id === ally.id);
          triggerVfx('shield', 30 + aIdx * 20, 72, `🛡️+${shAmt.toLocaleString()}`);
        });
        try { SoundManager.getInstance().play('shield'); } catch (_) { playSfx('shield'); }
        addLog(`🛡️ [${hero.name}] [${skill.name}] 시전! 아군 전술 보호막 전개!`, 'reward');
      } else if (skill.effectType === 'buff') {
        const isAtk = skill.description?.includes('공격력') || skill.id.includes('atk');
        const bType = isAtk ? 'buff_atk' : 'buff_def';
        targetAllies.forEach(ally => {
          const existing = ally.statusEffects.find(s => s.type === bType);
          if (existing) {
            existing.turnsLeft = 2;
          } else {
            ally.statusEffects.push({ type: bType, turnsLeft: 2, totalTurns: 2, magnitude: 0.25, source: `${hero.name} [${skill.name}]` });
          }
          const aIdx = heroesRef.current.findIndex(h => h.id === ally.id);
          triggerVfx('arcane_nova', 30 + aIdx * 20, 72, 'BUFF!');
        });
        try { SoundManager.getInstance().play('spell'); } catch (_) { playSfx('cast'); }
        addLog(`⚔️✨ [${hero.name}] [${skill.name}] 시전! 아군 능력치 강화 부여!`, 'reward');
      }

      setHeroes([...heroesRef.current]);
      setTimeout(() => {
        setSkillCutIn(null);
        isProcessingRef.current = false;
        processNextActionRef.current();
      }, getDelay(450));
      return;
    }

    // 4. ⚔️ 공격 스킬 및 기본 공격 처리
    const isAoe = Boolean(isMultiTargetAttack);
    const targetPartKeys: NemesisPartId[] = isAoe
      ? (['head', 'body', 'tail'] as NemesisPartId[]).filter(k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0)
      : [targetKey];

    const partPosMap: Record<NemesisPartId, { x: number; y: number }> = {
      head: { x: 25, y: 32 },
      body: { x: 50, y: 32 },
      tail: { x: 75, y: 32 },
    };

    let totalActionDmg = 0;
    let anyCrit = false;

    targetPartKeys.forEach(pKey => {
      const part = bossPartsRef.current[pKey];
      if (!part || part.isDefeated || part.currentHp <= 0) return;

      // A) 포지션 연계 보너스 (전열 머리 +25%, 후열 꼬리 +20%)
      const posBonus = !useSkill ? undefined : (skill.positionBonus || getEffectivePositionBonus(skill));
      let posMult = 1.0;
      if (posBonus === 'front' && pKey === 'head') posMult = 1.25;
      else if (posBonus === 'back' && pKey === 'tail') posMult = 1.20;

      // B) 기본 위력 및 오퍼레이터 화력 보너스 (+10%)
      const pwr = useSkill ? (skill.power || 1.0) : 1.0;
      const opBonus = 1.10;
      const aoeMult = isAoe ? 0.85 : 1.0;
      let rawDmg = Math.floor(hero.atk * pwr * 1.5 * posMult * opBonus * aoeMult);

      // 영웅 공격력 버프/디버프 반영
      const atkBuff = (hero.statusEffects || []).find(s => s.type === 'buff_atk');
      if (atkBuff) rawDmg = Math.floor(rawDmg * (1 + (atkBuff.magnitude || 0.25)));
      const atkDebuff = (hero.statusEffects || []).find(s => s.type === 'debuff_atk');
      if (atkDebuff) rawDmg = Math.floor(rawDmg * (1 - (atkDebuff.magnitude || 0.25)));

      // C) 치명타 판정
      const heroEff = hero.originalHero ? gm.getHeroEffectiveStats(hero.originalHero) : null;
      const critBonus = heroEff?.critRateBonus || 0;
      const critChance = Math.min(95, Math.max(5, hero.luck * 0.35 + critBonus + (isUltimate ? 20 : 0)));
      const isCrit = Math.random() * 100 < critChance;
      if (isCrit) anyCrit = true;
      const critMult = (heroEff?.critDmg || 1.5) + (hero.luck * 0.005);

      // D) 방어력 및 점근형 DR 공식 연산
      let partDef = part.def;
      const hasBurn = (part.statusEffects || []).some(s => s.type === 'burn');
      if (hasBurn) partDef = Math.round(partDef * 0.5);
      const hasFreeze = (part.statusEffects || []).some(s => s.type === 'freeze');
      if (hasFreeze) partDef = Math.round(partDef * 1.4);
      const defDebuffs = (part.statusEffects || []).filter(s => s.type === 'debuff_def');
      const totalDefDebuff = defDebuffs.reduce((sum, s) => sum + (s.magnitude || 0), 0);
      if (totalDefDebuff > 0) partDef = Math.max(0, Math.round(partDef * (1 - Math.min(0.9, totalDefDebuff))));

      const piercePct = (useSkill ? (skill.piercePct || 0) : 0) + (isUltimate ? 20 : 0);
      if (piercePct > 0) partDef = Math.round(partDef * (1 - Math.min(100, piercePct) / 100));

      const extraCrit = isCrit ? Math.round(rawDmg * (critMult - 1)) : 0;
      let totalAtk = rawDmg + extraCrit;
      if (part.isGroggy) totalAtk = Math.floor(totalAtk * 1.5);

      const K = 500;
      const dmg = Math.max(80, Math.round(totalAtk * (K / (partDef + K))));
      totalActionDmg += dmg;

      // E) ⚡ [차징 저지 & 브레이크 판정] (차징 게이지는 입은 피해의 50%만 적용)
      if (part.chargingState) {
        const breakDmg = Math.max(1, Math.floor(dmg * 0.5));
        part.chargingState.remainingBreakDmg -= breakDmg;
        if (part.chargingState.remainingBreakDmg <= 0) {
          if (part.chargingState.originalLuck !== undefined) {
            part.luck = part.chargingState.originalLuck;
          }
          part.chargingState = null;
          part.isGroggy = true;
          playSfx('shield_break');
          triggerVfx('boss_cataclysm', partPosMap[pKey].x, partPosMap[pKey].y, 'BREAK!', true);
          addLog(`💥 [차징 저지 성공!] ${hero.name}의 강력한 타격으로 [${part.name}]의 절멸기 차징이 파쇄되어 1턴간 그로기 상태에 빠졌습니다! (행운 정상화)`, 'reward');
          setSkillCutIn({
            id: String(Date.now()),
            skillName: `💥 [${part.name}] 차징 붕괴!`,
            icon: '💥⚡',
            isEnemy: false,
            subText: '1턴간 그로기 (받는 피해 +50%)'
          });
        } else {
          addLog(`⚡ [차징 저지 중] [${part.name}] 남은 브레이크 요구치: ${Math.max(0, part.chargingState.remainingBreakDmg).toLocaleString()}`);
        }
      }

      // F) 부위 체력 차감 (사경 없음: 0 즉시 패퇴)
      part.currentHp = Math.max(0, part.currentHp - dmg);
      if (part.currentHp <= 0) {
        part.isDefeated = true;
        if (part.chargingState?.originalLuck !== undefined) {
          part.luck = part.chargingState.originalLuck;
        }
        part.chargingState = null;
        addLog(`💀 [${part.name} 완전 패퇴!] 부위가 파괴되어 더 이상 재생하거나 행동하지 않습니다!`, 'reward');
        playSfx('shield_break');
      }

      // 🌟 [상태이상 연계 콤보 폭발 (Status Detonation Combo)]
      const combo = isComboReadyForMonster(useSkill ? skill : 'basic', part.statusEffects);
      if (combo && part.currentHp > 0) {
        const comboDmg = Math.max(100, Math.floor(dmg * 0.45));
        totalActionDmg += comboDmg;
        part.currentHp = Math.max(0, part.currentHp - comboDmg);

        let comboVfx: VFXType = 'arcane_nova';
        if (combo.comboName.includes('빙결') || combo.comboName.includes('초전도')) comboVfx = 'blizzard_storm';
        else if (combo.comboName.includes('출혈') || combo.comboName.includes('낙인')) comboVfx = 'blood_bleed';
        else if (combo.comboName.includes('독성') || combo.comboName.includes('산성')) comboVfx = 'dark_curse';
        else if (combo.comboName.includes('붕괴') || combo.comboName.includes('열폭')) comboVfx = 'heavy_slash';
        else if (combo.comboName.includes('신성') || combo.comboName.includes('성염')) comboVfx = 'divine_smite';
        else if (combo.comboName.includes('화염')) comboVfx = 'fire';

        triggerVfx(comboVfx, partPosMap[pKey].x, partPosMap[pKey].y, `⚡${combo.comboName.split(' ')[0]}`, true);
        addLog(`💥⚡ [연계 콤보 폭발!] ${combo.icon || '⚡'} [${combo.comboName}] 발동! [${part.name}]에게 추가 ${comboDmg.toLocaleString()} 콤보 피해!`, 'reward');

        if (part.chargingState) {
          const comboBreakDmg = Math.max(1, Math.floor(comboDmg * 0.5));
          part.chargingState.remainingBreakDmg -= comboBreakDmg;
          if (part.chargingState.remainingBreakDmg <= 0) {
            if (part.chargingState.originalLuck !== undefined) {
              part.luck = part.chargingState.originalLuck;
            }
            part.chargingState = null;
            part.isGroggy = true;
            playSfx('shield_break');
            triggerVfx('boss_cataclysm', partPosMap[pKey].x, partPosMap[pKey].y, 'BREAK!', true);
            addLog(`💥 [차징 저지 성공!] ${hero.name}의 연계 콤보로 [${part.name}]의 절멸기 차징이 파쇄되어 1턴간 그로기 상태에 빠졌습니다! (행운 정상화)`, 'reward');
          }
        }
      }

      // G) 스킬 고유 상태이상 부위 부여
      if (useSkill && part.currentHp > 0) {
        const sDesc = (skill.description || '').toLowerCase();
        const sName = (skill.name || '').toLowerCase();
        const dur = skill.statusDuration || 2;

        const checkPartResist = (effectName: string): boolean => {
          const resistChance = Math.min(50, (part.luck || 10) * 0.35);
          if (Math.random() * 100 < resistChance) {
            addLog(`🛡️ [저항(RESIST)] [${part.name}]이(가) 높은 행운(🍀${part.luck})으로 [${effectName}] 효과를 저항했습니다!`, 'system');
            return true;
          }
          return false;
        };

        const applyPartEffect = (type: StatusEffect['type'], duration: number, mag: number, name: string) => {
          if (checkPartResist(name)) return;
          const ex = part.statusEffects.find(s => s.type === type);
          if (ex) {
            ex.turnsLeft = Math.max(ex.turnsLeft, duration);
          } else {
            part.statusEffects.push({ type, turnsLeft: duration, totalTurns: duration, magnitude: mag, source: hero.name });
          }
        };

        if (skill.effectType === 'bleed' || sDesc.includes('출혈') || sName.includes('출혈')) {
          applyPartEffect('bleed', dur, 0.08, '출혈');
          addLog(`🩸 [출혈] [${part.name}]에게 ${dur}턴간 출혈 상태를 부여했습니다.`, 'normal');
        }
        if (skill.effectType === 'poison' || sDesc.includes('중독') || sName.includes('독')) {
          applyPartEffect('poison', dur + 1, 0.12, '중독');
          addLog(`☠️ [중독] [${part.name}]에게 ${dur + 1}턴간 맹독을 주입했습니다.`, 'normal');
        }
        if (skill.effectType === 'burn' || sDesc.includes('화상') || sName.includes('화염')) {
          applyPartEffect('burn', dur, 0.08, '화상');
          addLog(`🔥 [화상] [${part.name}]에게 ${dur}턴간 화상을 부여했습니다 (방어력 50% 분쇄).`, 'normal');
        }
        if (skill.effectType === 'freeze' || sDesc.includes('빙결') || sName.includes('빙결')) {
          applyPartEffect('freeze', 1, 0.04, '빙결');
          addLog(`❄️ [빙결] [${part.name}]에게 1턴간 빙결(행동 불가)을 부여했습니다!`, 'normal');
        }
        if (skill.effectType === 'stun' || sDesc.includes('기절') || sName.includes('기절')) {
          applyPartEffect('stun', 1, 0, '기절');
          addLog(`💫 [기절] [${part.name}]에게 1턴간 기절을 부여했습니다!`, 'normal');
        }
        if (skill.effectType === 'debuff' || sDesc.includes('방어력') || sDesc.includes('방어 분쇄')) {
          applyPartEffect('debuff_def', dur, 0.25, '방어 분쇄');
          addLog(`🛡️⬇️ [방어 분쇄] [${part.name}]의 방어력을 ${dur}턴간 25% 감소시켰습니다.`, 'normal');
        }
        if (sDesc.includes('공격력 약화') || sDesc.includes('공격력 감소')) {
          applyPartEffect('debuff_atk', dur, 0.25, '공격력 약화');
          addLog(`⚔️⬇️ [공격력 약화] [${part.name}]의 공격력을 ${dur}턴간 25% 감소시켰습니다.`, 'normal');
        }
      }

      // H) 흡혈 (Drain)
      const gearDrainPct = (heroEff?.drainPercent || 0) / 100;
      const skillDrainPct = (useSkill && skill) ? (skill.drainPct || (skill.effectType === 'drain' ? 0.35 : 0)) : 0;
      const totalDrainRatio = gearDrainPct + skillDrainPct;
      const effectiveMaxHp = Math.max(hero.maxHp, heroEff?.maxHp || 0);
      if (totalDrainRatio > 0 && dmg > 0 && hero.currentHp < effectiveMaxHp) {
        const drainAmt = Math.max(1, Math.floor(dmg * totalDrainRatio));
        const actualHealed = Math.min(effectiveMaxHp - hero.currentHp, drainAmt);
        if (actualHealed > 0) {
          hero.currentHp += actualHealed;
          addLog(`🩸 [생명력 흡수] ${hero.name}이(가) 가한 피해의 ${Math.round(totalDrainRatio * 100)}%를 흡혈하여 체력 +${actualHealed.toLocaleString()} 회복!`, 'normal');
        }
      }

      // I) 해당 타겟 부위 좌표에 VFX 격발
      const pos = partPosMap[pKey];
      const partVfx: VFXType = isCrit ? 'crit_slash' : (fxInfo.vfx || 'slash');
      triggerVfx(partVfx, pos.x, pos.y, `${dmg.toLocaleString()}`, isCrit);

      addLog(
        `▶ [${hero.name}] [${useSkill ? skill.name : '기본 공격'}] ➔ [${part.name}]에게 ${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
        'normal'
      );
    });

    // 5. 총합 피해 누적 및 보스 잔여 체력 업데이트
    setBossParts({ ...bossPartsRef.current });
    const nextTotalDmg = totalBattleDmgRef.current + totalActionDmg;
    setTotalBattleDmg(nextTotalDmg);
    totalBattleDmgRef.current = nextTotalDmg;

    const totalCurBossHp = Object.values(bossPartsRef.current).reduce((sum, p) => sum + (p.isDefeated ? 0 : p.currentHp), 0);
    setBossHp(totalCurBossHp);
    bossHpRef.current = totalCurBossHp;

    // 딜미터기 기록
    const metric = combatMetricsRef.current[hero.id];
    if (metric) {
      metric.actionsCount = (metric.actionsCount || 0) + 1;
      metric.damageDealt += totalActionDmg;
      if (anyCrit) metric.critCount += 1;
      if (useSkill) metric.combosTriggered += 1;
    }

    // 타격 SFX 및 연출
    try {
      SoundManager.getInstance().play(fxInfo.sfx || (anyCrit ? 'crit' : 'hit'));
    } catch (_) {
      playSfx(anyCrit ? 'crit' : 'hit');
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 250);
    setScreenFlash('enemy');
    setTimeout(() => setScreenFlash(null), 150);

    setHeroes([...heroesRef.current]);

    setTimeout(() => {
      setSkillCutIn(null);
      isProcessingRef.current = false;
      processNextActionRef.current();
    }, getDelay(450));
  }, [addLog, finalizeRaidBattle, getDelay, playSfx, triggerVfx]);

  // ── 네메시스 부위 행동 실행 ──────────────────────────────────────────
  const executePartCombat = useCallback((part: NemesisCombatPart) => {
    isProcessingRef.current = true;
    const liveTargets = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveTargets.length === 0) {
      setAttackingPartId(null);
      finalizeRaidBattle();
      return;
    }

    const partPosMap: Record<NemesisPartId, { x: number; y: number }> = {
      head: { x: 25, y: 32 },
      body: { x: 50, y: 32 },
      tail: { x: 75, y: 32 },
    };

    // 0. 부위 상태이상 지속 피해 (DOT) 처리
    let dotDamage = 0;
    (part.statusEffects || []).forEach(se => {
      if (se.type === 'bleed') dotDamage += Math.floor(part.maxHp * 0.015);
      if (se.type === 'burn') dotDamage += Math.floor(part.maxHp * 0.015);
      if (se.type === 'poison') dotDamage += Math.floor(part.maxHp * 0.020);
    });
    if (dotDamage > 0) {
      part.currentHp = Math.max(0, part.currentHp - dotDamage);
      addLog(`🩸🔥 [지속 피해] [${part.name}] 상태이상 지속 피해로 ${dotDamage.toLocaleString()} 피해!`, 'normal');
      triggerVfx('blood_bleed', partPosMap[part.id].x, partPosMap[part.id].y, `${dotDamage.toLocaleString()}`);
      if (part.currentHp <= 0) {
        part.isDefeated = true;
        if (part.chargingState?.originalLuck !== undefined) {
          part.luck = part.chargingState.originalLuck;
        }
        part.chargingState = null;
        addLog(`💀 [${part.name} 완전 패퇴!] 지속 피해로 부위가 파괴되었습니다!`, 'reward');
        setBossParts({ ...bossPartsRef.current });
        setAttackingPartId(null);
        isProcessingRef.current = false;
        setTimeout(() => processNextActionRef.current(), getDelay(300));
        return;
      }
    }
    // 부위 상태이상 턴 감소
    part.statusEffects = (part.statusEffects || []).map(se => ({ ...se, turnsLeft: se.turnsLeft - 1 })).filter(se => se.turnsLeft > 0);

    // 0-1. 군중 제어기(CC) 체크 (빙결/기절)
    const cc = (part.statusEffects || []).find(se => se.type === 'freeze' || se.type === 'stun');
    if (cc) {
      if (part.chargingState) {
        if (part.chargingState.originalLuck !== undefined) {
          part.luck = part.chargingState.originalLuck;
        }
        part.chargingState = null;
        part.isGroggy = true;
        addLog(`💥 [차징 취소] 결빙/기절로 인해 [${part.name}]의 차징이 붕괴되었습니다! (행운 정상화)`, 'reward');
      }
      addLog(`💫 [행동 불가] [${part.name}]이(가) ${cc.type === 'freeze' ? '빙결' : '기절'} 상태로 이번 턴 행동할 수 없습니다!`, 'system');
      setBossParts({ ...bossPartsRef.current });
      setAttackingPartId(null);
      isProcessingRef.current = false;
      setTimeout(() => processNextActionRef.current(), getDelay(300));
      return;
    }

    // 1. 그로기 상태 처리 (차징 파쇄 시 행동 스킵)
    if (part.isGroggy) {
      part.isGroggy = false;
      addLog(`💫 [${part.name}] 그로기 상태에서 정신을 차리고 있습니다. (이번 턴 행동 불가)`, 'system');
      setBossParts({ ...bossPartsRef.current });
      setAttackingPartId(null);
      isProcessingRef.current = false;
      setTimeout(() => processNextActionRef.current(), getDelay(300));
      return;
    }

    // 2. 절멸기 차징 완료 시: 방출 폭발!
    if (part.chargingState) {
      const chargeSkill = part.chargingState.skill;
      if (part.chargingState.originalLuck !== undefined) {
        part.luck = part.chargingState.originalLuck;
      }
      part.chargingState = null;

      setSkillCutIn({
        id: String(Date.now()),
        skillName: `💥⚠️ [절멸기 방출] ${chargeSkill.name}`,
        icon: chargeSkill.icon || '💀',
        isEnemy: true,
        subText: `${part.name}의 시공간 차원 절멸기 폭발!`
      });

      playSfx('defeat');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setScreenFlash('enemy');
      setTimeout(() => setScreenFlash(null), 250);

      // 아군 전체에게 막대한 절멸 피해 (보호막 선흡수)
      liveTargets.forEach(h => {
        let cataDmg = Math.max(60, Math.floor(h.maxHp * 0.35 + part.atk * 0.45));
        const sh = (h.statusEffects || []).find(s => s.type === 'shield');
        if (sh && (sh.magnitude || 0) > 0) {
          const absorbed = Math.min(sh.magnitude || 0, cataDmg);
          sh.magnitude = (sh.magnitude || 0) - absorbed;
          cataDmg -= absorbed;
          addLog(`🛡️ [${h.name}] 보호막이 ${absorbed.toLocaleString()} 피해를 흡수했습니다!`, 'normal');
        }
        h.currentHp = Math.max(0, h.currentHp - cataDmg);
        const m = combatMetricsRef.current[h.id];
        if (m) m.damageTaken += cataDmg;
      });

      triggerVfx('dark_curse', 50, 75, 'CATACLYSM!', true);
      addLog(`💥⚠️ [${part.name}] 절멸기 [${chargeSkill.name}] 방출! 파티 전원에게 궤멸적 피해가 쏟아졌습니다! (행운 정상화)`, 'danger');

      setHeroes([...heroesRef.current]);
      setBossParts({ ...bossPartsRef.current });

      setTimeout(() => {
        setSkillCutIn(null);
        setAttackingPartId(null);
        isProcessingRef.current = false;
        processNextActionRef.current();
      }, getDelay(650));
      return;
    }

    // 3. 차징 돌입 판정 (2라운드 이상, 35% 확률로 고유 절멸기 차징 개시)
    const availableSkills = part.skills && part.skills.length > 0 ? part.skills : NEMESIS_BOSS_CONFIG.skills;
    const chargeSkillCandidate = availableSkills[availableSkills.length - 1] || availableSkills[0];
    const shouldStartCharge = battleTurnRef.current >= 2 && !part.chargingState && Math.random() < 0.35;

    if (shouldStartCharge) {
      const breakGauge = part.id === 'head' ? 30000 : part.id === 'body' ? 32000 : 28000;
      const origLuck = part.luck || 15;
      const boostedLuck = Math.round(origLuck * 1.3);
      part.chargingState = {
        skillName: chargeSkillCandidate.name,
        remainingBreakDmg: breakGauge,
        maxBreakDmg: breakGauge,
        skill: chargeSkillCandidate,
        originalLuck: origLuck,
      };
      part.luck = boostedLuck;

      setSkillCutIn({
        id: String(Date.now()),
        skillName: `⚡ [차원 절멸기 차징] ${chargeSkillCandidate.name}`,
        icon: '⚡',
        isEnemy: true,
        subText: `${part.name} 차징 돌입! 저지 요구치: ${breakGauge.toLocaleString()} (피해 50% 반영 & 행운 +30%)`
      });

      playSfx('cast');
      triggerVfx('dark_curse', 50, 25, 'CHARGING!');
      addLog(`⚠️ [${part.name}] 차원 절멸기 [${chargeSkillCandidate.name}] 차징 돌입! (행운 +30% 상승으로 상태이상 저항력 강화: 🍀${origLuck}→${boostedLuck}, 차징 게이지는 받는 피해의 50%만 적용)`, 'danger');

      setBossParts({ ...bossPartsRef.current });

      setTimeout(() => {
        setSkillCutIn(null);
        setAttackingPartId(null);
        isProcessingRef.current = false;
        processNextActionRef.current();
      }, getDelay(500));
      return;
    }

    // 4. 일반 스킬 및 부위 공격
    const partSkill = availableSkills[Math.floor(Math.random() * (availableSkills.length - 1))];
    const isAoe = partSkill.target === 'all';

    setSkillCutIn({
      id: String(Date.now()),
      skillName: `[${part.name}] ${partSkill.name}`,
      icon: partSkill.icon || '👁️',
      isEnemy: true,
      subText: partSkill.desc
    });

    playSfx('hit');
    setScreenFlash('enemy');
    setTimeout(() => setScreenFlash(null), 150);

    if (isAoe) {
      liveTargets.forEach(target => {
        let bDmg = Math.max(20, Math.floor(part.atk * partSkill.power * 0.85 - target.def * 0.25));
        const sh = (target.statusEffects || []).find(s => s.type === 'shield');
        if (sh && (sh.magnitude || 0) > 0) {
          const absorbed = Math.min(sh.magnitude || 0, bDmg);
          sh.magnitude = (sh.magnitude || 0) - absorbed;
          bDmg -= absorbed;
          addLog(`🛡️ [${target.name}] 보호막이 ${absorbed.toLocaleString()} 피해를 흡수했습니다!`, 'normal');
        }
        target.currentHp = Math.max(0, target.currentHp - bDmg);
        const m = combatMetricsRef.current[target.id];
        if (m) m.damageTaken += bDmg;
        if (partSkill.effectType === 'drain') {
          target.currentMp = Math.max(0, target.currentMp - 15);
        }
      });
      triggerVfx('dark_curse', 50, 75, 'AOE HIT');
      addLog(`🌀 [${part.name}] [${partSkill.name}] 광역 강타! 아군 전체가 피해를 입었습니다!`, 'danger');
    } else {
      const target = liveTargets[Math.floor(Math.random() * liveTargets.length)];
      const evadeChance = Math.min(0.25, Math.max(0.04, target.spd * 0.001 + target.luck * 0.001));
      const isEvaded = Math.random() < evadeChance;

      if (isEvaded) {
        const m = combatMetricsRef.current[target.id];
        if (m) m.dodges += 1;
        triggerVfx('evade', 50, 75, '💨 EVADE');
        addLog(`💨 [${target.name}] [${part.name}]의 [${partSkill.name}] 공격을 신속히 회피했습니다!`, 'reward');
      } else {
        let bDmg = Math.max(30, Math.floor(part.atk * partSkill.power * 1.3 - target.def * 0.35));
        const sh = (target.statusEffects || []).find(s => s.type === 'shield');
        if (sh && (sh.magnitude || 0) > 0) {
          const absorbed = Math.min(sh.magnitude || 0, bDmg);
          sh.magnitude = (sh.magnitude || 0) - absorbed;
          bDmg -= absorbed;
          addLog(`🛡️ [${target.name}] 보호막이 ${absorbed.toLocaleString()} 피해를 흡수했습니다!`, 'normal');
        }
        target.currentHp = Math.max(0, target.currentHp - bDmg);
        const m = combatMetricsRef.current[target.id];
        if (m) m.damageTaken += bDmg;
        triggerVfx('claw', 50, 75, `-${bDmg}`);
        addLog(`👁️ [${part.name}] [${partSkill.name}] ➔ [${target.name}]에게 ${bDmg} 피해!`, 'danger');
      }
    }

    setHeroes([...heroesRef.current]);

    setTimeout(() => {
      setSkillCutIn(null);
      setAttackingPartId(null);
      isProcessingRef.current = false;
      processNextActionRef.current();
    }, getDelay(450));
  }, [addLog, finalizeRaidBattle, getDelay, playSfx, triggerVfx]);

  // ── 수동 커맨드 핸들러 (플레이어가 버튼 클릭 시 실행) ───────────────────
  const handleManualAction = (skill: Skill | 'basic') => {
    if (!isHeroTurn || !activeHeroTurnId) return;
    const hero = heroesRef.current.find(h => h.id === activeHeroTurnId);
    if (!hero) return;

    if (skill === 'basic') {
      executeHeroCombat(hero, null);
    } else {
      if (hero.currentMp < skill.manaCost) {
        gm.addLog('마나(MP)가 부족하여 스킬을 시전할 수 없습니다!', 'danger');
        return;
      }
      if ((hero.cooldowns[skill.id] || 0) > 0) {
        gm.addLog(`쿨다운 대기 중입니다! (${hero.cooldowns[skill.id]}턴 남음)`, 'danger');
        return;
      }
      executeHeroCombat(hero, skill);
    }
  };

  // ── 전투 철수 확인 ──────────────────────────────────────────────────
  const handleRetreat = async () => {
    const confirmed = await gameDialog.confirm({
      title: '🏃 전투 철수',
      message: '지금까지 가한 피해를 저장하고 전장에서 안전하게 철수하시겠습니까?',
      confirmText: '철수하기',
      cancelText: '계속 전투',
    });
    if (confirmed) {
      finalizeRaidBattle();
    }
  };

  // ── 레이드 전투 개시 ─────────────────────────────────────────────────
  const startRaidBattle = () => {
    if (!isGateUnlocked) {
      gm.addLog(`🔒 [출격 불가] 차원 네메시스는 차원 앵커 게이트 Lv.3 이상에 개방됩니다. (현재 Lv.${gateLevel})`, 'danger');
      return;
    }

    const { status, respawnRemainingMs } = gm.getNemesisCycleInfo();
    if (status !== 'active') {
      const waitMinutes = Math.ceil(respawnRemainingMs / 60000);
      gameDialog.alert({
        title: '💤 토벌 대기 중',
        message: status === 'defeated'
          ? `네메시스는 이미 이번 주기에 토벌되었습니다. 다음 주기(${waitMinutes}분 후)에 다시 도전할 수 있습니다.`
          : `현재 네메시스는 심연 재소환 준비 중입니다. (${waitMinutes}분 남음)`
      });
      return;
    }

    const squadCheck = gm.isNemesisSquadReady();
    if (!squadCheck.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 원정대 편성 필요',
        message: squadCheck.reason || '차원 네메시스 레이드는 선발 3인과 전술 오퍼레이터 1인이 모두 편성되어야 진행할 수 있습니다.'
      });
      return;
    }

    const { mainHeroes, leaderHero } = gm.getDimensionalDeck();
    const starterHeroes = mainHeroes.slice(0, 3);
    const assignedOperator = leaderHero;

    // 아군 3선발 런타임 영웅 데이터 빌드 (원래 스킬 및 궁극기 100% 일치)
    const raidHeroes: RaidHeroCombatant[] = starterHeroes.map((h, idx) => {
      const stats = gm.getHeroEffectiveStats(h);
      const cls = CHARACTER_CLASSES[h.classId];
      const heroSkills: Skill[] = [];

      // 1. 클래스 고유기 / 궁극기를 1순위로 배치 (PVE와 일치)
      if (cls?.specialSkill) {
        const resSpec = gm.resolveSkillData(cls.specialSkill.id, h);
        heroSkills.push({
          ...(resSpec || cls.specialSkill),
          isSpecial: true,
        });
      }

      // 2. 장착된 전술 스킬들
      if (h.equippedSkills && h.equippedSkills.length > 0) {
        h.equippedSkills.forEach(sid => {
          const res = gm.resolveSkillData(sid, h);
          if (res && !heroSkills.some(s => s.id === res.id)) {
            heroSkills.push(res);
          }
        });
      }

      // 3. 전술 스킬이 부족할 경우 클래스 기본 스킬 보충
      cls?.skills?.forEach(s => {
        if (heroSkills.length < 3 && !heroSkills.some(x => x.id === s.id)) {
          const res = gm.resolveSkillData(s.id, h);
          heroSkills.push(res || s);
        }
      });

      const pos = idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back';

      return {
        id: h.id,
        name: h.name,
        classId: h.classId,
        className: cls?.name || h.classId,
        grade: h.grade || 'normal',
        level: h.level,
        position: pos,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        currentMp: stats.maxMp,
        maxMp: stats.maxMp,
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        luck: stats.luck,
        skills: heroSkills,
        cooldowns: {},
        statusEffects: [],
        icon: cls?.skills[0]?.icon || '⚔️',
        damageDealt: 0,
        originalHero: h,
      };
    });

    setHeroes(raidHeroes);
    heroesRef.current = raidHeroes;
    setSelectedHeroIdx(0);
    setOperatorHero(assignedOperator);

    // 네메시스 부위별 실시간 HP 복원 (자연 재생 또는 영구 피해 반영)
    const persistedParts = state.nemesisState?.parts || {
      head: { currentHp: 4000000, maxHp: 4000000, isDefeated: false },
      body: { currentHp: 5000000, maxHp: 5000000, isDefeated: false },
      tail: { currentHp: 3500000, maxHp: 3500000, isDefeated: false },
    };

    initialPartHpsRef.current = {
      head: persistedParts.head.currentHp,
      body: persistedParts.body.currentHp,
      tail: persistedParts.tail.currentHp,
    };

    const gdsHead = NEMESIS_BOSS_CONFIG.parts.head;
    const gdsBody = NEMESIS_BOSS_CONFIG.parts.body;
    const gdsTail = NEMESIS_BOSS_CONFIG.parts.tail;

    const initParts: Record<NemesisPartId, NemesisCombatPart> = {
      head: {
        ...gdsHead,
        currentHp: persistedParts.head.currentHp,
        maxHp: persistedParts.head.maxHp,
        isDefeated: persistedParts.head.isDefeated || persistedParts.head.currentHp <= 0,
        statusEffects: [],
        chargingState: null,
      },
      body: {
        ...gdsBody,
        currentHp: persistedParts.body.currentHp,
        maxHp: persistedParts.body.maxHp,
        isDefeated: persistedParts.body.isDefeated || persistedParts.body.currentHp <= 0,
        statusEffects: [],
        chargingState: null,
      },
      tail: {
        ...gdsTail,
        currentHp: persistedParts.tail.currentHp,
        maxHp: persistedParts.tail.maxHp,
        isDefeated: persistedParts.tail.isDefeated || persistedParts.tail.currentHp <= 0,
        statusEffects: [],
        chargingState: null,
      },
    };

    setBossParts(initParts);
    bossPartsRef.current = initParts;

    const totalInitHp = Object.values(initParts).reduce((sum, p) => sum + (p.isDefeated ? 0 : p.currentHp), 0);
    setBossHp(totalInitHp);
    bossHpRef.current = totalInitHp;
    setTotalBattleDmg(0);
    totalBattleDmgRef.current = 0;

    // 타겟팅 가능한 첫 생존 부위 설정
    const firstAliveKey = (['head', 'body', 'tail'] as const).find(k => !initParts[k].isDefeated) || 'head';
    setTargetedPart(firstAliveKey);
    targetedPartRef.current = firstAliveKey;

    setBattleTurn(1);
    battleTurnRef.current = 1;
    setIsHeroTurn(false);
    setActiveHeroTurnId(null);
    setIsAutoBattle(false);
    isAutoBattleRef.current = false;

    // 📊 전투 리포트 메트릭스 초기화
    const initMetrics: Record<string, CombatantMetrics> = {};
    raidHeroes.forEach(h => {
      initMetrics[h.id] = {
        id: h.id,
        name: h.name,
        className: h.className,
        classId: h.classId,
        grade: h.grade,
        icon: h.icon,
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    });

    if (assignedOperator) {
      initMetrics[assignedOperator.id] = {
        id: assignedOperator.id,
        name: `${assignedOperator.name} (오퍼레이터)`,
        className: CHARACTER_CLASSES[assignedOperator.classId]?.name || '오퍼레이터',
        classId: assignedOperator.classId,
        grade: assignedOperator.grade,
        icon: '👑',
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }

    combatMetricsRef.current = initMetrics;
    setCombatMetrics(Object.values(initMetrics));

    const nowStr = new Date().toLocaleTimeString();
    const initLogs: LogEntry[] = [
      { id: '1', timestamp: nowStr, text: '🌌 [차원의 침식] 시공의 침식자 네메시스와의 결전이 시작되었습니다!', type: 'system' },
      { id: '2', timestamp: nowStr, text: '⚡ 선발 3인(전열/중열/후열) + 전술 오퍼레이터 1인이 전장에 배치되었습니다.', type: 'system' },
      { id: '3', timestamp: nowStr, text: '🎯 네메시스의 3대 부위(머리·전열 / 몸통·중열 / 꼬리·후열)를 선택하여 타겟팅할 수 있습니다.', type: 'normal' },
    ];
    if (assignedOperator) {
      const opCls = CHARACTER_CLASSES[assignedOperator.classId];
      const opSpecial = opCls?.specialSkill ? gm.resolveSkillData(opCls.specialSkill.id, assignedOperator) || opCls.specialSkill : null;
      initLogs.push({ id: '4', timestamp: nowStr, text: `📡 [전술 오퍼레이터] ${assignedOperator.name}: 전술 궁극기 [${opSpecial?.name || '차원 지휘'}] 지원 가동!`, type: 'reward' });
    }

    setBattleLogs(initLogs);
    setSettlement(null);
    setInBattle(true);
    isProcessingRef.current = false;

    // 1턴 첫 행동 큐 빌드 및 개시
    const initActions: Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }> = [
      ...raidHeroes.map(h => ({ type: 'hero' as const, id: h.id, spd: h.spd, luck: h.luck })),
      ...(['head', 'body', 'tail'] as const).filter(k => !initParts[k].isDefeated).map(k => ({ type: 'part' as const, id: k, spd: initParts[k].spd, luck: initParts[k].luck }))
    ];
    initActions.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
    turnQueueRef.current = initActions;
    turnIndexRef.current = 0;

    setTimeout(() => processNextActionRef.current(), 350);
  };

  // ── 마일스톤 및 충전 핸들러 ──────────────────────────────────────────
  const handleClaimMilestone = (msId: string) => {
    gm.claimNemesisMilestone(msId);
  };

  const handleRefillAttempts = () => {
    gm.refillNemesisAttempts();
  };

  const nemesisState = state.nemesisState || {
    totalDamage: 0,
    highestDamage: 0,
    currentBossHp: NEMESIS_BOSS_CONFIG.maxHp,
    maxBossHp: NEMESIS_BOSS_CONFIG.maxHp,
    phase: 1,
    claimedMilestones: [],
    dailyAttempts: 3,
  };

  const hpPercent = Math.max(0, (nemesisState.currentBossHp / (nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp)) * 100);
  const currentPhaseCfg = NEMESIS_BOSS_CONFIG.phases.find(p => p.phase === nemesisState.phase) || NEMESIS_BOSS_CONFIG.phases[0];
  const cycleInfo = gm.getNemesisCycleInfo();

  const formatRemainingTimeStr = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) return `${days}일 ${hours}시간 ${minutes}분`;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // ── 스킬 버튼 색상 구분 헬퍼 (PVE 스타일) ───────────────────────────
  const getSkillBtnStyle = (skill: Skill | 'basic') => {
    if (skill === 'basic') return { borderColor: '#8b9bb4', color: '#e2e8f0', label: '일반 공격' };
    const isUlt = skill.isSpecial || skill.name.includes('궁극기') || skill.id?.endsWith('_ultimate');
    if (isUlt) {
      return { borderColor: '#ffd54f', color: '#ffe57f', label: '궁극기', shadow: '0 0 10px #ffd54f55' };
    }
    if (['heal', 'shield', 'regen', 'buff'].includes(skill.effectType || '')) {
      return { borderColor: '#26a69a', color: '#b2dfdb', label: '지원/마법' };
    }
    return { borderColor: '#ef5350', color: '#ffcdd2', label: '전투 스킬' };
  };

  // ── 1. 레이드 전투 진행 중 화면 (PVE 동일 전장) ───────────────────────
  if (inBattle) {
    const activeHero = activeHeroTurnId ? heroes.find(h => h.id === activeHeroTurnId) : null;
    const targetedPartState = bossParts[targetedPart];
    const posLabel = targetedPart === 'head' ? '전열' : targetedPart === 'body' ? '중열' : '후열';
    const cleanTargetedName = (targetedPartState?.name || '').replace(/\s*\(.*?\)/g, '').trim();
    const alivePartsCount = Object.values(bossParts).filter(p => !p.isDefeated && p.currentHp > 0).length;

    // 🎨 에셋 스튜디오 연동: 선택된 부위별 커스텀 이미지 우선 노출
    const bossImageSrc =
      CustomAssetService.getInstance().getMonsterOverride(`nemesis_${targetedPart}`)
      || CustomAssetService.getInstance().getMonsterOverride('nemesis_boss')
      || CustomAssetService.getInstance().getMonsterOverride('nemesis')
      || `assets/nemesis_${targetedPart}.jpg`
      || 'assets/void_overlord.jpg';

    const operatorPortrait = operatorHero ? (
      CustomAssetService.getInstance().getMercenaryOverride(operatorHero.classId)
      || CustomAssetService.getInstance().getMercenaryOverride(operatorHero.id)
      || CustomAssetService.getInstance().getMercenaryOverride(operatorHero.name)
    ) : undefined;

    const activeHeroPortrait = activeHero ? (
      CustomAssetService.getInstance().getMercenaryOverride(activeHero.classId)
      || CustomAssetService.getInstance().getMercenaryOverride(activeHero.id)
      || CustomAssetService.getInstance().getMercenaryOverride(activeHero.name)
    ) : undefined;

    return (
      <div className={`flex-1 min-h-0 w-full max-w-full flex flex-col bg-[#070910] text-white relative overflow-hidden ${isShaking ? 'animate-screen-shake' : ''}`}>
        {/* ⚔️ 전투 오버레이 시각 이펙트 */}
        <BattleVFXOverlay vfxList={vfxList} onFinish={handleVfxComplete} isShaking={isShaking} />

        {/* 💥 화면 타격 플래시 */}
        {screenFlash && (
          <div className={`absolute inset-0 pointer-events-none z-50 animate-impact-flash ${
            screenFlash === 'enemy' ? 'bg-[#ff174435]' : 'bg-[#00d2ff30]'
          }`} />
        )}

        {/* 🌟 스킬 발동 컷인 배너 (PVE 스타일 슬래시 배너) */}
        {skillCutIn && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${
              skillCutIn.isEnemy
                ? 'bg-red-900/40'
                : skillCutIn.isUltimate
                ? 'bg-amber-600/50'
                : 'bg-cyan-900/40'
            } animate-skill-speedlines`} />

            <div className={`relative w-[130%] py-3 px-6 flex items-center justify-center shadow-2xl border-y-2 transform -rotate-2 animate-skill-banner ${
              skillCutIn.isEnemy
                ? 'bg-gradient-to-r from-transparent via-[#200813f5] via-50% to-transparent border-[#ff1744] shadow-[#ff1744aa]'
                : skillCutIn.isUltimate
                ? 'bg-gradient-to-r from-transparent via-[#2a1a05f5] via-50% to-transparent border-[#ffd54f] shadow-[0_0_35px_rgba(255,213,79,0.7)]'
                : 'bg-gradient-to-r from-transparent via-[#09152af5] via-50% to-transparent border-[#00d2ff] shadow-[#00d2ffaa]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`text-2xl p-1.5 rounded-xl border-2 shadow-xl shrink-0 ${
                  skillCutIn.isEnemy
                    ? 'bg-[#2b0c1b] border-[#ff1744] shadow-[#ff1744]'
                    : skillCutIn.isUltimate
                    ? 'bg-[#3b2408] border-[#ffd54f] shadow-[#ffd54f] animate-bounce'
                    : 'bg-[#0c1f38] border-[#00d2ff] shadow-[#00d2ff]'
                }`}>
                  {skillCutIn.icon}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#ffd54f]">
                      {skillCutIn.isEnemy ? '⚠️ NEMESIS ACTION ⚠️' : skillCutIn.isUltimate ? '🔥 CLASS ULTIMATE 🔥' : '⚔️ HERO ACTION ⚔️'}
                    </span>
                    {skillCutIn.subText && (
                      <span className="text-[9px] text-[#cfd8e8]">
                        {skillCutIn.subText}
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2 drop-shadow-md">
                    <span>{skillCutIn.skillName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 전투 상단 헤더: 퇴각, 턴 정보, 배속 토글, 자동 전투 토글 ── */}
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between shrink-0 bg-[#080d16] border-b border-[#1b263b] z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetreat}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#ef535022] hover:bg-[#ef535033] text-[#ef5350] border border-[#ef535055] transition-all flex items-center gap-1 shadow-sm"
            >
              <span>🏃</span>
              <span>퇴각</span>
            </button>
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#141d2f] text-[#00d2ff] border border-[#00d2ff44]">
              턴 {Math.min(maxTurns, battleTurn)} / {maxTurns}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 배속 토글 */}
            <button
              onClick={() => setBattleSpeed(s => s === 2 ? 1 : s === 1 ? 1.5 : 2)}
              className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-[#141d2f] text-[#ffd54f] border border-[#ffd54f44] hover:bg-[#ffd54f22] transition-all"
            >
              ⏩ {battleSpeed}x
            </button>

            {/* 자동 전투 토글 */}
            <button
              onClick={() => {
                const next = !isAutoBattle;
                setIsAutoBattle(next);
                isAutoBattleRef.current = next;
                if (next && isHeroTurn && activeHeroTurnId) {
                  const h = heroesRef.current.find(x => x.id === activeHeroTurnId);
                  if (h) {
                    const usableSkill = h.skills.find(s => h.currentMp >= s.manaCost && (h.cooldowns[s.id] || 0) === 0);
                    executeHeroCombat(h, usableSkill || null);
                  }
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isAutoBattle
                  ? 'bg-[#00d2ff22] text-[#00d2ff] border-[#00d2ff] shadow-[0_0_8px_rgba(0,210,255,0.4)] animate-pulse'
                  : 'bg-[#141d2f] text-[#8b9bb4] border-[#25354e]'
              }`}
            >
              {isAutoBattle ? '⚡ 자동 ON' : '🎮 자동 OFF'}
            </button>
          </div>
        </div>

        {/* ── ⚔️ 전장 반응형 내부 컨테이너 (PVE 동일 구조: 하단 공백 차단) ── */}
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto overflow-x-hidden relative">
          {/* ── 몬스터 일러스트 패널 (선택된 부위 실시간 연동 & 괄호 제거 클린 표기) ── */}
          <div className={`px-3 pt-1.5 shrink-0 relative ${attackingPartId ? 'z-40' : 'z-10'}`}>
            <div
              className={`relative w-full panel flex items-center justify-center transition-all duration-300 shadow-xl overflow-hidden ${
                attackingPartId
                  ? 'border-[#ff1744] shadow-[0_0_35px_rgba(255,23,68,0.6)] ring-1 ring-[#ff174488]'
                  : 'border-[#2c1d3b]'
              }`}
              style={{ height: 'min(135px, 17vh)', background: 'linear-gradient(135deg, #0d1525 0%, #1a0a2e 50%, #0d1525 100%)' }}
            >
              <div
                className="absolute inset-0 opacity-10 rounded-xl overflow-hidden pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,#a742f5 0,#a742f5 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#a742f5 0,#a742f5 1px,transparent 0,transparent 50%)',
                  backgroundSize: '40px 40px',
                }}
              />

              <img
                src={bossImageSrc}
                alt={cleanTargetedName}
                className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-300 ${
                  attackingPartId ? 'animate-monster-attack-surge filter brightness-125 contrast-125' : 'brightness-90 contrast-110'
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#070910] via-transparent to-transparent pointer-events-none" />

              {/* 타겟 부위 오버레이 배지 (괄호 완전 제거) */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-[#ffd54f]">🎯 집중 타겟:</span>
                  <span className="text-xs font-bold text-white">
                    [{posLabel}] {cleanTargetedName}
                  </span>
                </div>
                <div className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10 text-right">
                  <span className="text-[10px] text-[#8b9bb4]">보스 잔여: </span>
                  <span className="text-xs font-mono font-bold text-[#ffd54f]">
                    {((bossHp / 12500000) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 👾 적군 슬롯 그리드: 네메시스 3대 부위 (머리·전열 / 몸통·중열 / 꼬리·후열) ── */}
          <div className="px-3 pt-1.5 shrink-0 relative z-20">
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {(['head', 'body', 'tail'] as const).map(partKey => {
                const part = bossParts[partKey];
                const isAlive = !part.isDefeated && part.currentHp > 0;
                const isTargeted = isAlive && targetedPart === partKey;
                const hpPct = isAlive ? Math.max(0, Math.min(100, (part.currentHp / part.maxHp) * 100)) : 0;
                const posMeta = {
                  head: { label: '전열', color: '#ef5350' },
                  body: { label: '중열', color: '#ce93d8' },
                  tail: { label: '후열', color: '#00d2ff' },
                }[partKey];
                const cleanName = (part.name || '').replace(/\s*\(.*?\)/g, '').trim();

                return (
                  <LongPressBox
                    key={partKey}
                    onClick={() => {
                      if (isAlive) {
                        setTargetedPart(partKey);
                        targetedPartRef.current = partKey;
                        SoundManager.getInstance().play('click');
                      }
                    }}
                    onLongPress={() => {}}
                    className={`relative p-1.5 sm:p-2 rounded-lg transition-all border flex flex-col justify-center h-[42px] sm:h-[46px] min-w-0 select-none ${
                      !isAlive
                        ? 'border-[#18202d] bg-[#0c101a] opacity-35 grayscale cursor-not-allowed shadow-none'
                        : isTargeted
                        ? 'border-[#ff4444] bg-[#ff444425] shadow-[0_0_12px_rgba(255,68,68,0.4)] scale-[1.02] cursor-pointer'
                        : 'border-[#24334a] bg-[#111726dd] hover:border-[#3d5378] cursor-pointer'
                    }`}
                  >
                    {/* ⚡ 절멸기 차징 배지 */}
                    {isAlive && part.chargingState && (() => {
                      const breakPct = Math.max(0, Math.min(100, Math.round((part.chargingState.remainingBreakDmg / part.chargingState.maxBreakDmg) * 100)));
                      return (
                        <div className="absolute -top-3.5 right-1 z-30 h-4 px-1.5 sm:px-2 rounded-full overflow-hidden border border-[#ff9800] bg-[#1a0800] shadow-[0_0_10px_rgba(255,152,0,0.7)] flex items-center justify-center animate-pulse">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#ff3d00] via-[#ff9100] to-[#ffd600] transition-all duration-300 pointer-events-none"
                            style={{ width: `${breakPct}%` }}
                          />
                          <div className="relative z-10 flex items-center gap-1 text-[8.5px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-none">
                            <span>⚡ 절멸 차징</span>
                            <span className="font-mono text-[#fffde7]">BREAK {breakPct}%</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 그로기 배지 */}
                    {isAlive && part.isGroggy && (
                      <div className="absolute -top-3 left-1 z-30 px-1.5 py-0.2 rounded font-bold text-[8.5px] bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] animate-pulse">
                        💫 그로기
                      </div>
                    )}

                    {/* 체력 게이지 (배경 그라데이션 바) */}
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

                    {/* 부위 정보 및 체력 */}
                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {isTargeted && <span className="text-[10px] text-[#ff4444] font-bold animate-pulse">🎯</span>}
                        <span
                          className="text-[8.5px] px-1 py-0.2 rounded font-bold shrink-0"
                          style={{
                            background: !isAlive ? '#26323822' : `${posMeta.color}22`,
                            color: !isAlive ? '#607d8b' : posMeta.color,
                            border: `1px solid ${!isAlive ? '#26323844' : `${posMeta.color}44`}`,
                          }}
                        >
                          {posMeta.label}
                        </span>
                        <span
                          className="font-bold text-xs truncate"
                          style={{
                            color: !isAlive ? '#607d8b' : isTargeted ? '#ffffff' : '#cfd8dc',
                            textShadow: isAlive && isTargeted ? '0 0 6px #ff4444' : undefined,
                            textDecoration: !isAlive ? 'line-through' : undefined,
                          }}
                        >
                          {cleanName}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span
                          className="text-[9.5px] font-mono font-bold"
                          style={{
                            color: !isAlive ? '#607d8b' : hpPct > 50 ? '#38ef7d' : hpPct > 25 ? '#ffd54f' : '#ef5350',
                          }}
                        >
                          {isAlive ? `${(part.currentHp / 10000).toFixed(0)}만` : '💀 파괴'}
                        </span>
                      </div>
                    </div>

                    {/* 상태이상 배지 표시 */}
                    {isAlive && part.statusEffects && part.statusEffects.length > 0 && (
                      <div className="relative z-10 flex items-center gap-0.5 flex-wrap mt-0.5">
                        {part.statusEffects.map((se, sIdx) => {
                          const sIcon = se.type === 'bleed' ? '🩸' : se.type === 'burn' ? '🔥' : se.type === 'poison' ? '☠️' : se.type === 'freeze' ? '❄️' : se.type === 'stun' ? '💫' : se.type === 'debuff_def' ? '🛡️' : '⚔️';
                          return (
                            <span key={sIdx} className="text-[7.5px] px-1 py-0.2 rounded bg-black/80 border border-white/30 font-mono text-white leading-none">
                              {sIcon}{se.turnsLeft}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </LongPressBox>
                );
              })}
            </div>
          </div>

          {/* ── 📜 전투 로그 패널 (로그 영역 확장 및 상세 로그 모달 연동) ── */}
          <div className="px-3 pt-1 flex-1 min-h-[95px] relative z-10">
            <div className="relative h-full">
              <LogPanel logs={battleLogs} maxHeight={125} isBattle emptyMessage="기록된 전투 로그가 없습니다." />
              <button
                type="button"
                className="absolute top-1.5 right-2 px-2 py-0.5 rounded text-[11px] font-bold bg-[#141a27e0] hover:bg-[#1e273dee] text-[#00d2ff] hover:text-white border border-[#00d2ff44] shadow-md transition-all flex items-center gap-1 z-20"
                title="전체 전투 상세 기록 모달 열기"
                onClick={() => setShowFullLogModal(true)}
              >
                <span>📜</span>
                <span className="text-[10px]">상세 로그</span>
              </button>
            </div>
          </div>

          {/* ── 📡 전술 오퍼레이터 패널 (궁극기 이름 표시) ── */}
          {operatorHero && (() => {
            const opCls = CHARACTER_CLASSES[operatorHero.classId];
            const opSpecial = opCls?.specialSkill ? gm.resolveSkillData(opCls.specialSkill.id, operatorHero) || opCls.specialSkill : null;
            return (
              <div className="px-3 pt-1 shrink-0 z-10">
                <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0d1627] via-[#14233e] to-[#0d1627] border border-[#00d2ff44] shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#00d2ff88] bg-[#0c1424] flex items-center justify-center">
                      {operatorPortrait ? <img src={operatorPortrait} alt={operatorHero.name} className="w-full h-full object-cover" /> : '📡'}
                    </div>
                    <span className="text-[11px] font-bold text-white truncate">{operatorHero.name}</span>
                    <span className="text-[9.5px] text-[#00d2ff] font-medium shrink-0">{opCls?.name || operatorHero.classId}</span>
                    <span className="text-[9.5px] text-[#ffd54f] font-mono font-bold shrink-0">Lv.{operatorHero.level}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opSpecial && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f55] flex items-center gap-1">
                        <span>👑</span>
                        <span>전술 궁극기: [{opSpecial.name}]</span>
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-[#00d2ff] font-bold">
                      누적 {totalBattleDmg.toLocaleString()} DMG
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── 아군 선발 3인 영웅 행 & PVE 2열 스킬 패널 (하단 완벽 밀착) ── */}
          <div className="px-3 pt-1.5 pb-2 shrink-0 z-10 flex flex-col justify-end">
            {/* 아군 선발 3인 행 */}
            <div className="flex flex-col gap-1 mb-1.5">
              {heroes.map((hero, i) => (
                <HeroRow
                  key={hero.id}
                  hero={hero}
                  isCurrentTurn={activeHeroTurnId === hero.id}
                  isSelected={selectedHeroIdx === i}
                  onClick={() => setSelectedHeroIdx(i)}
                />
              ))}
            </div>

            {/* ── PVE 전장 동일 2x2 스킬 선택 패널 (궁극기 배지 강조) ── */}
            {!settlement && alivePartsCount > 0 && isHeroTurn && activeHero && activeHero.currentHp > 0 && !isAutoBattle && (() => {
              // 스킬 목록: 1번째는 궁극기(specialSkill), 2/3번째는 일반 스킬
              const ultSkill = activeHero.skills.find(s => s.isSpecial || s.name.includes('궁극기') || s.id.endsWith('_ultimate')) || activeHero.skills[0];
              const normalSkills = activeHero.skills.filter(s => s !== ultSkill);

              // 기본 공격 (무기 인챈트 스킬이 있는 경우 무기 스킬 반영)
              const weaponEnchantSkill = activeHero.originalHero?.equipment?.weapon?.prefix?.grantedSkill;
              const hasWeaponSkill = Boolean(weaponEnchantSkill);
              const basicDisplayName = weaponEnchantSkill?.name || '기본 공격';
              const basicDisplayIcon = weaponEnchantSkill?.icon || '⚔️';
              const basicSubLabel = weaponEnchantSkill ? (weaponEnchantSkill.targetType === 'all_enemies' ? '적 전체' : '단일 적') : '기본 물리 공격';
              const basicMpCost = weaponEnchantSkill?.manaCost || 0;
              const basicHasMp = activeHero.currentMp >= basicMpCost;
              const basicCanUse = !isProcessingRef.current && (hasWeaponSkill ? basicHasMp : true);

              const basicModalInfo: Skill = weaponEnchantSkill || {
                id: 'basic_attack',
                name: '기본 공격',
                description: '적 1체에 일반 물리 피해를 입힙니다. 마나를 소모하지 않으며 쿨다운이 없습니다.',
                manaCost: 0,
                cooldown: 0,
                power: 1.0,
                effectType: 'damage',
                targetType: 'single_enemy',
                icon: '⚔️'
              };

              // 3대 부위를 BattleMonsterTarget 규격으로 변환하여 연계 콤보 조건 정밀 감지
              const partsMonsterTargets = (['head', 'body', 'tail'] as const).map(pKey => {
                const p = bossParts[pKey];
                return {
                  id: p.id,
                  name: p.name,
                  currentHp: p.isDefeated ? 0 : p.currentHp,
                  maxHp: p.maxHp,
                  statusEffects: p.statusEffects || [],
                  data: { name: p.name },
                  position: p.position
                };
              });
              const targetedPartIdx = targetedPart === 'head' ? 0 : targetedPart === 'body' ? 1 : 2;

              const basicSkillObj: Skill | 'basic' = weaponEnchantSkill || 'basic';
              const basicComboMatch = basicCanUse ? isComboReadyForBattleTarget(basicSkillObj, partsMonsterTargets, targetedPartIdx) : null;
              const basicReadyCombo = basicComboMatch?.combo || null;
              const basicTags = weaponEnchantSkill ? getSkillTags(weaponEnchantSkill) : [];

              return (
                <div className="panel p-2 animate-slide-up" style={{ background: '#0b0d13dd', border: '1px solid #00d2ff44' }}>
                  <div className="text-xs text-[#00d2ff] font-bold mb-1.5 border-b border-[#00d2ff22] pb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#00d2ff55] bg-[#1a2333] flex items-center justify-center">
                        {activeHeroPortrait ? <img src={activeHeroPortrait} alt={activeHero.name} className="w-full h-full object-cover" /> : '⚔️'}
                      </span>
                      <span>{activeHero.name}</span>
                      <span className="text-[10px] text-[#00d2ff] font-medium">{activeHero.className}</span>
                      <span className="text-[10px] text-[#ffd54f] font-mono font-bold">Lv.{activeHero.level}</span>
                      <span className="text-[10px] font-normal text-[#8b9bb4]">({activeHero.position === 'front' ? '전열' : activeHero.position === 'mid' ? '중열' : '후열'})</span>
                    </span>
                    <span className="text-[10px] text-[#ffd54f] font-medium">타겟: [{cleanTargetedName}]</span>
                  </div>

                  {/* 2열 2행 PVE 스킬 버튼 그리드 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* [1행 1열]: 기본 공격 */}
                    <LongPressBox
                      onLongPress={() => setSelectedSkillForModal(basicModalInfo)}
                      onClick={() => !isProcessingRef.current && handleManualAction('basic')}
                      className={`btn btn-ghost flex flex-col justify-between p-2 min-h-[64px] bg-transparent border rounded-lg transition-all text-left relative select-none ${
                        !basicCanUse ? 'opacity-40 cursor-not-allowed' : ''
                      } ${basicReadyCombo ? 'animate-pulse shadow-[0_0_12px_rgba(255,213,79,0.45)]' : ''}`}
                      style={{
                        borderColor: basicReadyCombo ? '#ffd54f' : hasWeaponSkill ? (basicHasMp ? '#00d2ff' : '#ffd54f88') : '#8b9bb4',
                        boxShadow: basicReadyCombo ? '0 0 14px rgba(255,213,79,0.5)' : undefined
                      }}
                    >
                      {/* ⚡ 연계 발동 가능 뱃지 */}
                      {basicReadyCombo && basicComboMatch && (
                        <span
                          className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md flex items-center gap-0.5 animate-bounce z-10"
                          title={`⚡ [${basicReadyCombo.comboName}] 연계 폭발 가능!`}
                        >
                          <span>⚡</span>
                          <span>연계!{basicComboMatch.isAoe ? '' : basicComboMatch.isFrontTarget ? '(전열)' : '(후열)'}</span>
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 min-w-0 w-full">
                        <span className="shrink-0 flex items-center justify-center">
                          <GameIcon name={weaponEnchantSkill?.id || 'basic_attack'} icon={basicDisplayIcon} size={20} />
                        </span>
                        <span className="text-xs font-bold truncate flex-1" style={{ color: basicReadyCombo ? '#ffe57f' : hasWeaponSkill ? (basicHasMp ? '#00e5ff' : '#ffd54f') : '#ffffff' }}>
                          {basicDisplayName}
                        </span>
                        {basicTags.slice(0, 1).map(t => (
                          <span
                            key={t.id}
                            className="text-[7.5px] px-1 py-0.1 rounded font-bold shrink-0"
                            style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between w-full text-[10px] mt-1 text-[#8b9bb4]">
                        <span className="truncate mr-1">{basicSubLabel}</span>
                        <span className="font-mono font-bold shrink-0 text-[#cfd8dc]">{basicMpCost > 0 ? `${basicMpCost} MP` : '0 MP'}</span>
                      </div>
                    </LongPressBox>

                    {/* [1행 2열]: 궁극기 (특별 황금 테두리 & 배지 연출) */}
                    {ultSkill ? (() => {
                      const cdLeft = activeHero.cooldowns[ultSkill.id] || 0;
                      const mpCost = ultSkill.manaCost;
                      const hasMp = activeHero.currentMp >= mpCost;
                      const canUse = hasMp && cdLeft === 0 && !isProcessingRef.current;
                      const targetLabel = ultSkill.targetType === 'all_enemies' ? '적 전체' : ultSkill.targetType === 'all_allies' ? '아군 전체' : '고유 강타';
                      const ultComboMatch = canUse ? isComboReadyForBattleTarget(ultSkill, partsMonsterTargets, targetedPartIdx) : null;
                      const ultReadyCombo = ultComboMatch?.combo || null;
                      const ultTags = getSkillTags(ultSkill);

                      return (
                        <LongPressBox
                          onLongPress={() => setSelectedSkillForModal(ultSkill)}
                          onClick={() => canUse && handleManualAction(ultSkill)}
                          className={`btn btn-ghost flex flex-col justify-between p-2 min-h-[64px] bg-transparent border rounded-lg relative text-left transition-all select-none ${
                            !canUse
                              ? 'opacity-40 cursor-not-allowed border-[#37474f]'
                              : 'border-[#ffd54f] bg-[#ffd54f10] shadow-[0_0_12px_rgba(255,213,79,0.3)] hover:border-[#ffe57f]'
                          } ${ultReadyCombo ? 'animate-pulse shadow-[0_0_16px_rgba(255,213,79,0.6)]' : ''}`}
                          style={{
                            borderColor: ultReadyCombo ? '#ffd54f' : undefined,
                            boxShadow: ultReadyCombo ? '0 0 16px rgba(255,213,79,0.6)' : undefined
                          }}
                        >
                          {ultReadyCombo && ultComboMatch ? (
                            <span
                              className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md flex items-center gap-0.5 animate-bounce z-10"
                              title={`⚡ [${ultReadyCombo.comboName}] 연계 폭발 가능!`}
                            >
                              <span>⚡</span>
                              <span>궁극 연계!{ultComboMatch.isAoe ? '' : ultComboMatch.isFrontTarget ? '(전열)' : '(후열)'}</span>
                            </span>
                          ) : (
                            <span className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md">
                              궁극기
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 w-full min-w-0">
                            <span className="shrink-0 flex items-center justify-center">
                              <GameIcon name={ultSkill.id} icon={ultSkill.icon || '👑'} size={20} />
                            </span>
                            <span className="text-xs font-bold text-[#ffe57f] truncate flex-1">{ultSkill.name}</span>
                            {ultTags.slice(0, 1).map(t => (
                              <span
                                key={t.id}
                                className="text-[7.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] mt-1">
                            <span className="text-[#ffd54f88] truncate mr-1">{targetLabel}</span>
                            <span className={`font-mono font-bold shrink-0 ${hasMp ? 'text-[#ffd54f]' : 'text-[#ff5252]'}`}>
                              {cdLeft > 0 ? `${cdLeft}턴 대기` : `${mpCost} MP`}
                            </span>
                          </div>
                        </LongPressBox>
                      );
                    })() : <div />}

                    {/* [2행 1열]: 일반 스킬 1 */}
                    {normalSkills[0] ? (() => {
                      const sk = normalSkills[0];
                      const style = getSkillBtnStyle(sk);
                      const cdLeft = activeHero.cooldowns[sk.id] || 0;
                      const mpCost = sk.manaCost;
                      const hasMp = activeHero.currentMp >= mpCost;
                      const canUse = hasMp && cdLeft === 0 && !isProcessingRef.current;
                      const targetLabel = sk.targetType === 'all_enemies' ? '적 전체' : sk.targetType === 'all_allies' ? '아군 전체' : sk.effectType === 'heal' ? '아군 치유' : sk.effectType === 'shield' ? '보호막' : '단일 적';
                      const skComboMatch = canUse ? isComboReadyForBattleTarget(sk, partsMonsterTargets, targetedPartIdx) : null;
                      const skReadyCombo = skComboMatch?.combo || null;
                      const skTags = getSkillTags(sk);

                      return (
                        <LongPressBox
                          onLongPress={() => setSelectedSkillForModal(sk)}
                          onClick={() => canUse && handleManualAction(sk)}
                          className={`btn btn-ghost flex flex-col justify-between p-2 min-h-[64px] bg-transparent border rounded-lg text-left transition-all select-none relative ${
                            !canUse
                              ? 'opacity-40 cursor-not-allowed border-[#37474f]'
                              : 'border-[#00d2ff55] hover:border-[#00d2ff]'
                          } ${skReadyCombo ? 'animate-pulse shadow-[0_0_12px_rgba(255,213,79,0.45)]' : ''}`}
                          style={{
                            borderColor: skReadyCombo ? '#ffd54f' : canUse ? style.borderColor : undefined,
                            boxShadow: skReadyCombo ? '0 0 14px rgba(255,213,79,0.5)' : undefined
                          }}
                        >
                          {/* ⚡ 연계 발동 가능 뱃지 */}
                          {skReadyCombo && skComboMatch && (
                            <span
                              className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md flex items-center gap-0.5 animate-bounce z-10"
                              title={`⚡ [${skReadyCombo.comboName}] 연계 폭발 가능!`}
                            >
                              <span>⚡</span>
                              <span>연계!{skComboMatch.isAoe ? '' : skComboMatch.isFrontTarget ? '(전열)' : '(후열)'}</span>
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 w-full min-w-0">
                            <span className="shrink-0 flex items-center justify-center">
                              <GameIcon name={sk.id} icon={sk.icon || '⚡'} size={20} />
                            </span>
                            <span className="text-xs font-bold truncate flex-1" style={{ color: skReadyCombo ? '#ffe57f' : 'white' }}>{sk.name}</span>
                            {skTags.slice(0, 1).map(t => (
                              <span
                                key={t.id}
                                className="text-[7.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] mt-1">
                            <span className="text-[#8b9bb4] truncate mr-1">{targetLabel}</span>
                            <span className={`font-mono font-bold shrink-0 ${hasMp ? 'text-[#00d2ff]' : 'text-[#ff5252]'}`}>
                              {cdLeft > 0 ? `${cdLeft}턴 대기` : `${mpCost} MP`}
                            </span>
                          </div>
                        </LongPressBox>
                      );
                    })() : <div />}

                    {/* [2행 2열]: 일반 스킬 2 */}
                    {normalSkills[1] ? (() => {
                      const sk = normalSkills[1];
                      const style = getSkillBtnStyle(sk);
                      const cdLeft = activeHero.cooldowns[sk.id] || 0;
                      const mpCost = sk.manaCost;
                      const hasMp = activeHero.currentMp >= mpCost;
                      const canUse = hasMp && cdLeft === 0 && !isProcessingRef.current;
                      const targetLabel = sk.targetType === 'all_enemies' ? '적 전체' : sk.targetType === 'all_allies' ? '아군 전체' : sk.effectType === 'heal' ? '아군 치유' : sk.effectType === 'shield' ? '보호막' : '단일 적';
                      const skComboMatch = canUse ? isComboReadyForBattleTarget(sk, partsMonsterTargets, targetedPartIdx) : null;
                      const skReadyCombo = skComboMatch?.combo || null;
                      const skTags = getSkillTags(sk);

                      return (
                        <LongPressBox
                          onLongPress={() => setSelectedSkillForModal(sk)}
                          onClick={() => canUse && handleManualAction(sk)}
                          className={`btn btn-ghost flex flex-col justify-between p-2 min-h-[64px] bg-transparent border rounded-lg text-left transition-all select-none relative ${
                            !canUse
                              ? 'opacity-40 cursor-not-allowed border-[#37474f]'
                              : 'border-[#00d2ff55] hover:border-[#00d2ff]'
                          } ${skReadyCombo ? 'animate-pulse shadow-[0_0_12px_rgba(255,213,79,0.45)]' : ''}`}
                          style={{
                            borderColor: skReadyCombo ? '#ffd54f' : canUse ? style.borderColor : undefined,
                            boxShadow: skReadyCombo ? '0 0 14px rgba(255,213,79,0.5)' : undefined
                          }}
                        >
                          {/* ⚡ 연계 발동 가능 뱃지 */}
                          {skReadyCombo && skComboMatch && (
                            <span
                              className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-[#ffd54f] text-black shadow-md flex items-center gap-0.5 animate-bounce z-10"
                              title={`⚡ [${skReadyCombo.comboName}] 연계 폭발 가능!`}
                            >
                              <span>⚡</span>
                              <span>연계!{skComboMatch.isAoe ? '' : skComboMatch.isFrontTarget ? '(전열)' : '(후열)'}</span>
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 w-full min-w-0">
                            <span className="shrink-0 flex items-center justify-center">
                              <GameIcon name={sk.id} icon={sk.icon || '⚡'} size={20} />
                            </span>
                            <span className="text-xs font-bold truncate flex-1" style={{ color: skReadyCombo ? '#ffe57f' : 'white' }}>{sk.name}</span>
                            {skTags.slice(0, 1).map(t => (
                              <span
                                key={t.id}
                                className="text-[7.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] mt-1">
                            <span className="text-[#8b9bb4] truncate mr-1">{targetLabel}</span>
                            <span className={`font-mono font-bold shrink-0 ${hasMp ? 'text-[#00d2ff]' : 'text-[#ff5252]'}`}>
                              {cdLeft > 0 ? `${cdLeft}턴 대기` : `${mpCost} MP`}
                            </span>
                          </div>
                        </LongPressBox>
                      );
                    })() : <div />}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── 🎁 전투 정산 모달 ── */}
        {settlement && (
          <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-3 animate-fade-in">
            <div className="panel p-4 max-w-md w-full bg-[#0d121f] border border-[#ff416c] shadow-2xl flex flex-col gap-3 rounded-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                <span className="text-xs font-bold text-[#ff416c] uppercase tracking-widest">RAID SETTLEMENT</span>
                <h3 className="text-lg font-black text-white mt-0.5">네메시스 토벌전 정산 리포트</h3>
              </div>

              {settlement.isNewRecord && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-[#ffd54f33] to-[#ff980033] border border-[#ffd54f] text-center font-bold text-xs text-[#ffd54f] animate-pulse">
                  🎉 단일 전투 최고 피해 기록 갱신!
                </div>
              )}

              {/* 총 피해량 및 보상 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="panel p-2 bg-[#141b2d] border border-[#23334d] text-center">
                  <span className="text-[10px] text-[#8b9bb4]">총 누적 피해</span>
                  <div className="font-mono text-xs font-bold text-[#ffd54f] mt-0.5">
                    {settlement.damage.toLocaleString()} DMG
                  </div>
                </div>
                <div className="panel p-2 bg-[#141b2d] border border-[#23334d] text-center">
                  <span className="text-[10px] text-[#8b9bb4]">획득 골드</span>
                  <div className="font-mono text-xs font-bold text-[#ffd54f] mt-0.5">
                    🪙 {settlement.coins.toLocaleString()}
                  </div>
                </div>
                <div className="panel p-2 bg-[#141b2d] border border-[#23334d] text-center">
                  <span className="text-[10px] text-[#8b9bb4]">획득 에테르</span>
                  <div className="font-mono text-xs font-bold text-[#00d2ff] mt-0.5">
                    ✨ {settlement.ether.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 부위별 가한 피해량 상세 */}
              <div className="panel p-2.5 bg-[#0b101c] border border-[#1f2b42]">
                <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span>🎯 부위별 타격 피해 정산</span>
                  <span className="text-[10px] text-[#8b9bb4]">영구 누적 저장</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded bg-[#141c2e]">
                    <span className="text-[#ef5350] font-bold">머리 (전열)</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.head.toLocaleString()} DMG</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-[#141c2e]">
                    <span className="text-[#ce93d8] font-bold">몸통 (중열)</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.body.toLocaleString()} DMG</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-[#141c2e]">
                    <span className="text-[#00d2ff] font-bold">꼬리 (후열)</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.tail.toLocaleString()} DMG</span>
                  </div>
                </div>
              </div>

              {/* 딜미터기 요약 (적군 리포트 완전 제거) */}
              {combatMetrics.length > 0 && (
                <div className="panel p-2 bg-[#090d16] border border-[#1e2a40]">
                  <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                    <span>📊 대원별 피해 및 기여도</span>
                    <span className="text-[9px] text-[#ffd54f]">전투 리포트</span>
                  </div>
                  <CombatMeterTable
                    metrics={combatMetrics}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#141d30] hover:bg-[#1f2b45] text-[#00d2ff] hover:text-white border border-[#00d2ff44] transition-all flex items-center justify-center gap-1.5 flex-1 shadow-md"
                  onClick={() => setShowFullLogModal(true)}
                >
                  <span>📜</span>
                  <span>상세 로그 보기</span>
                </button>
                <ActionButton
                  label="로비로 복귀"
                  variant="primary"
                  size="md"
                  className="flex-1 font-bold shadow-lg shadow-[#00d2ff33]"
                  onClick={() => {
                    setSettlement(null);
                    setInBattle(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 🔍 스킬 상세 정보 모달 (홀드 / 롱프레스 시 오픈) ── */}
        <SkillDetailModal
          skill={selectedSkillForModal}
          hero={activeHero?.originalHero}
          gm={gm}
          canCast={
            activeHero && selectedSkillForModal
              ? (activeHero.currentMp >= selectedSkillForModal.manaCost &&
                 (selectedSkillForModal.id === 'basic_attack' || (activeHero.cooldowns[selectedSkillForModal.id] || 0) === 0) &&
                 !isProcessingRef.current && alivePartsCount > 0)
              : false
          }
          onCast={() => {
            if (selectedSkillForModal) {
              if (selectedSkillForModal.id === 'basic_attack') {
                handleManualAction('basic');
              } else {
                handleManualAction(selectedSkillForModal);
              }
            }
          }}
          onClose={() => setSelectedSkillForModal(null)}
        />

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
                <span>총 {battleLogs.length}건의 전투 기록</span>
                <span className="text-[10px] text-[#00d2ff]">스크롤하여 이전 기록을 확인할 수 있습니다.</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <LogPanel logs={battleLogs} isBattle maxHeight={520} emptyMessage="기록된 전투 로그가 없습니다." />
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── 2. 네메시스 로비 허브 화면 (기존 완성 로비) ──────────────────────────
  return (
    <div className="flex-1 min-h-0 w-full max-w-full flex flex-col bg-[#070910] text-white relative overflow-hidden">
      {/* 상단 통합 헤더 */}
      <div className="px-3 pt-2 shrink-0 border-b border-[#1f283d] pb-2 bg-[#0b0e18]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('citadel')}
              className="px-2 py-1 rounded bg-[#151c2d] hover:bg-[#1f2a42] text-xs font-bold text-[#8b9bb4] hover:text-white transition-all flex items-center gap-1 border border-[#23334d]"
            >
              <span>🏛️</span>
              <span>영지 복귀</span>
            </button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-white tracking-wide">차원 네메시스</span>
              <span className="text-[10px] text-[#ff416c] font-bold">VOID RAID</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cycleInfo.status === 'active' ? 'bg-[#4caf5022] text-[#4caf50] border-[#4caf5066]' : 'bg-[#ef535022] text-[#ef5350] border-[#ef535066]'}`}>
              {cycleInfo.status === 'active' ? '🟢 토벌 진행 중' : cycleInfo.status === 'defeated' ? '👑 토벌 완료' : '💤 재소환 대기'}
            </span>
            <span className="text-[10px] text-[#ffd54f] font-mono">
              주기: {formatRemainingTimeStr(cycleInfo.status === 'active' ? cycleInfo.activeRemainingMs : cycleInfo.respawnRemainingMs)}
            </span>
          </div>
        </div>
      </div>

      {/* 보스 개요 대형 카드 */}
      <div className="px-3 pt-2.5 shrink-0">
        <div className="relative rounded-2xl overflow-hidden border border-[#ff416c44] bg-gradient-to-r from-[#1f0b1f] via-[#120a1c] to-[#0a0d18] p-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#ff416c] relative shadow-md shrink-0 bg-black">
              <img src="assets/void_overlord.jpg" alt="Nemesis" className="w-full h-full object-cover object-center scale-110" />
              <div className="absolute inset-0 bg-purple-900/20 animate-pulse pointer-events-none" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight break-keep leading-tight">
                  {NEMESIS_BOSS_CONFIG.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0" style={{ backgroundColor: `${currentPhaseCfg.badgeColor}22`, color: currentPhaseCfg.badgeColor, border: `1px solid ${currentPhaseCfg.badgeColor}88` }}>
                  Phase {nemesisState.phase}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 bg-[#00d2ff1a] text-[#00d2ff] border border-[#00d2ff55] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-ping inline-block" />
                  🌐 전 지휘관 실시간 공유 월드 보스
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-[#ce93d8] truncate mt-0.5">
                {currentPhaseCfg.name}
              </div>
              <div className="text-[9px] text-[#8b9bb4] line-clamp-1 mt-0.2">
                {currentPhaseCfg.desc}
              </div>
            </div>
          </div>

          {/* 보스 전체 체력 상태 바 */}
          <div className="mt-2.5 pt-2 border-t border-[#ff416c22]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[10px] text-[#8b9bb4] flex items-center gap-1">
                <span>보스 전체 잔여 체력</span>
                <span className="text-[9px] text-[#00d2ff]">(전 지휘관 공유)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#ffd54f]">
                  {hpPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#8b9bb4] font-mono">
                  ({Math.round(nemesisState.currentBossHp).toLocaleString()} / {Math.round(nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp).toLocaleString()})
                </span>
              </div>
            </div>
            <div className="w-full bg-[#1c132b] h-2.5 rounded-full overflow-hidden border border-[#ff416c44]">
              <div
                className="h-full bg-gradient-to-r from-[#ce93d8] via-[#ff416c] to-[#ff007f] transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* 🎯 24주기 요격 목표치 (6시간 주기 저지 목표) */}
            <div className="mt-2 pt-2 border-t border-[#ff416c1a]">
              {(() => {
                const targetGoal = Math.round(cycleInfo.requiredWindowDamage);
                const remainingTarget = Math.max(0, targetGoal - Math.round(cycleInfo.currentWindowDamage));
                return (
                  <>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] text-[#cfd8e8] font-bold flex items-center gap-1">
                        <span>🎯</span>
                        <span className="text-[#ffd54f]">전 지휘관 요격 목표치</span>
                        <span className="text-[9px] text-[#8b9bb4] font-normal">(6시간 체력 1/24 저지)</span>
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[10px] text-[#8b9bb4]">잔여 목표:</span>
                        <span className={`text-[10px] font-bold ${cycleInfo.isWindowDefended ? 'text-[#38ef7d]' : 'text-[#ffd54f]'}`}>
                          {remainingTarget.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#8b9bb4]">
                          / {targetGoal.toLocaleString()} DMG
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          cycleInfo.isWindowDefended
                            ? 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d66]'
                            : 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f66]'
                        }`}>
                          {cycleInfo.isWindowDefended ? '✅ 요격 달성' : `${cycleInfo.windowProgressPct.toFixed(1)}% 저지`}
                        </span>
                      </div>
                    </div>

                    {/* 요격 진행도 바 */}
                    <div className="w-full bg-[#120a1c] h-2 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-500 ${
                          cycleInfo.isWindowDefended
                            ? 'bg-gradient-to-r from-[#38ef7d] to-[#00d2ff]'
                            : 'bg-gradient-to-r from-[#ff9800] via-[#ffd54f] to-[#38ef7d]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, cycleInfo.windowProgressPct))}%` }}
                      />
                    </div>

                    <div className="text-[9px] text-[#8b9bb4] flex items-center justify-between mt-1">
                      <span>⏱️ 다음 요격 주기 갱신: {formatRemainingTimeStr(cycleInfo.nextPlunderRemainingMs)}</span>
                      <span className="text-[#8b9bb4]">
                        전 지휘관 누적 피해: {Math.round(cycleInfo.currentWindowDamage).toLocaleString()} DMG {cycleInfo.isWindowDefended ? '(방어 성공)' : ''}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 3대 부위별 실시간 상태 배지 */}
            {nemesisState.parts && (
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {(['head', 'body', 'tail'] as const).map(pKey => {
                  const part = nemesisState.parts![pKey];
                  const pCfg = NEMESIS_BOSS_CONFIG.parts[pKey];
                  const curHp = part?.currentHp ?? pCfg.maxHp;
                  const maxHp = part?.maxHp ?? pCfg.maxHp;
                  const isDefeated = part?.isDefeated || curHp <= 0;
                  const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
                  const theme = pKey === 'head' ? '#ef5350' : pKey === 'body' ? '#ce93d8' : '#00d2ff';
                  const cleanName = (pCfg.name || '').replace(/\s*\(.*?\)/g, '').trim();
                  return (
                    <div
                      key={pKey}
                      className={`p-1.5 rounded-lg border text-center flex flex-col justify-between ${
                        isDefeated
                          ? 'bg-[#121218] border-[#37474f] opacity-60'
                          : 'bg-[#14101e] border-[#2c1d3b]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-bold" style={{ color: isDefeated ? '#78909c' : theme }}>
                        <span>{pCfg.icon} {cleanName}</span>
                        <span>{isDefeated ? '💀패퇴' : `${pct.toFixed(0)}%`}</span>
                      </div>
                      <div className="w-full bg-[#0a0710] h-1.5 rounded-full overflow-hidden mt-1 border border-white/5">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${isDefeated ? 0 : pct}%`,
                            backgroundColor: isDefeated ? '#546e7a' : theme,
                          }}
                        />
                      </div>
                      <div className="text-[8px] text-[#8b9bb4] font-mono mt-0.5">
                        {isDefeated ? '회복 불가' : `${(curHp / 10000).toFixed(0)}만 / ${(maxHp / 10000).toFixed(0)}만`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 실시간 레이드 상태 및 지휘관 통계 */}
      <div className="px-3 pt-2 grid grid-cols-3 gap-1.5 shrink-0">
        <div className="panel p-2 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40]">
          <span className="text-[10px] text-[#8b9bb4]">나의 누적 피해량</span>
          <span className="font-mono text-xs font-bold text-white mt-0.5">
            {nemesisState.totalDamage.toLocaleString()}
          </span>
        </div>
        <div className="panel p-2 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40]">
          <span className="text-[10px] text-[#8b9bb4]">단일 최고 기록</span>
          <span className="font-mono text-xs font-bold text-[#ffd54f] mt-0.5">
            {nemesisState.highestDamage.toLocaleString()}
          </span>
        </div>
        <div className="panel p-2 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40]">
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] text-[#8b9bb4]">일일 도전 횟수</span>
            {nemesisState.dailyAttempts === 0 && (
              <button
                className="text-[9px] text-[#ffd54f] hover:underline"
                onClick={handleRefillAttempts}
                title="에테르 50개로 +1회 충전"
              >
                +충전
              </button>
            )}
          </div>
          <span className="font-mono text-xs font-bold text-[#ff416c] mt-0.5">
            🔥 {nemesisState.dailyAttempts} / 3회
          </span>
        </div>
      </div>

      {/* 서브 탭 */}
      <div className="px-3 pt-2 flex gap-1.5 shrink-0">
        {[
          { key: 'hub', label: '⚔️ 토벌전 출격' },
          { key: 'milestones', label: `🎁 마일스톤 (${nemesisState.claimedMilestones.length}/${NEMESIS_MILESTONES.length})` },
          { key: 'ranking', label: '🏆 토벌 랭킹' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn flex-1 text-xs py-2 transition-all ${nemesisTab === t.key ? 'btn-primary font-bold shadow-md shadow-[#42321955]' : 'btn-ghost text-[#8b9bb4]'}`}
            onClick={() => setNemesisTab(t.key as NemesisTab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 영역 */}
      <div className="flex-1 min-h-0 px-3 pt-2 pb-2 overflow-y-auto overflow-x-hidden w-full max-w-full">
        {/* ── 1. 토벌전 출격 로비 ── */}
        {nemesisTab === 'hub' && (
          <div className="flex flex-col gap-2.5 w-full max-w-full">
            {/* ⚠️ 4인 부대(3선발 + 1오퍼레이터) 미편성 경고 */}
            {(() => {
              const squadCheck = gm.isNemesisSquadReady();
              const allHeroes = [...state.barracks, ...state.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
              if (!squadCheck.isReady) {
                return (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#2c1216] via-[#1f0f15] to-[#120d18] border border-[#ef535088] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#ef535022] border border-[#ef535066] flex items-center justify-center text-lg shrink-0">
                        ⚠️
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white">차원 원정대 편성 필요</span>
                          <span className="text-[10px] text-[#ef5350] font-mono font-bold">
                            ({squadCheck.count}/4인 편성됨)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#cfd8dc] mt-0.5 leading-relaxed">
                          차원 네메시스 레이드는 선발 3인과 전술 오퍼레이터 1인이 모두 편성되어야 출전할 수 있습니다.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {allHeroes.length >= 4 ? (
                        <button
                          className="btn btn-primary text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md shadow-[#00d2ff33]"
                          onClick={() => {
                            const ok = gm.autoAssignDimensionalDeck();
                            if (ok) SoundManager.getInstance().play('equip');
                          }}
                        >
                          <span>⚡</span>
                          <span>부대 자동 편성</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost text-xs px-3 py-1.5 text-[#ffd54f] border border-[#ffd54f55] hover:bg-[#ffd54f15] font-bold"
                          onClick={() => {
                            navigateTo('citadel');
                            gm.emit('openTavernDrawer');
                          }}
                        >
                          🍻 주점에서 영입
                        </button>
                      )}
                      <button
                        className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#00d2ff] border border-[#00d2ff44] hover:bg-[#00d2ff18] font-bold"
                        onClick={() => {
                          navigateTo('citadel');
                          gm.emit('openDimensionalBarracks');
                        }}
                      >
                        🏛️ 직접 편성
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* 🛡️ 출전 원정대 (3선발 + 1오퍼레이터) 4인 슬롯 그리드 */}
            <div className="panel p-2.5 bg-[#0b101c] border border-[#1f2b42]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>🛡️</span>
                  <span>출전 원정대 (3선발 + 1오퍼레이터)</span>
                </span>
                <span className="text-[10px] text-[#00d2ff] font-mono">
                  차원 덱 연동
                </span>
              </div>

              {(() => {
                const { mainHeroes, leaderHero } = gm.getDimensionalDeck();
                const displayMain = mainHeroes.slice(0, 3);
                return (
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {/* 선발 3인 슬롯 */}
                    {Array.from({ length: 3 }).map((_, idx) => {
                      const h = displayMain[idx];
                      if (!h) {
                        return (
                          <div
                            key={`empty_slot_${idx}`}
                            className="p-1.5 sm:p-2 rounded-xl border border-dashed border-[#23334d] bg-[#0c121f]/50 flex flex-col items-center justify-center text-center min-h-[72px]"
                          >
                            <span className="text-sm opacity-40">➕</span>
                            <span className="text-[9px] text-[#556987] mt-1 font-mono">선발 {idx + 1}</span>
                          </div>
                        );
                      }
                      const cls = CHARACTER_CLASSES[h.classId];
                      const posLabel = idx === 0 ? '전열' : idx === 1 ? '중열' : '후열';
                      return (
                        <div
                          key={h.id}
                          className="p-1.5 sm:p-2 rounded-xl bg-[#141c2e] border border-[#23334d] flex flex-col items-center text-center min-w-0"
                        >
                          <span className="text-[8px] font-bold text-[#00d2ff]">선발{idx + 1}</span>
                          <div className="text-base sm:text-xl">{cls?.skills[0]?.icon || '⚔️'}</div>
                          <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full mt-0.5" title={h.name}>
                            {h.name}
                          </span>
                          <span className="text-[8.5px] sm:text-[10px] text-[#00d2ff] truncate w-full">
                            {cls?.name || h.classId}
                          </span>
                          <div className="flex items-center gap-1 text-[8px] text-[#8b9bb4] font-mono mt-0.5">
                            <span>Lv.{h.level}</span>
                            <span className="text-[#ffd54f]">[{posLabel}]</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* 전술 오퍼레이터 슬롯 */}
                    {leaderHero ? (
                      (() => {
                        const opCls = CHARACTER_CLASSES[leaderHero.classId];
                        const opUlt = opCls?.specialSkill || (leaderHero as any)?.specialSkill || opCls?.skills?.[0] || null;
                        return (
                          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#2a1b0a] to-[#161009] border border-[#ffd54f55] flex flex-col items-center text-center min-w-0 shadow-sm shadow-[#ffd54f22]">
                            <span className="text-[8px] font-bold text-[#ffd54f]">오퍼레이터</span>
                            <div className="text-base sm:text-xl">👑</div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#ffd54f] truncate w-full mt-0.5" title={leaderHero.name}>
                              {leaderHero.name}
                            </span>
                            <span className="text-[8.5px] sm:text-[10px] text-[#ffecb3] truncate w-full">
                              {opCls?.name || leaderHero.classId}
                            </span>
                            {opUlt ? (
                              <div className="text-[7.5px] sm:text-[8px] text-[#ffd54f] font-bold truncate w-full mt-0.5 flex items-center justify-center gap-0.5" title={`궁극기: ${opUlt.name}`}>
                                <span>⚡</span>
                                <span className="truncate">{opUlt.name}</span>
                              </div>
                            ) : (
                              <div className="text-[8px] text-[#ffd54f] font-mono mt-0.5">
                                지휘 가호
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-1.5 sm:p-2 rounded-xl border border-dashed border-[#ffd54f33] bg-[#1a140a]/40 flex flex-col items-center justify-center text-center min-h-[72px]">
                        <span className="text-sm opacity-40">👑</span>
                        <span className="text-[9px] text-[#ffd54f88] mt-1 font-mono">오퍼레이터</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-2.5 pt-2 border-t border-[#1f2b42] flex items-center justify-between text-[10px] text-[#8b9bb4]">
                <span>선발 3인이 전투에 직접 참전하며, 오퍼레이터가 파티 전체에 전술 지휘를 제공합니다.</span>
                <button
                  className="text-[#00d2ff] hover:underline font-bold shrink-0 ml-2"
                  onClick={() => {
                    navigateTo('citadel');
                    gm.emit('openDimensionalBarracks');
                  }}
                >
                  원정대 변경 ➔
                </button>
              </div>
            </div>

            {/* 📜 레이드 특징 안내 (이전 정통 컨텐츠 규칙 복구) */}
            <div className="panel p-3 bg-[#110c1c] border border-[#ff416c44] flex flex-col gap-1.5 text-xs text-[#cfd8e8]">
              <div className="font-bold text-[#ff416c] flex items-center gap-1 text-sm">
                <span>⚠️</span>
                <span>차원 네메시스 침식 & 약탈 규칙</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8b9bb4]">
                • <strong className="text-white">차원 앵커 연동 침공</strong>: 차원 앵커 게이트(Lv.3+)가 개방되어 활성화된 상태에서만 침식과 약탈이 발생합니다. 차원 앵커가 닫혀 있는 동안에는 네메시스 침공과 자원 약탈이 전면 중단되어 영지 자원이 100% 안전하게 보호됩니다.<br />
                • <strong className="text-white">6일 활동 & 1일 재소환 주기</strong>: 6일 동안 활동하며 완전 토벌 시 다음 7일차 재소환 주기까지 평화 상태가 유지됩니다.<br />
                • <strong className="text-white">6시간 주기 20% 약탈</strong>: 침공 활성화 중 6시간마다 네메시스 체력의 1/24({(Math.round(cycleInfo.requiredWindowDamage)).toLocaleString()} DMG) 이상을 깎지 못하면 영지 전 자원의 20%를 약탈당합니다.<br />
                • <strong className="text-white">체력 자연 회복</strong>: 네메시스는 활동 중 매 분마다 생존 부위 체력을 지속 회복합니다. (파괴된 부위는 영구 회복 불가)<br />
                • <strong className="text-white">최대 15턴 전투 & 마일스톤</strong>: 매 전투마다 피해량을 누적하여 마일스톤 장비와 대량의 인장을 수령하십시오.
              </p>
            </div>

            {/* 대형 출격 버튼 */}
            {(() => {
              const squadCheck = gm.isNemesisSquadReady();
              const canFight = isGateUnlocked && cycleInfo.status === 'active' && nemesisState.dailyAttempts > 0 && squadCheck.isReady;
              return (
                <ActionButton
                  label={
                    cycleInfo.status === 'defeated'
                      ? `👑 이번 주기 토벌 완료 (재소환 대기 중: ${formatRemainingTimeStr(cycleInfo.respawnRemainingMs)})`
                      : cycleInfo.status === 'cooldown'
                      ? `💤 1일 재소환 대기 기간 (재소환까지: ${formatRemainingTimeStr(cycleInfo.respawnRemainingMs)})`
                      : !isGateUnlocked
                      ? `🔒 차원 앵커 게이트 Lv.3 필요 (현재 Lv.${gateLevel})`
                      : !squadCheck.isReady
                      ? `⚠️ 차원 원정대 미편성 (출격 불가: ${squadCheck.count}/4인)`
                      : nemesisState.dailyAttempts > 0
                      ? '🌌 네메시스 토벌전 출격 (전투 시작)'
                      : '🔒 일일 도전 횟수 소진 (에테르 충전 필요)'
                  }
                  variant={canFight ? 'danger' : 'ghost'}
                  size="lg"
                  disabled={!isGateUnlocked || cycleInfo.status !== 'active' || nemesisState.dailyAttempts <= 0 || !squadCheck.isReady}
                  className={`w-full py-3.5 text-sm font-bold ${canFight ? 'shadow-lg shadow-[#ff416c33]' : 'opacity-80 border border-[#ef535044] text-[#ff8a80]'}`}
                  onClick={startRaidBattle}
                />
              );
            })()}
          </div>
        )}

        {/* ── 2. 누적 대미지 마일스톤 보상 ── */}
        {nemesisTab === 'milestones' && (
          <div className="flex flex-col gap-2 w-full max-w-full">
            <div className="text-xs text-[#8b9bb4] px-1 flex items-center justify-between">
              <span>네메시스에게 누적 피해를 입혀 단계별 특별 무구와 마도석을 획득하십시오.</span>
              <span className="font-mono text-[#00d2ff] font-bold">누적: {nemesisState.totalDamage.toLocaleString()}</span>
            </div>

            {NEMESIS_MILESTONES.map(ms => {
              const isClaimed = nemesisState.claimedMilestones.includes(ms.id);
              const isUnlocked = nemesisState.totalDamage >= ms.reqDamage;
              const progressPct = Math.min(100, (nemesisState.totalDamage / ms.reqDamage) * 100);

              return (
                <div
                  key={ms.id}
                  className={`panel p-3 flex items-center justify-between gap-2.5 transition-all ${isClaimed ? 'bg-[#0a0f1a] border-[#162133] opacity-60' : isUnlocked ? 'bg-[#10182b] border-[#00d2ff66] shadow-sm' : 'bg-[#0d121f] border-[#1f283d]'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#172033] border border-[#2b3b5c] flex items-center justify-center text-xl shrink-0">
                      {ms.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{ms.title}</span>
                        {isClaimed ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#4caf5022] text-[#4caf50] font-bold">수령 완료</span>
                        ) : isUnlocked ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold animate-pulse">수령 가능!</span>
                        ) : (
                          <span className="text-[9px] text-[#8b9bb4] font-mono">{progressPct.toFixed(0)}%</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">{ms.desc}</div>

                      {!isUnlocked && !isClaimed && (
                        <div className="w-full bg-[#151c2e] h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-[#00d2ff] h-full" style={{ width: `${progressPct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <ActionButton
                      label={isClaimed ? '완료' : isUnlocked ? '수령' : '잠김'}
                      variant={isClaimed ? 'ghost' : isUnlocked ? 'success' : 'ghost'}
                      size="sm"
                      disabled={isClaimed || !isUnlocked}
                      className="px-3 py-1.5 text-xs font-bold"
                      onClick={() => handleClaimMilestone(ms.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 3. 토벌 랭킹 명예의 전당 ── */}
        {nemesisTab === 'ranking' && (
          <div className="flex flex-col gap-2 w-full max-w-full">
            <div className="text-xs text-[#8b9bb4] px-1 flex items-center justify-between">
              <span>전 서버 지휘관 토벌 랭킹 (시즌 누적)</span>
              <span className="text-[10px] text-[#ffd54f]">나의 순위: #14 ({nemesisState.totalDamage.toLocaleString()} DMG)</span>
            </div>

            {NEMESIS_LEADERBOARD_MOCK.map(entry => (
              <div
                key={entry.rank}
                className="panel p-2.5 flex items-center justify-between gap-2 bg-[#0c1220] border border-[#1e2a40]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#151d30] border border-[#273754] flex items-center justify-center font-mono text-xs font-bold text-white shrink-0">
                    {entry.rank <= 3 ? entry.badge : `#${entry.rank}`}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{entry.name}</div>
                    <div className="text-[10px] text-[#8b9bb4] truncate">{entry.guild}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-[#ffd54f]">
                    {entry.damage.toLocaleString()} DMG
                  </div>
                  <div className="text-[9px] text-[#00d2ff]">기여도 보상 획득</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
