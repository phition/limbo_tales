import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface Props {
  totalDamage: number;
  highestDamage: number;
  dailyAttempts: number;
  onRefillWithAd: () => void;
  onRefillWithAether: () => void;
  isAdLoading: boolean;
}

export const CommanderStatusWidget: React.FC<Props> = ({
  totalDamage,
  highestDamage,
  dailyAttempts,
  onRefillWithAd,
  onRefillWithAether,
  isAdLoading,
}) => {
  const { tr } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-1.5 shrink-0">
      {/* 1. 나의 누적 피해량 */}
      <div className="rounded-xl p-2.5 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40] shadow-sm">
        <span className="text-[10px] text-[#8b9bb4]">{tr('나의 누적 피해량')}</span>
        <span className="font-mono text-xs sm:text-sm font-bold text-white mt-1">
          {totalDamage.toLocaleString()}
        </span>
      </div>

      {/* 2. 단일 최고 기록 */}
      <div className="rounded-xl p-2.5 flex flex-col items-center text-center bg-[#0d1322] border border-[#1e2a40] shadow-sm">
        <span className="text-[10px] text-[#8b9bb4]">{tr('단일 최고 기록')}</span>
        <span className="font-mono text-xs sm:text-sm font-bold text-[#ffd54f] mt-1">
          {highestDamage.toLocaleString()}
        </span>
      </div>

      {/* 3. 일일 도전 횟수 */}
      <div className="rounded-xl p-2.5 flex flex-col items-center justify-between text-center bg-[#0d1322] border border-[#1e2a40] shadow-sm">
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] text-[#8b9bb4]">{tr('일일 출격권')}</span>
          {dailyAttempts < 3 && (
            <div className="flex items-center gap-1">
              <button
                className="text-[9px] text-[#00e5ff] hover:underline flex items-center gap-0.5 font-bold"
                onClick={onRefillWithAd}
                disabled={isAdLoading}
                title={tr('광고 시청 시 공격 횟수 +3 충전')}
              >
                <span>📺</span>
                <span>+{tr('광고')}</span>
              </button>
              {dailyAttempts === 0 && (
                <button
                  className="text-[9px] text-[#ffd54f] hover:underline"
                  onClick={onRefillWithAether}
                  title={tr('에테르 50개로 +1회 충전')}
                >
                  +{tr('에테르')}
                </button>
              )}
            </div>
          )}
        </div>
        <span className="font-mono text-xs sm:text-sm font-bold text-[#ff416c] mt-0.5">
          🔥 {dailyAttempts} / 3{tr('회')}
        </span>
      </div>
    </div>
  );
};
