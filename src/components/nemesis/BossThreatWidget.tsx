import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { NEMESIS_BOSS_CONFIG } from '../../data/nemesis';
import { NemesisPartId } from '../../types/game';

interface Props {
  currentBossHp: number;
  maxBossHp: number;
  phase: number;
  parts?: Record<NemesisPartId, {
    currentHp: number;
    maxHp: number;
    isDefeated?: boolean;
  }>;
  onOpenIntelModal: (partId?: NemesisPartId) => void;
}

export const BossThreatWidget: React.FC<Props> = ({
  currentBossHp,
  maxBossHp,
  phase,
  parts,
  onOpenIntelModal,
}) => {
  const { tr, lang } = useI18n();

  const totalMax = maxBossHp || NEMESIS_BOSS_CONFIG.maxHp;
  const hpPercent = Math.max(0, Math.min(100, (currentBossHp / totalMax) * 100));
  const currentPhaseCfg = NEMESIS_BOSS_CONFIG.phases.find(p => p.phase === phase) || NEMESIS_BOSS_CONFIG.phases[0];

  const partTags: Record<NemesisPartId, { tag: string; tagColor: string; theme: string }> = {
    head: { tag: tr('마법 취약'), tagColor: '#ef5350', theme: '#ef5350' },
    body: { tag: tr('타격 취약'), tagColor: '#ce93d8', theme: '#ce93d8' },
    tail: { tag: tr('관통 취약'), tagColor: '#ffd54f', theme: '#ffd54f' },
  };

  return (
    <div className="rounded-2xl p-3 border border-[#ce93d833] bg-gradient-to-r from-[#170c24] via-[#100a1c] to-[#0a0814] shadow-lg flex flex-col gap-2.5">
      {/* 상단 보스 정보 */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#ff416c88] relative shadow-md shrink-0 bg-black">
            <img
              src="assets/void_overlord.webp"
              alt="Nemesis"
              className="w-full h-full object-cover object-center scale-110"
            />
            <div className="absolute inset-0 bg-purple-900/30 animate-pulse pointer-events-none" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                {tr(NEMESIS_BOSS_CONFIG.name)}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0"
                style={{
                  backgroundColor: `${currentPhaseCfg.badgeColor}22`,
                  color: currentPhaseCfg.badgeColor,
                  border: `1px solid ${currentPhaseCfg.badgeColor}88`,
                }}
              >
                Phase {phase}
              </span>
            </div>
            <div className="text-[10px] text-[#ce93d8] truncate">
              {tr(currentPhaseCfg.name)}
            </div>
          </div>
        </div>

        {/* 테마 맞춤 보스 인텔 기믹 분석 버튼 */}
        <button
          onClick={() => onOpenIntelModal()}
          className="px-2.5 py-1 rounded-lg bg-[#241335] hover:bg-[#321a4a] border border-[#ce93d888] hover:border-[#ce93d8] text-[#e1bee7] hover:text-white text-[10px] font-bold flex items-center gap-1 shadow-sm shadow-[#ce93d822] transition-all shrink-0 cursor-pointer"
          title={tr('보스 기믹 및 약점 상세 분석')}
        >
          <span>🎯</span>
          <span>{tr('기믹 분석')}</span>
        </button>
      </div>

      {/* 보스 전체 잔여 체력바 */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1 font-mono">
          <span className="text-[10px] text-[#8b9bb4] flex items-center gap-1">
            <span>👾 {tr('보스 총 생명력')}</span>
            <span className="text-[8.5px] text-[#c8aa6e]">({tr('전 지휘관 공유')})</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-[#ffd54f]">
              {hpPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-[#8b9bb4]">
              ({Math.round(currentBossHp).toLocaleString()} / {Math.round(totalMax).toLocaleString()})
            </span>
          </div>
        </div>

        <div className="w-full bg-[#0a0710] h-2.5 rounded-full overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-[#ce93d8] via-[#ff416c] to-[#ff007f] transition-all duration-500 rounded-full"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* 3대 부위 전술 카드 그리드 */}
      {parts && (
        <div className="grid grid-cols-3 gap-1.5 mt-0.5">
          {(['head', 'body', 'tail'] as const).map(pKey => {
            const part = parts[pKey];
            const pCfg = NEMESIS_BOSS_CONFIG.parts[pKey];
            const curHp = part?.currentHp ?? pCfg.maxHp;
            const maxHp = part?.maxHp ?? pCfg.maxHp;
            const isDefeated = part?.isDefeated || curHp <= 0;
            const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
            const meta = partTags[pKey];
            const cleanName = (pCfg.name || '').replace(/\s*\(.*?\)/g, '').trim();

            return (
              <button
                key={pKey}
                onClick={() => onOpenIntelModal(pKey)}
                className={`p-2 rounded-xl border text-center flex flex-col justify-between transition-all group relative cursor-pointer ${
                  isDefeated
                    ? 'bg-[#101016] border-[#37474f] opacity-60'
                    : 'bg-[#150f22] border-[#2e1d44] hover:border-[#ce93d888] hover:bg-[#1c142e] shadow-sm'
                }`}
                title={tr('터치 시 부위 상세 정보 확인')}
              >
                <div className="flex items-center justify-between text-[9.5px] font-bold w-full" style={{ color: isDefeated ? '#78909c' : meta.theme }}>
                  <span className="truncate">{pCfg.icon} {tr(cleanName)}</span>
                  <span>{isDefeated ? tr('💀파괴') : `${pct.toFixed(0)}%`}</span>
                </div>

                <div className="w-full bg-[#08050e] h-1.5 rounded-full overflow-hidden my-1 border border-white/5">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${isDefeated ? 0 : pct}%`,
                      backgroundColor: isDefeated ? '#546e7a' : meta.theme,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[8px] font-mono w-full">
                  <span
                    className="px-1 py-0.2 rounded font-bold"
                    style={{
                      backgroundColor: isDefeated ? '#37474f33' : `${meta.tagColor}18`,
                      color: isDefeated ? '#90a4ae' : meta.tagColor,
                    }}
                  >
                    {isDefeated ? tr('기능 정지') : meta.tag}
                  </span>
                  <span className="text-[#8b9bb4]">
                    {isDefeated ? '-' : (lang === 'en' ? `${(curHp / 1000000).toFixed(1)}M` : `${(curHp / 10000).toFixed(0)}만`)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
