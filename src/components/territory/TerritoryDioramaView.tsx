import React, { useEffect, useState } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { formatTimeLeft } from '../../utils/timeUtils';

interface TerritoryDioramaViewProps {
  onOpenFacility: (facilityKey: string) => void;
  onOpenExplore: () => void;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  onOpenFacility,
}) => {
  const { state, gm } = useGameManager();
  const { tr, lang } = useI18n();

  // 0.5초마다 갱신 (온기 시간 등)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const handlePlayClick = () => {
    try {
      SoundManager.getInstance().play('click');
    } catch {}
  };

  const hasWarmth = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
  const warmthTimeStr = gm.bonfireWarmthTime > 0
    ? formatTimeLeft(gm.bonfireWarmthTime, lang)
    : `${gm.bonfireStacks || 0}/5`;

  const totalBuiltCount = Object.values(state.buildings || {}).filter(b => b && b.level > 0).length;

  return (
    <div className="relative w-full h-full bg-[#08090b] overflow-hidden select-none flex flex-col justify-between">
      {/* ── 1. 다크 고딕 부유 성채 2.5D 전경 배경 아트 ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090b] via-[#0f1218] to-[#08090b]">
        {/* 원경 성채 실루엣 및 흑무 안개 오버레이 */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2e2617] via-transparent to-transparent pointer-events-none" />
        
        {/* 거점 배경 이미지 */}
        <img
          src="assets/citadel_bonfire.jpg"
          alt="Ark Citadel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45 filter contrast-125 brightness-90 transition-all duration-700"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* 스모키 다크 비네팅 & 하단 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b] via-transparent to-[#08090b]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/70 via-transparent to-[#08090b]/90 pointer-events-none" />
      </div>

      {/* ── 2. 상단 여백 (알림 마커 및 오버레이 공간 확보) ── */}
      <div className="relative z-10 p-4" />

      {/* ── 3. 하단 중앙: 성채 사령부 상징 엠블럼 및 퀵 성화 컨트롤 ── */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-6 flex flex-col items-center text-center">
        {/* 성채 타이틀 & 로어 서사 플레이트 */}
        <div className="p-4 rounded-2xl bg-[#0e1117]/85 border border-[#3d372e]/80 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md w-full transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl drop-shadow">🏰</span>
              <h2 className="text-sm font-bold text-[#dcc496] tracking-tight">
                {tr('방주 성채 (Ark Citadel)')}
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1f2330] text-[#b89758] border border-[#2c3245]">
              {tr('시설 완공')} {totalBuiltCount}/13
            </span>
          </div>

          <p className="text-[11px] text-[#9da3af] leading-relaxed mb-3 text-left">
            {tr('심연의 흑무 속에서 타오르는 인류 최후의 구원 요람. 하단의 방주 영지 버튼을 통해 모든 인프라와 거점에 즉시 접근할 수 있습니다.')}
          </p>

          {/* 성화 온기 퀵 칩 & 영지 사령부 열기 버튼 */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#262933]">
            {/* 성화 상태 버튼 */}
            <button
              type="button"
              onClick={() => {
                handlePlayClick();
                onOpenFacility('bonfire');
              }}
              className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                hasWarmth
                  ? 'bg-[#b89758]/15 border-[#b89758] text-[#dcc496] shadow-[0_0_12px_rgba(184,151,88,0.25)] hover:bg-[#b89758]/25'
                  : 'bg-[#151821] border-[#3d372e] text-[#9da3af] hover:border-[#5a4b35]'
              }`}
            >
              <span className="text-base leading-none">🔥</span>
              <span className="text-xs font-bold font-mono">
                {hasWarmth ? `${tr('온기')} ${warmthTimeStr}` : `${tr('성화')} ${warmthTimeStr}`}
              </span>
            </button>

            {/* 영지 사령부 열기 버튼 */}
            <button
              type="button"
              onClick={() => {
                handlePlayClick();
                onOpenFacility('citadel');
              }}
              className="flex-1 py-2 px-3 rounded-xl tg-btn-gold text-xs font-bold cursor-pointer flex items-center justify-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <span>🏰</span>
              <span>{tr('영지 관리 열기 ▶')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
