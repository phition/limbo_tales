import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { formatRemainingTimeStr } from '../../utils/timeUtils';

interface Props {
  cycleInfo: {
    status: 'active' | 'defeated' | 'cooldown';
    requiredWindowDamage: number;
    currentWindowDamage: number;
    isWindowDefended: boolean;
    windowProgressPct: number;
    nextPlunderRemainingMs: number;
  };
  onOpenRulesModal: () => void;
}

export const PlunderThreatWidget: React.FC<Props> = ({
  cycleInfo,
  onOpenRulesModal,
}) => {
  const { tr, lang } = useI18n();

  const targetGoal = Math.round(cycleInfo.requiredWindowDamage);
  const currentDmg = Math.round(cycleInfo.currentWindowDamage);
  const remainingTarget = Math.max(0, targetGoal - currentDmg);
  const isDefended = cycleInfo.isWindowDefended || remainingTarget === 0;

  // 데미지가 누적될 때마다 100%에서 0%로 깎여나가는 잔여 목표 비율
  const remainingPct = targetGoal > 0 ? Math.max(0, Math.min(100, (remainingTarget / targetGoal) * 100)) : 0;
  const defendedPct = Math.min(100, Math.max(0, 100 - remainingPct));

  // 원형 그래프 SVG 수치 (반지름 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  // 깎여나가는 게이지: 남은 잔여 목표치(remainingPct)만큼만 채워짐
  const strokeDashoffset = circumference * (1 - remainingPct / 100);

  return (
    <div
      className={`rounded-2xl p-3 border transition-all shadow-lg relative overflow-hidden ${
        isDefended
          ? 'bg-gradient-to-r from-[#0b1f15] via-[#091710] to-[#060f0b] border-[#38ef7d55] shadow-[#38ef7d15]'
          : 'bg-gradient-to-r from-[#220d15] via-[#170a10] to-[#0d0710] border-[#ff416c66] shadow-[#ff416c22]'
      }`}
    >
      {/* 엠비언트 백그라운드 펄스 */}
      {!isDefended && (
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-red-600/10 blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base sm:text-lg animate-bounce">
            {isDefended ? '🛡️' : '⚠️'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                {tr('긴급 영지 약탈 방어 모니터')}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                  isDefended
                    ? 'bg-[#38ef7d22] text-[#38ef7d] border-[#38ef7d66]'
                    : 'bg-[#ff416c22] text-[#ff80ab] border-[#ff416c66]'
                }`}
              >
                {isDefended ? tr('방어 안전') : tr('약탈 위험')}
              </span>
            </div>
            <span className="text-[10px] text-[#8b9bb4]">
              {tr('6시간 주기 1/24 요격 목표')}
            </span>
          </div>
        </div>

        {/* 테마 맞춤 상세 정보 버튼 */}
        <button
          onClick={onOpenRulesModal}
          className="px-2.5 py-1 rounded-lg bg-[#2e1219] hover:bg-[#3d1822] border border-[#ff416c88] hover:border-[#ff416c] text-[#ff80ab] hover:text-white text-[10px] font-bold flex items-center gap-1 shadow-sm shadow-[#ff416c22] transition-all shrink-0 cursor-pointer"
          title={tr('약탈 및 침공 상세 규칙 확인')}
        >
          <span>📋</span>
          <span>{tr('약탈 규정')}</span>
        </button>
      </div>

      {/* 본문: 원형 그래프 + 텔레메트리 정보 */}
      <div className="mt-3 flex items-center gap-3 sm:gap-4">
        {/* 🌀 원형 게이지 (데미지 누적 시 게이지가 깎여나감) */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* 배경 원 (비활성 트랙) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-[#1a0f1c]"
              strokeWidth="7.5"
              fill="transparent"
            />

            {/* 깎여나가는 위험 게이지 (남은 체력 비율) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={
                isDefended
                  ? '#38ef7d'
                  : remainingPct > 50
                  ? '#ff416c'
                  : remainingPct > 20
                  ? '#ff9800'
                  : '#ffd54f'
              }
              strokeWidth="7.5"
              strokeDasharray={circumference}
              strokeDashoffset={isDefended ? circumference : strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{
                filter: isDefended
                  ? 'drop-shadow(0 0 6px rgba(56, 239, 125, 0.6))'
                  : 'drop-shadow(0 0 6px rgba(255, 65, 108, 0.5))',
              }}
            />

            {/* 완전 방어 달성 시 표시되는 은은한 수호 링 */}
            {isDefended && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#38ef7d"
                strokeWidth="7.5"
                fill="transparent"
                opacity="0.3"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* 원형 중앙 텍스트 / 리드아웃 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
            {isDefended ? (
              <>
                <span className="text-xl sm:text-2xl animate-bounce">🛡️</span>
                <span className="text-[10px] sm:text-xs font-black text-[#38ef7d] mt-0.5">
                  {tr('방어 완료')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-[#81c784] font-mono">
                  100% {tr('안전')}
                </span>
              </>
            ) : (
              <>
                <span className="text-[8.5px] sm:text-[9px] text-[#8b9bb4] uppercase tracking-wider font-bold">
                  {tr('잔여')}
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-[#ff80ab] leading-none my-0.5">
                  {remainingPct.toFixed(0)}%
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-[#ffd54f]">
                  {lang === 'en'
                    ? `${(remainingTarget / 1000).toFixed(0)}k`
                    : `${(remainingTarget / 10000).toFixed(1)}만`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 우측 전술 텔레메트리 데이터 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-[#8b9bb4]">{tr('방어 마감까지')}:</span>
            <span className="font-bold text-xs text-[#ffd54f] bg-black/40 px-2 py-0.5 rounded border border-white/10">
              ⏱️ {formatRemainingTimeStr(cycleInfo.nextPlunderRemainingMs, lang)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b9bb4]">{tr('요격 목표')}:</span>
              <span className="text-white font-bold">{targetGoal.toLocaleString()} HP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b9bb4]">{tr('누적 타격')}:</span>
              <span className={`font-bold ${isDefended ? 'text-[#38ef7d]' : 'text-[#ffd54f]'}`}>
                {currentDmg.toLocaleString()} DMG ({defendedPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="text-[9.5px] text-[#cfd8dc] leading-tight">
            {isDefended ? (
              <span className="text-[#81c784] font-medium flex items-center gap-1">
                <span>✨</span>
                <span>{tr('약탈 방어 성공! 6시간 마감 시 영지 자원이 100% 안전하게 보호됩니다.')}</span>
              </span>
            ) : (
              <span className="text-[#ffab91]">
                {tr('추가')} <strong className="text-white font-mono">{remainingTarget.toLocaleString()} HP</strong> {tr('를 깎아야 20% 영지 자원 약탈을 저지합니다.')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
