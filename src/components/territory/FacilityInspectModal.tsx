import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BuildingId } from '../../types/game';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { GameManager } from '../../managers/GameManager';
import { formatTimeLeft, formatDuration } from '../../utils/timeUtils';
import { GameIcon } from '../GameIcon';
import { getBuildingLore, getBuildingStatusInfo, RES_NAMES_AND_ICONS } from '../../utils/buildingStatusUtils';
import { getTutorialProductionTarget, checkTutorialBuildingRestriction } from '../../data/tutorialSteps';
import { registerBackButtonHandler } from '../../utils/nativeBridge';

// 🏛️ 시설별 내부 헤더 배너 이미지 매핑
const BUILDING_IMAGE_MAP: Record<string, string> = {
  blacksmith: 'assets/menu_forge.webp',
  tavern: 'assets/menu_tavern.webp',
  infirmary: 'assets/menu_infirmary.webp',
  storage: 'assets/menu_storage.webp',
  alchemy: 'assets/menu_alchemy.webp',
  market: 'assets/menu_market.webp',
  arenaGate: 'assets/menu_arena.webp',
  explore: 'assets/menu_explore.webp',
  quests: 'assets/menu_quests.webp',
  codex: 'assets/menu_codex.webp',
  barracks: 'assets/menu_barracks.webp',
  cemetery: 'assets/menu_cemetery.webp',
  citadel: 'assets/citadel_bonfire.webp',
  lumberCamp: 'assets/menu_lumber_camp.webp',
  quarry: 'assets/menu_quarry.webp',
  butchery: 'assets/menu_butchery.webp',
  cabin: 'assets/menu_cabin.webp',
  sanctuary: 'assets/menu_sanctuary.webp',
};

const BUILDINGS_DRAWER_MAP: Record<string, string> = {
  blacksmith: 'forge',
  tavern: 'tavern',
  infirmary: 'infirmary',
  storage: 'storage',
  alchemy: 'alchemy',
  market: 'market',
  arenaGate: 'arena',
};

interface FacilityInspectModalProps {
  buildingId: BuildingId;
  onClose: () => void;
  onEnterDrawer?: (drawerKey: string) => void;
  tutorialStepId?: string;
  onClearHighlight?: () => void;
}

