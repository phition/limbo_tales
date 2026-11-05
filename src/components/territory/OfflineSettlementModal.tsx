import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { formatDuration } from '../../utils/timeUtils';

export interface OfflineProductionData {
  elapsedSeconds: number;
  produced: Record<string, number>;
  upkeepDeducted: Record<string, number>;
  netGains: Record<string, number>;
}

interface OfflineSettlementModalProps {
  open: boolean;
  onClose: () => void;
  report: OfflineProductionData | null;
}

export const OfflineSettlementModal: React.FC<OfflineSettlementModalProps> = ({
  open,
  onClose,
  report,
}) => {
  const { tr, lang } = useI18n();

  if (!open || !report) return null;

  const resMeta: Record<string, { label: string; icon: string; color: string }> = {
    gold:  { label: tr('골드'),   icon: '🪙', color: '#dcc496' },
    wood:  { label: tr('목재'),   icon: '🪵', color: '#c29b68' },
    stone: { label: tr('석재'),   icon: '🪨', color: '#9da3af' },
    iron:  { label: tr('철광석'), icon: '⚙️', color: '#8b9bb4' },
    food:  { label: tr('식량'),   icon: '🍖', color: '#d97d64' },
    ether: { label: tr('에테르'), icon: '✨', color: '#b89758' },
    leather:{ label: tr('가죽'), icon: '🥋', color: '#876739' },
  };

  const elapsedText = formatDuration(report.elapsedSeconds * 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div 
        className="relative w-full max-w-md bg-[#121418] border border-[#3d372e] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── 헤더 ── */}
        <div className="px-4 py-3 bg-[#0a0b0e] border-b border-[#242732] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏰</span>
            <div>
              <h3 className="text-sm font-bold text-[#ededed] tracking-tight">
                {tr('방주 거점 운영 일지 (지휘관 부재중 정산)')}
              </h3>
              <p className="text-[11px] text-[#9da3af]">
                {tr('부재 시간')}: <span className="font-mono text-[#dcc496] font-bold">{elapsedText}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9da3af] hover:text-white text-base"
          >
            ✕
          </button>
        </div>

        {/* ── 본문 내용 ── */}
        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto tg-scrollbar text-xs">
          {/* 1. 자동 생산 내역 */}
          <div className="p-3 rounded-lg bg-[#161820] border border-[#242732]">
            <h4 className="font-bold text-[#b89758] mb-2 flex items-center gap-1.5">
              <span>📦</span> {tr('부재중 자동 누적 생산량')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(report.produced).map(([key, amt]) => {
                if (!amt || amt <= 0) return null;
                const meta = resMeta[key] || { label: key, icon: '📦', color: '#ededed' };
                return (
                  <div key={key} className="flex items-center justify-between p-1.5 rounded bg-[#101216] border border-[#1f222b]">
                    <span className="flex items-center gap-1 text-[#9da3af]">
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="font-mono font-bold" style={{ color: meta.color }}>
                      +{amt.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 유지비 차감 정산 내역 */}
          {Object.keys(report.upkeepDeducted).length > 0 && (
            <div className="p-3 rounded-lg bg-[#161820] border border-[#242732]">
              <h4 className="font-bold text-[#8c2d2d] mb-1.5 flex items-center gap-1.5">
                <span>⚖️</span> {tr('시설 유지비 차감 정산')}
              </h4>
              <p className="text-[10px] text-[#9da3af] mb-2">
                {tr('* 테크 시너지(상업 네트워크, 대량 배급제)가 적용된 최종 결제액입니다.')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.upkeepDeducted).map(([key, amt]) => {
                  if (!amt || amt <= 0) return null;
                  const meta = resMeta[key] || { label: key, icon: '⚖️', color: '#ededed' };
                  return (
                    <div key={key} className="flex items-center justify-between p-1.5 rounded bg-[#101216] border border-[#1f222b]">
                      <span className="flex items-center gap-1 text-[#9da3af]">
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                      <span className="font-mono font-bold text-[#ff8585]">
                        -{amt.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 최종 창고 적재 결과 */}
          <div className="p-3 rounded-lg bg-[#1a1711] border border-[#5a4b35]">
            <h4 className="font-bold text-[#dcc496] mb-1 flex items-center gap-1.5">
              <span>✨</span> {tr('창고 최종 순수 적재 결과')}
            </h4>
            <p className="text-[11px] text-[#9da3af] mb-2">
              {tr('모든 자원은 방주 중앙 병참고에 안전하게 자동 저장되었습니다.')}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(report.netGains).map(([key, net]) => {
                const meta = resMeta[key] || { label: key, icon: '📦', color: '#ededed' };
                const isPositive = net >= 0;
                return (
                  <div key={key} className="flex items-center gap-1 px-2 py-1 rounded bg-[#101216] border border-[#3d372e]">
                    <span>{meta.icon}</span>
                    <span className="font-mono font-bold text-xs" style={{ color: isPositive ? meta.color : '#ff8585' }}>
                      {isPositive ? `+${net.toLocaleString()}` : net.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 푸터: 확인 버튼 ── */}
        <div className="p-3 bg-[#0a0b0e] border-t border-[#242732]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg tg-btn-gold text-xs font-bold cursor-pointer"
          >
            {tr('확인 및 영지 복귀')}
          </button>
        </div>
      </div>
    </div>
  );
};
