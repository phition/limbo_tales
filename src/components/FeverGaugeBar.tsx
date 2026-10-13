import React, { useMemo } from 'react';
import { FeverBadgeType } from '../types/fever';
import { FEVER_BADGE_META, evaluateFeverSynergy } from '../utils/feverUtils';
import { Mercenary } from '../types/game';
import { GameIcon } from './GameIcon';

interface FeverGaugeBarProps {
  badges: FeverBadgeType[];
  party?: Mercenary[];
  onOpenInfo?: () => void;
  label?: string;
  side?: 'player' | 'enemy';
}

export const FeverGaugeBar: React.FC<FeverGaugeBarProps> = ({ badges = [], party = [], onOpenInfo, label = 'FEVER', side = 'player' }) => {
  const maxSlots = 5;
  const isFull = (badges || []).length >= maxSlots;
  const isEnemy = side === 'enemy';
  
  const synergy = useMemo(() => {
    return evaluateFeverSynergy(badges || [], party || []);
  }, [badges, party]);

  return (
    <div
      className={`relative w-full rounded-xl px-2.5 py-1.5 transition-all duration-300 border ${
        isFull
          ? isEnemy
            ? 'bg-gradient-to-r from-[#2a0815] via-[#380e20] to-[#200511] border-[#ff416c] shadow-[0_0_15px_rgba(255,65,108,0.35)]'
            : 'bg-gradient-to-r from-[#201605] via-[#2d1f05] to-[#1a1203] border-[#ffd54f] shadow-[0_0_15px_rgba(255,213,79,0.35)]'
          : badges.length > 0
          ? isEnemy
            ? 'bg-[#180a14] border-[#38182b] shadow-sm'
            : 'bg-[#0d131f] border-[#22354e] shadow-sm'
          : 'bg-[#0a0e17] border-[#182333]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* 좌측: 타이틀 & 상태 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs ${isFull ? 'animate-bounce' : ''}`}>
            <GameIcon name={isFull ? 'fever_gauge' : 'fever_burst'} icon={isFull ? '🔥' : isEnemy ? '💀' : '⚡'} size={14} />
          </span>
          <span
            className={`text-[11px] font-black tracking-wider uppercase ${
              isFull ? (isEnemy ? 'text-[#ff416c] drop-shadow-[0_0_8px_#ff416c]' : 'text-[#ffd54f] drop-shadow-[0_0_8px_#ffd54f]') : (isEnemy ? 'text-[#ff80ab]' : 'text-[#8b9bb4]')
            }`}
          >
            {label}
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
              isFull
                ? isEnemy ? 'bg-[#ff416c] text-white animate-pulse font-black' : 'bg-[#ffd54f] text-[#0b0d13] animate-pulse font-black'
                : badges.length > 0
                ? isEnemy ? 'bg-[#ff416c22] text-[#ff80ab] border border-[#ff416c44]' : 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                : 'bg-[#151d2a] text-[#546e7a]'
            }`}
          >
            {badges.length}/{maxSlots}
          </span>
        </div>

        {/* 중앙: 5개 뱃지 슬롯 거치대 */}
        <div className="flex items-center gap-1.5 justify-center flex-1">
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const badgeType = badges[idx];
            const meta = badgeType ? FEVER_BADGE_META[badgeType] : null;

            if (meta) {
              return (
                <div
                  key={idx}
                  className="relative group flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-all duration-200 transform scale-100 hover:scale-110 animate-fade-in shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: meta.bg,
                    borderColor: meta.borderColor,
                    boxShadow: isFull ? `0 0 10px ${meta.color}66` : undefined
                  }}
                  title={`[${meta.label}] ${meta.description}`}
                >
                  <GameIcon name={`badge_${meta.type}`} icon={meta.icon} size={16} />
                  {/* 슬롯 상단 미니 뱃지 라벨 */}
                  <span className="absolute -bottom-1 text-[8px] font-black px-1 rounded-sm bg-[#000000dd] text-white tracking-tighter">
                    {meta.shortLabel}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#1b273b] bg-[#0b0f19] flex items-center justify-center text-[#253347] transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#1b273b]" />
              </div>
            );
          })}
        </div>

        {/* 우측: 시너지 요약 배너 or 도움말 */}
        <div className="shrink-0 text-right flex items-center gap-1">
          {isFull ? (
            <div className="flex flex-col items-end animate-pulse">
              <span className="text-[10px] sm:text-xs font-black text-[#ffd54f] flex items-center gap-1">
                <GameIcon name={`fever_${synergy.id}`} icon={synergy.icon} size={13} />
                <span>{synergy.name}</span>
              </span>
            </div>
          ) : badges.length > 0 ? (
            <div className="text-[9px] text-[#80d8ff] font-medium hidden sm:block">
              {maxSlots - badges.length}개 추가 시 FEVER 완충
            </div>
          ) : (
            <span className="text-[9px] text-[#546e7a] font-normal hidden sm:block">
              전술 모멘텀으로 뱃지 수집
            </span>
          )}
        </div>
      </div>

      {/* 5개 완충 시 하단에 펼쳐지는 발동 효과 프리뷰 바 */}
      {isFull && (
        <div className="mt-1 pt-1 border-t border-[#ffd54f33] flex items-center justify-between text-[10px] text-[#fff9c4] px-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-[#ffd54f] shrink-0">★ 시너지:</span>
            <span className="truncate">{synergy.summary}</span>
          </div>
          <span className="text-[9px] text-[#ffd54f] font-mono shrink-0 ml-1">SLOTS FULL</span>
        </div>
      )}
    </div>
  );
};
