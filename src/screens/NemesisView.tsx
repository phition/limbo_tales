import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { ActionButton } from '../components/ActionButton';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { SoundManager } from '../managers/SoundManager';
import { Skill, StatusEffect, Mercenary, NemesisPartId } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import {
  NEMESIS_BOSS_CONFIG,
  NEMESIS_MILESTONES,
  NEMESIS_LEADERBOARD_MOCK,
  NemesisBossSkill
} from '../data/nemesis';
import { FeverBadgeType } from '../types/fever';
import { FeverGaugeBar } from '../components/FeverGaugeBar';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { GameDataService } from '../services/GameDataService';
import { gameDialog } from '../services/DialogService';

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
}

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
  skills: NemesisBossSkill[];
  statusEffects: StatusEffect[];
}

interface RaidCombatLog {
  turn: number;
  text: string;
  type: 'damage' | 'boss_skill' | 'hero_skill' | 'warning' | 'system';
}

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
  const [cataclysmCount, setCataclysmCount] = useState(3);
  const [heroes, setHeroes] = useState<RaidHeroCombatant[]>([]);
  
  // 3대 부위 전투 런타임 상태
  const [bossParts, setBossParts] = useState<Record<NemesisPartId, NemesisCombatPart>>({
    head: { ...NEMESIS_BOSS_CONFIG.parts.head, currentHp: 4000000, isDefeated: false, statusEffects: [] },
    body: { ...NEMESIS_BOSS_CONFIG.parts.body, currentHp: 5000000, isDefeated: false, statusEffects: [] },
    tail: { ...NEMESIS_BOSS_CONFIG.parts.tail, currentHp: 3500000, isDefeated: false, statusEffects: [] },
  });
  const [targetedPart, setTargetedPart] = useState<NemesisPartId>('head');
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [activeHeroTurnId, setActiveHeroTurnId] = useState<string | null>(null);
  const [isWaitingManual, setIsWaitingManual] = useState(false);

  const [bossHp, setBossHp] = useState(state.nemesisState?.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp);
  const [totalBattleDmg, setTotalBattleDmg] = useState(0);
  const [battleSpeed, setBattleSpeed] = useState<1.5 | 2>(2);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [logs, setLogs] = useState<RaidCombatLog[]>([]);

  // 👑 전술 오퍼레이터 상태 (3선발 + 1오퍼레이터 체계)
  const [playerLeader, setPlayerLeader] = useState<Mercenary | null>(null);
  const playerLeaderRef = useRef<Mercenary | null>(null);
  playerLeaderRef.current = playerLeader;

  const playerLeaderBlessing = useMemo(() => {
    return playerLeader ? gm.getLeaderBlessing(playerLeader) : null;
  }, [playerLeader, gm]);

  // 🔥 피버 게이지 상태
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const [bossFeverBadges, setBossFeverBadges] = useState<FeverBadgeType[]>([]);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  const bossFeverBadgesRef = useRef<FeverBadgeType[]>([]);
  feverBadgesRef.current = feverBadges;
  bossFeverBadgesRef.current = bossFeverBadges;

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
  const bossHpRef = useRef(bossHp);
  const totalBattleDmgRef = useRef(0);
  const cataclysmCountRef = useRef(cataclysmCount);
  const battleTurnRef = useRef(battleTurn);

  // 라운드 내 행동 큐 Ref
  const actionsRef = useRef<Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }>>([]);
  const actionIndexRef = useRef(0);
  const initialPartHpsRef = useRef<{ head: number; body: number; tail: number }>({ head: 4000000, body: 5000000, tail: 3500000 });

  useEffect(() => { heroesRef.current = heroes; }, [heroes]);
  useEffect(() => { bossPartsRef.current = bossParts; }, [bossParts]);
  useEffect(() => { targetedPartRef.current = targetedPart; }, [targetedPart]);
  useEffect(() => { isAutoBattleRef.current = isAutoBattle; }, [isAutoBattle]);
  useEffect(() => { bossHpRef.current = bossHp; }, [bossHp]);
  useEffect(() => { totalBattleDmgRef.current = totalBattleDmg; }, [totalBattleDmg]);
  useEffect(() => { cataclysmCountRef.current = cataclysmCount; }, [cataclysmCount]);
  useEffect(() => { battleTurnRef.current = battleTurn; }, [battleTurn]);

  // ── 레이드 VFX 발생기 ────────────────────────────────────────────────
  const triggerVfx = useCallback((type: VFXType, x: number, y: number, text?: string, isCrit?: boolean) => {
    const ev: VFXEvent = { id: `vfx_${Date.now()}_${Math.random()}`, type, x, y, text, isCrit };
    setVfxList(prev => [...prev.slice(-8), ev]);
  }, []);

  const handleVfxComplete = useCallback((id: string) => {
    setVfxList(prev => prev.filter(v => v.id !== id));
  }, []);

  // ── 사운드 재생 ─────────────────────────────────────────────────────
  const playSfx = useCallback((type: 'hit' | 'crit' | 'shield' | 'victory' | 'defeat' | 'cast') => {
    try {
      const sm = SoundManager.getInstance();
      if (type === 'hit') sm.play('slash');
      else if (type === 'crit') sm.play('crit');
      else if (type === 'shield') sm.play('shield');
      else if (type === 'victory') sm.play('victory');
      else if (type === 'defeat') sm.play('defeat');
      else if (type === 'cast') sm.play('spell');
    } catch (_) {}
  }, []);

  // 🔥 피버 뱃지 추가
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  const addBossFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setBossFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      bossFeverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 👑 아군 피버 버스트
  const triggerPlayerFeverBurst = useCallback(() => {
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveHeroes.length === 0) return;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: '👑 아군 차원 총공격: ALL-OUT FEVER BURST!',
      sub: '아군 피버 만충! 오퍼레이터의 차원 지휘로 네메시스에게 집중 포화!',
      color: '#ffd54f',
    });

    const totalAtk = liveHeroes.reduce((sum, h) => sum + h.atk, 0);
    const burstDmg = Math.floor(totalAtk * 4.5 + Math.random() * 2000);

    triggerVfx('crit_slash', 50, 25, `${burstDmg.toLocaleString()}`, true);
    playSfx('crit');

    // 살아있는 타겟 부위 또는 첫 생존 부위에 타격
    const alivePartKeys = (['head', 'body', 'tail'] as const).filter(k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0);
    const targetKey = alivePartKeys.includes(targetedPartRef.current) ? targetedPartRef.current : alivePartKeys[0];

    if (targetKey) {
      const part = bossPartsRef.current[targetKey];
      const nextHp = Math.max(0, part.currentHp - burstDmg);
      part.currentHp = nextHp;
      if (nextHp <= 0) {
        part.isDefeated = true;
        setLogs(prev => [...prev.slice(-20), { turn: battleTurnRef.current, text: `💀 [${part.name} 패퇴!] 피버 총공격으로 부위가 완전히 파괴되었습니다!`, type: 'warning' }]);
      }
      setBossParts({ ...bossPartsRef.current });
    }

    const curTotalHp = Object.values(bossPartsRef.current).reduce((sum, p) => sum + (p.isDefeated ? 0 : p.currentHp), 0);
    setBossHp(curTotalHp);
    bossHpRef.current = curTotalHp;

    const nextTotalDmg = totalBattleDmgRef.current + burstDmg;
    setTotalBattleDmg(nextTotalDmg);
    totalBattleDmgRef.current = nextTotalDmg;

    setFeverBadges([]);
    feverBadgesRef.current = [];
  }, [playSfx, triggerVfx]);

  // 💀 보스 피버 버스트
  const triggerBossFeverBurst = useCallback(() => {
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveHeroes.length === 0) return;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: '💀 네메시스 공허 폭주: VOID FEVER ANNIHILATION!',
      sub: '보스 피버 만충! 전 부위 공명으로 아군 전원에게 차원 균열 방출!',
      color: '#ff416c',
    });

    triggerVfx('dark_curse', 50, 75, 'FEVER BURST!', true);
    playSfx('defeat');

    const updated = heroesRef.current.map(h => {
      if (h.currentHp <= 0) return h;
      const bDmg = Math.floor(h.maxHp * 0.25 + 40);
      const m = combatMetricsRef.current[h.id];
      if (m) m.damageTaken += bDmg;
      return { ...h, currentHp: Math.max(0, h.currentHp - bDmg) };
    });

    setHeroes(updated);
    heroesRef.current = updated;
    setBossFeverBadges([]);
    bossFeverBadgesRef.current = [];
  }, [playSfx, triggerVfx]);

  // ── 레이드 종료 및 정산 처리 ─────────────────────────────────────────
  const finalizeRaidBattle = useCallback(() => {
    isProcessingRef.current = true;
    setIsWaitingManual(false);
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
    if (!inBattle || settlement) return;

    // 생존 영웅 및 생존 부위 확인
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    const alivePartKeys = (['head', 'body', 'tail'] as const).filter(k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0);

    // 종료 조건 1: 모든 아군 전멸
    if (liveHeroes.length === 0) {
      setLogs(prev => [...prev.slice(-20), { turn: battleTurnRef.current, text: '💀 원정대 전원이 쓰러져 시공의 틈새로 철수합니다!', type: 'warning' }]);
      finalizeRaidBattle();
      return;
    }

    // 종료 조건 2: 모든 네메시스 부위 패퇴 (완전 토벌)
    if (alivePartKeys.length === 0) {
      setLogs(prev => [...prev.slice(-20), { turn: battleTurnRef.current, text: '👑 [네메시스 토벌 성공] 머리, 몸통, 꼬리가 모두 패퇴하여 네메시스가 격퇴되었습니다!', type: 'system' }]);
      finalizeRaidBattle();
      return;
    }

    // 종료 조건 3: 15턴 도달
    if (battleTurnRef.current > maxTurns) {
      setLogs(prev => [...prev.slice(-20), { turn: maxTurns, text: '⌛ 15턴 경과! 차원의 왜곡 한계에 도달하여 안전 귀환합니다.', type: 'system' }]);
      finalizeRaidBattle();
      return;
    }

    // 라운드 내 모든 행동 완료 시 다음 턴으로 전진
    if (actionIndexRef.current >= actionsRef.current.length) {
      // 피버 버스트 검사
      if (feverBadgesRef.current.length >= 5) {
        setTimeout(() => triggerPlayerFeverBurst(), 200);
      }
      if (bossFeverBadgesRef.current.length >= 5) {
        setTimeout(() => triggerBossFeverBurst(), 200);
      }

      // 아군 쿨다운 1씩 감소
      heroesRef.current.forEach(h => {
        Object.keys(h.cooldowns).forEach(k => {
          if (h.cooldowns[k] > 0) h.cooldowns[k] -= 1;
        });
      });
      setHeroes([...heroesRef.current]);

      const nextTurn = battleTurnRef.current + 1;
      setBattleTurn(nextTurn);
      battleTurnRef.current = nextTurn;

      // 새 라운드 행동 큐 생성
      const nextLiveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
      const nextAliveParts = (['head', 'body', 'tail'] as const).filter(k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0);

      const nextActions: Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }> = [
        ...nextLiveHeroes.map(h => ({ type: 'hero' as const, id: h.id, spd: h.spd, luck: h.luck })),
        ...nextAliveParts.map(k => ({ type: 'part' as const, id: k, spd: bossPartsRef.current[k].spd, luck: bossPartsRef.current[k].luck }))
      ];
      nextActions.sort((a, b) => b.spd - a.spd || b.luck - a.luck);

      actionsRef.current = nextActions;
      actionIndexRef.current = 0;

      const stepDelay = battleSpeed === 2 ? 300 : 450;
      setTimeout(() => processNextActionRef.current(), stepDelay);
      return;
    }

    const currentAction = actionsRef.current[actionIndexRef.current];
    const stepDelay = battleSpeed === 2 ? 300 : 450;

    // ── [1. 영웅의 행동] ──
    if (currentAction.type === 'hero') {
      const hero = heroesRef.current.find(h => h.id === currentAction.id);
      if (!hero || hero.currentHp <= 0) {
        actionIndexRef.current++;
        processNextAction();
        return;
      }

      // 자동 전투인 경우: AI 자동 실행
      if (isAutoBattleRef.current) {
        executeHeroCombat(hero, null);
      } else {
        // 수동 모드: 플레이어 입력 대기 상태 돌입
        setActiveHeroTurnId(hero.id);
        setIsWaitingManual(true);
      }
    } else {
      // ── [2. 네메시스 부위의 행동] ──
      const partKey = currentAction.id as NemesisPartId;
      const part = bossPartsRef.current[partKey];

      // 네메시스 부위는 사경 없음 -> 체력 0이면 바로 패퇴하여 행동 불가!
      if (!part || part.isDefeated || part.currentHp <= 0) {
        actionIndexRef.current++;
        processNextAction();
        return;
      }

      executeBossPartCombat(part);
    }
  }, [inBattle, settlement, maxTurns, battleSpeed, finalizeRaidBattle, triggerPlayerFeverBurst, triggerBossFeverBurst]);

  processNextActionRef.current = processNextAction;

  // ── 영웅 공격 실행기 ──────────────────────────────────────────────────
  const executeHeroCombat = useCallback((hero: RaidHeroCombatant, chosenSkill: Skill | null) => {
    setIsWaitingManual(false);
    setActiveHeroTurnId(null);

    // 타겟팅된 부위가 살아있는지 검사, 사망 시 생존 부위로 자동 교체
    let targetKey = targetedPartRef.current;
    if (bossPartsRef.current[targetKey].isDefeated || bossPartsRef.current[targetKey].currentHp <= 0) {
      const aliveKeys = (['head', 'body', 'tail'] as const).filter(k => !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0);
      if (aliveKeys.length > 0) {
        targetKey = aliveKeys[0];
        setTargetedPart(targetKey);
        targetedPartRef.current = targetKey;
      } else {
        finalizeRaidBattle();
        return;
      }
    }

    const targetPart = bossPartsRef.current[targetKey];

    // 스킬 결정 (자동 전투 시 65% 확률로 쿨다운 가능한 스킬 선택)
    let useSkill = chosenSkill;
    if (!useSkill && isAutoBattleRef.current) {
      const readySkills = hero.skills.filter(s => (hero.cooldowns[s.id] || 0) === 0 && hero.currentMp >= s.manaCost);
      if (readySkills.length > 0 && Math.random() < 0.7) {
        useSkill = readySkills[Math.floor(Math.random() * readySkills.length)];
      }
    }

    let dmg = 0;
    const isCrit = Math.random() * 100 < Math.min(50, 10 + hero.luck * 0.8);
    const critMult = isCrit ? 1.75 : 1.0;

    if (useSkill) {
      const power = useSkill.power || 1.25;
      dmg = Math.floor((hero.atk * power * 2.2 - targetPart.def * 0.4) * critMult);
      dmg = Math.max(150, dmg + Math.floor(Math.random() * 80));
      hero.currentMp = Math.max(0, hero.currentMp - useSkill.manaCost);
      hero.cooldowns[useSkill.id] = useSkill.cooldown || 2;

      setActionBanner({
        text: `⚔️ [${hero.name}] ${useSkill.name} ➔ ${targetPart.name}`,
        sub: `${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
        color: '#00d2ff',
      });

      setLogs(prev => [...prev.slice(-20), {
        turn: battleTurnRef.current,
        text: `⚔️ [${hero.name}] ${useSkill?.icon || '⚡'} [${useSkill?.name}] ➔ [${targetPart.name}]에게 ${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
        type: 'hero_skill'
      }]);
    } else {
      dmg = Math.floor((hero.atk * 1.6 - targetPart.def * 0.3) * critMult);
      dmg = Math.max(90, dmg + Math.floor(Math.random() * 50));
      hero.currentMp = Math.min(hero.maxMp, hero.currentMp + 15);

      setActionBanner({
        text: `🗡️ [${hero.name}] 일반 공격 ➔ ${targetPart.name}`,
        sub: `${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
        color: '#42a5f5',
      });

      setLogs(prev => [...prev.slice(-20), {
        turn: battleTurnRef.current,
        text: `🗡️ [${hero.name}] 일반 공격 ➔ [${targetPart.name}]에게 ${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
        type: 'damage'
      }]);
    }

    // 타겟 부위 체력 차감 (사경 없음 -> 0이 되면 즉시 패퇴)
    const nextPartHp = Math.max(0, targetPart.currentHp - dmg);
    targetPart.currentHp = nextPartHp;
    if (nextPartHp <= 0) {
      targetPart.isDefeated = true;
      setActionBanner({
        text: `💀 [${targetPart.name} 패퇴!]`,
        sub: '부위가 완전히 파괴되어 전선에서 이탈했습니다!',
        color: '#ff416c',
      });
      setLogs(prev => [...prev.slice(-20), {
        turn: battleTurnRef.current,
        text: `💀⚠️ [네메시스 ${targetPart.name} 파괴!] 부위 체력이 소진되어 즉시 패퇴했습니다!`,
        type: 'warning'
      }]);

      // 다음 살아있는 부위로 타겟 자동 교체
      const remainingAlive = (['head', 'body', 'tail'] as const).filter(k => k !== targetKey && !bossPartsRef.current[k].isDefeated && bossPartsRef.current[k].currentHp > 0);
      if (remainingAlive.length > 0) {
        setTargetedPart(remainingAlive[0]);
        targetedPartRef.current = remainingAlive[0];
      }
    }

    setBossParts({ ...bossPartsRef.current });

    hero.damageDealt += dmg;
    const nextTotalDmg = totalBattleDmgRef.current + dmg;
    setTotalBattleDmg(nextTotalDmg);
    totalBattleDmgRef.current = nextTotalDmg;

    const totalCurBossHp = Object.values(bossPartsRef.current).reduce((sum, p) => sum + (p.isDefeated ? 0 : p.currentHp), 0);
    setBossHp(totalCurBossHp);
    bossHpRef.current = totalCurBossHp;

    // 딜미터기 기록
    const metric = combatMetricsRef.current[hero.id];
    if (metric) {
      metric.actionsCount = (metric.actionsCount || 0) + 1;
      metric.damageDealt += dmg;
      if (isCrit) metric.critCount += 1;
      if (useSkill) metric.combosTriggered += 1;
    }

    if (isCrit) addFeverBadge('crit');
    else if (useSkill) addFeverBadge('extra');
    else addFeverBadge('assist');

    triggerVfx(isCrit ? 'crit_slash' : 'slash', 50, 25, `${dmg.toLocaleString()}`, isCrit);
    playSfx(isCrit ? 'crit' : 'hit');

    setHeroes([...heroesRef.current]);

    const stepDelay = battleSpeed === 2 ? 300 : 450;
    actionIndexRef.current++;
    setTimeout(() => processNextActionRef.current(), stepDelay);
  }, [addFeverBadge, battleSpeed, finalizeRaidBattle, playSfx, triggerVfx]);

  // ── 네메시스 부위별 고유 행동 실행기 ─────────────────────────────────
  const executeBossPartCombat = useCallback((part: NemesisCombatPart) => {
    const liveTargets = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveTargets.length === 0) {
      actionIndexRef.current++;
      processNextActionRef.current();
      return;
    }

    const nextCountdown = cataclysmCountRef.current - 1;

    // 3턴 주기 절멸기: 차원 소멸선 (Cataclysm)
    if (nextCountdown <= 0) {
      setActionBanner({
        text: `💥 [차원 소멸선] (${part.name} 발동)`,
        sub: '시공간 균열이 폭발하여 파티 전원에게 궤멸적 전멸 피해!',
        color: '#ff416c'
      });
      triggerVfx('dark_curse', 50, 75, 'CATACLYSM!', true);
      playSfx('defeat');

      heroesRef.current.forEach(h => {
        if (h.currentHp > 0) {
          const cataDmg = Math.floor(h.maxHp * 0.45 + 50);
          h.currentHp = Math.max(0, h.currentHp - cataDmg);
          const m = combatMetricsRef.current[h.id];
          if (m) m.damageTaken += cataDmg;
        }
      });

      setLogs(prev => [...prev.slice(-20), {
        turn: battleTurnRef.current,
        text: `💥⚠️ [네메시스](SPD ${part.spd}) 차원 소멸선 방출! 파티 전체가 치명적인 피해를 입었습니다!`,
        type: 'warning'
      }]);

      setCataclysmCount(3);
      cataclysmCountRef.current = 3;
      addBossFeverBadge('extra');
    } else {
      // 부위별 고유 스킬 선택
      const availableSkills = part.skills && part.skills.length > 0 ? part.skills : NEMESIS_BOSS_CONFIG.skills;
      const partSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];

      setActionBanner({
        text: `${partSkill.icon} [${part.name}] ${partSkill.name}`,
        sub: partSkill.desc,
        color: part.id === 'head' ? '#ef5350' : part.id === 'body' ? '#ce93d8' : '#00d2ff'
      });
      playSfx('cast');

      if (partSkill.target === 'single') {
        const target = liveTargets[Math.floor(Math.random() * liveTargets.length)];
        const evadeChance = Math.min(0.25, Math.max(0.04, target.spd * 0.001 + target.luck * 0.001));
        const isEvaded = Math.random() < evadeChance;

        if (isEvaded) {
          const m = combatMetricsRef.current[target.id];
          if (m) m.dodges += 1;
          triggerVfx('evade', 50, 75, '💨 EVADE');
          setLogs(prev => [...prev.slice(-20), {
            turn: battleTurnRef.current,
            text: `💨 [${target.name}] [${part.name}]의 [${partSkill.name}] 공격을 신속히 회피했습니다!`,
            type: 'hero_skill'
          }]);
        } else {
          const bDmg = Math.max(30, Math.floor(part.atk * partSkill.power * 1.5 - target.def * 0.35));
          target.currentHp = Math.max(0, target.currentHp - bDmg);
          const m = combatMetricsRef.current[target.id];
          if (m) m.damageTaken += bDmg;

          triggerVfx('fire', 50, 75, `-${bDmg}`);
          setLogs(prev => [...prev.slice(-20), {
            turn: battleTurnRef.current,
            text: `👁️ [${part.name}] [${partSkill.name}] ➔ [${target.name}]에게 ${bDmg} 피해!`,
            type: 'boss_skill'
          }]);
        }
      } else {
        // 광역기
        liveTargets.forEach(target => {
          const bDmg = Math.max(20, Math.floor(part.atk * partSkill.power * 0.95 - target.def * 0.25));
          target.currentHp = Math.max(0, target.currentHp - bDmg);
          const m = combatMetricsRef.current[target.id];
          if (m) m.damageTaken += bDmg;
          if (partSkill.effectType === 'drain') {
            target.currentMp = Math.max(0, target.currentMp - 15);
          }
        });

        triggerVfx('dark_curse', 50, 75, 'AOE HIT');
        setLogs(prev => [...prev.slice(-20), {
          turn: battleTurnRef.current,
          text: `🌀 [${part.name}] [${partSkill.name}] 광역 강타! 아군 전체가 피해를 입었습니다!`,
          type: 'boss_skill'
        }]);
      }

      setCataclysmCount(nextCountdown);
      cataclysmCountRef.current = nextCountdown;
      addBossFeverBadge('crit');
    }

    setHeroes([...heroesRef.current]);

    const stepDelay = battleSpeed === 2 ? 300 : 450;
    actionIndexRef.current++;
    setTimeout(() => processNextActionRef.current(), stepDelay);
  }, [addBossFeverBadge, battleSpeed, playSfx, triggerVfx]);

  // ── 수동 커맨드 핸들러 (플레이어가 버튼 클릭 시 실행) ───────────────────
  const handleManualAction = (skill: Skill | 'basic') => {
    if (!isWaitingManual || !activeHeroTurnId) return;
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

  // ── 레이드 전투 개시 ─────────────────────────────────────────────────
  const startRaidBattle = () => {
    if (!isGateUnlocked) {
      gm.addLog(`🔒 [출격 불가] 차원 네메시스는 차원 앵커 게이트 Lv.3 이상에 개방됩니다. (현재 Lv.${gateLevel})`, 'danger');
      return;
    }

    if ((state.nemesisState?.dailyAttempts ?? 0) <= 0) {
      gm.addLog('일일 토벌 도전 횟수를 모두 소진했습니다! 에테르로 충전 가능합니다.', 'danger');
      return;
    }

    const squadCheck = gm.isNemesisSquadReady();
    if (!squadCheck.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 원정대 편성 필요',
        message: squadCheck.reason || '차원 네메시스 레이드는 선발 3인과 전술 오퍼레이터 1인이 모두 편성되어야 진행할 수 있습니다.',
        icon: '⚠️',
      });
      return;
    }

    // 3선발 + 1오퍼레이터 (리더)
    const { mainHeroes, leaderHero } = gm.getDimensionalDeck();
    setPlayerLeader(leaderHero);
    playerLeaderRef.current = leaderHero;

    // 리더 영웅의 가호 버프 적용
    const leaderBlessing = leaderHero ? gm.getLeaderBlessing(leaderHero) : null;
    const atkBonus = leaderBlessing?.buffs?.atkBonus || 1.0;
    const defBonus = leaderBlessing?.buffs?.defBonus || 1.0;
    const hpBonus = leaderBlessing?.buffs?.maxHpBonus || (leaderBlessing?.buffs as any)?.hpBonus || 1.0;
    const allBonus = leaderBlessing?.buffs?.allStatsBonus || 1.0;

    const raidHeroes: RaidHeroCombatant[] = mainHeroes.slice(0, 3).map((hero, idx) => {
      const cls = CHARACTER_CLASSES[hero.classId] || CHARACTER_CLASSES['squire'];
      const heroSkills: Skill[] = cls?.skills ? [...cls.skills] : [];
      if (cls?.specialSkill) heroSkills.push(cls.specialSkill);
      const eff = gm.getHeroEffectiveStats(hero);

      const maxHp = Math.round(eff.maxHp * hpBonus * allBonus);
      const currentHp = Math.min(maxHp, Math.round(hero.currentHp * hpBonus * allBonus));
      const atk = Math.round(eff.atk * atkBonus * allBonus);
      const def = Math.round(eff.def * defBonus * allBonus);

      return {
        id: hero.id,
        name: hero.name,
        classId: hero.classId,
        className: cls?.name || hero.classId,
        grade: hero.grade,
        level: hero.level,
        position: idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back',
        currentHp: currentHp,
        maxHp: maxHp,
        currentMp: eff.maxMp,
        maxMp: eff.maxMp,
        atk: atk,
        def: def,
        spd: eff.spd,
        luck: eff.luck,
        skills: heroSkills,
        cooldowns: {},
        statusEffects: [],
        icon: heroSkills[0]?.icon || '⚔️',
        damageDealt: 0,
      };
    });

    setHeroes(raidHeroes);
    heroesRef.current = raidHeroes;

    // 3개 부위 초기화 (저장된 parts 상태 또는 기본 설정)
    const savedParts = state.nemesisState?.parts;
    const headCfg = NEMESIS_BOSS_CONFIG.parts.head;
    const bodyCfg = NEMESIS_BOSS_CONFIG.parts.body;
    const tailCfg = NEMESIS_BOSS_CONFIG.parts.tail;

    const curHeadHp = savedParts?.head?.currentHp ?? headCfg.maxHp;
    const curBodyHp = savedParts?.body?.currentHp ?? bodyCfg.maxHp;
    const curTailHp = savedParts?.tail?.currentHp ?? tailCfg.maxHp;

    const initParts: Record<NemesisPartId, NemesisCombatPart> = {
      head: {
        ...headCfg,
        currentHp: curHeadHp,
        isDefeated: (savedParts?.head?.isDefeated || curHeadHp <= 0),
        statusEffects: [],
      },
      body: {
        ...bodyCfg,
        currentHp: curBodyHp,
        isDefeated: (savedParts?.body?.isDefeated || curBodyHp <= 0),
        statusEffects: [],
      },
      tail: {
        ...tailCfg,
        currentHp: curTailHp,
        isDefeated: (savedParts?.tail?.isDefeated || curTailHp <= 0),
        statusEffects: [],
      },
    };

    setBossParts(initParts);
    bossPartsRef.current = initParts;
    initialPartHpsRef.current = { head: curHeadHp, body: curBodyHp, tail: curTailHp };

    const defaultTarget: NemesisPartId = !initParts.head.isDefeated ? 'head' : !initParts.body.isDefeated ? 'body' : 'tail';
    setTargetedPart(defaultTarget);
    targetedPartRef.current = defaultTarget;

    const totalInitHp = Object.values(initParts).reduce((sum, p) => sum + (p.isDefeated ? 0 : p.currentHp), 0);
    setBossHp(totalInitHp);
    bossHpRef.current = totalInitHp;

    setBattleTurn(1);
    battleTurnRef.current = 1;
    setCataclysmCount(3);
    cataclysmCountRef.current = 3;
    setTotalBattleDmg(0);
    totalBattleDmgRef.current = 0;
    setIsWaitingManual(false);
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

    if (leaderHero) {
      initMetrics[leaderHero.id] = {
        id: leaderHero.id,
        name: `${leaderHero.name} (오퍼레이터)`,
        className: CHARACTER_CLASSES[leaderHero.classId]?.name || '오퍼레이터',
        classId: leaderHero.classId,
        grade: leaderHero.grade,
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
    setFeverBadges([]);
    setBossFeverBadges([]);
    feverBadgesRef.current = [];
    bossFeverBadgesRef.current = [];

    const initLogs: RaidCombatLog[] = [
      { turn: 1, text: '🌌 [차원의 침식] 시공의 침식자 네메시스와의 결전이 시작되었습니다!', type: 'system' },
      { turn: 1, text: '⚡ 선발 3인(전열/중열/후열) + 전술 오퍼레이터 1인이 참전했습니다!', type: 'system' },
      { turn: 1, text: '🎯 네메시스의 3대 부위(머리·전열 / 몸통·중열 / 꼬리·후열)를 타겟팅하여 수동 공격할 수 있습니다.', type: 'warning' },
    ];
    if (leaderHero && leaderBlessing) {
      initLogs.push({ turn: 1, text: `👑 [오퍼레이터 가호] ${leaderHero.name}: ${leaderBlessing.name} 효과 발동!`, type: 'hero_skill' });
    }

    setLogs(initLogs);
    setSettlement(null);
    setInBattle(true);
    isProcessingRef.current = false;

    // 1턴 첫 행동 큐 빌드 및 개시
    const initActions: Array<{ type: 'hero' | 'part'; id: string; spd: number; luck: number }> = [
      ...raidHeroes.map(h => ({ type: 'hero' as const, id: h.id, spd: h.spd, luck: h.luck })),
      ...(['head', 'body', 'tail'] as const).filter(k => !initParts[k].isDefeated).map(k => ({ type: 'part' as const, id: k, spd: initParts[k].spd, luck: initParts[k].luck }))
    ];
    initActions.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
    actionsRef.current = initActions;
    actionIndexRef.current = 0;

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

  // ── 1. 레이드 전투 진행 중 화면 (PVE 스타일 수동 전장) ───────────────────
  if (inBattle) {
    const activeHero = activeHeroTurnId ? heroes.find(h => h.id === activeHeroTurnId) : null;
    const battleHpPercent = Math.max(0, (bossHp / (NEMESIS_BOSS_CONFIG.maxHp || 12500000)) * 100);

    return (
      <div className="flex-1 min-h-0 w-full max-w-full flex flex-col bg-[#070910] text-white relative overflow-hidden">
        <BattleVFXOverlay vfxList={vfxList} onFinish={handleVfxComplete} />

        {/* 상단 액션 배너 */}
        {actionBanner && (
          <div className="absolute top-2 inset-x-3 z-30 flex flex-col items-center justify-center p-2 rounded-xl bg-black/85 border border-[#ff416c88] shadow-lg animate-bounce">
            <span className="text-sm font-bold tracking-wider" style={{ color: actionBanner.color }}>{actionBanner.text}</span>
            <span className="text-[10px] text-[#cfd8e8]">{actionBanner.sub}</span>
          </div>
        )}

        {/* 전투 상단 헤더: 턴 정보, 배속, 자동/수동, 스킵, 철수 */}
        <div className="px-3 pt-2 flex items-center justify-between shrink-0 border-b border-[#1f283d] pb-2 bg-[#0b0e18]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ff416c22] border border-[#ff416c66] text-[#ff416c] text-xs font-mono font-bold">
              Turn {Math.min(maxTurns, battleTurn)} / {maxTurns}
            </span>
            <span className="text-xs text-[#8b9bb4]">Phase {nemesisState.phase}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 자동/수동 전투 토글 */}
            <button
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                isAutoBattle
                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff66] animate-pulse'
                  : 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f66]'
              }`}
              onClick={() => {
                const next = !isAutoBattle;
                setIsAutoBattle(next);
                isAutoBattleRef.current = next;
                if (next && isWaitingManual && activeHeroTurnId) {
                  const h = heroes.find(x => x.id === activeHeroTurnId);
                  if (h) executeHeroCombat(h, null);
                }
              }}
            >
              {isAutoBattle ? '⚡ 자동 진행' : '🎮 수동 조작'}
            </button>

            {/* 배속 토글 */}
            <button
              className={`px-2 py-1 rounded text-xs font-bold ${battleSpeed === 2 ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739]' : 'bg-[#151c2d] text-[#8b9bb4]'}`}
              onClick={() => setBattleSpeed(s => s === 2 ? 1.5 : 2)}
            >
              ⏩ {battleSpeed}x
            </button>

            {/* 즉시 스킵 */}
            <button
              className="px-2.5 py-1 rounded bg-[#ffd54f22] border border-[#ffd54f66] text-[#ffd54f] text-xs font-bold hover:bg-[#ffd54f33]"
              onClick={() => {
                const remainingTurns = Math.max(1, maxTurns - battleTurn + 1);
                const avgDmgPerTurn = 22000 + Math.floor(Math.random() * 8000);
                const addDmg = remainingTurns * avgDmgPerTurn;
                totalBattleDmgRef.current += addDmg;

                // 살아있는 부위에 분배 차감
                const aliveKeys = (['head', 'body', 'tail'] as const).filter(k => !bossPartsRef.current[k].isDefeated);
                if (aliveKeys.length > 0) {
                  const perPart = Math.floor(addDmg / aliveKeys.length);
                  aliveKeys.forEach(k => {
                    bossPartsRef.current[k].currentHp = Math.max(0, bossPartsRef.current[k].currentHp - perPart);
                    if (bossPartsRef.current[k].currentHp <= 0) bossPartsRef.current[k].isDefeated = true;
                  });
                }
                finalizeRaidBattle();
              }}
            >
              ⏭️ 스킵
            </button>

            {/* 안전 철수 */}
            <button
              className="px-2 py-1 rounded bg-[#ef535022] border border-[#ef535066] text-[#ef5350] text-xs font-bold"
              onClick={finalizeRaidBattle}
            >
              🏳️ 철수
            </button>
          </div>
        </div>

        {/* 상단 몬스터 일러스트 및 보스 통합 정보 */}
        <div className="px-3 pt-2 shrink-0">
          <div className="relative rounded-2xl overflow-hidden border border-[#ff416c55] bg-gradient-to-b from-[#1a0c24] to-[#0d0914] p-2.5 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#ff416c] relative shadow-md shrink-0 bg-black">
                <img src="assets/void_overlord.jpg" alt="Nemesis" className="w-full h-full object-cover object-center scale-110" />
                <div className="absolute inset-0 bg-purple-900/20 animate-pulse pointer-events-none" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight break-keep truncate">
                    {NEMESIS_BOSS_CONFIG.name}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-bold" style={{ backgroundColor: `${currentPhaseCfg.badgeColor}22`, color: currentPhaseCfg.badgeColor }}>
                    Phase {nemesisState.phase}
                  </span>
                </div>
                <div className="text-[9px] text-[#ce93d8] truncate">
                  절멸기 충전: <span className="font-mono text-[#ff416c] font-bold">{cataclysmCount}턴 후 발동</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="font-mono text-xs font-bold text-[#ffd54f]">{battleHpPercent.toFixed(1)}%</span>
              <span className="text-[9px] text-[#8b9bb4] font-mono">({bossHp.toLocaleString()} / 12,500,000)</span>
            </div>
          </div>
        </div>

        {/* ── 👾 네메시스 3대 부위 (적군 슬롯: 머리·전열 / 몸통·중열 / 꼬리·후열) ── */}
        <div className="px-3 pt-2 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-[#8b9bb4] mb-1">
            <span className="flex items-center gap-1 font-bold text-white">
              <span>🎯</span>
              <span>네메시스 부위 선택 (공격 타겟 탭)</span>
            </span>
            <span className="text-[9px] text-[#ffd54f]">
              현재 타겟: <strong className="text-white">{bossParts[targetedPart]?.name || '머리'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(['head', 'body', 'tail'] as const).map(pKey => {
              const part = bossParts[pKey];
              const isSelected = targetedPart === pKey && !part.isDefeated;
              const isDead = part.isDefeated || part.currentHp <= 0;
              const partHpPct = Math.max(0, Math.min(100, (part.currentHp / part.maxHp) * 100));
              const themeColor = pKey === 'head' ? '#ef5350' : pKey === 'body' ? '#ce93d8' : '#00d2ff';
              const posLabel = pKey === 'head' ? '전열' : pKey === 'body' ? '중열' : '후열';

              return (
                <div
                  key={pKey}
                  onClick={() => {
                    if (!isDead) {
                      setTargetedPart(pKey);
                      targetedPartRef.current = pKey;
                      SoundManager.getInstance().play('click');
                    }
                  }}
                  className={`relative p-2 rounded-xl transition-all border flex flex-col justify-between min-h-[72px] sm:min-h-[80px] select-none ${
                    isDead
                      ? 'border-[#1f283d] bg-[#0c101a] opacity-35 grayscale cursor-not-allowed'
                      : isSelected
                      ? 'border-[#ff4444] bg-[#ff444422] shadow-[0_0_12px_rgba(255,68,68,0.5)] scale-[1.02] cursor-pointer'
                      : 'border-[#24334a] bg-[#111726ee] hover:border-[#3d5378] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-bold flex items-center gap-1 truncate" style={{ color: isDead ? '#8b9bb4' : themeColor }}>
                      <span>{part.icon}</span>
                      <span className="truncate">{part.name}</span>
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded font-bold" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
                      {posLabel}
                    </span>
                  </div>

                  <div className="text-[8.5px] text-[#8b9bb4] truncate mt-0.5">
                    {part.archetype.split(' ')[0]}
                  </div>

                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[8px] font-mono text-[#cfd8dc] mb-0.5">
                      <span>{isDead ? '💀 패퇴' : `${partHpPct.toFixed(0)}%`}</span>
                      <span>{isDead ? '0' : Math.round(part.currentHp).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${isDead ? 0 : partHpPct}%`,
                          backgroundColor: isDead ? '#546e7a' : themeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 적군 피버 게이지 */}
        <div className="px-3 pt-1.5 shrink-0">
          <FeverGaugeBar
            badges={bossFeverBadges}
            party={[{ id: 'nemesis_boss', name: NEMESIS_BOSS_CONFIG.name, currentHp: bossHp, maxHp: NEMESIS_BOSS_CONFIG.maxHp } as any]}
            label="NEMESIS FEVER"
            side="enemy"
          />
        </div>

        {/* ── ⚔️ 전투 상황 로그 ── */}
        <div className="flex-1 min-h-[50px] px-3 py-1 overflow-y-auto font-mono text-[9.5px] space-y-0.5">
          {logs.slice(-5).map((l, i) => (
            <div key={i} className={`truncate ${l.type === 'warning' ? 'text-[#ff416c] font-bold' : l.type === 'hero_skill' ? 'text-[#00d2ff]' : l.type === 'boss_skill' ? 'text-[#ce93d8]' : 'text-[#8b9bb4]'}`}>
              {l.text}
            </div>
          ))}
        </div>

        {/* 아군 피버 게이지 */}
        <div className="px-3 pb-1 shrink-0">
          <FeverGaugeBar
            badges={feverBadges}
            party={heroes.map(h => ({ id: h.id, name: h.name, currentHp: h.currentHp, maxHp: h.maxHp, classId: h.className } as any))}
            label="PLAYER FEVER"
            side="player"
          />
        </div>

        {/* 👑 전술 오퍼레이터 상태 바 */}
        <div className="px-3 py-1 flex items-center justify-between gap-2 shrink-0 bg-[#090d16] border-t border-[#1a2333]">
          {playerLeader ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#ffd54f15] border border-[#ffd54f44] text-[10px] min-w-0 flex-1 truncate">
              <span className="text-xs">👑</span>
              <span className="font-bold text-[#ffd54f] truncate">{playerLeader.name}</span>
              <span className="text-[9px] text-[#cfd8e8] truncate">
                (전술 오퍼레이터: {playerLeaderBlessing?.name || '가호 발동'})
              </span>
            </div>
          ) : (
            <div className="text-[9px] text-[#8b9bb4]">전술 오퍼레이터 미편성</div>
          )}
          <span className="text-[9px] text-[#00d2ff] font-mono shrink-0">
            총 가한 피해: {totalBattleDmg.toLocaleString()} DMG
          </span>
        </div>

        {/* ── 아군 선발 3인 슬롯 ── */}
        <div className="px-2 pt-1 pb-1.5 grid grid-cols-3 gap-1.5 shrink-0 bg-[#090d16] border-t border-[#1f283d]">
          {heroes.map(hero => {
            const hpPct = Math.max(0, (hero.currentHp / hero.maxHp) * 100);
            const mpPct = Math.max(0, (hero.currentMp / hero.maxMp) * 100);
            const isDead = hero.currentHp <= 0;
            const isActive = activeHeroTurnId === hero.id;

            return (
              <div
                key={hero.id}
                className={`panel p-1.5 flex flex-col justify-between transition-all rounded-xl ${
                  isDead
                    ? 'opacity-40 bg-[#16121a]'
                    : isActive
                    ? 'border-[#ffd54f] bg-[#1a190f] shadow-[0_0_12px_rgba(255,213,79,0.5)] scale-[1.02]'
                    : 'bg-[#0f1523] border border-[#1e2a40]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold truncate text-white">{hero.name}</span>
                    <span className="text-[9px] text-[#00d2ff] font-bold shrink-0">{hero.className}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[#8b9bb4] mt-0.5 font-mono">
                    <span>Lv.{hero.level}</span>
                    <span className="text-[#ffd54f] font-bold">SPD {hero.spd}</span>
                  </div>
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-[#4caf50] h-full" style={{ width: `${hpPct}%` }} />
                  </div>
                  <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden mt-0.5">
                    <div className="bg-[#00d2ff] h-full" style={{ width: `${mpPct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8.5px] text-[#8b9bb4] mt-1 font-mono">
                  <span>{hero.currentHp}/{hero.maxHp}</span>
                  {isDead ? (
                    <span className="text-[#ff416c] font-bold">기절</span>
                  ) : (
                    <span className="text-[#00d2ff]">{hero.currentMp} MP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 🎮 수동 조작 커맨드 액션 바 ── */}
        <div className="px-3 py-2 bg-[#0d1322] border-t border-[#1f2d48] shrink-0">
          {activeHero && isWaitingManual && !isAutoBattle ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span>
                  <span>[{activeHero.name}] 커맨드 선택</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  타겟: <strong className="text-[#00d2ff]">{bossParts[targetedPart]?.name || '머리'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {/* 일반 공격 버튼 */}
                <button
                  className="px-3 py-2 rounded-xl bg-[#1c273c] border border-[#2e3e5c] text-white hover:bg-[#2e3e5c] text-xs font-bold flex items-center gap-1 shrink-0"
                  onClick={() => handleManualAction('basic')}
                >
                  <span>🗡️</span>
                  <span>일반 공격</span>
                </button>

                {/* 보유 스킬 버튼들 */}
                {activeHero.skills.map(sk => {
                  const onCd = (activeHero.cooldowns[sk.id] || 0) > 0;
                  const notEnoughMp = activeHero.currentMp < sk.manaCost;
                  const disabled = onCd || notEnoughMp;

                  return (
                    <button
                      key={sk.id}
                      disabled={disabled}
                      onClick={() => handleManualAction(sk)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-0.5 shrink-0 transition-all ${
                        disabled
                          ? 'border-[#232c3d] bg-[#121722] text-[#556987] opacity-60 cursor-not-allowed'
                          : 'border-[#00d2ff66] bg-[#0c1f33] text-white hover:bg-[#122e4d] shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{sk.icon || '⚡'}</span>
                        <span className="truncate max-w-[110px]">{sk.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono">
                        <span className="text-[#00d2ff]">{sk.manaCost} MP</span>
                        {onCd && <span className="text-[#ff416c]">({activeHero.cooldowns[sk.id]}턴)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs py-1 text-[#8b9bb4]">
              {isAutoBattle ? (
                <span className="text-[#00d2ff] font-bold flex items-center gap-1 animate-pulse">
                  <span>⚡</span>
                  <span>자동 전투 진행 중입니다... (상단 버튼으로 수동 전환 가능)</span>
                </span>
              ) : (
                <span>턴 큐 진행 대기 중... (행동 순서가 도달하면 커맨드가 활성화됩니다)</span>
              )}
            </div>
          )}
        </div>

        {/* 🏆 정산 모달 */}
        {settlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="panel-accent w-full max-w-[520px] max-h-[90vh] overflow-y-auto custom-scrollbar p-4 flex flex-col items-center gap-3 border border-[#333d4e] shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#00d2ff22] border border-[#00d2ff] flex items-center justify-center text-2xl shadow-lg">
                🌌
              </div>

              <div className="text-center">
                <h3 className="font-cinzel text-lg font-bold text-white tracking-wide">
                  네메시스 토벌전 정산
                </h3>
                <p className="text-xs text-[#8b9bb4] mt-0.5">
                  부위별 피해량을 영구 기록하고 시공의 틈새에서 철수했습니다.
                </p>
              </div>

              {settlement.isNewRecord && (
                <div className="px-3 py-1 rounded-full bg-[#ffd54f22] border border-[#ffd54f] text-[#ffd54f] text-xs font-bold flex items-center gap-1 animate-pulse">
                  👑 개인 단일 최고 피해량 신기록 달성!
                </div>
              )}

              {/* 딜량 및 부위별 피해량 기록 */}
              <div className="w-full panel p-3 bg-[#0d1424] border border-[#1e2c45] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b9bb4]">가한 총 피해량:</span>
                  <span className="font-mono text-base font-bold text-[#ffd54f]">
                    {settlement.damage.toLocaleString()} DMG
                  </span>
                </div>

                {/* 부위별 가한 피해 기록 */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#070b14] rounded-lg border border-[#172338] text-[10px] text-center">
                  <div>
                    <span className="text-[#ef5350] block font-bold">💥 머리 피해</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.head.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#ce93d8] block font-bold">🌀 몸통 피해</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.body.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#00d2ff] block font-bold">🎯 꼬리 피해</span>
                    <span className="font-mono font-bold text-white">{settlement.partDamages.tail.toLocaleString()}</span>
                  </div>
                </div>

                <div className="h-px bg-[#1f283d]" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b9bb4] flex items-center gap-1">
                    <span>🪙</span>
                    <span>투사의 인장 획득:</span>
                  </span>
                  <span className="font-mono font-bold text-white">+{settlement.coins}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b9bb4] flex items-center gap-1">
                    <span>✨</span>
                    <span>에테르 정제 보상:</span>
                  </span>
                  <span className="font-mono font-bold text-[#00d2ff]">+{settlement.ether}</span>
                </div>
              </div>

              {/* ⚔️ 상세 전투 리포트 분석 표 */}
              <CombatMeterTable
                metrics={combatMetrics}
                title="🌌 차원 네메시스 전투 리포트"
              />

              <ActionButton
                label="로비로 복귀"
                variant="primary"
                size="md"
                className="w-full py-2.5 font-bold"
                onClick={() => {
                  setInBattle(false);
                  setSettlement(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 2. 네메시스 메인 로비 화면 ────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 w-full max-w-full flex flex-col bg-transparent overflow-hidden overflow-x-hidden relative">
      {/* 🌌 네메시스 상단 침식 사이클 & 보스 현황 배너 카드 */}
      <div className="px-3 pt-2 w-full max-w-full shrink-0">
        <div className="relative rounded-2xl overflow-hidden border border-[#ff416c66] bg-gradient-to-r from-[#180a24] via-[#0d0716] to-[#180a24] p-3 shadow-xl">
          {/* 상단 사이클 상태 태그 */}
          <div className="flex items-center justify-between mb-2 border-b border-[#ff416c33] pb-1.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              {cycleInfo.status === 'dormant' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#78909c33] text-[#cfd8dc] border border-[#78909c66]">
                  🛑 차원 앵커 폐쇄 중 (네메시스 침공 및 약탈 전면 중단)
                </span>
              ) : cycleInfo.status === 'active' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff416c33] text-[#ff416c] border border-[#ff416c66] animate-pulse">
                  🚨 6일 침식 활동 중 (D-{Math.ceil(cycleInfo.activeRemainingMs / 86400000)} · {formatRemainingTimeStr(cycleInfo.activeRemainingMs)})
                </span>
              ) : cycleInfo.status === 'defeated' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd54f33] text-[#ffd54f] border border-[#ffd54f66]">
                  👑 토벌 완료 (평화 상태 · 재소환까지 {formatRemainingTimeStr(cycleInfo.respawnRemainingMs)})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00d2ff33] text-[#00d2ff] border border-[#00d2ff66]">
                  💤 1일 재소환 대기 중 (재소환까지 {formatRemainingTimeStr(cycleInfo.respawnRemainingMs)})
                </span>
              )}
            </div>
            {cycleInfo.status === 'active' && (
              <span className="text-[10px] text-[#81c784] font-mono flex items-center gap-0.5">
                🌱 분당 +0.05% (+{Math.round(cycleInfo.regenPerMinute).toLocaleString()} HP/분) 회복 중
              </span>
            )}
          </div>

          {/* 보스 헤더 정보 */}
          <div className="flex items-start gap-3">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-[#ff416c] relative shadow-lg shrink-0 bg-black">
              <img src="assets/void_overlord.jpg" alt="Nemesis" className="w-full h-full object-cover object-center scale-110" />
              <div className="absolute inset-0 bg-purple-900/30 animate-pulse pointer-events-none" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight break-keep leading-tight">
                  {NEMESIS_BOSS_CONFIG.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0" style={{ backgroundColor: `${currentPhaseCfg.badgeColor}22`, color: currentPhaseCfg.badgeColor, border: `1px solid ${currentPhaseCfg.badgeColor}88` }}>
                  Phase {nemesisState.phase}
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
              <span className="text-[10px] text-[#8b9bb4]">보스 전체 잔여 체력</span>
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
                        <span>{pCfg.icon} {pCfg.name}</span>
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
                      <span className="text-[8px] text-[#8b9bb4] font-mono mt-0.5 truncate">
                        {isDefeated ? '재생 불가' : `${Math.round(curHp).toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 지휘관 레이드 전적 & 일일 도전 횟수 */}
      <div className="px-3 pt-2 grid grid-cols-3 gap-1.5 shrink-0">
        <div className="panel p-2 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40]">
          <span className="text-[10px] text-[#8b9bb4]">누적 총 피해량</span>
          <span className="font-mono text-xs font-bold text-[#00d2ff] mt-0.5">
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
                      <span className="text-2xl p-1.5 rounded-lg bg-black/40 border border-[#ef535044] shrink-0">⚠️</span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[#ff8a80] flex items-center gap-1.5 flex-wrap">
                          <span>차원 원정대 (3선발 + 1오퍼레이터) 미편성</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 text-[#ffd54f] font-mono font-bold border border-[#ffd54f33]">
                            현재 {squadCheck.count}/4인 배치
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
                          <div className="text-[8px] text-[#ffd54f] mt-0.5 font-mono flex items-center justify-center gap-0.5">
                            <span>Lv.{h.level}</span>
                            <span className="text-[#8b9bb4]">·</span>
                            <span>{posLabel}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* 1오퍼레이터 (리더) 슬롯 */}
                    {leaderHero ? (() => {
                      const lCls = CHARACTER_CLASSES[leaderHero.classId];
                      return (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[#1f1910] border border-[#ffd54f66] flex flex-col items-center text-center min-w-0 relative">
                          <span className="text-[8px] font-bold text-[#ffd54f]">👑오퍼레이터</span>
                          <div className="text-base sm:text-xl">{lCls?.skills[0]?.icon || '👑'}</div>
                          <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full mt-0.5" title={leaderHero.name}>
                            {leaderHero.name}
                          </span>
                          <span className="text-[8.5px] sm:text-[10px] text-[#ffd54f] truncate w-full">
                            {lCls?.name || leaderHero.classId}
                          </span>
                          <div className="text-[8px] text-[#ffd54f] mt-0.5 font-mono">
                            Lv.{leaderHero.level} 가호
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-1.5 sm:p-2 rounded-xl border border-dashed border-[#ffd54f44] bg-[#1a150c]/50 flex flex-col items-center justify-center text-center min-h-[72px]">
                        <span className="text-sm opacity-40">👑</span>
                        <span className="text-[9px] text-[#ffd54f88] mt-1 font-mono">오퍼레이터 공석</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 레이드 특징 안내 */}
            <div className="panel p-3 bg-[#110c1c] border border-[#ff416c44] flex flex-col gap-1.5 text-xs text-[#cfd8e8]">
              <div className="font-bold text-[#ff416c] flex items-center gap-1 text-sm">
                <span>⚠️</span>
                <span>차원 네메시스 침식 & 부위별 전투 규칙</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8b9bb4]">
                • <strong className="text-white">3선발 + 1오퍼레이터 원정대</strong>: 선발 3인(전열/중열/후열)의 직접 수동 커맨드 전투와 전술 오퍼레이터의 후방 가호/피버 총공격으로 토벌전을 진행합니다.<br />
                • <strong className="text-white">3대 전술 부위 (머리/몸통/꼬리)</strong>: 전열의 머리(워로드·광역 물리/분쇄, 400만), 중열의 몸통(크로노 아콘·광역 디버프/CC, 500만), 후열의 꼬리(레인저·광역 휩쓸기/원샷원킬, 350만)로 구성됩니다.<br />
                • <strong className="text-white">수동 타겟팅 & 즉시 패퇴 (사경 없음)</strong>: 원하는 부위를 직접 탭하여 집중 공격할 수 있으며, 부위 체력이 0이 되면 사경 유예 없이 즉시 패퇴합니다.<br />
                • <strong className="text-white">생존 부위 한정 시간제 자연 재생</strong>: 살아있는 부위는 분당 0.05%씩 자연 재생되나, 어느 한 부위라도 패퇴하면 해당 부위는 영구히 재생되지 않습니다.<br />
                • <strong className="text-white">영구 피해 기록</strong>: 전투 후 가한 부위별 피해는 누적 보존되며, 로비에는 전체 합계 잔여 체력이 표시됩니다.
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
