import React, { useState, useEffect } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { formatTimeLeft } from '../../utils/timeUtils';

interface TerritoryHeaderProps {
  onOpenBonfire?: () => void;
  onOpenCitadel?: () => void;
  onOpenStorage?: () => void;
  onOpenSettings?: () => void;
}

export const TerritoryHeader: React.FC<TerritoryHeaderProps> = ({
  onOpenBonfire,
  onOpenCitadel,
  onOpenStorage,
  onOpenSettings,
}) => {
  const { state, gm } = useGameManager();
  const { tr, lang } = useI18n();

  // 온기 타이머 1초마다 실시간 갱신용
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const res = state.resources as unknown as Record<string, number>;

  const hasWarmth = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
  const warmthTimeStr = gm.bonfireWarmthTime > 0
    ? formatTimeLeft(gm.bonfireWarmthTime, lang)
    : `${gm.bonfireStacks || 0}/5`;

  const formatNum = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 10_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const resourceItems = [
    { key: 'gold',  label: tr('골드'),   icon: '🪙', val: res.gold,  color: '#dcc496' },
    { key: 'wood',  label: tr('목재'),   icon: '🪵', val: res.wood,  color: '#c29b68' },
    { key: 'stone', label: tr('석재'),   icon: '🪨', val: res.stone, color: '#9da3af' },
    { key: 'iron',  label: tr('철광석'), icon: '⚙️', val: res.iron,  color: '#8b9bb4' },
    { key: 'food',  label: tr('식량'),   icon: '🍖', val: res.food,  color: '#d97d64' },
    { key: 'ether', label: tr('에테르'), icon: '✨', val: res.ether, color: '#b89758' },
  ];

  return (
    <header className="relative z-30 flex items-center justify-between px-3 py-1.5 bg-[#08090b]/95 backdrop-blur-md border-b border-[#3d372e] select-none text-xs">
      {/* ── 좌측: 현재 보유 재고량 가로 스트립 (터치 시 중앙 창고로 이동) ── */}
      <div 
        onClick={onOpenStorage}
        title={tr('중앙 병참고 열기 (보유 물자 확인)')}
        className="flex items-center gap-2.5 overflow-x-auto tg-scrollbar py-0.5 cursor-pointer hover:opacity-90 transition-opacity"
      >
        {resourceItems.map(item => (
          <div key={item.key} className="flex items-center gap-1 shrink-0">
            <span className="text-sm leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{item.icon}</span>
            <span className="font-bold font-mono tracking-tight" style={{ color: item.color }}>
              {formatNum(item.val)}
            </span>
          </div>
        ))}
      </div>

      {/* ── 우측: 영지 건설 & 성화 온기 바로가기 ── */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* 🏰 영지 관리 (상단 뷰포트에서 가장 빠른 접근) */}
        {onOpenCitadel && (
          <button
            type="button"
            onClick={onOpenCitadel}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#1a1712] border border-[#b89758] text-[#dcc496] font-bold text-[11px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            title={tr('영지 시설 건설 및 증축 목록 관리')}
          >
            <span>🏰</span>
            <span className="hidden sm:inline">{tr('영지 관리')}</span>
          </button>
        )}

        {/* 🔥 성화 온기 상태 뱃지 */}
        <button
          type="button"
          onClick={onOpenBonfire}
          title={hasWarmth ? tr('성화 온기 가동 중 (생산량 +15%, 전투 EXP +20%)') : tr('성화 점화 필요')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all cursor-pointer ${
            hasWarmth
              ? 'bg-[#b89758]/15 border-[#b89758] text-[#dcc496] shadow-[0_0_8px_rgba(184,151,88,0.25)]'
              : 'bg-[#161820] border-[#3d372e] text-[#9da3af] hover:border-[#5a4b35]'
          }`}
        >
          <span className="text-sm leading-none">🔥</span>
          <span className="font-mono font-bold text-[11px]">
            {warmthTimeStr}
          </span>
          {hasWarmth && (
            <span className="text-[10px] hidden sm:inline text-[#b89758] font-bold">
              +15%
            </span>
          )}
        </button>

        {/* 설정 버튼 */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 rounded text-[#9da3af] hover:text-[#dcc496] hover:bg-[#1a1c22] border border-transparent hover:border-[#3d372e] transition-colors"
            title={tr('설정')}
          >
            ⚙️
          </button>
        )}
      </div>
    </header>
  );
};
