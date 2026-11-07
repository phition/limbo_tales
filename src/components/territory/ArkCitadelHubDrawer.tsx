import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { formatTimeLeft, formatDuration } from '../../utils/timeUtils';
import { BuildingId } from '../../types/game';
import { GameIcon } from '../GameIcon';
import { EncyclopediaBadge } from '../EncyclopediaBadge';
import { getBuildingLore, getBuildingStatusInfo, RES_NAMES_AND_ICONS } from '../../utils/buildingStatusUtils';
import { GameManager } from '../../managers/GameManager';
import { getTutorialProductionTarget, checkTutorialBuildingRestriction } from '../../data/tutorialSteps';
import { gameDialog } from '../../services/DialogService';

// 🏛️ 시설별 내부 헤더 배너 이미지 매핑
const BUILDING_IMAGE_MAP: Record<string, string> = {
  blacksmith: 'assets/menu_forge.jpg',
  tavern: 'assets/menu_tavern.jpg',
  infirmary: 'assets/menu_infirmary.jpg',
  storage: 'assets/menu_storage.jpg',
  alchemy: 'assets/menu_alchemy.jpg',
  market: 'assets/menu_market.jpg',
  arenaGate: 'assets/menu_arena.jpg',
  explore: 'assets/menu_explore.jpg',
  quests: 'assets/menu_quests.jpg',
  codex: 'assets/menu_codex.jpg',
  barracks: 'assets/menu_barracks.jpg',
  cemetery: 'assets/menu_cemetery.jpg',
  citadel: 'assets/citadel_bonfire.jpg',
};

interface ArkCitadelHubDrawerProps {
  onClose: () => void;
  onEnterDrawer: (drawerKey: string) => void;
  onOpenBonfireModal?: () => void;
  initialView?: 'banners' | 'bonfire' | 'facilities' | 'workstations';
  highlightedBuildingId?: string | null;
  onClearHighlight?: () => void;
  tutorialStepId?: string;
}

