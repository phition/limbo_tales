import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { GameIcon } from '../GameIcon';

interface QuickFacilityDockProps {
  activeKey: string | null;
  onSelectFacility: (key: string) => void;
}

export const QuickFacilityDock: React.FC<QuickFacilityDockProps> = ({
  activeKey,
  onSelectFacility,
}) => {
  const { tr } = useI18n();

  const handleClick = (key: string) => {
    try {
      SoundManager.getInstance().play('click');
    } catch {}
    onSelectFacility(key);
  };

  return (
    <div className="relative z-20 flex flex-col bg-[#07090d] border-t border-[#3d372e] select-none shadow-[0_-8px_24px_rgba(0,0,0,0.9)] w-full">
      {/* ── 하단 3대 마스터 내비게이션 앵커 바 (심연 강하 ↔ 방주 영지 ↔ 차원 게이트) ── */}
      <div className="grid grid-cols-3 items-center gap-1.5 sm:gap-2.5 md:gap-3 px-2 sm:px-3 py-1.5 sm:py-2.5 bg-[#090b10] w-full max-w-full">
        
        {/* [좌측]: 🌌 심연 강하 (Explore) */}
        <button
          type="button"
          onClick={() => handleClick('explore')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 h-13 sm:h-16 px-1.5 sm:px-2.5 rounded-2xl transition-all cursor-pointer min-w-0 overflow-hidden ${
            activeKey === 'explore'
              ? 'bg-[#1c2333] border-2 border-[#5c7cbd] text-white shadow-[0_0_16px_rgba(92,124,189,0.5)]'
              : 'bg-[#121620] border border-[#2f394d] hover:border-[#5c7cbd] text-[#cfd8e8] hover:bg-[#181d2a] active:scale-95'
          }`}
          title={tr('심연 1~5층 강하 출격')}
        >
          <span className="text-xl sm:text-2xl md:text-3xl leading-none drop-shadow shrink-0">🌌</span>
          <div className="text-left min-w-0 flex flex-col justify-center">
            <div className="dock-btn-title font-black text-white tracking-tight truncate">
              {tr('심연 강하')}
            </div>
            <div className="dock-btn-subtext text-[#8b9bb4] truncate mt-0.5">
              {tr('원정 출격')}
            </div>
          </div>
        </button>

        {/* [중심]: 🏰 방주 영지 (Citadel - 가장 돋보이는 센터 랜드마크 버튼) */}
        <button
          type="button"
          onClick={() => handleClick('citadel')}
          className={`relative flex items-center justify-center gap-1.5 sm:gap-2.5 h-15 sm:h-18 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 overflow-hidden ${
            activeKey === 'citadel'
              ? 'bg-gradient-to-b from-[#3d3220] via-[#2a2215] to-[#18130c] border-2 border-[#dcc496] shadow-[0_0_24px_rgba(184,151,88,0.6)] scale-[1.02]'
              : 'bg-gradient-to-b from-[#262015] via-[#1a160e] to-[#110e09] border-2 border-[#b89758] shadow-[0_4px_18px_rgba(0,0,0,0.85)] hover:brightness-115 active:scale-95'
          }`}
          title={tr('전체 시설 건설 및 증축 관리')}
        >
          <span className="text-2xl sm:text-3xl md:text-4xl leading-none drop-shadow shrink-0">🏰</span>
          <div className="text-left min-w-0 flex flex-col justify-center">
            <div className="dock-btn-center-title font-black tracking-tight text-white truncate">
              {tr('방주 영지')}
            </div>
            <div className="dock-btn-subtext font-bold text-[#dcc496] mt-0.5 truncate">
              {tr('건설 & 증축')}
            </div>
          </div>
        </button>

        {/* [우측]: 🌀 차원 게이트 (Arena - 커스텀 에셋 연동) */}
        <button
          type="button"
          onClick={() => handleClick('arena')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 h-13 sm:h-16 px-1.5 sm:px-2.5 rounded-2xl transition-all cursor-pointer min-w-0 overflow-hidden ${
            activeKey === 'arena'
              ? 'bg-[#2b1b24] border-2 border-[#d45070] text-white shadow-[0_0_16px_rgba(212,80,112,0.5)]'
              : 'bg-[#1c1219] border border-[#442838] hover:border-[#d45070] text-[#e8cfdb] hover:bg-[#231720] active:scale-95'
          }`}
          title={tr('차원 아레나 & 침공전')}
        >
          <GameIcon name="arena" icon="🌀" size={28} className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain drop-shadow shrink-0" />
          <div className="text-left min-w-0 flex flex-col justify-center">
            <div className="dock-btn-title font-black text-white tracking-tight truncate">
              {tr('차원 게이트')}
            </div>
            <div className="dock-btn-subtext text-[#b48b9f] truncate mt-0.5">
              {tr('아레나 PVP')}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
