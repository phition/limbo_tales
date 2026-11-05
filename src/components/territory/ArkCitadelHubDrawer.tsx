import React, { useState, useEffect, useMemo } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { formatTimeLeft, formatDuration } from '../../utils/timeUtils';
import { BuildingId } from '../../types/game';
import { GameIcon } from '../GameIcon';

interface ArkCitadelHubDrawerProps {
  onClose: () => void;
  onEnterDrawer: (drawerKey: string) => void;
  initialView?: 'banners' | 'bonfire' | 'facilities' | 'workstations';
  highlightedBuildingId?: string | null;
  onClearHighlight?: () => void;
}

export const ArkCitadelHubDrawer: React.FC<ArkCitadelHubDrawerProps> = ({
  onClose,
  onEnterDrawer,
  initialView = 'banners',
  highlightedBuildingId,
  onClearHighlight,
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

  // 성채 활동 시설 8종
  const WORKSTATION_ITEMS = [
    { key: 'forge',     name: tr('심연의 병기창'), sub: tr('무기·방어구 단조, 장비 강화, 침식 정화'), icon: '⚒️', isBuilt: (state.buildings['blacksmith']?.level || 0) >= 1 },
    { key: 'tavern',    name: tr('방랑자의 라운지'), sub: tr('방랑 용병 모집 계약 및 고용 풀 갱신'), icon: '🍺', isBuilt: (state.buildings['tavern']?.level || 0) >= 1, badge: (state.tavernCandidates || []).length > 0 ? 'NEW' : null },
    { key: 'infirmary', name: tr('생체 복원 병동'), sub: tr('전투 부상 대원 입원 치료 및 완치'), icon: '🏥', isBuilt: (state.buildings['infirmary']?.level || 0) >= 1, badge: (state.infirmaryPatients || []).length > 0 ? `${state.infirmaryPatients.length}인` : null },
    { key: 'storage',   name: tr('방주 중앙 병참고'), sub: tr('전 군수 물자 및 장비·보급품 보관함'), icon: '🏛️', isBuilt: true },
    { key: 'alchemy',   name: tr('에테르 연금 공방'), sub: tr('마도 스킬 비전서 강화 및 장비 룬 인챈트'), icon: '🧪', isBuilt: (state.buildings['alchemy']?.level || 0) >= 1 },
    { key: 'market',    name: tr('황혼의 블랙 마켓'), sub: tr('17종 군수물자 거래 및 유지비 주기 연장'), icon: '⚖️', isBuilt: (state.buildings['market']?.level || 0) >= 1 },
    { key: 'barracks',  name: tr('원정단 병영 & 작전실'), sub: tr('4인 파티 편성, 진형 배치, 전직 관리'), icon: '⚔️', isBuilt: true },
    { key: 'cemetery',  name: tr('성채 묘지'), sub: tr('전사한 영령 안치, 추모 EXP 버프 및 가호'), icon: '🪦', isBuilt: true, badge: (state.cemetery || []).length > 0 ? `${state.cemetery.length}위` : null },
  ];

  const handlePlayClick = () => {
    try { SoundManager.getInstance().play('click'); } catch {}
  };

  const selectedBuildingData = selectedBuildingId ? state.buildings[selectedBuildingId] : null;
  const selectedCost = selectedBuildingId && selectedBuildingData ? gm.getBuildingUpgradeCost(selectedBuildingId, selectedBuildingData.level) : {};
  const selectedCanAfford = selectedBuildingData ? Object.entries(selectedCost).every(
    ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
  ) : false;
  const selectedIsMax = selectedBuildingData ? (selectedBuildingData.maxLevel || selectedBuildingData.level) >= 10 : false;
  const selectedPrereq = selectedBuildingId && selectedBuildingData ? gm.checkBuildingPrerequisites(selectedBuildingId, (selectedBuildingData.maxLevel || selectedBuildingData.level) + 1) : { allowed: true };
  const selectedDrawerKey = selectedBuildingId ? buildingsList.find(b => b.id === selectedBuildingId)?.drawerKey : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end select-none">
      {/* ── 배경 어두운 백드롭 (클릭 시 닫기) ── */}
      <div
        className="absolute inset-0 bg-[#08090b]/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          handlePlayClick();
          onClose();
        }}
      />

      {/* ── 슬라이드업 바텀시트(모바일) / 사이드 드로어(PC) ── */}
      <div
        className="relative z-10 flex flex-col w-full md:w-[600px] lg:w-[660px] h-[88vh] md:h-full border-t md:border-t-0 md:border-l border-[#3d372e] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] rounded-t-2xl md:rounded-none overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(18, 20, 24, 0.92), rgba(12, 14, 18, 0.97)), url('assets/citadel_bonfire.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 상단 드래그 핸들 */}
        <div 
          className="md:hidden flex items-center justify-center py-2 bg-[#0d0f14]/80 cursor-pointer"
        >
          <div className="w-10 h-1 rounded-full bg-[#3d372e]" />
        </div>

        {/* ── 상단 사령부 헤더 ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0b0e]/90 border-b border-[#242732] shrink-0 backdrop-blur-md">
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
              {activeView === 'bonfire' && tr('방주의 성화 (온기 관리)')}
              {activeView === 'facilities' && tr('영지 시설 관리 (건설 & 증축)')}
              {activeView === 'workstations' && tr('성채 활동 거점 진입')}
              {activeView === 'banners' && tr('방주 성채 사령부 (Citadel Command)')}
            </h2>
            <p className="text-[11px] text-[#9da3af]">
              {activeView === 'banners' && tr('거점의 신성한 성화, 13종 인프라 및 핵심 활동 관리')}
              {activeView === 'bonfire' && tr('목재를 공헌하여 전 거점 생산 +15% 및 버프를 활성화합니다.')}
              {activeView === 'facilities' && tr('거점 건물의 단계적 건설 및 증축 현황을 확인합니다.')}
              {activeView === 'workstations' && tr('입장 가능한 실제 활동 거점으로 즉시 진입합니다.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handlePlayClick();
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1a1c22] border border-[#2c303b] text-[#9da3af] hover:text-[#dcc496] hover:border-[#b89758] transition-colors cursor-pointer"
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
                setActiveView('bonfire');
              }}
              className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                hasWarmth
                  ? 'bg-gradient-to-r from-[#241a12] via-[#1a1612] to-[#121418] border-[#b89758] shadow-[0_0_16px_rgba(184,151,88,0.25)] hover:border-[#dcc496]'
                  : 'bg-[#151821] border-[#3d372e] hover:border-[#5a4b35] hover:bg-[#1a1e2a]'
              }`}
            >
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
                    : 'bg-[#242732] text-[#9da3af] border border-[#3d4252]'
                }`}>
                  {hasWarmth ? `온기 가동 중 (${warmthTimeStr})` : `성화 꺼짐 (${warmthTimeStr})`}
                </span>
              </div>
              <p className="text-[11px] text-[#9da3af] leading-relaxed">
                {hasWarmth
                  ? tr('✨ 전 영지 생산량 +15%, 전투 EXP +20%, 용병 지속 재생 온기 버프 활성화 중')
                  : tr('영목(목재)을 공헌하여 거점의 불씨를 지피고 온기 3대 버프를 활성화하십시오.')}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2720] text-[11px] text-[#b89758] font-bold">
                <span>{tr('영목 줍기 & 불씨 지피기')}</span>
                <span>온기 관리 바로가기 ▶</span>
              </div>
            </div>

            {/* 🏛️ 【배너 2】 영지 시설 관리 카드 */}
            <div
              onClick={() => {
                handlePlayClick();
                setActiveView('facilities');
              }}
              className="p-3.5 rounded-xl bg-gradient-to-r from-[#171a22] via-[#14161d] to-[#121418] border border-[#3d372e] hover:border-[#b89758] hover:bg-[#1a1e28] cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none drop-shadow">🏛️</span>
                  <h3 className="text-sm font-bold text-[#ededed] group-hover:text-[#dcc496] tracking-tight">
                    {tr('【영지 시설 관리】')}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[#1f2330] text-[#9da3af] border border-[#2c3245]">
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
                {tr('13종 거점 건물의 단계적 건설 및 증축 현황을 초간결 목록으로 확인하고 관리합니다.')}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262933] text-[11px] text-[#b89758] font-bold">
                <span>{tr('전체 시설 건설 & 증축 목록')}</span>
                <span>목록 열기 ▶</span>
              </div>
            </div>

            {/* 🏰 【배너 3】 성채 시설 진입 카드 */}
            <div
              onClick={() => {
                handlePlayClick();
                setActiveView('workstations');
              }}
              className="p-3.5 rounded-xl bg-gradient-to-r from-[#1a1622] via-[#15131b] to-[#121418] border border-[#3d372e] hover:border-[#a875d4] hover:bg-[#1c1626] cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none drop-shadow">🏰</span>
                  <h3 className="text-sm font-bold text-[#ededed] group-hover:text-[#e0b8ff] tracking-tight">
                    {tr('【성채 시설 진입】')}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#2a1e35] text-[#ce93d8] font-bold text-[11px] border border-[#5c377d]">
                  {tr('활동 거점 8종')}
                </span>
              </div>
              <p className="text-[11px] text-[#9da3af] leading-relaxed">
                {tr('대장간, 주점, 병동, 연금공방 등 실제 내부 패널 진입이 가능한 시설로 즉시 입장합니다.')}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#292233] text-[11px] text-[#ce93d8] font-bold">
                <span>{tr('병기창·주점·병동·연금·마켓')}</span>
                <span>거점 입장 ▶</span>
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
            <div className="p-4 rounded-xl bg-[#161820] border border-[#3d372e] flex flex-col items-center text-center">
              <span className="text-4xl mb-2 drop-shadow-[0_0_16px_rgba(255,123,37,0.5)]">🔥</span>
              <h3 className="text-base font-bold text-[#dcc496] mb-1">
                {tr('신성한 방주의 성화')}
              </h3>
              <p className="text-xs text-[#9da3af] max-w-md leading-relaxed mb-3">
                {hasWarmth
                  ? tr('신성한 온기가 방주 거점 전역을 보호하고 있습니다. (전 시설 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 회복)')
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
          <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
            <div className="px-1 py-0.5 text-[11px] text-[#9da3af] flex items-center justify-between">
              <span>{tr('시설을 터치하면 상세 효과 확인 및 건설/증축/입장이 가능합니다.')}</span>
              <span className="font-bold text-[#b89758]">{totalBuiltCount}/13 완공</span>
            </div>

            {buildingsList.map(item => {
              const b = state.buildings[item.id];
              if (!b) return null;
              const isBuilt = b.level > 0;
              const curLv = b.maxLevel || b.level;
              const isMax = curLv >= 10;
              const isConstructing = !!b.construction;
              const cost = gm.getBuildingUpgradeCost(item.id, curLv);
              const canAfford = Object.entries(cost).every(
                ([k, v]) => (state.resources as unknown as Record<string, number>)[k] >= (v as number)
              );
              const prereq = gm.checkBuildingPrerequisites(item.id, curLv + 1);

              const isHighlighted = highlightedBuildingId === item.id;

              return (
                <div
                  key={item.id}
                  id={`citadel-building-row-${item.id}`}
                  onClick={() => {
                    handlePlayClick();
                    setSelectedBuildingId(item.id);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                    isHighlighted ? 'ring-2 ring-[#b89758] shadow-[0_0_12px_rgba(184,151,88,0.5)]' : ''
                  } ${
                    isBuilt
                      ? 'bg-[#151821]/80 border-[#3d372e] hover:border-[#b89758] hover:bg-[#1a1f2b]/90'
                      : 'bg-[#101216]/50 border-[#242732] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-2xl shrink-0 w-8 flex items-center justify-center">
                      <GameIcon name={b.id} icon={b.icon} size={22} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#ededed] truncate">
                          {b.name}
                        </span>
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
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#2a1e35] text-[#ce93d8]">
                            입장가능
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#87724d] truncate mt-0.5">
                        {b.description || tr('방주 거점 필수 인프라 시설')}
                      </p>
                    </div>
                  </div>

                  {/* 우측 간결 상태 뱃지 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConstructing ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b89758]/20 text-[#dcc496] border border-[#b89758]/40 animate-pulse">
                        🔨 건설중
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#52784c]/20 text-[#9cd494] border border-[#52784c]/40">
                        ⬆ 증축 가능
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] text-[#585e6b]">
                        재료 부족
                      </span>
                    )}
                    <span className="text-[#87724d] text-xs">▶</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            VIEW 4: 성채 활동 시설 8종 목록 (Step 3-C)
            ═════════════════════════════════════════════════════════════ */}
        {activeView === 'workstations' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto w-full">
            {WORKSTATION_ITEMS.map(item => (
              <div
                key={item.key}
                onClick={() => {
                  handlePlayClick();
                  if (item.key === 'arena') navigateTo('arena');
                  else onEnterDrawer(item.key);
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-[#151821]/95 border border-[#3d372e] hover:border-[#b89758] hover:bg-[#1a1f2b] transition-all cursor-pointer shadow-md select-none active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="text-2xl shrink-0 leading-none drop-shadow">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-[#ededed] tracking-tight truncate">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#b89758] text-[#08090b]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9da3af] line-clamp-1 mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-[#b89758] font-bold shrink-0">
                  입장 ▶
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════
          【건설·증축·입장 통합 모달】 (리스트 아이템 터치 시 오픈)
          ═════════════════════════════════════════════════════════════ */}
      {selectedBuildingId && selectedBuildingData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
          onClick={() => setSelectedBuildingId(null)}
        >
          <div
            className="relative w-full max-w-md bg-[#161820] border border-[#b89758] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] p-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262933] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  <GameIcon name={selectedBuildingData.id} icon={selectedBuildingData.icon} size={26} />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#ededed]">
                      {selectedBuildingData.name}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#b89758]/20 text-[#dcc496]">
                      Lv.{selectedBuildingData.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#87724d]">{selectedBuildingData.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handlePlayClick();
                  setSelectedBuildingId(null);
                  onClearHighlight?.();
                }}
                className="text-[#9da3af] hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            {/* 증축 필요 재화 목록 (여기서만 자세히 확인!) */}
            {!selectedIsMax && (
              <div className="mb-4 p-3 rounded-lg bg-[#101216] border border-[#242732]">
                <div className="text-[11px] font-bold text-[#dcc496] mb-2 flex items-center justify-between">
                  <span>{tr('다음 단계 증축 소모 비용')} (Lv.{selectedBuildingData.level + 1})</span>
                  <span>{selectedCanAfford ? tr('재화 충족') : tr('재화 부족')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedCost).map(([resKey, reqAmt]) => {
                    const curAmt = (state.resources as unknown as Record<string, number>)[resKey] || 0;
                    const isEnough = curAmt >= (reqAmt as number);
                    return (
                      <div key={resKey} className="flex items-center justify-between p-1.5 rounded bg-[#161820] border border-[#1f222b]">
                        <span className="text-[#9da3af] capitalize">{resKey}</span>
                        <span className={`font-mono font-bold ${isEnough ? 'text-[#9cd494]' : 'text-[#ff8585]'}`}>
                          {curAmt.toLocaleString()} / {(reqAmt as number).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 선행 조건 경고 */}
            {!selectedPrereq.allowed && (
              <div className="mb-3 p-2 rounded bg-[#8c2d2d]/20 border border-[#8c2d2d] text-[#ff8585] text-xs">
                ⚠️ {selectedPrereq.reason || tr('선행 시설 조건 미충족')}
              </div>
            )}

            {/* 하단 액션 버튼 그룹 */}
            <div className="flex gap-2 pt-1">
              {/* 시설 입장 버튼 (해당 건물이 입장 가능한 경우) */}
              {selectedDrawerKey && selectedBuildingData.level > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handlePlayClick();
                    setSelectedBuildingId(null);
                    onClose();
                    if (selectedDrawerKey === 'arena') navigateTo('arena');
                    else onEnterDrawer(selectedDrawerKey);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#2a1e35] border border-[#a875d4] text-[#e0b8ff] font-bold text-xs hover:bg-[#352545] transition-all cursor-pointer"
                >
                  🚪 {tr('시설 내부 입장')}
                </button>
              )}

              {/* 건설 / 증축 실행 버튼 */}
              <button
                type="button"
                disabled={selectedIsMax || !selectedPrereq.allowed || !selectedCanAfford}
                onClick={() => {
                  handlePlayClick();
                  gm.buildBuilding(selectedBuildingId);
                  setSelectedBuildingId(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-lg tg-btn-gold text-xs font-bold cursor-pointer"
              >
                {selectedIsMax ? tr('최고 레벨 도달') : selectedBuildingData.level > 0 ? tr('⬆ 시설 증축 실행') : tr('🔨 시설 신축 실행')}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
