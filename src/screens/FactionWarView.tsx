import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameManager } from '../hooks/useGameManager';
import { useIsMobile } from '../hooks/useIsMobile';
import { SoundManager } from '../managers/SoundManager';
import { FirebaseService } from '../services/FirebaseService';
import { gameAlert, gameConfirm } from '../services/DialogService';
import { Modal } from '../components/Modal';
import {
  FactionId,
  StrongholdId,
  FACTIONS,
  FACTION_WAR_NODES,
  FACTION_WAR_GATES,
  CONSTELLATION_SHOP_ITEMS,
  FactionWarState,
  createInitialFactionWarState,
  canFactionAccessAkashicCore,
  hasBridgeheadForNode,
  canJoinFaction,
  GarrisonSquadEntry,
  FactionWarNodeRuntimeState,
  MarchingOrder,
} from '../data/factionWar';
import { CHARACTER_CLASSES } from '../data/classes';

const STORAGE_KEY = 'limbo_faction_war_state_v1';

export const FactionWarView: React.FC = () => {
  const { gm, state } = useGameManager();
  const isMobile = useIsMobile();

  const [warState, setWarState] = useState<FactionWarState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.nodes && parsed.gates) {
          return {
            ...createInitialFactionWarState(),
            ...parsed,
          };
        }
      }
    } catch {}
    return createInitialFactionWarState();
  });

  const [selectedNodeId, setSelectedNodeId] = useState<StrongholdId | null>('node_core');
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isBigMapModalOpen, setIsBigMapModalOpen] = useState(false);
  const [selectedSquadHeroIds, setSelectedSquadHeroIds] = useState<string[]>(() => warState.dispatchedSquadIds || []);
  const [, setTimerTick] = useState(0);

  // ── 📐 대형 모달 전술 지도 반응형 가로세로 비율(1376:768) 정밀 측정 ──
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const [modalMapSize, setModalMapSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isBigMapModalOpen) return;

    const el = mapViewportRef.current;
    if (!el) return;

    const computeFitSize = () => {
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (!availW || !availH) return;

      const MAP_RATIO = 1376 / 768; // ~1.7916667
      const availRatio = availW / availH;

      let targetW: number;
      let targetH: number;

      if (availRatio > MAP_RATIO) {
        // 가로가 더 넓음 -> 가용 높이에 맞추고 가로를 비율 계산 (좌우 레터박스)
        targetH = Math.floor(availH);
        targetW = Math.floor(targetH * MAP_RATIO);
      } else {
        // 세로가 더 길쭉하거나 좁음 -> 가용 너비에 맞추고 세로를 비율 계산 (상하 레터박스)
        targetW = Math.floor(availW);
        targetH = Math.floor(targetW / MAP_RATIO);
      }

      setModalMapSize({ width: targetW, height: targetH });
    };

    // 즉시 1회 계산 후 다음 프레임에서도 레이아웃 안정화 재계산
    computeFitSize();
    const rafId = requestAnimationFrame(computeFitSize);

    const ro = new ResizeObserver(() => {
      computeFitSize();
    });
    ro.observe(el);

    window.addEventListener('resize', computeFitSize);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', computeFitSize);
    };
  }, [isBigMapModalOpen]);

  // ⌨️ Esc 키 입력 시 대형 지도 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBigMapModalOpen) {
        setIsBigMapModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBigMapModalOpen]);

  // 1초 단위 타이머 (1시간 원정 및 24시간 수성 타이머 갱신)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 상태 변경 시 로컬 스토리지 자동 저장 및 전역 월드 버프 동기화용 이벤트 발행
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(warState));
      gm.emit('update');
    } catch {}
  }, [warState, gm]);

  const myFaction: FactionId = warState.playerFaction || 'dawn';
  const myFactionMeta = FACTIONS[myFaction];

  // ⚔️ 시즌 3인 결사대 차출 정보 및 총 전투력 산출
  const mySquadInfo = useMemo(() => {
    const allHeroes = [...(state.party || []), ...(state.barracks || [])];
    const dispatched = (warState.dispatchedSquadIds || [])
      .map(id => allHeroes.find(h => h && h.id === id))
      .filter(Boolean) as typeof allHeroes;

    // 만약 차출 부대가 아직 등록되지 않았다면 대표 3인으로 임시 fallback
    const effectiveHeroes = dispatched.length === 3 ? dispatched : allHeroes.slice(0, 3);
    const totalCp = effectiveHeroes.reduce((sum, h) => {
      let atk = h.stats?.atk || 0;
      let def = h.stats?.def || 0;
      let maxHp = h.maxHp || 0;
      let spd = h.stats?.spd || 0;
      let luck = h.stats?.luck || 0;
      if (h.equipment) {
        Object.values(h.equipment).forEach((eq) => {
          if (!eq?.stats) return;
          atk += eq.stats.atk || 0;
          def += eq.stats.def || 0;
          maxHp += eq.stats.hp || 0;
          spd += eq.stats.spd || 0;
          luck += eq.stats.luck || 0;
        });
      }
      const cp = Math.floor(
        atk * 2.5 +
        def * 2.0 +
        maxHp * 0.35 +
        spd * 3.0 +
        luck * 2.5
      );
      return sum + cp;
    }, 0);
    return {
      heroes: effectiveHeroes,
      isFullyDispatched: dispatched.length === 3,
      totalCp: Math.max(12000, totalCp),
    };
  }, [warState.dispatchedSquadIds, state.party, state.barracks]);

  // 우리 진영의 교두보(인접 2거점 연결) 상태 확인
  const bridgeheadStatus = useMemo(() => {
    return canFactionAccessAkashicCore(myFaction, warState.nodes);
  }, [myFaction, warState.nodes]);

  // 우리 진영이 현재 보유한 거점 목록 및 활성화된 월드 버프 목록
  const ownedNodesByFaction = useMemo(() => {
    const counts: Record<FactionId, StrongholdId[]> = { dawn: [], arcana: [], iron: [] };
    (Object.keys(warState.nodes) as StrongholdId[]).forEach((nId) => {
      const nDef = FACTION_WAR_NODES[nId];
      if (nDef?.isHq) return;
      const owner = warState.nodes[nId]?.ownerFaction;
      if (owner) counts[owner].push(nId);
    });
    return counts;
  }, [warState.nodes]);

  const appendWarLog = useCallback((text: string, faction?: FactionId, isSystem = false) => {
    setWarState((prev) => ({
      ...prev,
      battleLogs: [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          text,
          faction,
          isSystem,
        },
        ...prev.battleLogs,
      ].slice(0, 40),
    }));
  }, []);

  // 특정 거점으로 이어지는 관문 중 우리 진영이 개방 가능한지 또는 이미 개방했는지 확인
  const isGateUnlockedToAttack = useCallback(
    (gateId: string): { unlocked: boolean; reason?: string } => {
      const gateDef = FACTION_WAR_GATES[gateId];
      if (!gateDef) return { unlocked: false, reason: '관문 정보 없음' };

      // 1. 본진 출진 관문 (9곳): 해당 진영 본진에서 출발하는 관문만 공략 가능
      if (gateDef.lineCategory === 'dawn_outpost') {
        if (myFaction !== 'dawn') return { unlocked: false, reason: '창백한 여명회 전용 본진 출진 관문입니다.' };
        return { unlocked: true };
      }
      if (gateDef.lineCategory === 'arcana_outpost') {
        if (myFaction !== 'arcana') return { unlocked: false, reason: '심연 마도 학회 전용 본진 출진 관문입니다.' };
        return { unlocked: true };
      }
      if (gateDef.lineCategory === 'iron_outpost') {
        if (myFaction !== 'iron') return { unlocked: false, reason: '강철 방주 연맹 전용 본진 출진 관문입니다.' };
        return { unlocked: true };
      }

      // 2. 에메랄드 내곽 순환 관문 (6곳): 양 끝 내곽 거점 중 최소 1곳을 우리 진영이 점령 중이어야 개척 가능
      if (gateDef.lineCategory === 'emerald_ring') {
        const fromOwned = warState.nodes[gateDef.fromNodeId]?.ownerFaction === myFaction;
        const toOwned = warState.nodes[gateDef.toNodeId]?.ownerFaction === myFaction;
        if (!fromOwned && !toOwned) {
          return {
            unlocked: false,
            reason: `인접 거점([${FACTION_WAR_NODES[gateDef.fromNodeId].name}] 또는 [${FACTION_WAR_NODES[gateDef.toNodeId].name}]) 중 최소 1곳을 먼저 점령해야 진입할 수 있습니다.`,
          };
        }
        return { unlocked: true };
      }

      // 3. 진홍빛 아카식 왕관 수호 성문 (6곳): 출발 내곽 거점이 '인접 2거점 교두보' 조건을 만족해야 해금!
      if (gateDef.lineCategory === 'crimson_core') {
        const fromNodeId = gateDef.fromNodeId;
        const fromNodeName = FACTION_WAR_NODES[fromNodeId].name;
        const hasBridgehead = hasBridgeheadForNode(fromNodeId, myFaction, warState.nodes);
        if (!hasBridgehead) {
          return {
            unlocked: false,
            reason: `🔒 [교두보 조건 미달] [${fromNodeName}] 거점과 인접한 내곽 주요 거점 1곳을 추가로 확보(총 2거점 연속 점령)해야만 왕관 수호 성문에 접근할 수 있습니다!`,
          };
        }
        return { unlocked: true };
      }

      return { unlocked: true };
    },
    [myFaction, warState.nodes]
  );

  // 특정 주요 거점을 우리 진영이 공성할 수 있는지 확인 (연결된 관문 중 최소 1곳이 개방되어 있어야 함)
  const canAttackStronghold = useCallback(
    (nodeId: StrongholdId): { canAttack: boolean; reason?: string } => {
      const nDef = FACTION_WAR_NODES[nodeId];
      if (!nDef) return { canAttack: false, reason: '거점 정보 없음' };
      if (nDef.isHq) return { canAttack: false, reason: '진영 본진(불침 성채)은 공격할 수 없습니다.' };

      // 아카식 크라운 코어인 경우: 인접 2거점 교두보 조건 + 해당 진홍 관문 돌파 여부 확인
      if (nodeId === 'node_core') {
        if (!bridgeheadStatus.canAccess) {
          return {
            canAttack: false,
            reason: '🔒 [교두보 법칙] 아카식 크라운 코어에 접근하려면 인접한 내곽 주요 거점 2곳 이상을 동시에 점령해야 합니다!',
          };
        }
        const hasClearedCoreGate = bridgeheadStatus.activeBridgeheadNodes.some((innerId) => {
          const coreGateId = `gate_core_${innerId.replace('node_', '')}`;
          return warState.gates[coreGateId]?.clearedBy[myFaction];
        });
        if (!hasClearedCoreGate) {
          return {
            canAttack: false,
            reason: '⛩️ 교두보 거점에서 이어지는 [진홍빛 왕관 수호 성문 (PvE)]을 먼저 돌파해야 크라운 코어를 타격할 수 있습니다!',
          };
        }
        return { canAttack: true };
      }

      // 일반 내곽 거점(6곳): 연결된 관문 중 우리 진영이 돌파 완료(clearedBy[myFaction] === true)한 관문이 최소 1개 있어야 함
      const anyConnectedGateCleared = nDef.connectedGateIds.some((gId) => {
        const gDef = FACTION_WAR_GATES[gId];
        if (!gDef || gDef.lineCategory === 'crimson_core') return false;
        return warState.gates[gId]?.clearedBy[myFaction];
      });

      if (!anyConnectedGateCleared) {
        return {
          canAttack: false,
          reason: `⛩️ [${nDef.name}] 거점으로 이어지는 중간 [PvE 차원 수호 관문]을 먼저 돌파해 보급선을 개척해야 합니다!`,
        };
      }

      return { canAttack: true };
    },
    [myFaction, warState.gates, bridgeheadStatus]
  );

  // ⛩️ PvE 차원 수호 관문 토벌 실행 (1시간 원정 진격 시스템 반영)
  const handleAttackGate = async (gateId: string) => {
    const gateDef = FACTION_WAR_GATES[gateId];
    const gateState = warState.gates[gateId];
    if (!gateDef || !gateState) return;

    if (warState.currentWeek === 1) {
      await gameAlert({
        title: '🔒 1주차 배치 기간',
        message: '1주차는 팩션 가입 및 3인 부대 차출 기간입니다. 거점/관문 진격은 2주차부터 개시됩니다.',
        icon: '📅',
        tone: 'warning',
      });
      return;
    }

    if (warState.currentWeek === 4) {
      await gameAlert({
        title: '🔒 4주차 시즌 아웃',
        message: '4주차는 시즌이 종료되어 전장이 동결되었습니다. 거점 및 크라운 점령 버프만 유지됩니다.',
        icon: '❄️',
        tone: 'warning',
      });
      return;
    }

    if (!mySquadInfo.isFullyDispatched) {
      await gameAlert({
        title: '⚠️ 3인 결사대 미편성',
        message: '전쟁에 출전할 3인 전담 결사대가 편성되지 않았습니다. 상단 [3인 결사대] 버튼을 눌러 부대를 차출해 주세요.',
        icon: '⚔️',
        tone: 'danger',
      });
      setIsDispatchModalOpen(true);
      return;
    }

    if (warState.marchingOrder) {
      const remainingSec = Math.max(0, Math.ceil((warState.marchingOrder.arrivesAt - Date.now()) / 1000));
      if (remainingSec > 0) {
        await gameAlert({
          title: '⏳ 원정 부대 행군 중',
          message: `현재 [${warState.marchingOrder.targetName}]으로 3인 결사대가 진격 중입니다. (남은 시간: ${Math.floor(remainingSec / 60)}분 ${remainingSec % 60}초)`,
          icon: '⏳',
          tone: 'warning',
        });
        return;
      }
    }

    const unlockCheck = isGateUnlockedToAttack(gateId);
    if (!unlockCheck.unlocked) {
      await gameAlert({
        title: '🔒 관문 접근 불가',
        message: unlockCheck.reason || '보급선이 연결되지 않았습니다.',
        icon: '⛩️',
        tone: 'warning',
      });
      return;
    }

    if (gateState.clearedBy[myFaction]) {
      await gameAlert({
        title: '✅ 이미 개방된 관문',
        message: `[${gateDef.name}]은(는) 이미 우리 진영이 수호병을 모두 토벌하여 진격로가 열려 있습니다!`,
        icon: '⛩️',
        tone: 'primary',
      });
      return;
    }

    if (warState.siegeTokens <= 0) {
      await gameAlert({
        title: '⚡ 작전권 부족',
        message: '남은 공성 작전권이 없습니다. 상단 [작전권 보충] 버튼을 이용해 충전해 주세요.',
        icon: '⚠️',
        tone: 'danger',
      });
      return;
    }

    SoundManager.getInstance().play('slash');

    // 1시간 원정 명령 등록 (비동기 진격)
    const order: MarchingOrder = {
      id: `march_${Date.now()}`,
      targetType: 'gate',
      targetId: gateId,
      targetName: gateDef.name,
      startedAt: Date.now(),
      arrivesAt: Date.now() + 3600 * 1000, // 1시간
      heroes: mySquadInfo.heroes.map(h => ({
        id: h.id,
        name: h.name,
        classId: h.classId,
        level: h.level,
        cp: 4000,
        icon: h.portraitPromptKey || '⚔️',
      })),
    };

    setWarState((prev) => ({
      ...prev,
      siegeTokens: Math.max(0, prev.siegeTokens - 1),
      marchingOrder: order,
    }));

    const commanderNick = FirebaseService.getInstance().getCommanderCallsign();
    appendWarLog(
      `🚩 [${commanderNick}]님이 3인 결사대를 이끌고 [${gateDef.name}]을(를) 향해 1시간 공성 원정 진격을 개시했습니다! (작전권 1 소모)`,
      myFaction
    );

    await gameAlert({
      title: '⏳ 1시간 공성 원정 출격!',
      message: `[${gateDef.name}]을(를) 향해 3인 결사대가 진격을 시작했습니다!\n\n• 소요 시간: 1시간 (60분)\n• 작전 완료 시 방주 영지(Citadel) 화면에 [🔴 알림 뱃지]가 표시됩니다.`,
      icon: '🚩',
      tone: 'primary',
    });
  };

  // ⚔️ 적/중립 주요 거점 공성 강습 (1시간 원정 진격 시스템 반영)
  const handleSiegeStronghold = async (nodeId: StrongholdId) => {
    const nDef = FACTION_WAR_NODES[nodeId];
    const nState = warState.nodes[nodeId];
    if (!nDef || !nState || nDef.isHq) return;

    if (warState.currentWeek === 1) {
      await gameAlert({
        title: '🔒 1주차 배치 기간',
        message: '1주차는 팩션 가입 및 3인 부대 차출 기간입니다. 거점 공성은 2주차부터 개시됩니다.',
        icon: '📅',
        tone: 'warning',
      });
      return;
    }

    if (warState.currentWeek === 4) {
      await gameAlert({
        title: '🔒 4주차 시즌 아웃',
        message: '4주차는 시즌이 종료되어 전장이 동결되었습니다. 거점 및 크라운 점령 버프만 유지됩니다.',
        icon: '❄️',
        tone: 'warning',
      });
      return;
    }

    if (nodeId === 'node_core' && warState.currentWeek < 3) {
      await gameAlert({
        title: '🔒 아카식 크라운 봉인',
        message: '아카식 크라운 코어는 1~2주차 동안 접근할 수 없습니다. 3주차 [최후의 결전] 개막과 함께 진입로가 개방됩니다!',
        icon: '👑',
        tone: 'warning',
      });
      return;
    }

    if (!mySquadInfo.isFullyDispatched) {
      await gameAlert({
        title: '⚠️ 3인 결사대 미편성',
        message: '전쟁에 출전할 3인 전담 결사대가 편성되지 않았습니다. 상단 [3인 결사대] 버튼을 눌러 부대를 차출해 주세요.',
        icon: '⚔️',
        tone: 'danger',
      });
      setIsDispatchModalOpen(true);
      return;
    }

    if (warState.marchingOrder) {
      const remainingSec = Math.max(0, Math.ceil((warState.marchingOrder.arrivesAt - Date.now()) / 1000));
      if (remainingSec > 0) {
        await gameAlert({
          title: '⏳ 원정 부대 행군 중',
          message: `현재 [${warState.marchingOrder.targetName}]으로 3인 결사대가 진격 중입니다. (남은 시간: ${Math.floor(remainingSec / 60)}분 ${remainingSec % 60}초)`,
          icon: '⏳',
          tone: 'warning',
        });
        return;
      }
    }

    if (nState.ownerFaction === myFaction) {
      await gameAlert({
        title: '☀️ 아군 점령 거점',
        message: `[${nDef.name}]은(는) 이미 우리 진영(${myFactionMeta.name})이 점령 중입니다! 수비 분대를 주둔시켜 방어를 굳히세요.`,
        icon: '🛡️',
        tone: 'primary',
      });
      return;
    }

    const attackCheck = canAttackStronghold(nodeId);
    if (!attackCheck.canAttack) {
      await gameAlert({
        title: '🔒 거점 공성 조건 미달',
        message: attackCheck.reason || '인접 관문을 먼저 개방해야 합니다.',
        icon: '⚠️',
        tone: 'danger',
      });
      return;
    }

    if (warState.siegeTokens <= 0) {
      await gameAlert({
        title: '⚡ 작전권 부족',
        message: '남은 공성 작전권이 없습니다. 상단 [작전권 보충] 버튼을 이용해 충전해 주세요.',
        icon: '⚠️',
        tone: 'danger',
      });
      return;
    }

    SoundManager.getInstance().play('heavy_hit');

    // 1시간 원정 명령 등록
    const order: MarchingOrder = {
      id: `march_${Date.now()}`,
      targetType: 'node',
      targetId: nodeId,
      targetName: nDef.name,
      startedAt: Date.now(),
      arrivesAt: Date.now() + 3600 * 1000, // 1시간
      heroes: mySquadInfo.heroes.map(h => ({
        id: h.id,
        name: h.name,
        classId: h.classId,
        level: h.level,
        cp: 4000,
        icon: h.portraitPromptKey || '⚔️',
      })),
    };

    setWarState((prev) => ({
      ...prev,
      siegeTokens: Math.max(0, prev.siegeTokens - 1),
      marchingOrder: order,
    }));

    const commanderNick = FirebaseService.getInstance().getCommanderCallsign();
    appendWarLog(
      `🚩 [${commanderNick}]님이 3인 결사대를 이끌고 [${nDef.name}] 거점을 향해 1시간 공성 원정 진격을 개시했습니다! (작전권 1 소모)`,
      myFaction
    );

    await gameAlert({
      title: '⏳ 1시간 공성 원정 출격!',
      message: `[${nDef.name}]을(를) 향해 3인 결사대가 진격을 시작했습니다!\n\n• 소요 시간: 1시간 (60분)\n• 공성 성공 시 자동으로 거점에 주둔을 시도하며, 주둔 슬롯 부족 또는 패배 시 본진으로 복귀합니다.\n• 1시간 후 방주 영지(Citadel) 화면에 [🔴 알림 뱃지]가 표시됩니다.`,
      icon: '🚩',
      tone: 'primary',
    });
  };

  // ⚡ 1시간 원정 즉시 완료 (마스터 테스트 또는 1시간 도래 시 해결 함수)
  const handleResolveMarchingOrder = async (isInstantMaster = false) => {
    const order = warState.marchingOrder;
    if (!order) return;

    if (!isInstantMaster && Date.now() < order.arrivesAt) {
      const leftSec = Math.ceil((order.arrivesAt - Date.now()) / 1000);
      await gameAlert({
        title: '⏳ 원정 진행 중',
        message: `아직 원정 부대가 목표 지점에 도착하지 않았습니다. (남은 시간: ${Math.floor(leftSec / 60)}분 ${leftSec % 60}초)`,
        icon: '⏳',
        tone: 'warning',
      });
      return;
    }

    SoundManager.getInstance().play('forge_success');
    const commanderNick = FirebaseService.getInstance().getCommanderCallsign();

    if (order.targetType === 'gate') {
      const gateDef = FACTION_WAR_GATES[order.targetId];
      if (!gateDef) return;

      const damage = Math.round(1500 * Math.max(0.8, mySquadInfo.totalCp / gateDef.recommendedCp));
      const curHp = warState.gates[order.targetId]?.hpByFaction[myFaction] ?? gateDef.maxHp;
      const nextHp = Math.max(0, curHp - damage);
      const isCleared = nextHp === 0;
      const sealReward = isCleared ? 200 : 90;

      setWarState((prev) => {
        const prevGate = prev.gates[order.targetId];
        return {
          ...prev,
          marchingOrder: null,
          constellationSeals: prev.constellationSeals + sealReward,
          personalContribution: prev.personalContribution + (isCleared ? 150 : 60),
          scores: {
            ...prev.scores,
            [myFaction]: prev.scores[myFaction] + (isCleared ? 50 : 20),
          },
          gates: {
            ...prev.gates,
            [order.targetId]: {
              ...prevGate,
              hpByFaction: {
                ...prevGate.hpByFaction,
                [myFaction]: nextHp,
              },
              clearedBy: {
                ...prevGate.clearedBy,
                [myFaction]: isCleared,
              },
            },
          },
        };
      });

      appendWarLog(
        isCleared
          ? `⛩️✨ 1시간 원정 완료! [${commanderNick}]님의 3인 결사대가 [${gateDef.name}]을 완전히 돌파하고 진격로를 확보했습니다!`
          : `⚔️ 1시간 원정 완료! [${commanderNick}]님의 3인 결사대가 [${gateDef.name}] 수호병에게 ${damage.toLocaleString()} 피해를 입히고 본진으로 복귀했습니다.`,
        myFaction,
        isCleared
      );

      await gameAlert({
        title: isCleared ? '🎉 관문 돌파 성공!' : '⚔️ 관문 원정 완료',
        message: isCleared
          ? `[${gateDef.name}]의 수호병을 완전히 격파하고 진격로를 개방했습니다!\n\n• 획득 보상: 🎖️ 성좌의 인장 +${sealReward}`
          : `수호병에게 ${damage.toLocaleString()} 피해를 입혔습니다. 관문이 아직 열리지 않아 부대는 본진으로 회군했습니다.`,
        icon: '⛩️',
        tone: 'primary',
      });
    } else {
      // 거점 공성 결과 해결
      const nDef = FACTION_WAR_NODES[order.targetId as StrongholdId];
      const nState = warState.nodes[order.targetId as StrongholdId];
      if (!nDef || !nState) return;

      const damage = Math.round(1600 * Math.max(0.8, mySquadInfo.totalCp / 15000));
      const nextHp = Math.max(0, nState.hp - damage);
      const isCaptured = nextHp === 0;
      const sealReward = isCaptured ? 400 : 150;

      const leader = mySquadInfo.heroes[0];
      const myUid = FirebaseService.getInstance().getCurrentUser()?.uid || 'master_commander';
      const canGarrison = isCaptured && nState.garrisons.length < nDef.maxGarrisons;

      const newGarrison: GarrisonSquadEntry | null = canGarrison ? {
        id: `gar_${Date.now()}`,
        commanderUid: myUid,
        commanderName: commanderNick,
        faction: myFaction,
        combatPower: mySquadInfo.totalCp,
        fatigue: 0,
        defendWins: 0,
        deployedAt: Date.now(),
        leaderClassId: leader?.classId || 'paladin',
        leaderName: leader?.name || '결사대 선봉장',
      } : null;

      // 👑 아카식 크라운 코어인 경우 24시간 수성 타이머 세팅
      const isCore = order.targetId === 'node_core';

      setWarState((prev) => {
        const curNode = prev.nodes[order.targetId as StrongholdId];
        return {
          ...prev,
          marchingOrder: null,
          coreHoldStartedAt: isCaptured && isCore ? Date.now() : prev.coreHoldStartedAt,
          coreHegemonyActive: isCaptured && isCore ? false : prev.coreHegemonyActive,
          constellationSeals: prev.constellationSeals + sealReward,
          personalContribution: prev.personalContribution + (isCaptured ? 300 : 100),
          scores: {
            ...prev.scores,
            [myFaction]: prev.scores[myFaction] + (isCaptured ? 200 : 40),
          },
          nodes: {
            ...prev.nodes,
            [order.targetId as StrongholdId]: {
              ...curNode,
              ownerFaction: isCaptured ? myFaction : curNode.ownerFaction,
              hp: isCaptured ? nDef.maxHp : nextHp,
              shieldUntil: isCaptured ? Date.now() + 30 * 60 * 1000 : curNode.shieldUntil,
              lastCapturedBy: isCaptured ? commanderNick : curNode.lastCapturedBy,
              garrisons: isCaptured && newGarrison ? [newGarrison] : isCaptured ? [] : curNode.garrisons,
            },
          },
        };
      });

      appendWarLog(
        isCaptured
          ? `👑✨ 1시간 원정 성공! [${commanderNick}]님이 [${nDef.name}] 거점을 함락시키고 ${canGarrison ? '성벽에 주둔했습니다!' : '본진으로 회군했습니다.'}`
          : `⚔️ 1시간 원정 완료! [${commanderNick}]님이 [${nDef.name}] 성벽을 타격하고 본진으로 복귀했습니다. (잔여: ${nextHp.toLocaleString()} HP)`,
        myFaction,
        isCaptured
      );

      await gameAlert({
        title: isCaptured ? `👑 [${nDef.name}] 거점 함락 성공!` : '⚔️ 거점 공성 보고',
        message: isCaptured
          ? `[${myFactionMeta.name}]의 깃발이 [${nDef.name}] 정상에 꽂혔습니다!\n\n• 발동 월드 버프: ${nDef.buffTitle}\n• 부대 주둔: ${canGarrison ? '성벽 수비대로 주둔 완료' : '슬롯 포화로 본진 복귀'}\n• 획득 보상: 🎖️ 성좌의 인장 +${sealReward}${isCore ? '\n• 👑 아카식 크라운 24시간 수성 카운트다운이 시작되었습니다!' : ''}`
          : `성벽에 ${damage.toLocaleString()} 피해를 가했습니다. 거점이 아직 함락되지 않아 3인 부대는 본진으로 안전하게 복귀했습니다.`,
        icon: nDef.icon,
        tone: 'primary',
      });
    }
  };

  // 🛡️ 아군 점령 거점에 내 3인 결사대를 수비 분대로 주둔 (+100 성좌의 인장)
  const GARRISON_SEAL_REWARD = 100;
  const handleDeployGarrison = async (nodeId: StrongholdId) => {
    const nDef = FACTION_WAR_NODES[nodeId];
    const nState = warState.nodes[nodeId];
    if (!nDef || !nState || nDef.isHq) return;

    if (nState.ownerFaction !== myFaction) {
      await gameAlert({
        title: '⚠️ 주둔 불가',
        message: `[${nDef.name}]은(는) 우리 진영의 거점이 아닙니다. 먼저 공성으로 거점을 함락시켜야 합니다.`,
        icon: '🛡️',
        tone: 'warning',
      });
      return;
    }

    if (warState.currentWeek === 4) {
      await gameAlert({
        title: '🔒 4주차 시즌 아웃',
        message: '4주차는 시즌이 종료되어 전장이 동결되었습니다. 새 수비 분대를 주둔시킬 수 없습니다.',
        icon: '❄️',
        tone: 'warning',
      });
      return;
    }

    if (!mySquadInfo.isFullyDispatched) {
      await gameAlert({
        title: '⚠️ 3인 결사대 미편성',
        message: '주둔시킬 3인 전담 결사대가 편성되지 않았습니다. 상단 [3인 결사대] 버튼을 눌러 부대를 차출해 주세요.',
        icon: '⚔️',
        tone: 'danger',
      });
      setIsDispatchModalOpen(true);
      return;
    }

    if (warState.marchingOrder && warState.marchingOrder.arrivesAt > Date.now()) {
      const remainingSec = Math.ceil((warState.marchingOrder.arrivesAt - Date.now()) / 1000);
      await gameAlert({
        title: '⏳ 원정 부대 행군 중',
        message: `3인 결사대가 [${warState.marchingOrder.targetName}]으로 진격 중이라 주둔할 수 없습니다. (남은 시간: ${Math.floor(remainingSec / 60)}분 ${remainingSec % 60}초)`,
        icon: '⏳',
        tone: 'warning',
      });
      return;
    }

    const myUid = FirebaseService.getInstance().getCurrentUser()?.uid || 'master_commander';
    const alreadyStationed = (Object.values(warState.nodes) as FactionWarNodeRuntimeState[]).find((n) =>
      n.garrisons.some((g) => g.commanderUid === myUid)
    );
    if (alreadyStationed) {
      const stationedName = FACTION_WAR_NODES[alreadyStationed.id]?.name || alreadyStationed.id;
      await gameAlert({
        title: '🛡️ 이미 주둔 중',
        message: `내 결사대는 이미 [${stationedName}]에 주둔하고 있습니다. 한 번에 한 거점에만 주둔할 수 있습니다.`,
        icon: '🛡️',
        tone: 'warning',
      });
      return;
    }

    if (nState.garrisons.length >= nDef.maxGarrisons) {
      await gameAlert({
        title: '🛡️ 주둔 슬롯 포화',
        message: `[${nDef.name}]의 수비 분대 슬롯(${nDef.maxGarrisons})이 모두 찼습니다.`,
        icon: '🛡️',
        tone: 'warning',
      });
      return;
    }

    SoundManager.getInstance().play('forge_success');
    const commanderNick = FirebaseService.getInstance().getCommanderCallsign();
    const leader = mySquadInfo.heroes[0];
    const newGarrison: GarrisonSquadEntry = {
      id: `gar_${Date.now()}`,
      commanderUid: myUid,
      commanderName: commanderNick,
      faction: myFaction,
      combatPower: mySquadInfo.totalCp,
      fatigue: 0,
      defendWins: 0,
      deployedAt: Date.now(),
      leaderClassId: leader?.classId || 'paladin',
      leaderName: leader?.name || '결사대 선봉장',
    };

    setWarState((prev) => {
      const curNode = prev.nodes[nodeId];
      return {
        ...prev,
        constellationSeals: prev.constellationSeals + GARRISON_SEAL_REWARD,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...curNode,
            garrisons: [...curNode.garrisons, newGarrison],
          },
        },
      };
    });

    appendWarLog(`🛡️ [${commanderNick}]님의 3인 결사대가 [${nDef.name}] 성벽에 수비 분대로 주둔했습니다.`, myFaction);

    await gameAlert({
      title: '🛡️ 수비 분대 주둔 완료',
      message: `[${nDef.name}]에 수비 분대를 주둔시켰습니다.\n\n• 획득 보상: 🎖️ 성좌의 인장 +${GARRISON_SEAL_REWARD}`,
      icon: nDef.icon,
      tone: 'primary',
    });
  };

  // 🎖️ 성좌 군수 상점 아이템 구매
  const handleBuyShopItem = async (itemId: string) => {
    const item = CONSTELLATION_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    if (warState.constellationSeals < item.costSeals) {
      await gameAlert({
        title: '🎖️ 성좌의 인장 부족',
        message: `[${item.name}] 교환에 필요한 성좌의 인장이 부족합니다. (보유: ${warState.constellationSeals.toLocaleString()} / 필요: ${item.costSeals.toLocaleString()})`,
        icon: '⚠️',
        tone: 'danger',
      });
      return;
    }

    SoundManager.getInstance().play('item_upgrade');

    setWarState((prev) => ({
      ...prev,
      constellationSeals: prev.constellationSeals - item.costSeals,
      awakeningProtectionShards:
        item.rewardType === 'protection_shard'
          ? prev.awakeningProtectionShards + item.amount
          : prev.awakeningProtectionShards,
    }));

    if (item.rewardType === 'pure_prefix') {
      gm.modifyResource('pure_prefix_stone', item.amount);
    } else if (item.rewardType === 'pure_suffix') {
      gm.modifyResource('pure_suffix_stone', item.amount);
    } else if (item.rewardType === 'void_shard') {
      gm.modifyResource('void_shard', item.amount);
    } else if (item.rewardType === 'ether') {
      gm.modifyResource('ether', item.amount);
    }
    gm.saveGame();

    await gameAlert({
      title: '🎁 군수 물자 교환 완료',
      message: `[${item.icon} ${item.name}] 교환이 완료되었습니다!`,
      icon: item.icon,
      tone: 'primary',
    });
  };

  // 현재 선택된 거점 또는 관문 상세 정보
  const selectedNodeDef = selectedNodeId ? FACTION_WAR_NODES[selectedNodeId] : null;
  const selectedNodeState = selectedNodeId ? warState.nodes[selectedNodeId] : null;
  const selectedGateDef = selectedGateId ? FACTION_WAR_GATES[selectedGateId] : null;
  const selectedGateState = selectedGateId ? warState.gates[selectedGateId] : null;

  // ── 🗺️ 인터랙티브 성좌 전술 지도 렌더러 (인라인 축소 뷰 & 대형 모달 확대 뷰 공용) ──
  const renderStarMapCore = (isExpandedModal: boolean) => {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden border-2 border-[#c8aa6e88] shadow-[0_8px_32px_rgba(0,0,0,0.9)] bg-[#07090f] select-none ${
          isExpandedModal
            ? 'mx-auto shrink-0 transition-all duration-100 ease-out'
            : 'w-full aspect-[1376/768]'
        }`}
        style={
          isExpandedModal && modalMapSize
            ? {
                width: `${modalMapSize.width}px`,
                height: `${modalMapSize.height}px`,
                maxWidth: '100%',
                maxHeight: '100%',
              }
            : isExpandedModal
            ? {
                width: '100%',
                aspectRatio: '1376 / 768',
                maxWidth: '100%',
                maxHeight: '100%',
              }
            : {
                aspectRatio: '1376 / 768',
              }
        }
      >
        <img
          src="assets/faction_war_star_map.webp"
          alt="차원 성좌 전쟁 전술 지도"
          className="w-full h-full object-fill select-none pointer-events-none"
        />

        {/* 상단 오버레이 (범례 + 모달 확대 토글 + 원정 상태 배너) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-[#c8aa6e55] backdrop-blur-xs text-[10px] text-[#e2e8f0] flex items-center gap-2 flex-wrap">
            <span className="text-[#ffd54f] font-bold">☀️ 여명(3)</span>
            <span className="text-[#e040fb] font-bold">🔮 학회(3)</span>
            <span className="text-[#00e5ff] font-bold">⚙️ 강철(3)</span>
            <span className="text-[#00e676] font-bold">🌿 6각회랑(6)</span>
            <span className="text-[#ff1744] font-bold">🔥 크라운(6)</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* 1시간 원정 행군 진행 바 / 즉시 완료 버튼 */}
            {warState.marchingOrder && (
              <div className="px-2.5 py-1 rounded-lg bg-[#141b2d]/90 border border-[#38bdf888] flex items-center gap-1.5 text-[11px] shadow-lg animate-pulse">
                <span>⏳</span>
                <span className="text-[#38bdf8] font-bold font-mono">
                  {Math.max(0, Math.ceil((warState.marchingOrder.arrivesAt - Date.now()) / 1000))}s
                </span>
                <button
                  onClick={() => handleResolveMarchingOrder(true)}
                  className="px-1.5 py-0.2 rounded bg-[#38bdf822] border border-[#38bdf866] text-[#38bdf8] text-[9px] font-bold hover:bg-[#38bdf844] cursor-pointer"
                  title="원정 즉시 완료 (마스터 테스트)"
                >
                  즉시완료(M)
                </button>
              </div>
            )}

            {/* 대형 모달 확대 / 축소 버튼 */}
            {!isExpandedModal ? (
              <button
                onClick={() => {
                  SoundManager.getInstance().play('click');
                  setIsBigMapModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffd54f22] to-[#c8aa6e33] hover:from-[#ffd54f44] hover:to-[#c8aa6e55] border border-[#ffd54f88] text-[#ffd54f] text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow transition-all active:scale-95"
                title="패널을 벗어나 큰 모달로 지도 확대"
              >
                <span>⛶ 대형 모달 확대</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  SoundManager.getInstance().play('click');
                  setIsBigMapModalOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-[#1a2234] border border-[#ffd54f88] text-[#ffd54f] text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow"
                title="모달 닫기 (Esc)"
              >
                <span>✕ 축소</span>
              </button>
            )}
          </div>
        </div>

        {/* ⛩️ 21개 PvE 차원 수호 관문 마커 렌더링 */}
        {Object.values(FACTION_WAR_GATES).map((gateDef) => {
          const gateState = warState.gates[gateDef.id];
          const isCleared = gateState?.clearedBy[myFaction];
          const isSelected = selectedGateId === gateDef.id;
          const unlockInfo = isGateUnlockedToAttack(gateDef.id);
          const isHardCenter = gateDef.difficultyTier === 'center_hard';
          const isCoreGate = gateDef.difficultyTier === 'core_boss';

          const borderColor = isCleared
            ? '#38ef7d'
            : isCoreGate
            ? '#ff1744'
            : isHardCenter
            ? '#ff9100'
            : '#c8aa6e';

          return (
            <button
              key={gateDef.id}
              type="button"
              onClick={() => {
                SoundManager.getInstance().play('click');
                setSelectedGateId(gateDef.id);
                setSelectedNodeId(null);
              }}
              style={{
                left: `${gateDef.x}%`,
                top: `${gateDef.y}%`,
                borderColor,
              }}
              title={`${gateDef.name} (${gateDef.difficultyStars})`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 shadow-md ${
                isExpandedModal
                  ? 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-xs sm:text-sm'
                  : 'w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs'
              } ${
                isSelected
                  ? 'scale-125 ring-2 ring-white bg-[#1a1025]'
                  : isCleared
                  ? 'bg-[#0d291e]/90 hover:scale-110'
                  : unlockInfo.unlocked
                  ? 'bg-[#121624]/90 hover:scale-110 animate-pulse'
                  : 'bg-black/80 opacity-65 hover:opacity-100'
              }`}
            >
              <span className="leading-none">
                {isCleared ? '✅' : !unlockInfo.unlocked ? '🔒' : isHardCenter ? '🛡️' : '⛩️'}
              </span>
            </button>
          );
        })}

        {/* 🏰 10개 주요 거점 (3대 불침 성채 + 6대 내곽 거점 + 중앙 아카식 크라운 코어) 마커 렌더링 */}
        {(Object.keys(FACTION_WAR_NODES) as StrongholdId[]).map((nId) => {
          const nDef = FACTION_WAR_NODES[nId];
          const nState = warState.nodes[nId];
          const owner = nState?.ownerFaction;
          const ownerMeta = owner ? FACTIONS[owner] : null;
          const isSelected = selectedNodeId === nId;
          const isRally = warState.rallyTargets[myFaction] === nId;
          const isCore = nId === 'node_core';
          const hpPct = nState ? Math.max(0, Math.min(100, (nState.hp / nState.maxHp) * 100)) : 100;

          return (
            <button
              key={nId}
              type="button"
              onClick={() => {
                SoundManager.getInstance().play('click');
                setSelectedNodeId(nId);
                setSelectedGateId(null);
              }}
              style={{
                left: `${nDef.x}%`,
                top: `${nDef.y}%`,
                borderColor: ownerMeta ? ownerMeta.color : '#94a3b8',
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer transition-transform ${
                isSelected ? 'scale-115' : 'hover:scale-108'
              }`}
            >
              {/* 사령관 집결 마커 */}
              {isRally && (
                <span className="mb-0.5 px-1.5 py-0.2 rounded-full bg-[#ff1744] text-white text-[9px] font-black shadow animate-bounce">
                  🎯 집결
                </span>
              )}

              {/* 거점 원형 배지 */}
              <div
                className={`relative rounded-full flex items-center justify-center border-2 shadow-[0_0_16px_rgba(0,0,0,0.95)] ${
                  isCore
                    ? isExpandedModal
                      ? 'w-13 h-13 sm:w-16 sm:h-16 bg-gradient-to-b from-[#3d101e] to-[#1a070d]'
                      : 'w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-b from-[#3d101e] to-[#1a070d]'
                    : nDef.isHq
                    ? isExpandedModal
                      ? 'w-12 h-12 sm:w-14 sm:h-14 bg-black/85'
                      : 'w-10 h-10 sm:w-11 sm:h-11 bg-black/85'
                    : isExpandedModal
                    ? 'w-10 h-10 sm:w-12 sm:h-12 bg-[#0d1322]/90'
                    : 'w-9 h-9 sm:w-10 sm:h-10 bg-[#0d1322]/90'
                } ${isSelected ? 'ring-2 ring-[#ffd54f]' : ''}`}
                style={{
                  borderColor: ownerMeta ? ownerMeta.color : '#c8aa6e',
                }}
              >
                <span
                  className={
                    isCore
                      ? isExpandedModal
                        ? 'text-xl sm:text-2xl'
                        : 'text-lg sm:text-xl'
                      : isExpandedModal
                      ? 'text-base sm:text-lg'
                      : 'text-sm sm:text-base'
                  }
                >
                  {nDef.icon}
                </span>

                {/* 소유 진영 소형 배지 */}
                {ownerMeta && !nDef.isHq && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] border border-black shadow"
                    style={{ backgroundColor: ownerMeta.color, color: '#000' }}
                  >
                    {ownerMeta.icon}
                  </span>
                )}
              </div>

              {/* 거점 이름 & 내구도 미니 바 */}
              <div className={`mt-0.5 px-1.5 py-0.5 rounded bg-black/85 border border-[#ffffff22] text-center shadow ${
                isExpandedModal ? 'min-w-[76px]' : 'min-w-[68px]'
              }`}>
                <div className="text-[9px] sm:text-[10px] font-extrabold text-white truncate leading-tight">
                  {nDef.name}
                </div>
                {!nDef.isHq && (
                  <div className="w-full h-1 bg-[#1e293b] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${hpPct}%`,
                        backgroundColor: ownerMeta ? ownerMeta.color : '#ffd54f',
                      }}
                    />
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* ── 🗺️ 맵 우측 하단 플로팅 거점 상세 상황판 (HUD Overlay) ── */}
        {(selectedGateDef || selectedNodeDef) && (
          <div className={`absolute right-2 bottom-2 z-40 max-w-[calc(100%-16px)] bg-[#0d121fe6] backdrop-blur-md border border-[#c8aa6e88] rounded-xl p-3 shadow-2xl animate-fade-in pointer-events-auto ${
            isExpandedModal ? 'w-80 sm:w-96 right-4 bottom-4' : 'w-72 sm:w-80'
          }`}>
            {selectedGateDef && selectedGateState && (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-1 border-b border-[#ffffff14] pb-1.5">
                  <div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f55]">
                      ⛩️ PvE 관문 ({selectedGateDef.difficultyStars})
                    </span>
                    <h5 className="text-xs sm:text-sm font-black text-white mt-0.5">
                      {selectedGateDef.name}
                    </h5>
                  </div>
                  <button
                    onClick={() => setSelectedGateId(null)}
                    className="text-[#94a3b8] hover:text-white text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-[10px] text-[#94a3b8] leading-tight">
                  {selectedGateDef.desc}
                </div>

                <div className="p-2 rounded-lg bg-black/50 border border-[#ffffff12] flex items-center justify-between text-[11px]">
                  <span className="text-[#e2e8f0]">수호병: {selectedGateDef.monsterName}</span>
                  <span className="font-mono font-bold text-[#38ef7d]">
                    {selectedGateState.clearedBy[myFaction]
                      ? '✅ 개방 완료'
                      : `${(selectedGateState.hpByFaction[myFaction] ?? selectedGateDef.maxHp).toLocaleString()} HP`}
                  </span>
                </div>

                <button
                  onClick={() => handleAttackGate(selectedGateDef.id)}
                  disabled={selectedGateState.clearedBy[myFaction]}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow ${
                    selectedGateState.clearedBy[myFaction]
                      ? 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:brightness-110 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  {selectedGateState.clearedBy[myFaction] ? '관문 개방됨' : '1시간 원정 진격 (작전권 1)'}
                </button>
              </div>
            )}

            {selectedNodeDef && selectedNodeState && (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-1 border-b border-[#ffffff14] pb-1.5">
                  <div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border" style={{
                      color: selectedNodeState.ownerFaction ? FACTIONS[selectedNodeState.ownerFaction].color : '#94a3b8',
                      borderColor: selectedNodeState.ownerFaction ? FACTIONS[selectedNodeState.ownerFaction].color : '#94a3b8',
                    }}>
                      {selectedNodeState.ownerFaction ? `${FACTIONS[selectedNodeState.ownerFaction].name} 점령` : '중립 거점'}
                    </span>
                    <h5 className="text-xs sm:text-sm font-black text-white mt-0.5 flex items-center gap-1">
                      <span>{selectedNodeDef.icon}</span>
                      <span>{selectedNodeDef.name}</span>
                    </h5>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-[#94a3b8] hover:text-white text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-black/50 border border-[#ffffff12] space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">성벽 내구도</span>
                    <span className="font-mono font-bold text-[#ffd54f]">
                      {selectedNodeState.hp.toLocaleString()} / {selectedNodeDef.maxHp.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">수비대 주둔</span>
                    <span className="font-mono text-white">
                      {selectedNodeState.garrisons.length} / {selectedNodeDef.maxGarrisons}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#ffd54f] truncate pt-0.5">
                    🎁 버프: {selectedNodeDef.buffTitle}
                  </div>
                </div>

                {!selectedNodeDef.isHq && (
                  <div className="flex items-center gap-1.5">
                    {selectedNodeState.ownerFaction === myFaction ? (
                      <button
                        onClick={() => handleDeployGarrison(selectedNodeDef.id)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-black font-extrabold text-xs shadow active:scale-95 cursor-pointer"
                      >
                        수비대 주둔 (+100)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSiegeStronghold(selectedNodeDef.id)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white font-extrabold text-xs shadow active:scale-95 cursor-pointer"
                      >
                        1시간 원정 진격 (작전권 1)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 pb-4 select-none text-white">
      {/* ── 1. 최상단 시즌 현황 & 진영 선택/전환 바 ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141024] via-[#111626] to-[#141024] border border-[#c8aa6e55] p-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#ffffff14]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ff416c25] text-[#ff80ab] border border-[#ff416c66] text-[10px] font-mono font-extrabold">
              👑 MASTER PREVIEW
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#ffd54f] flex items-center gap-1.5">
              <span>🌌 차원 성좌 전쟁: 영토 쟁탈전</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#1b2438] hover:bg-[#25324d] border border-[#4a608a] text-[11px] font-bold text-[#cfd8e8] cursor-pointer"
            >
              📖 전장 규칙
            </button>
            <button
              onClick={() => setIsShopOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#b89758] to-[#876739] hover:brightness-110 text-[11px] font-bold text-black shadow-sm cursor-pointer flex items-center gap-1"
            >
              <span>🎖️</span>
              <span>성좌 상점 ({warState.constellationSeals.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* 3대 결사단 진영 현황 및 계약 전환 카드 */}
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          {(['dawn', 'arcana', 'iron'] as FactionId[]).map((fId) => {
            const fMeta = FACTIONS[fId];
            const isMyFaction = myFaction === fId;
            const nodeCount = ownedNodesByFaction[fId].length;
            const score = warState.scores[fId] || 0;

            return (
              <div
                key={fId}
                onClick={async () => {
                  if (warState.playerFaction && warState.playerFaction !== fId) {
                    // 시즌 진행 중 팩션 변경 차단
                    await gameAlert({
                      title: '🔒 팩션 변경 불가',
                      message: '차원 성좌 전쟁은 한 번 팩션에 가입하면 시즌 종료 시까지 다른 팩션으로 변경할 수 없습니다.',
                      icon: '⚠️',
                      tone: 'warning',
                    });
                    return;
                  }

                  // 팩션 가입 자격 검증 (기사/사제, 마법사/마총, 용병검사/그림자 1차 전직 이상)
                  const allHeroes = [...(state.party || []), ...(state.barracks || [])].map(h => ({
                    classId: h.classId,
                    tier: CHARACTER_CLASSES[h.classId]?.tier || 0,
                  }));
                  const check = canJoinFaction(fId, allHeroes);
                  if (!check.eligible) {
                    await gameAlert({
                      title: `🔒 [${fMeta.name}] 가입 조건 미달`,
                      message: check.reason || '해당 팩션의 전속 클래스 1차 전직 이상 용병이 필요합니다.',
                      icon: fMeta.icon,
                      tone: 'danger',
                    });
                    return;
                  }

                  SoundManager.getInstance().play('click');
                  setWarState((prev) => ({ ...prev, playerFaction: fId }));
                  appendWarLog(`📜 [${fMeta.name}]과(와) 정식 차원 결사 계약을 체결했습니다. (시즌 중 팩션 변경 불가)`, fId, true);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isMyFaction
                    ? `bg-gradient-to-b ${fMeta.bgGradient} border-2 shadow-[0_0_15px_rgba(255,213,79,0.2)]`
                    : 'bg-[#0b0e17]/80 border-[#263044] opacity-75 hover:opacity-100'
                }`}
                style={{ borderColor: isMyFaction ? fMeta.color : undefined }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black truncate flex items-center gap-1" style={{ color: fMeta.color }}>
                    <span>{fMeta.icon}</span>
                    <span>{fMeta.shortName}</span>
                  </span>
                  {isMyFaction && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/15 text-white font-mono font-bold shrink-0">
                      소속중
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[#90a4ae]">거점 {nodeCount}곳</span>
                  <span className="font-bold text-white">{score.toLocaleString()} pt</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4주 시즌 주차 & 3인 결사대 차출 배너 */}
        <div className="mt-2.5 pt-2 border-t border-[#ffffff14] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[#9c27b033] border border-[#ba68c866] text-[#e1bee7] font-bold text-[11px] flex items-center gap-1">
              <span>📅 시즌 주기:</span>
              <strong className="text-[#ffd54f]">
                {warState.currentWeek === 1
                  ? '1주차: 팩션 배치기'
                  : warState.currentWeek === 2
                  ? '2주차: 전격 진격기'
                  : warState.currentWeek === 3
                  ? '3주차: 최후의 결전 (크라운 개방)'
                  : '4주차: 시즌 아웃 (전장 동결)'}
              </strong>
            </span>

            {/* 마스터 주차 변경 컨트롤러 */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-[#ffffff1a]">
              <span className="text-[10px] text-[#90a4ae] px-1 font-mono">주차(M):</span>
              {([1, 2, 3, 4] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    SoundManager.getInstance().play('click');
                    setWarState(prev => ({ ...prev, currentWeek: w }));
                  }}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-all ${
                    warState.currentWeek === w
                      ? 'bg-[#ffd54f] text-black font-extrabold'
                      : 'text-[#90a4ae] hover:text-white'
                  }`}
                >
                  {w}주
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                mySquadInfo.isFullyDispatched
                  ? 'bg-[#1e293b] border-[#38ef7d66] text-[#38ef7d]'
                  : 'bg-[#d32f2f22] border-[#f44336] text-[#ff8a80] animate-pulse'
              }`}
            >
              <span>⚔️ 3인 결사대:</span>
              <span>{mySquadInfo.isFullyDispatched ? `편성 완료 (${mySquadInfo.heroes.length}인)` : '편성 필요 ⚠️'}</span>
            </button>
          </div>
        </div>

        {/* 내 작전 상태 & 교두보 해금 표시줄 */}
        <div className="mt-2.5 pt-2 border-t border-[#ffffff14] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#cfd8e8] flex items-center gap-1">
              <span>⚡ 작전권:</span>
              <strong className="text-[#38ef7d] font-mono">
                {warState.siegeTokens} / {warState.maxSiegeTokens}
              </strong>
              <button
                onClick={() => {
                  SoundManager.getInstance().play('item_upgrade');
                  setWarState((prev) => ({ ...prev, siegeTokens: prev.maxSiegeTokens }));
                }}
                className="ml-1 px-1.5 py-0.5 rounded bg-[#38ef7d22] border border-[#38ef7d66] text-[#38ef7d] text-[10px] font-bold hover:bg-[#38ef7d33] cursor-pointer"
              >
                +무료충전
              </button>
            </span>

            <span className="text-[#cfd8e8] flex items-center gap-1">
              <span>🌟 각성 보호석 조각:</span>
              <strong className="text-[#ffd54f] font-mono">{warState.awakeningProtectionShards} / 3</strong>
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
              bridgeheadStatus.canAccess
                ? 'bg-[#ff174425] border-[#ff174488] text-[#ff8a80]'
                : 'bg-[#1a2234] border-[#334155] text-[#94a3b8]'
            }`}
          >
            <span>{bridgeheadStatus.canAccess ? '🔓' : '🔒'}</span>
            <span>
              {bridgeheadStatus.canAccess
                ? `아카식 크라운 교두보 활성화! (연결 거점 ${bridgeheadStatus.activeBridgeheadNodes.length}곳)`
                : '아카식 크라운 봉인됨 (인접 내곽 거점 2곳 동시 확보 필요)'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. 인터랙티브 성좌 전술 지도 (v4 배경 + 10대 거점 + 21개 PvE 관문 마커) ── */}
      {/* 🖥️ 대화면 패널 확장 모달 진입 배너 */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#172033] via-[#0f1523] to-[#172033] border border-[#c8aa6e88] shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🖥️</span>
          <div>
            <div className="text-xs font-extrabold text-[#ffd54f] flex items-center gap-1.5">
              <span>대형 전술 지도 모달 (와이드 화면 지휘)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#ffd54f22] text-[#ffd54f] font-mono">
                추천
              </span>
            </div>
            <div className="text-[10px] text-[#94a3b8] leading-tight">
              워크스테이션 패널 경계를 벗어나 화면 전체로 펼쳐지는 대형 모달로 지도를 확인합니다.
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            SoundManager.getInstance().play('click');
            setIsBigMapModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd54f] to-[#ffb300] hover:brightness-110 text-black font-black text-xs shadow-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <span>⛶ 대형 지도 확대</span>
        </button>
      </div>

      {/* 인라인 지도 */}
      {renderStarMapCore(false)}

      {/* ── 3. 선택된 거점 또는 PvE 관문 상세 작전 통제실 ── */}
      {selectedGateDef && selectedGateState && (
        <div className="rounded-2xl bg-[#101524] border-2 border-[#c8aa6e88] p-3.5 shadow-lg animate-fade-in">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#ffffff14]">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f55] text-[10px] font-mono font-bold">
                  ⛩️ PvE 차원 수호 관문
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    selectedGateDef.difficultyTier === 'center_hard' || selectedGateDef.difficultyTier === 'core_boss'
                      ? 'bg-[#ff174425] text-[#ff8a80] border-[#ff174466]'
                      : 'bg-[#38ef7d20] text-[#38ef7d] border-[#38ef7d55]'
                  }`}
                >
                  난이도: {selectedGateDef.difficultyStars}
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-1 flex items-center gap-1.5">
                <span>⛩️ {selectedGateDef.name}</span>
              </h4>
              <p className="text-xs text-[#94a3b8] mt-0.5">{selectedGateDef.desc}</p>
            </div>

            <div className="text-right shrink-0 font-mono">
              <div className="text-[10px] text-[#94a3b8]">권장 부대 전투력</div>
              <div className="text-xs font-bold text-[#ffd54f]">
                ⚡ {selectedGateDef.recommendedCp.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 수호병 내구도 바 */}
          <div className="my-3 p-3 rounded-xl bg-black/40 border border-[#ffffff12]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#e2e8f0]">
                👾 수호 몬스터: {selectedGateDef.monsterName} (Lv.{selectedGateDef.monsterLevel})
              </span>
              <span className="font-mono font-bold text-[#38ef7d]">
                {selectedGateState.clearedBy[myFaction]
                  ? '✅ 돌파 완료 (진격로 개방됨)'
                  : `${(selectedGateState.hpByFaction[myFaction] ?? selectedGateDef.maxHp).toLocaleString()} / ${selectedGateDef.maxHp.toLocaleString()} HP`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff416c] to-[#ffd54f] transition-all duration-300"
                style={{
                  width: `${
                    selectedGateState.clearedBy[myFaction]
                      ? 0
                      : ((selectedGateState.hpByFaction[myFaction] ?? selectedGateDef.maxHp) /
                          selectedGateDef.maxHp) *
                        100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAttackGate(selectedGateDef.id)}
              disabled={selectedGateState.clearedBy[myFaction]}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                selectedGateState.clearedBy[myFaction]
                  ? 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:brightness-110 text-white active:scale-95'
              }`}
            >
              <span>⚔️</span>
              <span>
                {selectedGateState.clearedBy[myFaction]
                  ? '관문 개방 완료 (인접 거점 공성 가능)'
                  : '관문 수호병 토벌 출격 (작전권 1 소모)'}
              </span>
            </button>

            {/* 👑 마스터 전용 즉시 개방/초기화 토글 버튼 */}
            <button
              onClick={() => {
                SoundManager.getInstance().play('item_upgrade');
                const currentlyCleared = selectedGateState.clearedBy[myFaction];
                setWarState((prev) => ({
                  ...prev,
                  gates: {
                    ...prev.gates,
                    [selectedGateDef.id]: {
                      ...prev.gates[selectedGateDef.id],
                      clearedBy: {
                        ...prev.gates[selectedGateDef.id].clearedBy,
                        [myFaction]: !currentlyCleared,
                      },
                      hpByFaction: {
                        ...prev.gates[selectedGateDef.id].hpByFaction,
                        [myFaction]: !currentlyCleared ? 0 : selectedGateDef.maxHp,
                      },
                    },
                  },
                }));
              }}
              className="py-2.5 px-3 rounded-xl bg-[#2e1038] hover:bg-[#3f164d] border border-[#e040fb88] text-[#e0aaff] font-bold text-xs cursor-pointer"
            >
              👑 마스터: {selectedGateState.clearedBy[myFaction] ? '관문 봉인' : '즉시 돌파'}
            </button>
          </div>
        </div>
      )}

      {selectedNodeDef && selectedNodeState && (
        <div className="rounded-2xl bg-[#101524] border-2 border-[#c8aa6e88] p-3.5 shadow-lg animate-fade-in">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#ffffff14]">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#c8aa6e22] text-[#ffd54f] border border-[#c8aa6e55] text-[10px] font-mono font-bold">
                  {selectedNodeDef.subTitle}
                </span>
                {selectedNodeState.ownerFaction ? (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold border"
                    style={{
                      color: FACTIONS[selectedNodeState.ownerFaction].color,
                      borderColor: FACTIONS[selectedNodeState.ownerFaction].color,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    {FACTIONS[selectedNodeState.ownerFaction].icon}{' '}
                    {FACTIONS[selectedNodeState.ownerFaction].name} 점령 중
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600 text-[10px] font-bold">
                    ⚪ 중립 미점령 거점
                  </span>
                )}
              </div>

              <h4 className="text-base font-black text-white mt-1 flex items-center gap-1.5">
                <span>{selectedNodeDef.icon}</span>
                <span>{selectedNodeDef.name}</span>
              </h4>
              <p className="text-xs text-[#ffd54f] font-bold mt-0.5">
                🎁 점령 월드 버프: {selectedNodeDef.buffTitle}
              </p>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedNodeDef.buffDesc}</p>
            </div>

            {!selectedNodeDef.isHq && (
              <div className="text-right shrink-0 font-mono">
                <div className="text-[10px] text-[#94a3b8]">시간당 승점</div>
                <div className="text-sm font-black text-[#38ef7d]">+{selectedNodeDef.pointsPerHour} pt/h</div>
              </div>
            )}
          </div>

          {!selectedNodeDef.isHq && (
            <>
              {/* 성벽 내구도 & 주둔 수비대 현황 */}
              <div className="my-3 p-3 rounded-xl bg-black/40 border border-[#ffffff12] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#e2e8f0]">🏰 거점 성벽 내구도</span>
                  <span className="font-mono font-bold text-[#ffd54f]">
                    {selectedNodeState.hp.toLocaleString()} / {selectedNodeState.maxHp.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#38ef7d] to-[#ffd54f] transition-all duration-300"
                    style={{ width: `${(selectedNodeState.hp / selectedNodeState.maxHp) * 100}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[#94a3b8]">
                    🛡️ 주둔 수비 분대 ({selectedNodeState.garrisons.length} / {selectedNodeDef.maxGarrisons})
                  </span>
                  {selectedNodeState.lastCapturedBy && (
                    <span className="text-[11px] text-[#ffd54f]">
                      최근 점령 선봉장: [{selectedNodeState.lastCapturedBy}]
                    </span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 그룹 */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedNodeState.ownerFaction === myFaction ? (
                  <button
                    onClick={() => handleDeployGarrison(selectedNodeDef.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00b09b] to-[#96c93d] hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>🛡️</span>
                    <span>내 수비 분대 주둔 파견 (+100 인장)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSiegeStronghold(selectedNodeDef.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>⚔️</span>
                    <span>거점 공성 강습 개시 (작전권 1 소모)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    SoundManager.getInstance().play('click');
                    setWarState((prev) => ({
                      ...prev,
                      rallyTargets: {
                        ...prev.rallyTargets,
                        [myFaction]: selectedNodeDef.id,
                      },
                    }));
                    appendWarLog(
                      `🎯 [${myFactionMeta.name}] 성좌 사령관이 [${selectedNodeDef.name}]에 총공세 집결 명령(공방 +15%)을 발령했습니다!`,
                      myFaction
                    );
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#ffd54f66] text-[#ffd54f] font-bold text-xs cursor-pointer"
                >
                  🎯 집결지 지정
                </button>

                {/* 👑 마스터 전용 즉시 점령 버튼 */}
                <button
                  onClick={() => {
                    SoundManager.getInstance().play('forge_success');
                    const commanderNick = FirebaseService.getInstance().getCommanderCallsign();
                    setWarState((prev) => ({
                      ...prev,
                      nodes: {
                        ...prev.nodes,
                        [selectedNodeDef.id]: {
                          ...prev.nodes[selectedNodeDef.id],
                          ownerFaction: myFaction,
                          hp: selectedNodeDef.maxHp,
                          lastCapturedBy: commanderNick,
                        },
                      },
                    }));
                    appendWarLog(
                      `👑 [마스터 권한] [${selectedNodeDef.name}] 거점이 [${myFactionMeta.name}] 소유로 즉시 전환되었습니다.`,
                      myFaction,
                      true
                    );
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#2e1038] hover:bg-[#3f164d] border border-[#e040fb88] text-[#e0aaff] font-bold text-xs cursor-pointer"
                >
                  👑 마스터: 즉시 점령
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 4. 실시간 성좌 전황 로그 ── */}
      <div className="rounded-2xl bg-[#0b0e17] border border-[#23304a] p-3">
        <div className="text-xs font-bold text-[#ffd54f] mb-2 flex items-center justify-between">
          <span>📡 실시간 성좌 전황 기록</span>
          <button
            onClick={async () => {
              const ok = await gameConfirm({
                title: '🔄 성좌 전장 초기화',
                message: '마스터 테스트를 위해 모든 거점과 관문 상태를 시즌 초기 상태로 리셋하시겠습니까?',
                icon: '🔄',
                tone: 'warning',
              });
              if (ok) {
                setWarState(createInitialFactionWarState());
              }
            }}
            className="text-[10px] text-[#94a3b8] hover:text-white underline cursor-pointer"
          >
            전장 상태 초기화
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono">
          {warState.battleLogs.map((log) => (
            <div
              key={log.id}
              className={`py-0.5 ${log.isSystem ? 'text-[#ffd54f] font-bold' : 'text-[#cfd8e8]'}`}
            >
              {log.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── 🎖️ 성좌 군수 상점 모달 ── */}
      {isShopOpen && (
        <Modal title="🎖️ 성좌 군수 상점 (Constellation Armory)" open={isShopOpen} onClose={() => setIsShopOpen(false)}>
          <div className="flex flex-col gap-3 text-white">
            <div className="p-3 rounded-xl bg-[#141b2d] border border-[#ffd54f55] flex items-center justify-between">
              <span className="text-xs text-[#cfd8e8]">보유 성좌의 인장</span>
              <span className="text-sm font-black font-mono text-[#ffd54f]">
                🎖️ {warState.constellationSeals.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {CONSTELLATION_SHOP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#0e1320] border border-[#28354e] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => handleBuyShopItem(item.id)}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#b89758] to-[#876739] hover:brightness-110 text-black font-black text-xs shrink-0 cursor-pointer"
                  >
                    🎖️ {item.costSeals}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── ⚔️ 3인 결사대 차출 관리 모달 ── */}
      {isDispatchModalOpen && (
        <Modal title="⚔️ 차원 성좌 전쟁 3인 결사대 차출" open={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)}>
          <div className="flex flex-col gap-3 text-white text-xs">
            <div className="p-3 rounded-xl bg-[#141b2d] border border-[#ffd54f55] leading-relaxed">
              <div className="font-bold text-[#ffd54f] mb-1">⚠️ 3인 결사대 차출 규칙</div>
              <p className="text-[#cfd8e8] text-[11px]">
                • 선택된 3명의 용병은 <strong>시즌 동안 차원 성좌 전쟁에 상시 전담</strong>되며, 다른 모든 컨텐츠(던전 탐험, 아레나, 보스 토벌 등)에 출전할 수 없습니다.<br />
                • 정확히 3명을 선택하여 차출 등록을 완료하십시오.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {[...(state.party || []), ...(state.barracks || [])].map((h) => {
                const isSelected = selectedSquadHeroIds.includes(h.id);
                const cls = CHARACTER_CLASSES[h.classId];
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      SoundManager.getInstance().play('click');
                      if (isSelected) {
                        setSelectedSquadHeroIds(prev => prev.filter(id => id !== h.id));
                      } else {
                        if (selectedSquadHeroIds.length >= 3) {
                          gameAlert({
                            title: '슬롯 초과',
                            message: '결사대는 최대 3명까지만 차출할 수 있습니다.',
                            icon: '⚠️',
                            tone: 'warning',
                          });
                          return;
                        }
                        setSelectedSquadHeroIds(prev => [...prev, h.id]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b253b] border-[#38ef7d] text-white shadow'
                        : 'bg-[#0d121c] border-[#222e44] text-[#94a3b8] hover:border-[#486596]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{h.portraitPromptKey ? '👤' : '⚔️'}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{h.name}</span>
                          <span className="text-[10px] text-[#ffd54f] font-mono">Lv.{h.level}</span>
                          <span className="text-[10px] text-[#38bdf8]">[{cls?.name || h.classId}]</span>
                        </div>
                        <div className="text-[10px] text-[#94a3b8] font-mono">
                          HP {h.maxHp.toLocaleString()} · ATK {h.stats?.atk} · DEF {h.stats?.def}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold font-mono text-xs">
                      {isSelected ? <span className="text-[#38ef7d]">선택됨 ✓</span> : <span className="text-[#64748b]">+선택</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#ffffff14] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#94a3b8]">
                선택된 용병: <strong className="text-[#ffd54f] font-mono">{selectedSquadHeroIds.length} / 3</strong>
              </span>
              <button
                onClick={async () => {
                  if (selectedSquadHeroIds.length !== 3) {
                    await gameAlert({
                      title: '부대 인원 부족',
                      message: '정확히 3명의 용병을 선택해야 결사대를 차출할 수 있습니다.',
                      icon: '⚠️',
                      tone: 'warning',
                    });
                    return;
                  }

                  SoundManager.getInstance().play('item_upgrade');
                  // 게임 매니저의 용병들에게 isDispatchedToFactionWar 플래그 세팅
                  const allHeroes = [...(state.party || []), ...(state.barracks || [])];
                  allHeroes.forEach((h) => {
                    h.isDispatchedToFactionWar = selectedSquadHeroIds.includes(h.id);
                  });
                  gm.saveGame();

                  setWarState(prev => ({
                    ...prev,
                    dispatchedSquadIds: selectedSquadHeroIds,
                  }));

                  appendWarLog(
                    `⚔️ 3인 결사대 차출 완료: [${selectedSquadHeroIds.map(id => allHeroes.find(h => h.id === id)?.name).join(', ')}]`,
                    myFaction,
                    true
                  );

                  setIsDispatchModalOpen(false);

                  await gameAlert({
                    title: '⚔️ 3인 결사대 차출 완료',
                    message: '차원 성좌 전쟁 전담 3인 부대가 성공적으로 등록되었습니다!\n(시즌 종료 시까지 타 컨텐츠 출전이 제한됩니다.)',
                    icon: '🚩',
                    tone: 'primary',
                  });
                }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#ffd54f] to-[#ffb300] text-black font-black text-xs shadow cursor-pointer active:scale-95"
              >
                결사대 차출 확정
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 📖 성좌 전쟁 핵심 규칙 모달 ── */}
      {isRulesOpen && (
        <Modal title="📖 차원 성좌 전쟁: 영토 쟁탈전 핵심 규칙" open={isRulesOpen} onClose={() => setIsRulesOpen(false)}>
          <div className="flex flex-col gap-3 text-xs text-[#cfd8e8] leading-relaxed">
            <div className="p-3 rounded-xl bg-[#141b2d] border border-[#ffd54f44]">
              <div className="font-bold text-[#ffd54f] mb-1">1. 출진 3갈래 관문 난이도 차등 전략</div>
              <div>
                • <strong>중앙 직할 관문 (10시·2시·6시)</strong>: 타 진영의 방해 없이 안전하게 전면 거점을 독점 확보할 수 있으나, <strong>고난도 PvE 수호 거신(★★★)</strong>이 배치되어 있습니다.<br />
                • <strong>좌·우익 주변부 관문 (12시·4시·8시)</strong>: <strong>저난도 PvE(★☆☆)</strong>로 구성되어 빠르게 돌파해 선점할 수 있으나, 인접 진영과 즉각적인 거점 쟁탈전이 벌어집니다.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#2a121d] border border-[#ff174466]">
              <div className="font-bold text-[#ff8a80] mb-1">2. [👑 아카식 크라운 코어] 인접 2거점 교두보 법칙</div>
              <div>
                • 내곽 거점 1곳만 점령한 상태에서는 정중앙 아카식 크라운 코어로 진입할 수 없습니다.<br />
                • 반드시 <strong>인접한 내곽 주요 거점 1곳을 추가로 확보(총 2개 이상의 연결된 내곽 거점 동시 점령)</strong>해야만 진홍빛 결전선과 왕관 수호 성문이 개방됩니다!
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#10221c] border border-[#38ef7d55]">
              <div className="font-bold text-[#38ef7d] mb-1">3. 실시간 진영 월드 버프 & 성좌 보호석</div>
              <div>
                • 점령한 거점에 따라 <strong>자원 생산량 +25%, 병기창 단조 할인 -10%, 장비 각성 성공률 +2%p 가산</strong> 등 강력한 월드 버프가 실시간 적용됩니다.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 🖥️ 대형 전술 지도 모달 (패널을 넘어 화면 전체로 확장되는 포털 모달) ── */}
      {isBigMapModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-3 lg:p-5 bg-black/90 backdrop-blur-md select-none animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              SoundManager.getInstance().play('click');
              setIsBigMapModalOpen(false);
            }
          }}
        >
          <div className="relative w-full h-full md:w-[96vw] md:max-w-[1650px] md:h-[94vh] md:max-h-[96vh] flex flex-col bg-[#070a12] md:border-2 md:border-[#c8aa6e] md:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden">
            {/* 모달 상단 헤더 바 */}
            <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[#0a0d17] border-b border-[#c8aa6e55] flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-xl sm:text-2xl">🌌</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                      차원 성좌 전쟁 - 통합 사령부 전술 지휘 지도
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f55]">
                      {warState.currentWeek}주차: {
                        warState.currentWeek === 1 ? '배치' :
                        warState.currentWeek === 2 ? '진격' :
                        warState.currentWeek === 3 ? '결전' : '시즌 아웃'
                      }
                    </span>
                    <span className="text-[11px] text-[#94a3b8] font-mono">
                      Day {warState.seasonDay}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] flex items-center gap-2 mt-0.5">
                    <span style={{ color: myFactionMeta.color }} className="font-bold flex items-center gap-1">
                      <span>{myFactionMeta.icon}</span>
                      <span>{myFactionMeta.name}</span>
                    </span>
                    <span>•</span>
                    <span>결사대 3인: {mySquadInfo.heroes.map(h => h.name).join(', ')}</span>
                    <span className="text-[#ffd54f] font-mono font-bold">(⚡ {mySquadInfo.totalCp.toLocaleString()})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
                <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-[#ffffff15] text-[11px] flex items-center gap-1.5 font-mono">
                  <span className="text-[#94a3b8]">⚔️ 작전권:</span>
                  <strong className="text-[#38ef7d]">{warState.siegeTokens} / {warState.maxSiegeTokens}</strong>
                  <button
                    onClick={() => {
                      SoundManager.getInstance().play('item_upgrade');
                      setWarState(prev => ({ ...prev, siegeTokens: prev.maxSiegeTokens }));
                    }}
                    className="px-1.5 py-0.2 rounded bg-[#38ef7d22] border border-[#38ef7d66] text-[#38ef7d] text-[9px] font-bold hover:bg-[#38ef7d44] cursor-pointer"
                    title="작전권 충전 (마스터)"
                  >
                    +충전
                  </button>
                </div>

                {warState.marchingOrder && (
                  <div className="px-2.5 py-1 rounded-lg bg-[#141b2d] border border-[#38bdf888] flex items-center gap-1.5 text-[11px] shadow animate-pulse">
                    <span>⏳ 원정:</span>
                    <span className="text-[#38bdf8] font-mono font-bold">
                      {Math.max(0, Math.ceil((warState.marchingOrder.arrivesAt - Date.now()) / 1000))}s
                    </span>
                    <button
                      onClick={() => handleResolveMarchingOrder(true)}
                      className="px-1.5 py-0.2 rounded bg-[#38bdf822] border border-[#38bdf866] text-[#38bdf8] text-[9px] font-bold hover:bg-[#38bdf844] cursor-pointer"
                      title="원정 즉시 완료 (마스터 테스트)"
                    >
                      즉시완료(M)
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    SoundManager.getInstance().play('click');
                    setIsBigMapModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1f2738] hover:bg-[#2e3b55] border border-[#475569] text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow transition-all active:scale-95"
                  title="모달 닫고 워크스테이션 복귀 (Esc)"
                >
                  <span>✕ 지도 닫기 (Esc)</span>
                </button>
              </div>
            </div>

            {/* 대형 전술 지도 본문 영역 (aspect ratio 1376:768 완벽 유지하며 최대 확장) */}
            <div
              ref={mapViewportRef}
              className="flex-1 min-h-0 relative flex items-center justify-center p-1 sm:p-2 md:p-3 bg-[#04060c] overflow-hidden"
            >
              {renderStarMapCore(true)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
