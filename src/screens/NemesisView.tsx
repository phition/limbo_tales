import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { ActionButton } from '../components/ActionButton';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { SoundManager } from '../managers/SoundManager';
import { Skill, StatusEffect, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import {
  NEMESIS_BOSS_CONFIG,
  NEMESIS_MILESTONES,
  NEMESIS_LEADERBOARD_MOCK
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
  const [bossHp, setBossHp] = useState(state.nemesisState?.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp);
  const [totalBattleDmg, setTotalBattleDmg] = useState(0);
  const [battleSpeed, setBattleSpeed] = useState<1 | 1.5>(1);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [logs, setLogs] = useState<RaidCombatLog[]>([]);
  const [turnTick, setTurnTick] = useState(0);

  // 👑 리더 & 🤝 서포터 상태 (3선발 + 1리더 + 1서포터 구성)
  const [playerLeader, setPlayerLeader] = useState<Mercenary | null>(null);
  const [playerSupporter, setPlayerSupporter] = useState<Mercenary | null>(null);
  const [isPlayerSupporterJoined, setIsPlayerSupporterJoined] = useState(false);
  const playerLeaderRef = useRef<Mercenary | null>(null);
  const playerSupporterRef = useRef<Mercenary | null>(null);
  const isPlayerSupporterJoinedRef = useRef(false);

  playerLeaderRef.current = playerLeader;
  playerSupporterRef.current = playerSupporter;
  isPlayerSupporterJoinedRef.current = isPlayerSupporterJoined;

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
  } | null>(null);

  // ── 비동기 Ref 제어 ──────────────────────────────────────────────────
  const isProcessingRef = useRef(false);
  const heroesRef = useRef<RaidHeroCombatant[]>([]);
  const bossHpRef = useRef(bossHp);
  const totalBattleDmgRef = useRef(0);
  const cataclysmCountRef = useRef(cataclysmCount);
  const battleTurnRef = useRef(battleTurn);

  useEffect(() => {
    heroesRef.current = heroes;
  }, [heroes]);
  useEffect(() => {
    bossHpRef.current = bossHp;
  }, [bossHp]);
  useEffect(() => {
    totalBattleDmgRef.current = totalBattleDmg;
  }, [totalBattleDmg]);
  useEffect(() => {
    cataclysmCountRef.current = cataclysmCount;
  }, [cataclysmCount]);
  useEffect(() => {
    battleTurnRef.current = battleTurn;
  }, [battleTurn]);

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

    const squadCheck = gm.isDimensionalSquadReady();
    if (!squadCheck.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 5인 부대 편성 필요',
        message: squadCheck.reason || '차원 네메시스 레이드는 5인 부대(선발 3인 + 리더 1인 + 서포터 1인)가 모두 편성되어야 진행할 수 있습니다.',
        icon: '⚠️',
      });
      return;
    }

    // 3선발 + 1리더 + 1서포터 차원 부대 파싱
    const { mainHeroes, leaderHero, supporterHero } = gm.getDimensionalDeck();
    const partySource = mainHeroes;

    setPlayerLeader(leaderHero);
    setPlayerSupporter(supporterHero);
    playerLeaderRef.current = leaderHero;
    playerSupporterRef.current = supporterHero;
    setIsPlayerSupporterJoined(false);
    isPlayerSupporterJoinedRef.current = false;

    // 리더 영웅의 무덤의 영령 가호 버프 적용
    const leaderBlessing = leaderHero ? gm.getLeaderBlessing(leaderHero) : null;
    const atkBonus = leaderBlessing?.buffs?.atkBonus || 1.0;
    const defBonus = leaderBlessing?.buffs?.defBonus || 1.0;
    const hpBonus = leaderBlessing?.buffs?.maxHpBonus || (leaderBlessing?.buffs as any)?.hpBonus || 1.0;
    const allBonus = leaderBlessing?.buffs?.allStatsBonus || 1.0;

    const raidHeroes: RaidHeroCombatant[] = partySource.slice(0, 3).map((hero, idx) => {
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
    setBossHp(state.nemesisState?.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp);
    bossHpRef.current = state.nemesisState?.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp;
    setBattleTurn(1);
    battleTurnRef.current = 1;
    setCataclysmCount(3);
    cataclysmCountRef.current = 3;
    setTotalBattleDmg(0);
    totalBattleDmgRef.current = 0;

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

    // 👑 리더 메트릭 등록
    if (leaderHero) {
      initMetrics[leaderHero.id] = {
        id: leaderHero.id,
        name: `${leaderHero.name} (리더)`,
        className: CHARACTER_CLASSES[leaderHero.classId]?.name || '리더',
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

    // 🤝 서포터 메트릭 등록
    if (supporterHero) {
      initMetrics[supporterHero.id] = {
        id: supporterHero.id,
        name: `${supporterHero.name} (서포터)`,
        className: CHARACTER_CLASSES[supporterHero.classId]?.name || '서포터',
        classId: supporterHero.classId,
        grade: supporterHero.grade,
        icon: '🤝',
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

    initMetrics['nemesis_boss'] = {
      id: 'nemesis_boss',
      name: NEMESIS_BOSS_CONFIG.name,
      className: '차원 보스',
      classId: 'boss',
      grade: 'legend',
      icon: '🌌',
      isPlayer: false,
      damageDealt: 0,
      healingDone: 0,
      damageTaken: 0,
      dodges: 0,
      combosTriggered: 0,
      critCount: 0,
      kills: 0,
      actionsCount: 0,
    };
    combatMetricsRef.current = initMetrics;
    setCombatMetrics(Object.values(initMetrics));
    setFeverBadges([]);
    setBossFeverBadges([]);
    feverBadgesRef.current = [];
    bossFeverBadgesRef.current = [];

    const initLogs: RaidCombatLog[] = [
      { turn: 1, text: '🌌 [차원의 침식] 시공의 침식자 네메시스와의 결전이 시작되었습니다!', type: 'system' },
      { turn: 1, text: '⚡ 3인 선발 전투원 + 1인 리더 + 1인 서포터 원정대가 진입했습니다!', type: 'system' },
    ];
    if (leaderHero && leaderBlessing) {
      initLogs.push({ turn: 1, text: `👑 [리더의 가호] ${leaderHero.name}: ${leaderBlessing.name} 효과 발동!`, type: 'hero_skill' });
    }
    if (supporterHero) {
      initLogs.push({ turn: 1, text: `🤝 [서포터 대기] ${supporterHero.name}이(가) 후방 지원 준비를 마쳤습니다.`, type: 'system' });
    }
    initLogs.push({ turn: 1, text: '⚡ 최대 15턴 동안 생존하며 최대한의 피해를 입히십시오!', type: 'warning' });

    setLogs(initLogs);
    setSettlement(null);
    setInBattle(true);
    isProcessingRef.current = false;
    setTurnTick(1);
  };

  // 🔥 아군 피버 뱃지 추가
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 💀 보스 피버 뱃지 추가
  const addBossFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setBossFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      bossFeverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 👑 아군 피버 버스트: 차원 총공격
  const triggerPlayerFeverBurst = useCallback(() => {
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveHeroes.length === 0) return;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: '👑 아군 차원 총공격: ALL-OUT FEVER BURST!',
      sub: '아군 피버 만충! 시공간 왜곡을 뚫고 네메시스에게 치명타 집중 폭격!',
      color: '#ffd54f',
    });

    const totalAtk = liveHeroes.reduce((sum, h) => sum + h.atk, 0);
    const burstDmg = Math.floor(totalAtk * 4.5 + Math.random() * 2000);

    triggerVfx('crit_slash', 50, 25, `${burstDmg.toLocaleString()}`, true);
    playSfx('crit');

    const nextBossHp = Math.max(0, bossHpRef.current - burstDmg);
    setBossHp(nextBossHp);
    bossHpRef.current = nextBossHp;

    const nextTotalDmg = totalBattleDmgRef.current + burstDmg;
    setTotalBattleDmg(nextTotalDmg);
    totalBattleDmgRef.current = nextTotalDmg;

    // 딜미터기 기록
    const leadHero = liveHeroes[0];
    if (leadHero && combatMetricsRef.current[leadHero.id]) {
      combatMetricsRef.current[leadHero.id].damageDealt += burstDmg;
      combatMetricsRef.current[leadHero.id].critCount += 1;
      combatMetricsRef.current[leadHero.id].combosTriggered += 1;
    }
    if (combatMetricsRef.current['nemesis_boss']) {
      combatMetricsRef.current['nemesis_boss'].damageTaken += burstDmg;
    }

    setFeverBadges([]);
    feverBadgesRef.current = [];
  }, [playSfx, triggerVfx]);

  // 💀 보스 피버 버스트: 공허의 파멸선
  const triggerBossFeverBurst = useCallback(() => {
    const liveHeroes = heroesRef.current.filter(h => h.currentHp > 0);
    if (liveHeroes.length === 0) return;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: '💀 네메시스 공허 폭주: VOID FEVER ANNIHILATION!',
      sub: '보스 피버 만충! 아군 전원에게 차원 균열 파동!',
      color: '#ff416c',
    });

    triggerVfx('dark_curse', 50, 75, 'FEVER BURST!', true);
    playSfx('defeat');

    const updated = heroesRef.current.map(h => {
      if (h.currentHp <= 0) return h;
      const bDmg = Math.floor(h.maxHp * 0.25 + 40);
      if (combatMetricsRef.current[h.id]) combatMetricsRef.current[h.id].damageTaken += bDmg;
      if (combatMetricsRef.current['nemesis_boss']) {
        combatMetricsRef.current['nemesis_boss'].damageDealt += bDmg;
        combatMetricsRef.current['nemesis_boss'].critCount += 1;
        combatMetricsRef.current['nemesis_boss'].combosTriggered += 1;
        if (h.currentHp - bDmg <= 0) combatMetricsRef.current['nemesis_boss'].kills += 1;
      }
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
    const finalDmg = totalBattleDmgRef.current;
    const res = gm.recordNemesisDamage(finalDmg);

    setCombatMetrics(Object.values(combatMetricsRef.current));
    setSettlement({
      damage: finalDmg,
      coins: res.coinsEarned,
      ether: res.etherEarned,
      isNewRecord: res.isNewRecord,
      bossPhaseChanged: res.bossPhaseChanged,
    });
    playSfx('victory');
  }, [gm, playSfx]);

  // ── 턴 실행 엔진 (속도(SPD) 순서 기반 턴제 진행) ─────────────────────
  useEffect(() => {
    if (!inBattle || isProcessingRef.current || settlement) return;

    // 관전이 편안하도록 속도 딜레이 완화 (기본 1x: 650ms, 1.5x: 450ms)
    const stepDelay = battleSpeed === 1.5 ? 450 : 650;

    const timer = setTimeout(() => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // 생존 영웅 확인
      const currentHeroes = [...heroesRef.current];
      const aliveHeroes = currentHeroes.filter(h => h.currentHp > 0);

      // 종료 조건 1: 모든 아군 전멸
      if (aliveHeroes.length === 0) {
        setLogs(prev => [...prev.slice(-20), { turn: battleTurnRef.current, text: '💀 파티가 전멸하여 원정대가 시공의 틈새로 퇴각합니다!', type: 'warning' }]);
        finalizeRaidBattle();
        return;
      }

      // 종료 조건 2: 15턴 도달
      if (battleTurnRef.current > maxTurns) {
        setLogs(prev => [...prev.slice(-20), { turn: maxTurns, text: '⌛ 15턴 경과! 차원의 왜곡 한계에 도달하여 안전 철수합니다.', type: 'system' }]);
        finalizeRaidBattle();
        return;
      }

      // 🏃 속도(SPD) 내림차순으로 행동 큐 생성
      interface RaidTurnAction {
        type: 'hero' | 'boss';
        id: string;
        spd: number;
        luck: number;
      }

      const actions: RaidTurnAction[] = [
        ...aliveHeroes.map(h => ({ type: 'hero' as const, id: h.id, spd: h.spd, luck: h.luck })),
        { type: 'boss' as const, id: 'nemesis_boss', spd: NEMESIS_BOSS_CONFIG.spd, luck: NEMESIS_BOSS_CONFIG.luck },
      ];
      actions.sort((a, b) => b.spd - a.spd || b.luck - a.luck);

      let stepIndex = 0;

      const executeNextAction = () => {
        // 이미 종료되었거나 전멸한 경우
        if (settlement || heroesRef.current.every(h => h.currentHp <= 0)) {
          finalizeRaidBattle();
          return;
        }

        // 라운드 내 모든 행동 완료 시 턴 종료 및 정산
        if (stepIndex >= actions.length) {
          // 피버 버스트 검사
          if (feverBadgesRef.current.length >= 5) {
            setTimeout(() => triggerPlayerFeverBurst(), 250);
          }
          if (bossFeverBadgesRef.current.length >= 5) {
            setTimeout(() => triggerBossFeverBurst(), 250);
          }

          setBattleTurn(t => t + 1);
          battleTurnRef.current += 1;
          isProcessingRef.current = false;
          setTurnTick(tk => tk + 1);
          return;
        }

        const currentAction = actions[stepIndex];
        stepIndex++;

        // ── [영웅의 행동] ──
        if (currentAction.type === 'hero') {
          const hero = heroesRef.current.find(h => h.id === currentAction.id);
          // 이전 보스 공격으로 사망했으면 행동 스킵
          if (!hero || hero.currentHp <= 0) {
            executeNextAction();
            return;
          }

          // 스킬 선택 또는 기본 공격
          const readySkills = hero.skills.filter(s => (hero.cooldowns[s.id] || 0) === 0 && hero.currentMp >= s.manaCost);
          const useSkill = readySkills.length > 0 && Math.random() < 0.65 ? readySkills[Math.floor(Math.random() * readySkills.length)] : null;

          let dmg = 0;
          const isCrit = Math.random() * 100 < Math.min(50, 10 + hero.luck * 0.8);
          const critMult = isCrit ? 1.75 : 1.0;

          // 🌌 [순수 PVE 월드 보스 레이드]: 아레나 PVP 공/방 너프 스케일 없이 원스펙(100% 공격력/방어력) 그대로 계산
          if (useSkill) {
            const power = useSkill.power || 1.2;
            dmg = Math.floor((hero.atk * power * 2.2 - NEMESIS_BOSS_CONFIG.def * 0.4) * critMult);
            dmg = Math.max(120, dmg + Math.floor(Math.random() * 80));
            hero.currentMp = Math.max(0, hero.currentMp - useSkill.manaCost);
            hero.cooldowns[useSkill.id] = useSkill.cooldown || 2;

            setActionBanner({
              text: `⚔️ [${hero.name}] ${useSkill.name} (속도 ${hero.spd})`,
              sub: `${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
              color: '#00d2ff',
            });

            setLogs(prev => [...prev.slice(-20), {
              turn: battleTurnRef.current,
              text: `⚔️ [${hero.name}](SPD ${hero.spd}) ${useSkill.icon} [${useSkill.name}]! ${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
              type: 'hero_skill'
            }]);
          } else {
            dmg = Math.floor((hero.atk * 1.6 - NEMESIS_BOSS_CONFIG.def * 0.3) * critMult);
            dmg = Math.max(80, dmg + Math.floor(Math.random() * 50));
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + 15);

            setActionBanner({
              text: `🗡️ [${hero.name}] 일반 공격 (속도 ${hero.spd})`,
              sub: `${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
              color: '#42a5f5',
            });

            setLogs(prev => [...prev.slice(-20), {
              turn: battleTurnRef.current,
              text: `🗡️ [${hero.name}](SPD ${hero.spd}) 일반 공격! ${dmg.toLocaleString()} 피해! ${isCrit ? '💥 치명타!' : ''}`,
              type: 'damage'
            }]);
          }

          // 쿨다운 1 감소
          Object.keys(hero.cooldowns).forEach(k => {
            if (hero.cooldowns[k] > 0 && (!useSkill || useSkill.id !== k)) {
              hero.cooldowns[k] -= 1;
            }
          });

          hero.damageDealt += dmg;
          const nextTotal = totalBattleDmgRef.current + dmg;
          setTotalBattleDmg(nextTotal);
          totalBattleDmgRef.current = nextTotal;

          const nextBossHp = Math.max(0, bossHpRef.current - dmg);
          setBossHp(nextBossHp);
          bossHpRef.current = nextBossHp;

          // 📊 딜미터기 메트릭스 기록
          const mRef = combatMetricsRef.current;
          const mHero = mRef[hero.id];
          if (mHero) {
            mHero.actionsCount = (mHero.actionsCount || 0) + 1;
            mHero.damageDealt += dmg;
            if (isCrit) mHero.critCount += 1;
            if (useSkill) mHero.combosTriggered += 1;
          }
          const mBoss = mRef['nemesis_boss'];
          if (mBoss) {
            mBoss.damageTaken += dmg;
          }

          // 피버 뱃지 적립
          if (isCrit) addFeverBadge('crit');
          else if (useSkill) addFeverBadge('extra');
          else addFeverBadge('assist');

          // VFX & 사운드
          triggerVfx(isCrit ? 'crit_slash' : 'slash', 50, 25, `${dmg.toLocaleString()}`, isCrit);
          playSfx(isCrit ? 'crit' : 'hit');

          setHeroes([...heroesRef.current]);
          setTimeout(executeNextAction, stepDelay);
        } else {
          // ── [보스 네메시스의 행동] ──
          const liveTargets = heroesRef.current.filter(h => h.currentHp > 0);
          if (liveTargets.length === 0) {
            executeNextAction();
            return;
          }

          const nextCountdown = cataclysmCountRef.current - 1;

          if (nextCountdown <= 0) {
            // 🔥 절멸기: 차원 소멸선 (Cataclysm) 발동!
            setActionBanner({
              text: `💥 [차원 소멸선] (네메시스 속도 ${NEMESIS_BOSS_CONFIG.spd})`,
              sub: '네메시스의 종말 절멸기 방출! 파티 전원 궤멸 피해!',
              color: '#ff416c'
            });
            triggerVfx('dark_curse', 50, 75, 'CATACLYSM!', true);
            playSfx('defeat');

            heroesRef.current.forEach(h => {
              if (h.currentHp > 0) {
                const cataDmg = Math.floor(h.maxHp * 0.45 + 50);
                h.currentHp = Math.max(0, h.currentHp - cataDmg);
                if (combatMetricsRef.current[h.id]) combatMetricsRef.current[h.id].damageTaken += cataDmg;
                if (combatMetricsRef.current['nemesis_boss']) {
                  combatMetricsRef.current['nemesis_boss'].damageDealt += cataDmg;
                  combatMetricsRef.current['nemesis_boss'].critCount += 1;
                  combatMetricsRef.current['nemesis_boss'].combosTriggered += 1;
                  if (h.currentHp <= 0) combatMetricsRef.current['nemesis_boss'].kills += 1;
                }
              }
            });

            setLogs(prev => [...prev.slice(-20), {
              turn: battleTurnRef.current,
              text: `💥⚠️ [네메시스](SPD ${NEMESIS_BOSS_CONFIG.spd}) 차원 소멸선 방출! 파티 전체가 치명적인 궤멸 피해를 입었습니다!`,
              type: 'warning'
            }]);

            setCataclysmCount(3);
            cataclysmCountRef.current = 3;
            addBossFeverBadge('extra');
          } else {
            // 일반 보스 스킬
            const bossSkill = NEMESIS_BOSS_CONFIG.skills[Math.floor(Math.random() * (NEMESIS_BOSS_CONFIG.skills.length - 1))];
            setActionBanner({
              text: `${bossSkill.icon} [${bossSkill.name}] (네메시스 속도 ${NEMESIS_BOSS_CONFIG.spd})`,
              sub: bossSkill.desc,
              color: '#ce93d8'
            });
            playSfx('cast');

            if (bossSkill.target === 'single') {
              const target = liveTargets[Math.floor(Math.random() * liveTargets.length)];
              const evadeChance = Math.min(0.25, Math.max(0.04, target.spd * 0.001 + target.luck * 0.001));
              const isEvaded = Math.random() < evadeChance;

              if (isEvaded) {
                if (combatMetricsRef.current[target.id]) {
                  combatMetricsRef.current[target.id].dodges += 1;
                }
                triggerVfx('evade', 50, 75, '💨 EVADE');
                playSfx('cast');
                setLogs(prev => [...prev.slice(-20), {
                  turn: battleTurnRef.current,
                  text: `💨 [${target.name}] 보스의 [${bossSkill.name}] 공격을 신속하게 회피(EVADE)했습니다!`,
                  type: 'hero_skill'
                }]);
              } else {
                const bDmg = Math.max(25, Math.floor(NEMESIS_BOSS_CONFIG.atk * bossSkill.power - target.def * 0.4));
                target.currentHp = Math.max(0, target.currentHp - bDmg);
                if (combatMetricsRef.current[target.id]) combatMetricsRef.current[target.id].damageTaken += bDmg;
                if (combatMetricsRef.current['nemesis_boss']) {
                  combatMetricsRef.current['nemesis_boss'].damageDealt += bDmg;
                  if (target.currentHp <= 0) combatMetricsRef.current['nemesis_boss'].kills += 1;
                }
                triggerVfx('fire', 50, 75, `-${bDmg}`);
                setLogs(prev => [...prev.slice(-20), {
                  turn: battleTurnRef.current,
                  text: `👁️ [네메시스](SPD ${NEMESIS_BOSS_CONFIG.spd}) [${bossSkill.name}] ➔ [${target.name}]에게 ${bDmg} 피해!`,
                  type: 'boss_skill'
                }]);
              }
            } else {
              // 광역기
              liveTargets.forEach(target => {
                const bDmg = Math.max(15, Math.floor(NEMESIS_BOSS_CONFIG.atk * bossSkill.power * 0.75 - target.def * 0.3));
                target.currentHp = Math.max(0, target.currentHp - bDmg);
                if (combatMetricsRef.current[target.id]) combatMetricsRef.current[target.id].damageTaken += bDmg;
                if (combatMetricsRef.current['nemesis_boss']) {
                  combatMetricsRef.current['nemesis_boss'].damageDealt += bDmg;
                  if (target.currentHp <= 0) combatMetricsRef.current['nemesis_boss'].kills += 1;
                }
                if (bossSkill.effectType === 'drain') {
                  target.currentMp = Math.max(0, target.currentMp - 12);
                }
              });
              triggerVfx('dark_curse', 50, 75, 'AOE HIT');
              setLogs(prev => [...prev.slice(-20), {
                turn: battleTurnRef.current,
                text: `🌀 [네메시스](SPD ${NEMESIS_BOSS_CONFIG.spd}) [${bossSkill.name}] 광역 강타! 아군 전체가 피해를 입었습니다!`,
                type: 'boss_skill'
              }]);
            }

            setCataclysmCount(nextCountdown);
            cataclysmCountRef.current = nextCountdown;
            addBossFeverBadge('crit');
          }

          // 🤝 서포터 교체 투입 검사: 아군 전사 시 즉시 후방 서포터 참전
          if (!isPlayerSupporterJoinedRef.current && playerSupporterRef.current) {
            const deadIdx = heroesRef.current.findIndex(h => h.currentHp <= 0);
            if (deadIdx !== -1) {
              const deadHero = heroesRef.current[deadIdx];
              const supp = playerSupporterRef.current;
              const suppEff = gm.getHeroEffectiveStats(supp);
              const suppCls = CHARACTER_CLASSES[supp.classId] || CHARACTER_CLASSES['squire'];
              const suppSkills: Skill[] = suppCls?.skills ? [...suppCls.skills] : [];
              if (suppCls?.specialSkill) suppSkills.push(suppCls.specialSkill);

              const suppCombatant: RaidHeroCombatant = {
                id: supp.id,
                name: supp.name,
                classId: supp.classId,
                className: suppCls.name,
                grade: supp.grade,
                level: supp.level,
                position: deadHero.position,
                currentHp: suppEff.maxHp,
                maxHp: suppEff.maxHp,
                currentMp: Math.floor(suppEff.maxMp * 0.5),
                maxMp: suppEff.maxMp,
                atk: suppEff.atk,
                def: suppEff.def,
                spd: suppEff.spd,
                luck: suppEff.luck,
                skills: suppSkills,
                cooldowns: {},
                statusEffects: [],
                icon: suppSkills[0]?.icon || '🛡️',
                damageDealt: 0,
              };

              heroesRef.current[deadIdx] = suppCombatant;
              isPlayerSupporterJoinedRef.current = true;
              setIsPlayerSupporterJoined(true);

              setActionBanner({
                text: `🤝 아군 서포터 난입! ${supp.name} 참전!`,
                sub: `[${deadHero.name}] 전사 ➔ 후방 서포터가 전선에 합류했습니다!`,
                color: '#00d2ff',
              });
              playSfx('shield');
              setLogs(prev => [...prev.slice(-20), {
                turn: battleTurnRef.current,
                text: `🤝 [서포터 난입] [${deadHero.name}] 전사로 인해 후방의 ${supp.name}이(가) 즉시 전장에 투입되었습니다!`,
                type: 'hero_skill'
              }]);
            }
          }

          setHeroes([...heroesRef.current]);
          setTimeout(executeNextAction, stepDelay);
        }
      };

      executeNextAction();
    }, stepDelay);

    return () => clearTimeout(timer);
  }, [inBattle, turnTick, battleSpeed, settlement, maxTurns, finalizeRaidBattle, triggerVfx, playSfx, addFeverBadge, addBossFeverBadge, triggerPlayerFeverBurst, triggerBossFeverBurst, gm]);

  // ── 마일스톤 수령 핸들러 ───────────────────────────────────────────────
  const handleClaimMilestone = (msId: string) => {
    gm.claimNemesisMilestone(msId);
  };

  // ── 도전 횟수 충전 ────────────────────────────────────────────────────
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

  const hpPercent = Math.max(0, (nemesisState.currentBossHp / nemesisState.maxBossHp) * 100);
  const currentPhaseCfg = NEMESIS_BOSS_CONFIG.phases.find(p => p.phase === nemesisState.phase) || NEMESIS_BOSS_CONFIG.phases[0];

  // ── 1. 레이드 전투 진행 중 화면 ──────────────────────────────────────
  if (inBattle) {
    const battleHpPercent = Math.max(0, (bossHp / NEMESIS_BOSS_CONFIG.maxHp) * 100);

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

        {/* 전투 헤더: 턴 정보, 배속, 스킵, 철수 */}
        <div className="px-3 pt-2 flex items-center justify-between shrink-0 border-b border-[#1f283d] pb-2 bg-[#0b0e18]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ff416c22] border border-[#ff416c66] text-[#ff416c] text-xs font-mono font-bold">
              Turn {Math.min(maxTurns, battleTurn)} / {maxTurns}
            </span>
            <span className="text-xs text-[#8b9bb4]">Phase {nemesisState.phase}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className={`px-2 py-1 rounded text-xs font-bold ${battleSpeed === 1.5 ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739]' : 'bg-[#151c2d] text-[#8b9bb4]'}`}
              onClick={() => setBattleSpeed(s => s === 1 ? 1.5 : 1)}
            >
              ⚡ {battleSpeed}x
            </button>
            <button
              className="px-2.5 py-1 rounded bg-[#ffd54f22] border border-[#ffd54f66] text-[#ffd54f] text-xs font-bold hover:bg-[#ffd54f33]"
              onClick={() => {
                // 즉시 결과 시뮬레이션
                const remainingTurns = Math.max(1, maxTurns - battleTurn + 1);
                const avgDmgPerTurn = 18000 + Math.floor(Math.random() * 8000);
                totalBattleDmgRef.current += remainingTurns * avgDmgPerTurn;
                finalizeRaidBattle();
              }}
            >
              ⏭️ 스킵
            </button>
            <button
              className="px-2 py-1 rounded bg-[#ef535022] border border-[#ef535066] text-[#ef5350] text-xs font-bold"
              onClick={finalizeRaidBattle}
            >
              🏳️ 철수
            </button>
          </div>
        </div>

        {/* 거대 보스 네메시스 카드 */}
        <div className="px-3 pt-2 shrink-0">
          <div className="relative rounded-2xl overflow-hidden border border-[#ff416c55] bg-gradient-to-b from-[#1a0c24] to-[#0d0914] p-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-[#ff416c] relative shadow-md shrink-0 bg-black">
                <img src="assets/void_overlord.jpg" alt="Nemesis" className="w-full h-full object-cover object-center scale-110" />
                <div className="absolute inset-0 bg-purple-900/20 animate-pulse pointer-events-none" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight break-keep leading-tight">
                    {NEMESIS_BOSS_CONFIG.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0" style={{ backgroundColor: `${currentPhaseCfg.badgeColor}22`, color: currentPhaseCfg.badgeColor, border: `1px solid ${currentPhaseCfg.badgeColor}66` }}>
                    Phase {nemesisState.phase}
                  </span>
                </div>
                <div className="text-[10px] text-[#ce93d8] truncate mt-0.5">{NEMESIS_BOSS_CONFIG.title}</div>
                
                {/* 절멸기 카운트다운 게이지 */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] font-bold text-[#ff416c] shrink-0">절멸기 충전:</span>
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-3 h-2 rounded-sm transition-all ${i <= (3 - cataclysmCount) ? 'bg-[#ff416c] shadow-sm shadow-[#ff416c]' : 'bg-[#2a1c35]'}`}
                      />
                    ))}
                  </div>
                  {cataclysmCount === 1 && (
                    <span className="text-[9px] text-[#ff416c] font-bold animate-pulse">⚠️ 다음 턴 소멸선 발동!</span>
                  )}
                </div>
              </div>
            </div>

            {/* 보스 HP 수치 및 거대 HP 프로그레스 바 */}
            <div className="mt-2 pt-2 border-t border-[#ff416c22]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] text-[#8b9bb4]">보스 잔여 체력</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#ffd54f]">
                    {battleHpPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#8b9bb4] font-mono">
                    ({bossHp.toLocaleString()} / {NEMESIS_BOSS_CONFIG.maxHp.toLocaleString()})
                  </span>
                </div>
              </div>
              {/* 거대 HP 프로그레스 바 */}
              <div className="w-full bg-[#1c132b] h-2.5 rounded-full overflow-hidden border border-[#ff416c33]">
                <div
                  className="h-full bg-gradient-to-r from-[#ce93d8] via-[#ff416c] to-[#ff007f] transition-all duration-300"
                  style={{ width: `${battleHpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 적군 피버 게이지 (보스 패널 바로 아래, 중앙 로그 위) */}
        <div className="px-3 pt-1 shrink-0">
          <FeverGaugeBar
            badges={bossFeverBadges}
            party={[{ id: 'nemesis_boss', name: NEMESIS_BOSS_CONFIG.name, currentHp: bossHp, maxHp: NEMESIS_BOSS_CONFIG.maxHp } as any]}
            label="NEMESIS FEVER"
            side="enemy"
          />
        </div>

        {/* 💥 실시간 대미지 미터기 (Live Damage Meter) */}
        <div className="px-3 pt-1.5 shrink-0">
          <div className="panel p-2.5 bg-[#0b101c] border border-[#00d2ff33]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#00d2ff] flex items-center gap-1">
                <span>💥</span>
                <span>이번 전투 가한 누적 피해:</span>
              </span>
              <span className="font-mono text-base font-bold text-[#ffd54f] tracking-wide animate-pulse">
                {totalBattleDmg.toLocaleString()} DMG
              </span>
            </div>

            {/* 영웅별 딜량 기여도 바 */}
            <div className="flex flex-col gap-1 mt-2">
              {heroes.map(hero => {
                const ratio = totalBattleDmg > 0 ? (hero.damageDealt / totalBattleDmg) * 100 : 0;
                return (
                  <div key={hero.id} className="flex items-center gap-2 text-[10px]">
                    <span className="w-14 truncate text-white font-bold">{hero.name}</span>
                    <div className="flex-1 bg-[#141b2b] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00d2ff] h-full" style={{ width: `${ratio}%` }} />
                    </div>
                    <span className="font-mono text-[#8b9bb4] shrink-0 w-20 text-right">
                      {hero.damageDealt.toLocaleString()} ({ratio.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 전투 상황 로그 */}
        <div className="flex-1 min-h-[60px] px-3 pt-2 overflow-y-auto font-mono text-[10px] space-y-1">
          {logs.slice(-6).map((l, i) => (
            <div key={i} className={`truncate ${l.type === 'warning' ? 'text-[#ff416c] font-bold' : l.type === 'hero_skill' ? 'text-[#00d2ff]' : l.type === 'boss_skill' ? 'text-[#ce93d8]' : 'text-[#8b9bb4]'}`}>
              {l.text}
            </div>
          ))}
        </div>

        {/* 아군 피버 게이지 (중앙 로그 아래, 아군 패널 바로 위) */}
        <div className="px-3 pb-1 shrink-0">
          <FeverGaugeBar
            badges={feverBadges}
            party={heroes.map(h => ({ id: h.id, name: h.name, currentHp: h.currentHp, maxHp: h.maxHp, classId: h.className } as any))}
            label="PLAYER FEVER"
            side="player"
          />
        </div>

        {/* 👑 리더 가호 칩 & 🤝 서포터 상태 칩 (3+1+1 덱 상태 바) */}
        <div className="px-3 py-1 flex items-center justify-between gap-2 shrink-0 bg-[#090d16] border-t border-[#1a2333]">
          {playerLeader ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#ffd54f15] border border-[#ffd54f44] text-[10px] min-w-0 flex-1 truncate">
              <span className="text-xs">👑</span>
              <span className="font-bold text-[#ffd54f] truncate">{playerLeader.name}</span>
              <span className="text-[9px] text-[#cfd8e8] truncate">
                ({playerLeaderBlessing?.name || '가호 발동'})
              </span>
            </div>
          ) : (
            <div className="text-[9px] text-[#8b9bb4]">리더 미편성</div>
          )}

          {playerSupporter ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#00d2ff15] border border-[#00d2ff44] text-[10px] min-w-0 flex-1 truncate justify-end">
              <span className="text-xs">🤝</span>
              <span className="font-bold text-[#00d2ff] truncate">{playerSupporter.name}</span>
              <span className={`text-[8.5px] font-mono px-1 rounded font-bold ${isPlayerSupporterJoined ? 'bg-[#38ef7d33] text-[#38ef7d]' : 'bg-[#1e2a40] text-[#8b9bb4]'}`}>
                {isPlayerSupporterJoined ? '참전 중' : '대기 중'}
              </span>
            </div>
          ) : (
            <div className="text-[9px] text-[#8b9bb4]">서포터 미편성</div>
          )}
        </div>

        {/* 하단 아군 3인 선발 카드 (3인 전투원) */}
        <div className="px-2 pb-2.5 pt-1 grid grid-cols-3 gap-1.5 shrink-0 bg-[#090d16] border-t border-[#1f283d]">
          {heroes.map(hero => {
            const hpPct = Math.max(0, (hero.currentHp / hero.maxHp) * 100);
            const mpPct = Math.max(0, (hero.currentMp / hero.maxMp) * 100);
            const isDead = hero.currentHp <= 0;

            return (
              <div
                key={hero.id}
                className={`panel p-1.5 flex flex-col justify-between transition-all rounded-xl ${isDead ? 'opacity-40 bg-[#16121a]' : 'bg-[#0f1523] border border-[#1e2a40]'}`}
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
                  시공의 틈새에서 무사히 철수하여 피해량을 기록했습니다.
                </p>
              </div>

              {settlement.isNewRecord && (
                <div className="px-3 py-1 rounded-full bg-[#ffd54f22] border border-[#ffd54f] text-[#ffd54f] text-xs font-bold flex items-center gap-1 animate-pulse">
                  👑 개인 단일 최고 피해량 신기록 달성!
                </div>
              )}

              {/* 딜량 및 획득 재화 */}
              <div className="w-full panel p-3 bg-[#0d1424] border border-[#1e2c45] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b9bb4]">가한 총 피해량:</span>
                  <span className="font-mono text-base font-bold text-[#ffd54f]">
                    {settlement.damage.toLocaleString()} DMG
                  </span>
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
            {cycleInfo.status === 'dormant' && (
              <span className="text-[10px] text-[#90a4ae] font-mono">
                🛡️ 영지 침식 및 약탈 비활성화
              </span>
            )}
          </div>

          {/* 보스 헤더 정보 (모바일에서도 '시공의 침식자, 네메시스' 이름이 온전히 표시되도록 가로 공간 확보) */}
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

          {/* 보스 체력 상태 바 및 수치 정보 (상하 분리 배치로 모바일 폭 부족 문제 완전 해결) */}
          <div className="mt-2.5 pt-2 border-t border-[#ff416c22]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[10px] text-[#8b9bb4]">보스 잔여 체력</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#ffd54f]">
                  {hpPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#8b9bb4] font-mono">
                  ({Math.round(nemesisState.currentBossHp).toLocaleString()} / {Math.round(nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp).toLocaleString()})
                </span>
              </div>
            </div>
            {/* 대형 보스 체력 프로그레스 바 */}
            <div className="w-full bg-[#1c132b] h-2.5 rounded-full overflow-hidden border border-[#ff416c44]">
              <div
                className="h-full bg-gradient-to-r from-[#ce93d8] via-[#ff416c] to-[#ff007f] transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 💀 6시간 주기 시공 침식 약탈 경고 & 1/24 저지 게이지 */}
      {cycleInfo.status === 'active' && (
        <div className="px-3 pt-2 w-full max-w-full shrink-0">
          <div className="panel p-2.5 rounded-xl border flex flex-col gap-1.5 bg-[#0f241d] border-[#38ef7d66]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1">
                <span>🛡️</span>
                <span className="text-[#38ef7d]">
                  6시간 침식 약탈 [휴무 중] (영지 자원 완전 보호)
                </span>
              </span>
              <span className="font-mono text-[11px] text-[#ffd54f]">
                다음 주기: ⏱️ {formatRemainingTimeStr(cycleInfo.nextPlunderRemainingMs)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#cfd8e8]">
              <span>6시간 저지 목표 (체력 1/24 삭감)</span>
              <span className="font-mono">
                {Math.round(cycleInfo.currentWindowDamage).toLocaleString()} / {Math.round(cycleInfo.requiredWindowDamage).toLocaleString()} DMG ({cycleInfo.windowProgressPct.toFixed(1)}%)
              </span>
            </div>

            {/* 저지 진행도 바 */}
            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full transition-all duration-500 bg-gradient-to-r from-[#38ef7d] to-[#00d2ff]"
                style={{ width: `${Math.min(100, Math.max(0, cycleInfo.windowProgressPct))}%` }}
              />
            </div>

            <div className="text-[9px] text-[#8b9bb4] flex items-center justify-between">
              <span>
                🛑 네메시스의 영지 자원 약탈은 현재 [휴무] 상태로 영지 자원이 100% 안전하게 보호됩니다.
              </span>
              <span className="text-[#38ef7d] shrink-0 font-bold">약탈 휴무</span>
            </div>
          </div>
        </div>
      )}

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

      {/* 네메시스 서브 탭: 출격 / 마일스톤 / 랭킹 */}
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
            {/* ⚠️ 5인 차원 부대 미편성 경고 배너 */}
            {(() => {
              const squadCheck = gm.isDimensionalSquadReady();
              const allHeroes = [...state.barracks, ...state.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
              if (!squadCheck.isReady) {
                return (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#2c1216] via-[#1f0f15] to-[#120d18] border border-[#ef535088] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl p-1.5 rounded-lg bg-black/40 border border-[#ef535044] shrink-0">⚠️</span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[#ff8a80] flex items-center gap-1.5 flex-wrap">
                          <span>차원 5인 부대 미편성</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 text-[#ffd54f] font-mono font-bold border border-[#ffd54f33]">
                            현재 {squadCheck.count}/5인 배치
                          </span>
                        </div>
                        <div className="text-[10px] text-[#cfd8dc] mt-0.5 leading-relaxed">
                          차원 네메시스 레이드는 5인 부대(선발 3인 + 리더 1인 + 서포터 1인)가 모두 편성되어야 출전할 수 있습니다.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {allHeroes.length >= 5 ? (
                        <button
                          className="btn btn-primary text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md shadow-[#00d2ff33]"
                          onClick={() => {
                            const ok = gm.autoAssignDimensionalDeck();
                            if (ok) {
                              SoundManager.getInstance().play('equip');
                            }
                          }}
                        >
                          <span>⚡</span>
                          <span>5인 자동 편성</span>
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

            {/* 차원 원정대 (3선발 + 1리더 + 1서포터) 출전 현황 */}
            <div className="panel p-2.5 bg-[#0b101c] border border-[#1f2b42]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>🛡️</span>
                  <span>출전 원정대 (3선발 + 1리더 + 1서포터)</span>
                </span>
                <span className="text-[10px] text-[#00d2ff] font-mono">
                  차원 덱 연동
                </span>
              </div>

              {(() => {
                const { mainHeroes, leaderHero, supporterHero } = gm.getDimensionalDeck();
                const displayMain = mainHeroes.slice(0, 3);
                return (
                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {/* 3선발 슬롯 */}
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

                    {/* 1리더 슬롯 */}
                    {leaderHero ? (() => {
                      const lCls = CHARACTER_CLASSES[leaderHero.classId];
                      return (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[#1f1910] border border-[#ffd54f66] flex flex-col items-center text-center min-w-0 relative">
                          <span className="text-[8px] font-bold text-[#ffd54f]">👑리더</span>
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
                        <span className="text-[9px] text-[#ffd54f88] mt-1 font-mono">리더 공석</span>
                      </div>
                    )}

                    {/* 1서포터 슬롯 */}
                    {supporterHero ? (() => {
                      const sCls = CHARACTER_CLASSES[supporterHero.classId];
                      return (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[#0c1824] border border-[#00d2ff66] flex flex-col items-center text-center min-w-0 relative">
                          <span className="text-[8px] font-bold text-[#00d2ff]">🤝서포터</span>
                          <div className="text-base sm:text-xl">{sCls?.skills[0]?.icon || '🛡️'}</div>
                          <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full mt-0.5" title={supporterHero.name}>
                            {supporterHero.name}
                          </span>
                          <span className="text-[8.5px] sm:text-[10px] text-[#80deea] truncate w-full">
                            {sCls?.name || supporterHero.classId}
                          </span>
                          <div className="text-[8px] text-[#00d2ff] mt-0.5 font-mono">
                            Lv.{supporterHero.level} 원호
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-1.5 sm:p-2 rounded-xl border border-dashed border-[#00d2ff44] bg-[#0c1420]/50 flex flex-col items-center justify-center text-center min-h-[72px]">
                        <span className="text-sm opacity-40">🤝</span>
                        <span className="text-[9px] text-[#00d2ff88] mt-1 font-mono">서포터 공석</span>
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
                <span>차원 네메시스 침식 & 약탈 규칙</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8b9bb4]">
                • <strong className="text-white">차원 앵커 연동 침공</strong>: 차원 앵커 게이트(Lv.3+)가 개방되어 활성화된 상태에서만 침식과 약탈이 발생합니다. 차원 앵커가 닫혀 있는 동안에는 네메시스 침공과 자원 약탈이 전면 중단되어 영지 자원이 100% 안전하게 보호됩니다.<br />
                • <strong className="text-white">6일 활동 & 1일 재소환 주기</strong>: 6일 동안 활동하며 완전 토벌 시 다음 7일차 재소환 주기까지 평화 상태가 유지됩니다.<br />
                • <strong className="text-white">6시간 주기 20% 약탈</strong>: 침공 활성화 중 6시간마다 네메시스 체력의 1/24({(Math.round(cycleInfo.requiredWindowDamage)).toLocaleString()} DMG) 이상을 깎지 못하면 영지 전 자원의 20%를 약탈당합니다.<br />
                • <strong className="text-white">체력 자연 회복</strong>: 네메시스는 활동 중 매 분마다 최대 체력의 0.05%(+{Math.round(cycleInfo.regenPerMinute).toLocaleString()} HP/분)를 지속 회복합니다.<br />
                • <strong className="text-white">최대 15턴 전투 & 마일스톤</strong>: 매 전투마다 피해량을 누적하여 마일스톤 장비와 대량의 인장을 수령하십시오.
              </p>
            </div>

            {/* 대형 출격 버튼 */}
            {(() => {
              const squadCheck = gm.isDimensionalSquadReady();
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
                      ? `⚠️ 차원 5인 부대 미편성 (출격 불가: ${squadCheck.count}/5인)`
                      : nemesisState.dailyAttempts > 0
                      ? '🌌 네메시스 토벌전 출격 (전투 시작)'
                      : '🔒 일일 도전 횟수 소진 (에테르 충전 필요)'
                  }
                  variant={canFight ? 'danger' : 'ghost'}
                  size="lg"
                  disabled={!isGateUnlocked || cycleInfo.status !== 'active' || nemesisState.dailyAttempts <= 0}
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

                      {/* 미달성 시 프로그레스 바 */}
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