export const FacilityInspectModal: React.FC<FacilityInspectModalProps> = ({
  buildingId: initialBuildingId,
  onClose,
  onEnterDrawer,
  tutorialStepId,
  onClearHighlight,
}) => {
  const { gm, state } = useGameManager();
  const { tr, lang } = useI18n();

  const [buildingId, setBuildingId] = useState<BuildingId>(initialBuildingId);
  useEffect(() => {
    setBuildingId(initialBuildingId);
  }, [initialBuildingId]);

  const buildingData = state.buildings[buildingId];
  const isConstructing = Boolean(buildingData?.construction);

  // 건설 시작/변화 즉시 시각 동기화 및 건설 진행 중일 때만 150ms 주기로 리프레시
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
  }, [buildingData?.construction]);

  useEffect(() => {
    if (!isConstructing) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(timer);
  }, [isConstructing]);

  // 📱 안드로이드 하드웨어 뒤로가기 버튼 연동
  useEffect(() => {
    const unregister = registerBackButtonHandler(() => {
      onClose();
      return true;
    });
    return () => unregister();
  }, [onClose]);

  // ⌨️ Esc 키 연동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePlayClick = () => {
    try {
      SoundManager.getInstance().play('click');
    } catch (_) {}
  };

  if (!buildingData) return null;

  const hasWarmth = (state.bonfireWarmthTime > 0 && state.bonfireStacks >= 5) || (gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5);

  const tutorialRestriction = checkTutorialBuildingRestriction(
    tutorialStepId || '',
    buildingId,
    buildingData.level,
    state.buildings,
    state.quests
  );

  const tutorialProdTarget = getTutorialProductionTarget(tutorialStepId || '', state.buildings);

  const cost = gm.getBuildingUpgradeCost(buildingId, buildingData.level);
  const canAfford = Object.entries(cost).every(
    ([k, v]) => ((state.resources as unknown as Record<string, number>)[k] || 0) >= (v as number)
  );
  const isMax = (buildingData.maxLevel || buildingData.level) >= 10;
  const prereq = gm.checkBuildingPrerequisites(buildingId, (buildingData.maxLevel || buildingData.level) + 1);
  const drawerKey = BUILDINGS_DRAWER_MAP[buildingId];

  const effectiveNow = isConstructing
    ? Math.max(now, buildingData.construction!.startedAt)
    : now;
  const remainSec = isConstructing
    ? Math.max(1, Math.ceil((buildingData.construction!.startedAt + buildingData.construction!.durationMs - effectiveNow) / 1000))
    : 0;
  const progressPct = isConstructing
    ? Math.min(100, Math.max(3, Math.floor(((effectiveNow - buildingData.construction!.startedAt) / Math.max(1, buildingData.construction!.durationMs)) * 100)))
    : 0;

  const statusInfo = getBuildingStatusInfo(buildingId, buildingData.level, hasWarmth);
  const lore = getBuildingLore(buildingId, buildingData.level);
  const nextLevel = Math.min(10, buildingData.level + 1);
  const nextUpkeep = gm.getBuildingUpkeep(buildingId, nextLevel) || {
    amount: 0,
    resName: '',
    resIcon: '',
    isDiscounted: false,
    originalAmount: 0,
    secondaryAmount: 0,
    secondaryIcon: '',
    secondaryName: '',
  };
  const upkeepSec = gm.getUpkeepIntervalSeconds();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4 bg-black/85 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[92vw] sm:max-w-[480px] md:max-w-[540px] max-h-[86vh] max-h-[86dvh] bg-[#0a0d14] border border-[#b89758]/80 rounded-2xl p-3.5 sm:p-4.5 shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col gap-3 select-none overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top, rgba(184, 151, 88, 0.15), transparent 70%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 1. 상단 헤더 바 (성화 모달 스타일 계승) */}
        <div className="flex items-center justify-between border-b border-[#3d372e]/70 pb-2.5 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-black/60 border border-[#b89758]/50 flex items-center justify-center shrink-0">
              <GameIcon name={buildingData.id} icon={buildingData.icon} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#f3e5c8] truncate">
                  {tr(buildingData.name)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b89758]/20 text-[#ffd54f] border border-[#b89758]/40">
                  Lv.{buildingData.level}/10
                </span>
              </div>
              <div className="text-[11px] text-[#cfd8e8]/75 truncate font-normal mt-0.5">
                {tr(buildingData.description)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#181113] border border-[#4a2426] text-[#c56060] hover:text-[#e07b7b] hover:bg-[#2a1618] hover:border-[#85383b] transition-all cursor-pointer font-bold shadow-xs active:scale-95 text-xs shrink-0"
            title="닫기 (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 2. 본문 영역 (내부 독립 스크롤) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 tg-scrollbar flex flex-col gap-3 text-xs">
          {/* 배너 이미지 */}
          {BUILDING_IMAGE_MAP[buildingData.id] && (
            <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-[#3d372e]/60 shrink-0">
              <img
                src={BUILDING_IMAGE_MAP[buildingData.id]}
                alt={buildingData.name}
                className={`w-full h-full object-cover ${
                  buildingData.level === 0 ? 'grayscale brightness-75' : 'brightness-95 contrast-105'
                }`}
                onError={(e) => {
                  const parent = (e.currentTarget as HTMLElement).parentElement;
                  if (parent) parent.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141720] via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* 🔒 튜토리얼 생산 시설 우선 복원 지침 배너 */}
          {tutorialRestriction.isRestricted && (
            <div className="p-3 rounded-xl bg-[#2a1714] border border-[#ff7043]/70 flex items-start gap-2.5 shadow-md">
              <span className="text-xl shrink-0">🛡️</span>
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
                {tutorialRestriction.target && tutorialRestriction.target.targetId !== buildingId && (
                  <button
                    type="button"
                    onClick={() => {
                      handlePlayClick();
                      setBuildingId(tutorialRestriction.target!.targetId);
                    }}
                    className="mt-2 py-1 px-2.5 rounded-lg bg-gradient-to-r from-[#ff7043] to-[#e64a19] text-[#08090b] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                  >
                    <span>{tr(`목표 시설 [${tutorialRestriction.target.targetName}] 건설로 이동`)}</span>
                    <span>➔</span>
                  </button>
                )}
                {tutorialRestriction.target && !tutorialRestriction.target.isUnlocked && onEnterDrawer && (
                  <button
                    type="button"
                    onClick={() => {
                      handlePlayClick();
                      onEnterDrawer('quests');
                    }}
                    className="mt-2 py-1 px-2.5 rounded-lg bg-[#2a1714] border border-[#ff7043] text-[#ffab91] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                  >
                    <span>{tr('지휘관 퀘스트 보상 수령하러 가기')}</span>
                    <span>➔</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 🔨 공사 진행 중 안내 배너 */}
          {isConstructing && (
            <div className="p-3 rounded-xl bg-[#0a1424] border border-[#c8aa6e66] flex flex-col gap-2 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-[#c8aa6e] tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 leading-none animate-spin text-xs">⚙️</span>
                  <span>Lv.{buildingData.construction!.targetLevel} {buildingData.level === 0 ? tr('신축 공사 진행 중...') : tr('증축 공사 진행 중...')}</span>
                </span>
                <span className="font-mono">{formatTimeLeft(remainSec, lang)} ({progressPct}%)</span>
              </div>
              <div className="w-full bg-[#050c18] rounded-full h-2.5 overflow-hidden border border-[#c8aa6e44]">
                <div
                  className="bg-gradient-to-r from-[#c8aa6e] to-[#00f2fe] h-full transition-[width] duration-150 ease-linear shadow-[0_0_8px_#c8aa6e]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 🔒 테크트리 선행 미달 경고 배너 */}
          {!prereq.allowed && !isMax && (
            <div className="p-3 rounded-xl bg-[#2a1412] border border-[#ef535066] text-xs text-[#ff8a80] flex items-center gap-2.5 shadow-sm">
              <span className="text-xl">🔒</span>
              <div>
                <div className="font-bold text-[#ef5350]">{tr('테크트리 선행 조건 미달')}</div>
                <div className="text-[11px] text-[#cfd8dc] mt-0.5">{prereq.reason}</div>
              </div>
            </div>
          )}

          {/* 📜 상단: 시설 서사 및 배경 로어 */}
          <div className="p-3 rounded-xl bg-[#0d121c] border border-[#202738] flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#c8aa6e] font-bold">📜 {tr('시설 서사 및 배경')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e]">
                {buildingData.level > 0 ? `현재 Lv.${buildingData.level}` : tr('미건설 시설')}
              </span>
            </div>
            <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
              {lore}
            </div>
          </div>

          {/* ✨ 중단 1: 현재 가동 효과 */}
          {statusInfo && (
            <div className="p-3 rounded-xl bg-[#0a1816] border border-[#1e3e34] flex flex-col gap-1 shadow-xs">
              <div className="flex items-center justify-between text-[#9cd494] font-bold text-xs">
                <span>✨ {tr('현재 가동 효과')} (Lv.{buildingData.level})</span>
                {statusInfo.badge && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]">
                    {statusInfo.badge}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#e0e6ed] mt-0.5 font-medium leading-relaxed">
                {statusInfo.currentText}
              </div>
            </div>
          )}

          {/* 🔮 중단 2: 다음 단계 승급 프리뷰 & 유지비 표기 */}
          {statusInfo && (
            <div className="p-3 rounded-xl bg-[#181326] border border-[#2d2244] flex flex-col gap-1 shadow-xs">
              <div className="text-[#ffd54f] font-bold text-xs flex items-center justify-between">
                <span>🔮 {tr('다음 레벨 특전')} (Lv.{nextLevel})</span>
                {isMax ? (
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
                {statusInfo.nextText}
                {!isMax && nextUpkeep.amount > 0 && buildingData.level < 4 && (
                  <span className="text-[10px] text-[#ff8a80] block mt-0.5">
                    * 4레벨부터 {upkeepSec}초마다 {nextUpkeep.resIcon} {nextUpkeep.resName} {nextUpkeep.amount}개 유지비 소모 (Lv.1~3 무료 유지)
                  </span>
                )}
                {!isMax && (buildingId === 'lumberCamp' || buildingId === 'quarry') && nextLevel >= 5 && (
                  <span className="text-[10px] text-[#c8aa6e] block mt-0.5 font-mono">
                    ⚙️ 시설 특화: 골드 유지비 -{Math.min(42, (nextLevel - 4) * 7)}% 고유 감면 적용{buildingId === 'quarry' && nextLevel >= 7 ? ' (30% 식량 분담)' : ''}
                  </span>
                )}
                {!isMax && nextUpkeep.isDiscounted && (
                  <span className="text-[10px] text-[#38ef7d] block mt-0.5">
                    ✓ 인프라 시너지 감면 적용 중 (정가: {nextUpkeep.originalAmount} ➔ 할인가: {nextUpkeep.amount})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ⚡ / 🔨 하단: 강화 소모 자원 */}
          {!isMax && (
            <div className="p-3 rounded-xl bg-[#0e1118] border border-[#222d42] flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ededed]">
                  {buildingData.level > 0 ? tr('⚡ 증축 필요 자원') : tr('🔨 신축 필요 자원')}
                </span>
                <span className={canAfford ? 'text-[10px] text-[#9cd494] font-bold' : 'text-[10px] text-[#ff8585] font-bold animate-pulse'}>
                  {canAfford ? tr('✅ 모든 재료 보유') : tr('⚠️ 일부 자원 부족')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(cost).map(([resKey, reqAmt]) => {
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

        {/* 3. 하단 액션 버튼 바 */}
        <div className="border-t border-[#3d372e]/60 pt-2.5 shrink-0 flex items-center justify-between w-full gap-2">
          {/* 좌측: 시설 바로 입장 */}
          {drawerKey && buildingData.level > 0 && onEnterDrawer ? (
            <button
              type="button"
              onClick={() => {
                handlePlayClick();
                onEnterDrawer(drawerKey);
              }}
              className="py-1.5 px-3 rounded-lg bg-[#2a1e35] border border-[#a875d4] text-[#e0b8ff] font-bold text-xs hover:bg-[#352545] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
            >
              <span>🚪</span>
              <span>{tr('시설 바로 입장')}</span>
            </button>
          ) : <div />}

          {/* 우측: 닫기 & 건설/증축 시작 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-lg bg-[#1a1c24] border border-[#3d4252] text-[#9da3af] hover:text-white font-bold text-xs transition-colors cursor-pointer active:scale-95"
            >
              {tr('닫기')}
            </button>

            {isConstructing ? (
              <button
                type="button"
                disabled
                className="py-1.5 px-3.5 rounded-lg bg-[#c8aa6e1a] border border-[#c8aa6e88] text-[#c8aa6e] font-bold text-xs opacity-75 cursor-not-allowed animate-pulse"
              >
                🔨 {tr('공사 진행 중')} ({formatDuration(remainSec, lang)})
              </button>
            ) : tutorialRestriction.isRestricted ? (
              <button
                type="button"
                onClick={() => {
                  handlePlayClick();
                  gm.addLog(`⚠️ [튜토리얼 지침] ${tutorialRestriction.message}`, 'system');
                }}
                className="py-1.5 px-3.5 rounded-lg bg-[#2a1714] border border-[#ff7043]/60 text-[#ffab91] font-extrabold text-xs cursor-not-allowed opacity-90 flex items-center gap-1.5 shadow-inner"
                title={tutorialRestriction.message}
              >
                <span>🔒</span>
                <span>{tr('생산 시설 우선 복원 필요')}</span>
              </button>
            ) : (
              <button
                type="button"
                data-tutorial-target={
                  buildingId === 'butchery' && buildingData.level === 0 && (tutorialStepId === 'TUTORIAL_BUILD_REFINERY' || !tutorialStepId)
                    ? 'build-refinery'
                    : buildingId === 'tavern' && buildingData.level === 0 && tutorialStepId === 'TUTORIAL_BUILD_TAVERN'
                    ? 'build-tavern'
                    : tutorialProdTarget && buildingId === tutorialProdTarget.targetId && buildingData.level === 0
                    ? 'tutorial-confirm-build'
                    : undefined
                }
                data-tutorial-confirm-build="true"
                disabled={isMax || !prereq.allowed || !canAfford}
                onClick={() => {
                  handlePlayClick();
                  if (!isMax && prereq.allowed && gm.buildBuilding(buildingId)) {
                    onClearHighlight?.();
                    onClose();
                  }
                }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  canAfford && !isMax && prereq.allowed
                    ? 'tg-btn-gold cursor-pointer hover:brightness-110 active:scale-95'
                    : 'bg-[#1b1e28] border border-[#2e3344] text-[#616a7d] cursor-not-allowed opacity-60'
                }`}
              >
                {isMax
                  ? tr('★ 최고 레벨')
                  : (!prereq.allowed
                    ? tr('선행 조건 필요')
                    : (buildingData.level > 0 ? tr('⚡ 레벨업 공사 시작') : tr('🔨 건설 시작')))}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