export const ArkCitadelHubDrawer: React.FC<ArkCitadelHubDrawerProps> = ({
  onClose,
  onEnterDrawer,
  onOpenBonfireModal,
  initialView = 'banners',
  highlightedBuildingId,
  onClearHighlight,
  tutorialStepId,
}) => {
  const { state, gm, navigateTo } = useGameManager();
  const { tr, lang } = useI18n();

  // 뷰 상태: 3대 마스터 배너 ➔ 성화 조작 ➔ 초간결 시설 목록 ➔ 성채 진입 카드 목록
  const [activeView, setActiveView] = useState<'banners' | 'bonfire' | 'facilities' | 'workstations'>(initialView);

  // 시설 관리에서 특정 건물을 터치했을 때 열리는 [건설·증축·입장 통합 모달]
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null);

  // 외부 initialView 변경 시 동기화
  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // 튜토리얼 스텝 전환 시 해당 전용 뷰 자동 동기화
  useEffect(() => {
    if (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' || tutorialStepId === 'TUTORIAL_BUILD_TAVERN') {
      setActiveView('facilities');
    } else if (tutorialStepId === 'TUTORIAL_ENTER_TAVERN') {
      setActiveView('workstations');
    }
  }, [tutorialStepId]);

  // 외부 강조 건물 지정 시 시설 목록으로 전환 후 해당 건물 모달 즉시 노출
  useEffect(() => {
    if (highlightedBuildingId) {
      setActiveView('facilities');
      setSelectedBuildingId(highlightedBuildingId as BuildingId);
    }
  }, [highlightedBuildingId]);

  // 0.5초 타이머 리프레시 (건설 시간 및 온기 카운트다운)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const hasWarmth = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
  const warmthTimeStr = gm.bonfireWarmthTime > 0
    ? formatTimeLeft(gm.bonfireWarmthTime, lang)
    : `${gm.bonfireStacks || 0}/5`;

  // 13종 건물 목록 정의
  const buildingsList: { id: BuildingId; drawerKey?: string }[] = [
    { id: 'lumberCamp' },
    { id: 'quarry' },
    { id: 'butchery' },
    { id: 'cabin' },
    { id: 'blacksmith', drawerKey: 'forge' },
    { id: 'tavern',     drawerKey: 'tavern' },
    { id: 'infirmary',  drawerKey: 'infirmary' },
    { id: 'storage',    drawerKey: 'storage' },
    { id: 'alchemy',    drawerKey: 'alchemy' },
    { id: 'market',     drawerKey: 'market' },
    { id: 'sanctuary' },
    { id: 'arenaGate',  drawerKey: 'arena' },
  ];

  // 완공 시설 수 및 증축 가능 수 계산
  const totalBuiltCount = Object.values(state.buildings || {}).filter(b => b && b.level > 0).length;
  const upgradeableCount = useMemo(() => {
    let count = 0;
    buildingsList.forEach(item => {
      const b = state.buildings[item.id];
      if (!b || !b.unlocked) return;
      const curLv = b.maxLevel || b.level;
      if (curLv >= 10 || b.construction) return;
      const cost = gm.getBuildingUpgradeCost(item.id, curLv);
      const canAfford = Object.entries(cost).every(
        ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
      );
      const prereq = gm.checkBuildingPrerequisites(item.id, curLv + 1);
      if (canAfford && prereq.allowed) count++;
    });
    return count;
  }, [state.buildings, state.resources, gm, buildingsList]);

  // 완료되어 보상 수령 가능한 퀘스트 건수 집계
  const claimableQuestCount = useMemo(() => {
    return (state.quests || []).filter(
      q => q.status === 'active' && q.objectives.length > 0 && q.objectives.every(o => o.isCompleted)
    ).length;
  }, [state.quests]);

  // 📜 도감 등록 가능 개수 및 컬렉션 수집 건수 집계
  const registerableCodexCount = useMemo(() => {
    return gm.getRegisterableCodexCount();
  }, [state.resources, state.citadelSupplies, state.equipmentInventory, state.skillBookInventory, state.codexUnlockedItems, gm]);

  const unlockedCodexCount = useMemo(() => {
    return Object.keys(gm.codexUnlockedItems || {}).length;
  }, [state.codexUnlockedItems, gm]);

  const codexBadge = registerableCodexCount > 0 
    ? `${registerableCodexCount}건 등록 가능` 
    : (unlockedCodexCount > 0 
        ? `${unlockedCodexCount}종 수집` 
        : null);

  // 성채 활동 시설 12종 (상단 배너 아트 에셋 매핑)
  const WORKSTATION_ITEMS: Array<{
    key: string;
    name: string;
    sub: string;
    icon: string;
    image: string;
    isBuilt: boolean;
    buildingId?: BuildingId;
    badge?: string | null;
  }> = [
    { key: 'quests',    name: tr('지휘관 퀘스트 & 작전 지도'), sub: tr('메인 스토리 임무 완수 및 단계별 시설 연계'), icon: '📜', image: 'assets/menu_quests.jpg', isBuilt: true, badge: claimableQuestCount > 0 ? `${claimableQuestCount}건 완료` : null },
    { key: 'explore',   name: tr('심연 강하 차원 관문'), sub: tr('침묵의 회랑 1~5층 MUD 던전 출격 및 전술 보급품 편성'), icon: '🌌', image: 'assets/menu_explore.jpg', isBuilt: true, badge: tr('출격 가능') },
    { key: 'barracks',  name: tr('원정단 병영 & 작전실'), sub: tr('4인 파티 편성, 진형 배치, 전직 관리'), icon: '⚔️', image: 'assets/menu_barracks.jpg', isBuilt: true },
    { key: 'codex',     name: tr('심연의 백과 & 회고록'), sub: tr('오파츠·서사 일지·신화 유물 컬렉션 및 영구 패시브 연구'), icon: '📜', image: 'assets/menu_codex.jpg', isBuilt: true, badge: codexBadge },
    { key: 'forge',     name: tr('심연의 병기창'), sub: tr('무기·방어구 단조, 장비 강화, 침식 정화'), icon: '⚒️', image: 'assets/menu_forge.jpg', isBuilt: (state.buildings['blacksmith']?.level || 0) >= 1, buildingId: 'blacksmith' },
    { key: 'tavern',    name: tr('방랑자의 라운지'), sub: tr('방랑 용병 모집 계약 및 고용 풀 갱신'), icon: '🍺', image: 'assets/menu_tavern.jpg', isBuilt: (state.buildings['tavern']?.level || 0) >= 1, buildingId: 'tavern', badge: (state.tavernCandidates || []).length > 0 ? 'NEW' : null },
    { key: 'infirmary', name: tr('생체 복원 병동'), sub: tr('전투 부상 대원 입원 치료 및 완치'), icon: '🏥', image: 'assets/menu_infirmary.jpg', isBuilt: (state.buildings['infirmary']?.level || 0) >= 1, buildingId: 'infirmary', badge: (state.infirmaryPatients || []).length > 0 ? `${state.infirmaryPatients.length}인` : null },
    { key: 'storage',   name: tr('방주 중앙 병참고'), sub: tr('전 군수 물자 및 장비·보급품 보관함'), icon: '🏛️', image: 'assets/menu_storage.jpg', isBuilt: (state.buildings['storage']?.level || 0) >= 1, buildingId: 'storage' },
    { key: 'alchemy',   name: tr('에테르 연금 공방'), sub: tr('마도 스킬 비전서 강화 및 장비 룬 인챈트'), icon: '🧪', image: 'assets/menu_alchemy.jpg', isBuilt: (state.buildings['alchemy']?.level || 0) >= 1, buildingId: 'alchemy' },
    { key: 'market',    name: tr('황혼의 블랙 마켓'), sub: tr('17종 군수물자 거래 및 유지비 주기 연장'), icon: '⚖️', image: 'assets/menu_market.jpg', isBuilt: (state.buildings['market']?.level || 0) >= 1, buildingId: 'market' },
    { key: 'cemetery',  name: tr('성채 묘지'), sub: tr('전사한 영령 안치, 추모 EXP 버프 및 가호'), icon: '🪦', image: 'assets/menu_cemetery.jpg', isBuilt: true, badge: (state.cemetery || []).length > 0 ? `${state.cemetery.length}위` : null },
    { key: 'arena',     name: tr('차원 아레나 & 게이트'), sub: tr('차원 아레나 결투 및 네메시스 침공전'), icon: '🏆', image: 'assets/menu_arena.jpg', isBuilt: (state.buildings['arenaGate']?.level || 0) >= 1, buildingId: 'arenaGate' },
  ];

  interface TransitionBannerInfo {
    key: string;
    title: string;
    image: string;
    rect: { top: number; left: number; width: number; height: number };
    animating: boolean;
  }
  const [transitionBanner, setTransitionBanner] = useState<TransitionBannerInfo | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handlePlayClick = () => {
    try { SoundManager.getInstance().play('click'); } catch {}
  };

  const handleWorkstationClick = (
    item: typeof WORKSTATION_ITEMS[0],
    cardEl: HTMLElement
  ) => {
    const isLocked = !item.isBuilt;
    if (isLocked) {
      try { SoundManager.getInstance().play('error'); } catch {}
      gameDialog.confirm({
        title: tr('시설 미건설'),
        message: `${item.name} ${tr('시설은 아직 건설되지 않았습니다.')}\n\n${tr('성채 시설 관리 화면으로 이동하여 건설하시겠습니까?')}`,
        confirmLabel: tr('건설하러 가기'),
        cancelLabel: tr('닫기'),
        icon: '🔒',
      }).then(confirmed => {
        if (confirmed) {
          setActiveView('facilities');
          if (item.buildingId) {
            setSelectedBuildingId(item.buildingId);
          }
        }
      });
      return;
    }

    handlePlayClick();

    // 🚀 카드 상단 배너 이미지가 상단 모달 헤더 위치로 승강하는 전환 애니메이션 구동
    if (drawerRef.current && cardEl) {
      const bannerImg = cardEl.querySelector('.facility-banner-img') as HTMLElement | null;
      const targetRect = (bannerImg || cardEl).getBoundingClientRect();
      const containerRect = drawerRef.current.getBoundingClientRect();

      setTransitionBanner({
        key: item.key,
        title: item.name,
        image: item.image,
        rect: {
          top: targetRect.top - containerRect.top,
          left: targetRect.left - containerRect.left,
          width: targetRect.width,
          height: targetRect.height,
        },
        animating: false,
      });

      // 다음 프레임에서 상단 헤더 위치(top: 0, w: 100%, h: 220px)로 트랜지션 발동
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionBanner(prev => prev ? { ...prev, animating: true } : null);
        });
      });

      // 260ms 후 실제 시설 진입 (모달 오픈)
      setTimeout(() => {
        setTransitionBanner(null);
        onEnterDrawer(item.key);
      }, 260);
    } else {
      onEnterDrawer(item.key);
    }
  };

  // 🛡️ 튜토리얼 중 생산 시설 복원 단계 목표 및 제한 검사
  const tutorialProdTarget = useMemo(() => {
    return getTutorialProductionTarget(tutorialStepId || '', state.buildings, state.quests);
  }, [tutorialStepId, state.buildings, state.quests]);

  const selectedBuildingData = selectedBuildingId ? state.buildings[selectedBuildingId] : null;

  const tutorialRestriction = useMemo(() => {
    if (!selectedBuildingId || !selectedBuildingData) return { isRestricted: false };
    return checkTutorialBuildingRestriction(
      tutorialStepId || '',
      selectedBuildingId,
      selectedBuildingData.level,
      state.buildings,
      state.quests
    );
  }, [tutorialStepId, selectedBuildingId, selectedBuildingData, state.buildings, state.quests]);
  const selectedCost = selectedBuildingId && selectedBuildingData ? gm.getBuildingUpgradeCost(selectedBuildingId, selectedBuildingData.level) : {};
  const selectedCanAfford = selectedBuildingData ? Object.entries(selectedCost).every(
    ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
  ) : false;
  const selectedIsMax = selectedBuildingData ? (selectedBuildingData.maxLevel || selectedBuildingData.level) >= 10 : false;
  const selectedPrereq = selectedBuildingId && selectedBuildingData ? gm.checkBuildingPrerequisites(selectedBuildingId, (selectedBuildingData.maxLevel || selectedBuildingData.level) + 1) : { allowed: true };
  const selectedDrawerKey = selectedBuildingId ? buildingsList.find(b => b.id === selectedBuildingId)?.drawerKey : undefined;

  const selectedIsConstructing = !!selectedBuildingData?.construction;
  const selectedRemainSec = selectedIsConstructing ? Math.max(1, Math.ceil((selectedBuildingData!.construction!.startedAt + selectedBuildingData!.construction!.durationMs - now) / 1000)) : 0;
  const selectedProgressPct = selectedIsConstructing ? Math.min(100, Math.max(0, Math.floor(((now - selectedBuildingData!.construction!.startedAt) / selectedBuildingData!.construction!.durationMs) * 100))) : 0;
  const selectedStatusInfo = selectedBuildingId && selectedBuildingData ? getBuildingStatusInfo(selectedBuildingId, selectedBuildingData.level, hasWarmth) : null;
  const selectedLore = selectedBuildingId && selectedBuildingData ? getBuildingLore(selectedBuildingId, selectedBuildingData.level) : '';
  const selectedNextLevel = selectedBuildingData ? Math.min(10, selectedBuildingData.level + 1) : 1;
  const selectedNextUpkeep = selectedBuildingId ? gm.getBuildingUpkeep(selectedBuildingId, selectedNextLevel) : { amount: 0, resName: '', resIcon: '', isDiscounted: false, originalAmount: 0 };
  const upkeepSec = gm.getUpkeepIntervalSeconds();

  return (
    <div className="absolute inset-0 z-40 flex items-end md:relative md:inset-auto md:w-[620px] lg:w-[700px] xl:w-[780px] md:h-full md:shrink-0 md:z-20 select-none">
      {/* ── 배경 어두운 백드롭 (모바일 전용 백드롭, 데스크탑은 좌측 뷰가 노출되도록 숨김) ── */}
      <div
        className="absolute inset-0 bg-[#08090b]/80 backdrop-blur-sm transition-opacity animate-fade-in md:hidden"
        onClick={() => {
          handlePlayClick();
          onClose();
        }}
      />

      {/* ── 슬라이드업 바텀시트(모바일) / 사이드 드로어(PC) ── */}
      <div
        ref={drawerRef}
        className="relative z-10 flex flex-col w-full h-full border-t md:border-t-0 md:border-l border-[#3d372e] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] rounded-t-2xl md:rounded-none overflow-hidden animate-drawer-enter"
        style={{
          backgroundImage: "linear-gradient(rgba(10, 12, 16, 0.40), rgba(6, 8, 12, 0.60)), url('assets/ark_citadel_hub.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 🚀 시설 카드 클릭 시 상단 워크스테이션 모달 헤더로 승강하는 전환 배너 */}
        {transitionBanner && (
          <div
            className="absolute z-50 overflow-hidden pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-b border-[#b89758] shadow-[0_16px_40px_rgba(0,0,0,0.95)]"
            style={{
              top: transitionBanner.animating ? 0 : transitionBanner.rect.top,
              left: transitionBanner.animating ? 0 : transitionBanner.rect.left,
              width: transitionBanner.animating ? '100%' : transitionBanner.rect.width,
              height: transitionBanner.animating ? (window.innerWidth >= 768 ? 224 : 128) : transitionBanner.rect.height,
              borderRadius: transitionBanner.animating ? '0px' : '16px',
            }}
          >
            <img
              src={transitionBanner.image}
              alt={transitionBanner.title}
              className="w-full h-full object-cover filter brightness-100 contrast-105 saturate-110"
            />
            {/* 상단 및 하단 그라데이션 */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#08090b]/80 via-[#08090b]/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 z-20">
              <h2 className="text-sm sm:text-base font-extrabold text-[#ededed] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {transitionBanner.title}
              </h2>
            </div>
          </div>
        )}
        {/* 모바일 상단 드래그 핸들 */}
        <div 
          className="md:hidden flex items-center justify-center py-2 bg-[#0d0f14]/80 shrink-0"
        >
          <div className="w-10 h-1 rounded-full bg-[#3d372e]" />
        </div>

        {/* ── 상단 사령부 헤더 ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0b0e]/80 border-b border-[#242732]/70 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {activeView !== 'banners' && (
            <button
              type="button"
              onClick={() => {
                handlePlayClick();
                setActiveView('banners');
              }}
              className="px-2 py-1 rounded bg-[#1a1c22] border border-[#3d372e] text-[#dcc496] font-bold text-xs hover:bg-[#232733] transition-colors cursor-pointer mr-1"
            >
              ← {tr('뒤로')}
            </button>
          )}
          <span className="text-xl">🏰</span>
          <div>
            <h2 className="text-sm md:text-base font-bold text-[#ededed] tracking-tight">
              {activeView === 'bonfire' && tr('방주의 성화')}
              {activeView === 'facilities' && tr('방주 시설 관리 (건설 & 증축)')}
              {activeView === 'workstations' && tr('성채 시설 진입')}
              {activeView === 'banners' && tr('방주 성채 사령부 (Citadel Command)')}
            </h2>
            <p className="text-[11px] text-[#9da3af]">
              {activeView === 'banners' && tr('성채의 신성한 성화, 13종 인프라 및 핵심 활동 관리')}
              {activeView === 'bonfire' && tr('목재를 공헌하여 전 성채 생산 +15% 및 버프를 활성화합니다.')}
              {activeView === 'facilities' && tr('성채 건물의 단계적 건설 및 증축 현황을 확인합니다.')}
              {activeView === 'workstations' && tr('입장 가능한 실제 활동 시설로 즉시 진입합니다.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handlePlayClick();
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#181113] border border-[#4a2426] text-[#c56060] hover:text-[#e07b7b] hover:bg-[#2a1618] hover:border-[#85383b] transition-all cursor-pointer font-bold shadow-xs active:scale-95"
          title={tr('닫기 (Esc)')}
        >
          ✕
        </button>
      </div>

      {/* ── 본문 콘텐츠 영역 (스크롤 지원) ── */}
      <div className="flex-1 overflow-y-auto tg-scrollbar p-3.5 md:p-4 space-y-3.5">
        
        {/* ═════════════════════════════════════════════════════════════
            VIEW 1: 3대 마스터 배너 메인 화면 (Step 2)
            ═════════════════════════════════════════════════════════════ */}
        {activeView === 'banners' && (
          <div className="flex flex-col gap-3.5 max-w-xl mx-auto w-full pt-1">
            
            {/* 🔥 【배너 1】 방주의 성화 카드 */}
            <div
              onClick={() => {
                handlePlayClick();
                if (onOpenBonfireModal) {
                  onClose();
                  onOpenBonfireModal();
                } else {
                  setActiveView('bonfire');
                }
              }}
              className={`relative overflow-hidden p-3.5 rounded-xl cursor-pointer transition-all border backdrop-blur-md group ${
                hasWarmth
                  ? 'border-[#b89758]/70 shadow-[0_0_16px_rgba(184,151,88,0.25)] hover:border-[#dcc496]'
                  : 'border-[#3d372e]/65 hover:border-[#5a4b35]'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                style={{
                  backgroundImage: "url('assets/citadel_bonfire.jpg')",
                  filter: hasWarmth ? 'brightness(0.35) contrast(1.15)' : 'brightness(0.2) grayscale(0.8)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14]/90 via-[#0d0f14]/75 to-[#0d0f14]/50 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none drop-shadow">🔥</span>
                    <h3 className="text-sm font-bold text-[#dcc496] tracking-tight">
                      {tr('【방주의 성화】')}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    hasWarmth
                      ? 'bg-[#b89758]/25 text-[#dcc496] border border-[#b89758]/50 animate-pulse'
                      : 'bg-[#242732]/80 text-[#9da3af] border border-[#3d4252]/70'
                  }`}>
                    {hasWarmth ? `온기 가동 중 (${warmthTimeStr})` : `성화 꺼짐 (${warmthTimeStr})`}
                  </span>
                </div>
                <p className="text-[11px] text-[#9da3af] leading-relaxed">
                  {hasWarmth
                    ? tr('✨ 전 성채 생산량 +15%, 전투 EXP +20%, 성채 용병 지속 재생 온기 버프 활성화 중')
                    : tr('영목(목재)을 공헌하여 거점의 불씨를 지피고 온기 3대 버프를 활성화하십시오.')}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2720]/70 text-[11px] text-[#b89758] font-bold">
                  <span>{tr('영목 줍기 & 불씨 지피기')}</span>
                  <span>{tr('성화 관리 바로가기')} ▶</span>
                </div>
              </div>
            </div>

            {/* 🏛️ 【배너 2】 방주 시설 관리 카드 */}
            <div
              onClick={() => {
                handlePlayClick();
                setActiveView('facilities');
              }}
              data-tutorial-target={
                activeView === 'banners' && (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' || tutorialStepId === 'TUTORIAL_BUILD_TAVERN')
                  ? (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' ? 'build-refinery' : 'build-tavern')
                  : undefined
              }
              className="relative overflow-hidden p-3.5 rounded-xl border border-[#3d372e]/65 hover:border-[#b89758] cursor-pointer transition-all shadow-md group"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                style={{
                  backgroundImage: "url('assets/ark_citadel_hub.jpg')",
                  filter: 'brightness(0.25) contrast(1.15)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14]/90 via-[#0d0f14]/75 to-[#0d0f14]/50 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none drop-shadow">🏛️</span>
                    <h3 className="text-sm font-bold text-[#ededed] group-hover:text-[#dcc496] tracking-tight">
                      {tr('【방주 시설 관리】')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#1f2330]/80 text-[#9da3af] border border-[#2c3245]/70">
                      {tr('완공')} {totalBuiltCount}/13
                    </span>
                    {upgradeableCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#b89758]/20 text-[#dcc496] font-bold border border-[#b89758]/40 animate-pulse">
                        {tr('증축 가능')} {upgradeableCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[#9da3af] leading-relaxed">
                  {tr('13종 성채 건물의 단계적 건설 및 증축 현황을 초간결 목록으로 확인하고 관리합니다.')}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262933]/70 text-[11px] text-[#b89758] font-bold">
                  <span>{tr('전체 성채 시설 건설 & 증축 목록')}</span>
                  <span>목록 열기 ▶</span>
                </div>
              </div>
            </div>

            {/* 🏰 【배너 3】 성채 시설 진입 카드 */}
            <div
              onClick={() => {
                handlePlayClick();
                setActiveView('workstations');
              }}
              data-tutorial-target={
                activeView === 'banners' && tutorialStepId === 'TUTORIAL_ENTER_TAVERN'
                  ? 'enter-tavern'
                  : undefined
              }
              className="relative overflow-hidden p-3.5 rounded-xl border border-[#3d372e]/65 hover:border-[#a875d4] cursor-pointer transition-all shadow-md group"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                style={{
                  backgroundImage: "url('assets/menu_barracks.jpg')",
                  filter: 'brightness(0.28) contrast(1.15)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14]/90 via-[#0d0f14]/75 to-[#0d0f14]/50 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none drop-shadow">🏰</span>
                    <h3 className="text-sm font-bold text-[#ededed] group-hover:text-[#e0b8ff] tracking-tight">
                      {tr('【성채 시설 진입】')}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#2a1e35]/80 text-[#ce93d8] font-bold text-[11px] border border-[#5c377d]/70">
                    {tr('활동 거점 12종')}
                  </span>
                </div>
                <p className="text-[11px] text-[#9da3af] leading-relaxed">
                  {tr('퀘스트, 심연 강하, 병영, 대장간, 주점, 차원 게이트 등 실제 내부 패널 진입이 가능한 시설로 즉시 입장합니다.')}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#292233]/70 text-[11px] text-[#ce93d8] font-bold">
                  <span>{tr('퀘스트·심연강하·병영·차원게이트')}</span>
                  <span>거점 입장 ▶</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            VIEW 2: 방주의 성화 온기 관리 (Step 3-A)
            ═════════════════════════════════════════════════════════════ */}
        {activeView === 'bonfire' && (
          <div className="flex flex-col gap-3.5 max-w-lg mx-auto w-full pt-1">
            {/* 성화 게이지 카드 */}
            <div className="p-4 rounded-xl bg-[#161820]/70 border border-[#3d372e]/65 backdrop-blur-md flex flex-col items-center text-center">
              <span className="text-4xl mb-2 drop-shadow-[0_0_16px_rgba(255,123,37,0.5)]">🔥</span>
              <h3 className="text-base font-bold text-[#dcc496] mb-1">
                {tr('신성한 방주의 성화')}
              </h3>
              <p className="text-xs text-[#9da3af] max-w-md leading-relaxed mb-3">
                {hasWarmth
                  ? tr('신성한 온기가 방주 거점 전역을 보호하고 있습니다. (전 성채 생산량 +15%, 전투 EXP +20%, 성채 용병 지속 회복)')
                  : tr('영목(목재)을 단계별로 바쳐 성화를 완충하면 5분간 온기 3대 버프가 지속됩니다.')}
              </p>

              {/* 온기 스택 시각화 */}
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                      step <= (gm.bonfireStacks || 0)
                        ? 'bg-[#b89758] text-[#08090b] border-[#dcc496] shadow-[0_0_8px_rgba(184,151,88,0.5)]'
                        : 'bg-[#101216] text-[#585e6b] border-[#242732]'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>

              <div className="text-xs font-mono font-bold text-[#b89758] mb-4">
                {hasWarmth ? `${tr('온기 잔여 시간')}: ${warmthTimeStr}` : `${tr('현재 불씨 스택')}: ${gm.bonfireStacks || 0}/5`}
              </div>

              {/* 조작 버튼 그룹: 영목 줍기 & 불씨 지피기 */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    handlePlayClick();
                    gm.gatherWood();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#1a1c24] border border-[#3d4252] text-[#ededed] font-bold text-xs hover:border-[#b89758] hover:text-[#dcc496] transition-all cursor-pointer"
                >
                  🪵 {tr('영목 줍기 (+1~3 목재)')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePlayClick();
                    gm.stokeFire();
                  }}
                  disabled={(state.resources?.wood || 0) < ([5, 10, 15, 20, 25][state.bonfireStacks] || 5)}
                  className="flex-1 py-2.5 px-3 rounded-lg tg-btn-gold text-xs font-bold cursor-pointer"
                >
                  🔥 {hasWarmth ? tr('온기 시간 연장 (+30초)') : tr('불씨 지피기')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            VIEW 3: 초간결 린(Lean) 시설 관리 목록 (Step 3-B)
            - 건설 재료 나열을 배제한 깔끔한 리스트
            ═════════════════════════════════════════════════════════════ */}
        {activeView === 'facilities' && (
          <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
            {/* 🏛️ 방주 3대 핵심 인프라 시너지 현황 위젯 */}
            {(() => {
              const syn = gm.getInfraSynergies();
              const butcheryLv = state.buildings['butchery']?.level || 0;
              const marketLv = state.buildings['market']?.level || 0;
              const alchemyLv = state.buildings['alchemy']?.level || 0;

              return (
                <div className="p-3 bg-[#0e1422]/75 border border-[#202c42]/70 rounded-xl flex flex-col gap-2 shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#c8aa6e] font-bold flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>{tr('핵심 인프라 테크 시너지')}</span>
                      <EncyclopediaBadge query="인프라" tab="systems" label={tr('시너지 백과')} compact />
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {/* 🥩 대량 배급제 */}
                    <div className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                      syn.foodSynergy
                        ? 'bg-[#1b2b22]/90 border-[#38ef7d66] text-[#38ef7d]' : 'bg-[#141822]/80 border-[#222b3d] text-[#8b9bb4] opacity-70'
                    }`}>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span>🥩</span>
                        <span>{tr('대량 배급제')}</span>
                      </div>
                      <div className="text-[9px] mt-0.5">
                        {syn.foodSynergy ? tr('식량 유지비 -30%') : `${tr('정제소 Lv.5 필요')} (${butcheryLv}/5)`}
                      </div>
                      <div className="text-[8px] font-mono mt-0.5 font-bold">
                        {syn.foodSynergy ? `● ${tr('활성화됨')}` : `○ ${tr('미달성')}`}
                      </div>
                    </div>

                    {/* ⚖️ 상업 네트워크 */}
                    <div className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                      syn.goldSynergy
                        ? 'bg-[#2b2716]/90 border-[#ffd54f66] text-[#ffd54f]' : 'bg-[#141822]/80 border-[#222b3d] text-[#8b9bb4] opacity-70'
                    }`}>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span>⚖️</span>
                        <span>{tr('상업 네트워크')}</span>
                      </div>
                      <div className="text-[9px] mt-0.5">
                        {syn.goldSynergy ? tr('골드 유지비 -25%') : `${tr('블랙마켓 Lv.5 필요')} (${marketLv}/5)`}
                      </div>
                      <div className="text-[8px] font-mono mt-0.5 font-bold">
                        {syn.goldSynergy ? `● ${tr('활성화됨')}` : `○ ${tr('미달성')}`}
                      </div>
                    </div>

                    {/* 🧪 에테르 환류관 */}
                    <div className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                      syn.etherSynergy
                        ? 'bg-[#171920]/90 border-[#c8aa6e66] text-[#c8aa6e]' : 'bg-[#141822]/80 border-[#222b3d] text-[#8b9bb4] opacity-70'
                    }`}>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span>🧪</span>
                        <span>{tr('에테르 환류관')}</span>
                      </div>
                      <div className="text-[9px] mt-0.5">
                        {syn.etherSynergy ? tr('마도 에테르 -25%') : `${tr('연금공방 Lv.6 필요')} (${alchemyLv}/6)`}
                      </div>
                      <div className="text-[8px] font-mono mt-0.5 font-bold">
                        {syn.etherSynergy ? `● ${tr('활성화됨')}` : `○ ${tr('미달성')}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="px-1 py-0.5 text-[11px] text-[#9da3af] flex items-center justify-between">
              <span>{tr('시설을 터치하면 상세 효과 확인 및 건설/증축/입장이 가능합니다.')}</span>
              <span className="font-bold text-[#b89758]">{totalBuiltCount}/13 완공</span>
            </div>

            {/* 📜 튜토리얼 주요 생산 시설 순차 재건 진행 배너 */}
            {tutorialProdTarget && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#1c1a14] via-[#242018] to-[#1a1c24] border border-[#ffd54f]/50 shadow-lg flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📜</span>
                    <span className="text-xs font-bold text-[#ffd54f]">{tr('튜토리얼 생산 시설 재건 지침')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#ffd54f]/20 text-[#ffd54f] border border-[#ffd54f]/30">
                    {tutorialProdTarget.stepName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#d8e3f5]">
                  <span className="min-w-0 truncate">
                    {tr('현재 복원 목표')}: <strong className="text-[#ffd54f]">[{tutorialProdTarget.targetName}]</strong>
                    {!tutorialProdTarget.isUnlocked && (
                      <span className="text-[#ff7043] ml-1.5 font-bold">({tr('퀘스트 보상 수령 필요')})</span>
                    )}
                  </span>
                  {tutorialProdTarget.isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        handlePlayClick();
                        setSelectedBuildingId(tutorialProdTarget.targetId);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffd54f] to-[#ffb300] text-black font-extrabold text-[11px] shadow hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
                    >
                      {tr('목표 시설 선택')} ➔
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handlePlayClick();
                        onEnterDrawer('quests');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#2a1714] border border-[#ff7043] text-[#ffab91] font-extrabold text-[11px] shadow hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
                    >
                      {tr('퀘스트 확인')} ➔
                    </button>
                  )}
                </div>
              </div>
            )}

            {buildingsList.map(item => {
              const b = state.buildings[item.id];
              if (!b) return null;
              const isBuilt = b.level > 0;
              const curLv = b.maxLevel || b.level;
              const isMax = curLv >= 10;
              const isConstructing = !!b.construction;
              const remainSec = isConstructing ? Math.max(1, Math.ceil((b.construction!.startedAt + b.construction!.durationMs - now) / 1000)) : 0;
              const progressPct = isConstructing ? Math.min(100, Math.max(0, Math.floor(((now - b.construction!.startedAt) / b.construction!.durationMs) * 100))) : 0;
              const targetLv = b.construction?.targetLevel || b.level + 1;
              const cost = gm.getBuildingUpgradeCost(item.id, curLv);
              const canAfford = Object.entries(cost).every(
                ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
              );
              const prereq = gm.checkBuildingPrerequisites(item.id, curLv + 1);

              const isHighlighted = highlightedBuildingId === item.id;
              const isTutorialTarget = Boolean(tutorialProdTarget && tutorialProdTarget.targetId === item.id && !isBuilt);

              return (
                <div
                  key={item.id}
                  id={`citadel-building-row-${item.id}`}
                  data-tutorial-target={
                    selectedBuildingId !== item.id
                      ? (item.id === 'butchery' && !isBuilt && (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' || !tutorialStepId)
                        ? 'build-refinery'
                        : item.id === 'tavern' && !isBuilt && tutorialStepId === 'TUTORIAL_BUILD_TAVERN'
                        ? 'build-tavern'
                        : isTutorialTarget
                        ? 'tutorial-production-target'
                        : undefined)
                      : undefined
                  }
                  onClick={() => {
                    handlePlayClick();
                    setSelectedBuildingId(item.id);
                  }}
                  className={`flex flex-col justify-center p-3.5 sm:p-4 min-h-[76px] sm:min-h-[82px] rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                    isTutorialTarget
                      ? 'ring-2 ring-[#ffd54f] border-[#ffd54f] shadow-[0_0_16px_rgba(255,213,79,0.35)] bg-[#1e1c16]/75'
                      : isHighlighted ? 'ring-2 ring-[#b89758] shadow-[0_0_12px_rgba(184,151,88,0.5)]' : ''
                  } ${
                    isConstructing
                      ? 'bg-[#181510]/75 border-[#b89758]/60 shadow-[0_0_12px_rgba(184,151,88,0.2)]'
                      : isBuilt
                      ? 'bg-[#12151e]/65 border-[#3d372e]/60 hover:border-[#b89758] hover:bg-[#181d2a]/80'
                      : 'bg-[#0a0d14]/45 border-[#202738]/50 opacity-60 hover:opacity-100 hover:bg-[#101420]/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-[#0a0d14]/70 border border-[#3d372e]/60 flex items-center justify-center shrink-0 shadow-inner">
                        <GameIcon name={b.id} icon={b.icon} size={24} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#ededed] truncate">
                            {b.name}
                          </span>
                          {isTutorialTarget && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-gradient-to-r from-[#ffd54f] to-[#b89758] text-[#08090b] shadow-xs animate-pulse">
                              ⭐ {tr('튜토리얼 목표')}
                            </span>
                          )}
                          {isBuilt ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#b89758]/15 text-[#dcc496] border border-[#b89758]/30">
                              Lv.{b.level}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#262933] text-[#9da3af]">
                              미건설
                            </span>
                          )}
                          {item.drawerKey && isBuilt && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#2a1e35] text-[#ce93d8] border border-[#ce93d8]/30">
                              입장가능
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[#9da3af] truncate mt-0.5">
                          {b.description || tr('방주 거점 필수 인프라 시설')}
                        </p>
                      </div>
                    </div>

                    {/* 우측 간결 상태 뱃지 */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isTutorialTarget && !isConstructing && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#ffd54f]/20 text-[#ffd54f] border border-[#ffd54f]/40 flex items-center gap-1 animate-pulse">
                          <span>🔨</span>
                          <span>{tr('필수 건설')}</span>
                        </span>
                      )}
                      {isConstructing ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono bg-[#b89758]/20 text-[#ffd54f] border border-[#b89758]/50 animate-pulse flex items-center gap-1">
                          <span>🔨</span>
                          <span>{progressPct}% ({formatTimeLeft(remainSec, lang)})</span>
                        </span>
                      ) : isMax ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#262933] text-[#9da3af]">
                          최고 레벨
                        </span>
                      ) : !prereq.allowed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e222d] text-[#78889e]">
                          선행 필요
                        </span>
                      ) : canAfford ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#52784c]/20 text-[#9cd494] border border-[#52784c]/40 flex items-center gap-1">
                          <span>⬆</span>
                          <span>증축 가능</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-[#585e6b]">
                          재료 부족
                        </span>
                      )}
                      <span className="text-[#b89758] text-xs font-bold">▶</span>
                    </div>
                  </div>

                  {/* 🔨 공사 진행 중일 때 하단 실시간 진행 프로그래스바 */}
                  {isConstructing && (
                    <div className="w-full mt-2.5 pt-2 border-t border-[#b89758]/30 flex flex-col gap-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#ffd54f] font-bold flex items-center gap-1.5">
                          <span className="animate-spin text-xs">⚙️</span>
                          <span>{tr('공사 진행 중')} (Lv.{b.level} ➔ Lv.{targetLv})</span>
                        </span>
                        <span className="text-[#f5ecd7] font-bold">
                          ⏳ {formatTimeLeft(remainSec, lang)} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#08090b] rounded-full overflow-hidden border border-[#b89758]/40 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#b89758] via-[#ffd54f] to-[#e6c88b] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,213,79,0.5)]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            VIEW 4: 성채 활동 시설 12종 목록 (Step 3-C) - 상단 배너 카드 뷰
            ═════════════════════════════════════════════════════════════ */}
        {activeView === 'workstations' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto w-full">
            {WORKSTATION_ITEMS.map(item => {
              const isLocked = !item.isBuilt;
              const buildingLevel = item.buildingId ? state.buildings[item.buildingId]?.level : undefined;

              return (
                <div
                  key={item.key}
                  id={`workstation-card-${item.key}`}
                  data-tutorial-target={item.key === 'tavern' && !isLocked ? 'enter-tavern' : undefined}
                  onClick={(e) => handleWorkstationClick(item, e.currentTarget)}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 select-none shadow-lg ${
                    isLocked
                      ? 'bg-[#0d1017]/80 border-[#222b3d]/70 opacity-80 cursor-pointer hover:border-[#384863]'
                      : 'bg-[#10141d] border-[#3d372e]/80 hover:border-[#b89758] hover:shadow-[0_8px_24px_rgba(184,151,88,0.22)] cursor-pointer active:scale-[0.985]'
                  }`}
                >
                  {/* ── 시설 내부 상단 배너 이미지 프레임 ── */}
                  <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-[#07090e] border-b border-[#242b3b]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`facility-banner-img w-full h-full object-cover transition-all duration-700 ease-out ${
                        isLocked
                          ? 'grayscale brightness-[0.52] contrast-110'
                          : 'grayscale-0 brightness-100 contrast-105 saturate-110 group-hover:scale-105 group-hover:brightness-110'
                      }`}
                      style={{
                        transition: 'filter 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />

                    {/* 상단 비네팅 (타이틀 가독성 확보) */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#08090b]/85 via-[#08090b]/40 to-transparent pointer-events-none" />

                    {/* 하단 자연스러운 그라데이션 블렌드 */}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#10141d] via-[#10141d]/60 to-transparent pointer-events-none" />

                    {/* 좌측 상단: 아이콘 + 시설 타이틀 */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex items-center gap-2 max-w-[calc(100%-80px)]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-md backdrop-blur-xs transition-colors ${
                        isLocked
                          ? 'bg-black/60 border border-[#2a3447]/60 text-[#718096]'
                          : 'bg-black/70 border border-[#b89758]/60 text-white group-hover:border-[#ffd54f]'
                      }`}>
                        <span className="leading-none drop-shadow">{item.icon}</span>
                      </div>
                      <h4 className={`text-xs sm:text-sm font-extrabold tracking-tight truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] transition-colors ${
                        isLocked ? 'text-[#8896ab]' : 'text-[#ededed] group-hover:text-[#ffd54f]'
                      }`}>
                        {item.name}
                      </h4>
                    </div>

                    {/* 우측 상단: 레벨 뱃지 및 상태 태그 */}
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5">
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-black/80 text-[#8896ab] border border-[#374154] backdrop-blur-xs shadow-md flex items-center gap-1">
                          <span>🔒</span>
                          <span>{tr('미해금')}</span>
                        </span>
                      ) : (
                        <>
                          {buildingLevel !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#b89758]/30 text-[#ffd54f] border border-[#b89758]/70 backdrop-blur-xs shadow-md">
                              Lv.{buildingLevel}
                            </span>
                          )}
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md backdrop-blur-xs ${
                              item.key === 'codex' && registerableCodexCount > 0
                                ? 'bg-[#ef5350] text-white animate-pulse'
                                : 'bg-gradient-to-r from-[#ffd54f] to-[#b89758] text-[#08090b]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* 미해금 중앙 락 오버레이 및 건설 안내 */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-xl bg-[#090b10]/90 border border-[#3b475e]/80 text-[#cfd8e8] text-xs font-bold shadow-2xl flex items-center gap-1.5">
                          <span className="text-sm">🔒</span>
                          <span>{tr('시설 미건설 (터치하여 건설하기)')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── 하단 설명 및 입장 액션 바 ── */}
                  <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2.5 bg-[#10141d]">
                    <p className={`text-xs line-clamp-2 leading-relaxed transition-colors ${
                      isLocked ? 'text-[#5a6578]' : 'text-[#9da3af] group-hover:text-[#d1d7e3]'
                    }`}>
                      {isLocked ? tr('성채 시설 관리에서 해당 시설을 건설하면 즉시 이용할 수 있습니다.') : item.sub}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#1e2330]/80">
                      <span className={`text-[11px] font-bold ${
                        isLocked ? 'text-[#7d8ba1]' : 'text-[#b89758]'
                      }`}>
                        {isLocked ? `🔨 ${tr('건설 필요')}` : `✨ ${tr('성채 핵심 거점')}`}
                      </span>

                      {isLocked ? (
                        <div className="px-2.5 py-1 rounded-lg bg-[#141924] border border-[#26334a] text-[#8896ab] hover:text-[#dcc496] hover:border-[#b89758] text-xs font-bold flex items-center gap-1 transition-colors">
                          <span>{tr('건설하러 가기')}</span>
                          <span>➔</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#b89758]/20 to-[#ffd54f]/15 border border-[#b89758]/60 group-hover:from-[#b89758] group-hover:to-[#ffd54f] text-[#dcc496] group-hover:text-[#08090b] text-xs font-black transition-all shadow-xs flex items-center gap-1">
                          <span>{tr('입장하기')}</span>
                          <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">▶</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════
          【건설·증축·입장 통합 모달】 (리스트 아이템 터치 시 오픈)
          기존 상세 모달의 모든 구성(공사진행, 테크선행, 로어, 가동효과, 다음특전, 커스텀자원) 완비
          ═════════════════════════════════════════════════════════════ */}
      {selectedBuildingId && selectedBuildingData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs select-none"
          onClick={() => {
            handlePlayClick();
            setSelectedBuildingId(null);
            onClearHighlight?.();
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#141720] border border-[#b89758] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. 모달 헤더 바 (시네마틱 배너 헤더) */}
            <div className="relative w-full h-32 sm:h-38 bg-[#0a0d14] border-b border-[#b89758]/60 shrink-0 overflow-hidden">
              {BUILDING_IMAGE_MAP[selectedBuildingData.id] ? (
                <img
                  src={BUILDING_IMAGE_MAP[selectedBuildingData.id]}
                  alt={selectedBuildingData.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                    selectedBuildingData.level === 0 ? 'grayscale brightness-[0.52] contrast-110' : 'brightness-100 contrast-105 saturate-110'
                  }`}
                  style={{
                    transition: 'filter 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              ) : null}
              {/* 상단 및 하단 그라데이션 */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#141720] via-[#141720]/80 to-transparent pointer-events-none" />

              {/* 헤더 콘텐츠 */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2.5 max-w-[calc(100%-60px)]">
                <div className="w-10 h-10 rounded-xl bg-black/75 border border-[#b89758]/60 flex items-center justify-center text-2xl drop-shadow shadow-md">
                  <GameIcon name={selectedBuildingData.id} icon={selectedBuildingData.icon} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#ededed] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                      {selectedBuildingData.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#b89758]/30 text-[#ffd54f] border border-[#b89758]/60 shadow-xs">
                      Lv.{selectedBuildingData.level}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cfd8e8] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] line-clamp-1 mt-0.5">
                    {selectedBuildingData.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handlePlayClick();
                  setSelectedBuildingId(null);
                  onClearHighlight?.();
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-black/70 hover:bg-[#2a1618] border border-[#4a2426] text-[#c56060] hover:text-[#e07b7b] hover:border-[#85383b] transition-all cursor-pointer font-bold shadow-md active:scale-95 text-sm"
                title={tr('닫기 (Esc)')}
              >
                ✕
              </button>
            </div>

            {/* 2. 모달 스크롤 본문 */}
            <div className="flex-1 overflow-y-auto tg-scrollbar p-3.5 sm:p-4 space-y-3 text-xs">
              
              {/* 🔒 튜토리얼 생산 시설 우선 복원 지침 배너 */}
              {tutorialRestriction.isRestricted && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#2a1714] to-[#1c1214] border border-[#ff7043]/70 flex items-start gap-2.5 shadow-md animate-fade-in">
                  <span className="text-xl shrink-0 drop-shadow">🛡️</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#ff8a65]">
                        {tr('방주 통제실 튜토리얼 지침')}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-[#ff7043]/25 text-[#ffab91] border border-[#ff7043]/40">
                        {tr('진행 필수')}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#ffd0c2] leading-relaxed mt-1">
                      {tr(tutorialRestriction.message || '우선 나머지 생산 시설 건설을 완료해 주십시오.')}
                    </p>
                    {tutorialRestriction.target && tutorialRestriction.target.targetId !== selectedBuildingId && (
                      <button
                        type="button"
                        onClick={() => {
                          handlePlayClick();
                          setSelectedBuildingId(tutorialRestriction.target!.targetId);
                        }}
                        className="mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#ff7043] to-[#e64a19] text-[#08090b] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                      >
                        <span>{tr(`목표 시설 [${tutorialRestriction.target.targetName}] 건설로 이동`)}</span>
                        <span>➔</span>
                      </button>
                    )}
                    {tutorialRestriction.target && !tutorialRestriction.target.isUnlocked && (
                      <button
                        type="button"
                        onClick={() => {
                          handlePlayClick();
                          onEnterDrawer('quests');
                        }}
                        className="mt-2 py-1.5 px-3 rounded-lg bg-[#2a1714] border border-[#ff7043] text-[#ffab91] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                      >
                        <span>{tr('지휘관 퀘스트 보상 수령하러 가기')}</span>
                        <span>➔</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 🔨 공사 진행 중 안내 배너 */}
              {selectedIsConstructing && (
                <div className="p-3 rounded-xl bg-[#0a1424] border border-[#c8aa6e66] flex flex-col gap-2 shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-[#c8aa6e]">
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin">⚙️</span>
                      <span>Lv.{selectedBuildingData.construction!.targetLevel} {tr('증축 공사 진행 중...')}</span>
                    </span>
                    <span className="font-mono">{formatTimeLeft(selectedRemainSec, lang)} ({selectedProgressPct}%)</span>
                  </div>
                  <div className="w-full bg-[#050c18] rounded-full h-2 overflow-hidden border border-[#c8aa6e33]">
                    <div
                      className="bg-gradient-to-r from-[#c8aa6e] to-[#00f2fe] h-full transition-all duration-300 shadow-[0_0_8px_#c8aa6e]"
                      style={{ width: `${selectedProgressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 🔒 테크트리 선행 미달 경고 배너 */}
              {!selectedPrereq.allowed && !selectedIsMax && (
                <div className="p-3 rounded-xl bg-[#2a1412] border border-[#ef535066] text-xs text-[#ff8a80] flex items-center gap-2.5 shadow-sm">
                  <span className="text-xl">🔒</span>
                  <div>
                    <div className="font-bold text-[#ef5350]">{tr('테크트리 선행 조건 미달')}</div>
                    <div className="text-[11px] text-[#cfd8dc] mt-0.5">{selectedPrereq.reason}</div>
                  </div>
                </div>
              )}

              {/* 📜 상단: 시설 서사 및 배경 로어 */}
              <div className="p-3 rounded-xl bg-[#0d121c]/90 border border-[#202738] flex flex-col gap-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#c8aa6e] font-bold">📜 {tr('시설 서사 및 배경')}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e]">
                    {selectedBuildingData.level > 0 ? `현재 Lv.${selectedBuildingData.level}` : tr('미건설 시설')}
                  </span>
                </div>
                <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                  {selectedLore}
                </div>
              </div>

              {/* ✨ 중단 1: 현재 가동 효과 */}
              {selectedStatusInfo && (
                <div className="p-3 rounded-xl bg-[#0a1816]/80 border border-[#1e3e34] flex flex-col gap-1 shadow-xs">
                  <div className="flex items-center justify-between text-[#9cd494] font-bold text-xs">
                    <span>✨ {tr('현재 가동 효과')} (Lv.{selectedBuildingData.level})</span>
                    {selectedStatusInfo.badge && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]">
                        {selectedStatusInfo.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#e0e6ed] mt-0.5 font-medium leading-relaxed">
                    {selectedStatusInfo.currentText}
                  </div>
                </div>
              )}

              {/* 🔮 중단 2: 다음 단계 승급 프리뷰 & 유지비 표기 */}
              {selectedStatusInfo && (
                <div className="p-3 rounded-xl bg-[#181326]/80 border border-[#2d2244] flex flex-col gap-1 shadow-xs">
                  <div className="text-[#ffd54f] font-bold text-xs flex items-center justify-between">
                    <span>🔮 {tr('다음 레벨 특전')} (Lv.{selectedNextLevel})</span>
                    {selectedIsMax ? (
                      <span className="text-[10px] text-[#8b9bb4]">MAX</span>
                    ) : (selectedNextUpkeep.amount > 0 || (selectedNextUpkeep.secondaryAmount && selectedNextUpkeep.secondaryAmount > 0)) ? (
                      <span className="text-[10px] font-mono text-[#ff8a80]">
                        ({[
                          selectedNextUpkeep.amount > 0 ? `${selectedNextUpkeep.resIcon} -${selectedNextUpkeep.amount}` : '',
                          selectedNextUpkeep.secondaryAmount && selectedNextUpkeep.secondaryAmount > 0 ? `${selectedNextUpkeep.secondaryIcon} -${selectedNextUpkeep.secondaryAmount}` : ''
                        ].filter(Boolean).join(', ')}/{upkeepSec}초)
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-[#ffd54f] mt-0.5 leading-relaxed font-medium">
                    {selectedStatusInfo.nextText}
                    {!selectedIsMax && selectedNextUpkeep.amount > 0 && selectedBuildingData.level < 4 && (
                      <span className="text-[10px] text-[#ff8a80] block mt-0.5">
                        * 4레벨부터 {upkeepSec}초마다 {selectedNextUpkeep.resIcon} {selectedNextUpkeep.resName} {selectedNextUpkeep.amount}개 유지비 소모 (Lv.1~3 무료 유지)
                      </span>
                    )}
                    {!selectedIsMax && (selectedBuildingId === 'lumberCamp' || selectedBuildingId === 'quarry') && selectedNextLevel >= 5 && (
                      <span className="text-[10px] text-[#c8aa6e] block mt-0.5 font-mono">
                        ⚙️ 시설 특화: 골드 유지비 -{Math.min(42, (selectedNextLevel - 4) * 7)}% 고유 감면 적용{selectedBuildingId === 'quarry' && selectedNextLevel >= 7 ? ' (30% 식량 분담)' : ''}
                      </span>
                    )}
                    {!selectedIsMax && selectedNextUpkeep.isDiscounted && (
                      <span className="text-[10px] text-[#38ef7d] block mt-0.5">
                        ✓ 인프라 시너지 감면 적용 중 (정가: {selectedNextUpkeep.originalAmount} ➔ 할인가: {selectedNextUpkeep.amount})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ⚡ / 🔨 하단: 강화 소모 자원 (커스텀 에셋 아이콘 & 충족 녹색 / 부족 적색 뱃지) */}
              {!selectedIsMax && (
                <div className="p-3 rounded-xl bg-[#0e1118] border border-[#222d42] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ededed]">
                      {selectedBuildingData.level > 0 ? tr('⚡ 증축 필요 자원') : tr('🔨 신축 필요 자원')}
                    </span>
                    <span className={selectedCanAfford ? 'text-[10px] text-[#9cd494] font-bold' : 'text-[10px] text-[#ff8585] font-bold animate-pulse'}>
                      {selectedCanAfford ? tr('✅ 모든 재료 보유') : tr('⚠️ 일부 자원 부족')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(selectedCost).map(([resKey, reqAmt]) => {
                      const curAmt = (state.resources as unknown as Record<string, number>)[resKey] || 0;
                      const isEnough = curAmt >= (reqAmt as number);
                      const gmMeta = GameManager.getResourceMeta(resKey as any);
                      const meta = RES_NAMES_AND_ICONS[resKey] || (gmMeta?.name ? { label: gmMeta.name, icon: gmMeta.icon } : { label: resKey, icon: '📦' });

                      return (
                        <div
                          key={resKey}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                            isEnough
                              ? 'bg-[#1b2b20]/90 border-[#38ef7d66] text-[#9cd494]'
                              : 'bg-[#2b1719]/90 border-[#ef535066] text-[#ff8585] animate-pulse'
                          }`}
                        >
                          <GameIcon name={resKey} icon={meta.icon} size={16} />
                          <span className="font-sans text-[11px]">{tr(meta.label)}</span>
                          <span>{curAmt.toLocaleString()}/{(reqAmt as number).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* 3. 모달 하단 액션 버튼 바 */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a0d14] border-t border-[#262933] shrink-0 gap-2">
              {/* 좌측: 시설 입장 버튼 (해당 건물이 입장 가능한 경우) */}
              {selectedDrawerKey && selectedBuildingData.level > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handlePlayClick();
                    setSelectedBuildingId(null);
                    onClose();
                    onEnterDrawer(selectedDrawerKey);
                  }}
                  className="py-2 px-3 rounded-xl bg-[#2a1e35] border border-[#a875d4] text-[#e0b8ff] font-bold text-xs hover:bg-[#352545] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>🚪</span>
                  <span>{tr('시설 바로 입장')}</span>
                </button>
              ) : <div />}

              {/* 우측: 닫기 & 건설/증축 실행 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePlayClick();
                    setSelectedBuildingId(null);
                    onClearHighlight?.();
                  }}
                  className="py-2 px-3 rounded-xl bg-[#1a1c24] border border-[#3d4252] text-[#9da3af] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {tr('닫기')}
                </button>

                {selectedIsConstructing ? (
                  <button
                    type="button"
                    disabled
                    className="py-2 px-4 rounded-xl bg-[#c8aa6e1a] border border-[#c8aa6e88] text-[#c8aa6e] font-bold text-xs opacity-75 cursor-not-allowed animate-pulse"
                  >
                    🔨 {tr('공사 진행 중')} ({formatDuration(selectedRemainSec, lang)})
                  </button>
                ) : tutorialRestriction.isRestricted ? (
                  <button
                    type="button"
                    onClick={() => {
                      handlePlayClick();
                      gm.addLog(`⚠️ [튜토리얼 지침] ${tutorialRestriction.message}`, 'warning');
                    }}
                    className="py-2 px-4 rounded-xl bg-[#2a1714] border border-[#ff7043]/60 text-[#ffab91] font-extrabold text-xs cursor-not-allowed opacity-90 flex items-center gap-1.5 shadow-inner"
                    title={tutorialRestriction.message}
                  >
                    <span>🔒</span>
                    <span>{tr('생산 시설 우선 복원 필요')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-tutorial-target={
                      selectedBuildingId === 'butchery' && selectedBuildingData.level === 0 && (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' || !tutorialStepId)
                        ? 'build-refinery'
                        : selectedBuildingId === 'tavern' && selectedBuildingData.level === 0 && tutorialStepId === 'TUTORIAL_BUILD_TAVERN'
                        ? 'build-tavern'
                        : tutorialProdTarget && selectedBuildingId === tutorialProdTarget.targetId && selectedBuildingData.level === 0
                        ? 'tutorial-confirm-build'
                        : undefined
                    }
                    data-tutorial-confirm-build="true"
                    disabled={selectedIsMax || !selectedPrereq.allowed || !selectedCanAfford}
                    onClick={() => {
                      handlePlayClick();
                      if (!selectedIsMax && selectedPrereq.allowed && gm.buildBuilding(selectedBuildingId)) {
                        setSelectedBuildingId(null);
                        onClearHighlight?.();
                      }
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md ${
                      selectedCanAfford && !selectedIsMax && selectedPrereq.allowed
                        ? 'tg-btn-gold cursor-pointer hover:brightness-110 active:scale-95'
                        : 'bg-[#1b1e28] border border-[#2e3344] text-[#616a7d] cursor-not-allowed opacity-60'
                    }`}
                  >
                    {selectedIsMax
                      ? tr('★ 최고 레벨')
                      : (!selectedPrereq.allowed
                        ? tr('선행 조건 필요')
                        : (selectedBuildingData.level > 0 ? tr('⚡ 레벨업 공사 시작') : tr('🔨 건설 시작')))}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};
