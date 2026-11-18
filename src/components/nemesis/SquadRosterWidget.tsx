import React, { useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Mercenary, PartySynergy, PositionSlot } from '../../types/game';
import { CHARACTER_CLASSES } from '../../data/classes';
import { CustomAssetService } from '../../services/CustomAssetService';
import { calculatePartySynergies } from '../../data/synergies';

interface Props {
  mainHeroes: Mercenary[];
  leaderHero: Mercenary | null;
  onOpenQuickSquadModal: (slotIdx?: number) => void;
}

export const SquadRosterWidget: React.FC<Props> = ({
  mainHeroes,
  leaderHero,
  onOpenQuickSquadModal,
}) => {
  const { tr, lang } = useI18n();

  const displayMain = mainHeroes.slice(0, 3);
  const activeCount = displayMain.filter(Boolean).length + (leaderHero ? 1 : 0);
  const isSquadFull = activeCount === 4;

  // 3선발(오퍼레이터 제외) 영웅들의 시너지 계산 (채비실과 동일)
  const vanguardHeroes = useMemo(() => {
    return displayMain.filter((h): h is Mercenary => !!h);
  }, [displayMain]);

  const activeSynergies = useMemo(() => {
    return calculatePartySynergies(vanguardHeroes);
  }, [vanguardHeroes]);

  const posConfig: Record<PositionSlot, { label: string; color: string; perk: string; icon: string }> = {
    front: { label: tr('전열'), color: '#ef5350', perk: tr('피격률↑ 받는 피해 -10%'), icon: '🛡️' },
    mid:   { label: tr('중열'), color: '#ffd54f', perk: tr('치명타 +10% 회피 +10%'), icon: '🎯' },
    back:  { label: tr('후열'), color: '#42a5f5', perk: tr('마나소모 -15% 마법위력 +15%'), icon: '🔮' },
  };

  const getBuffBadges = (buffs: PartySynergy['buffs']) => {
    if (!buffs) return [];
    const badges: { text: string; color: string }[] = [];
    if (buffs.allStatsBonus) badges.push({ text: `${tr('전능력치')} +${Math.round((buffs.allStatsBonus - 1) * 100)}%`, color: '#c8aa6e' });
    if (buffs.atkBonus) {
      const diff = Math.round((buffs.atkBonus - 1) * 100);
      badges.push({ text: `${tr('공격력')} ${diff > 0 ? `+${diff}%` : `${diff}%`}`, color: diff > 0 ? '#ef5350' : '#8b9bb4' });
    }
    if (buffs.defBonus) {
      const diff = Math.round((buffs.defBonus - 1) * 100);
      badges.push({ text: `${tr('방어력')} ${diff > 0 ? `+${diff}%` : `${diff}%`}`, color: diff > 0 ? '#42a5f5' : '#8b9bb4' });
    }
    if (buffs.spdBonus) badges.push({ text: `${tr('속도')} +${Math.round((buffs.spdBonus - 1) * 100)}%`, color: '#66bb6a' });
    if (buffs.maxHpBonus) badges.push({ text: `${tr('최대HP')} +${Math.round((buffs.maxHpBonus - 1) * 100)}%`, color: '#26a69a' });
    if (buffs.luckBonus) badges.push({ text: `${tr('행운')} +${buffs.luckBonus}`, color: '#ce93d8' });
    if (buffs.hpRegenPct) badges.push({ text: `${tr('턴당 체력')} +${(buffs.hpRegenPct * 100).toFixed(1)}%`, color: '#38ef7d' });
    if (buffs.mpRegenPerTurn) badges.push({ text: `${tr('턴당 마나')} +${buffs.mpRegenPerTurn} MP`, color: '#4fc3f7' });
    if (buffs.critRateBonus) badges.push({ text: `${tr('치명타')} +${buffs.critRateBonus}%`, color: '#ffd54f' });
    if (buffs.critDmgBonus) badges.push({ text: `${tr('치명피해')} +${Math.round(buffs.critDmgBonus * 100)}%`, color: '#ff7043' });
    if (buffs.damageReductionPct) badges.push({ text: `${tr('피해감소')} -${Math.round(buffs.damageReductionPct * 100)}%`, color: '#ab47bc' });
    return badges;
  };

  return (
    <div className="rounded-2xl p-3 border border-[#1f2b42] bg-gradient-to-r from-[#0d1424] via-[#0b101c] to-[#070b14] shadow-lg flex flex-col gap-2.5">
      {/* 헤더 (자동 편성과 편대 교체 버튼 제거됨) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base sm:text-lg">🛡️</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                {tr('차원 원정대 출격 편대')}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                  isSquadFull
                    ? 'bg-[#38ef7d22] text-[#38ef7d] border-[#38ef7d66]'
                    : 'bg-[#ef535022] text-[#ef5350] border-[#ef535066]'
                }`}
              >
                {activeCount}/4{tr('인 편성')}
              </span>
            </div>
            <span className="text-[10px] text-[#8b9bb4]">
              {tr('선발 3인 직접 참전 + 전술 오퍼레이터 1인')}
            </span>
          </div>
        </div>

        <span className="text-[10px] text-[#c8aa6e] font-mono shrink-0">
          {tr('슬롯 터치 시 교체')}
        </span>
      </div>

      {/* 4인 슬롯 그리드 (각 슬롯 클릭 시 퀵 편성 모달 호출) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* 선발 3인 슬롯 */}
        {Array.from({ length: 3 }).map((_, idx) => {
          const h = displayMain[idx];
          const posKey: PositionSlot = (h?.position as PositionSlot) || (idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back');
          const posMeta = posConfig[posKey];

          if (!h) {
            return (
              <button
                key={`empty_slot_${idx}`}
                onClick={() => onOpenQuickSquadModal(idx)}
                className="p-2 rounded-xl border border-dashed border-[#23334d] bg-[#0c121f]/50 hover:bg-[#141d30]/60 hover:border-[#c8aa6e66] flex flex-col items-center justify-center text-center min-h-[92px] transition-all group cursor-pointer"
              >
                <span className="text-base opacity-40 group-hover:opacity-80 transition-opacity">➕</span>
                <span className="text-[9px] text-[#556987] font-mono mt-1" style={{ color: posMeta.color }}>
                  {tr('선발')} {idx + 1} [{posMeta.label}]
                </span>
                <span className="text-[8px] text-[#8b9bb4]">{tr('배치하기')}</span>
              </button>
            );
          }

          const cls = CHARACTER_CLASSES[h.classId];
          const customPortrait = CustomAssetService.getHeroPortrait(h);

          return (
            <button
              key={h.id}
              onClick={() => onOpenQuickSquadModal(idx)}
              className="p-1.5 sm:p-2 rounded-xl bg-[#131c2e] border border-[#23334d] hover:border-[#c8aa6e88] hover:bg-[#1a253c] flex flex-col items-center text-center min-w-0 transition-all shadow-sm group cursor-pointer"
              title={tr('터치하여 영웅 및 포지션 변경')}
            >
              <div className="flex items-center justify-between w-full px-0.5 text-[8.5px] font-bold">
                <span className="text-[#c8aa6e]">{tr('선발')}{idx + 1}</span>
                <span style={{ color: posMeta.color }}>[{posMeta.icon}{posMeta.label}]</span>
              </div>

              {customPortrait ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#c8aa6e55] overflow-hidden my-1 shrink-0 bg-[#0c121f] group-hover:scale-105 transition-transform">
                  <img src={customPortrait} alt={h.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="text-lg sm:text-xl my-1 group-hover:scale-105 transition-transform">
                  {cls?.skills[0]?.icon || '🛡️'}
                </div>
              )}

              <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full" title={h.name}>
                {h.name}
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] text-[#c8aa6e] truncate w-full">
                {tr(cls?.name || h.classId)}
              </span>
              <div className="text-[8px] text-[#8b9bb4] font-mono mt-0.5">
                Lv.{h.level}
              </div>
            </button>
          );
        })}

        {/* 전술 오퍼레이터 슬롯 */}
        {leaderHero ? (
          (() => {
            const opCls = CHARACTER_CLASSES[leaderHero.classId];
            const opUlt = opCls?.specialSkill || (leaderHero as any)?.specialSkill || opCls?.skills?.[0] || null;
            const opPortrait = CustomAssetService.getHeroPortrait(leaderHero);
            const cleanUltName = opUlt ? (opUlt.name || '').replace(/^\[(?:궁극기|고유기)\]\s*/, '') : '';

            return (
              <button
                onClick={() => onOpenQuickSquadModal(3)}
                className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#2a1c0d] to-[#171009] border border-[#ffd54f88] hover:border-[#ffe082] hover:bg-[#32210f] flex flex-col items-center text-center min-w-0 transition-all shadow-md shadow-[#ffd54f15] group cursor-pointer"
                title={tr('터치하여 오퍼레이터 교체')}
              >
                <div className="flex items-center justify-between w-full px-0.5 text-[8.5px] font-bold">
                  <span className="text-[#ffd54f]">{tr('오퍼레이터')}</span>
                  <span className="text-[#ffd54f88]">[{tr('지휘')}]</span>
                </div>

                {opPortrait ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#ffd54f] overflow-hidden my-1 shrink-0 bg-[#161009] shadow-sm shadow-[#ffd54f44] group-hover:scale-105 transition-transform">
                    <img src={opPortrait} alt={leaderHero.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-lg sm:text-xl my-1 group-hover:scale-105 transition-transform">
                    👑
                  </div>
                )}

                <span className="text-[10px] sm:text-xs font-bold text-[#ffd54f] truncate w-full" title={leaderHero.name}>
                  {leaderHero.name}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] text-[#ffecb3] truncate w-full">
                  {tr(opCls?.name || leaderHero.classId)}
                </span>
                {cleanUltName ? (
                  <div className="text-[7.5px] text-[#ffd54f] font-bold truncate w-full mt-0.5 flex items-center justify-center gap-0.5">
                    <span>⚡</span>
                    <span className="truncate">{tr(cleanUltName)}</span>
                  </div>
                ) : (
                  <div className="text-[8px] text-[#8b9bb4] font-mono mt-0.5">
                    Lv.{leaderHero.level}
                  </div>
                )}
              </button>
            );
          })()
        ) : (
          <button
            onClick={() => onOpenQuickSquadModal(3)}
            className="p-2 rounded-xl border border-dashed border-[#ffd54f55] bg-[#1a140a]/50 hover:bg-[#251b0f]/60 hover:border-[#ffd54f] flex flex-col items-center justify-center text-center min-h-[92px] transition-all group cursor-pointer"
          >
            <span className="text-base opacity-40 group-hover:opacity-80 transition-opacity">👑</span>
            <span className="text-[9px] text-[#ffd54f] font-mono mt-1">{tr('오퍼레이터')}</span>
            <span className="text-[8px] text-[#ffd54f88]">{tr('배치하기')}</span>
          </button>
        )}
      </div>

      {/* ── 3인의 시너지 및 포지션 버프 나열 (채비실 형식) ── */}
      <div className="p-2.5 rounded-xl bg-[#0c101c] border border-[#1e2a40] flex flex-col gap-2">
        {/* 1. 활성 클래스 시너지 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
              <span>✨</span>
              <span>{tr('3선발 활성 시너지')}</span>
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                activeSynergies.length > 0
                  ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]'
                  : 'bg-white/5 text-[#8b9bb4]'
              }`}
            >
              {lang === 'ko'
                ? `${activeSynergies.length}개 발동 중`
                : `${activeSynergies.length} Active`}
            </span>
          </div>

          {activeSynergies.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {activeSynergies.map(syn => {
                const badges = getBuffBadges(syn.buffs);
                return (
                  <div
                    key={syn.id}
                    className="p-2 rounded-lg bg-[#121929] border border-[#23354d] flex flex-col gap-1.5"
                  >
                    {/* 상단: 시너지 정보 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">{syn.icon}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-[10.5px] truncate block">
                            {tr(syn.name)}
                          </span>
                          <span className="text-[9px] text-[#8b9bb4] truncate block">
                            {tr(syn.description)}
                          </span>
                        </div>
                      </div>
                      {syn.conditionText && (
                        <span className="text-[8.5px] px-1.5 py-0.2 rounded font-mono shrink-0 bg-[#c8aa6e18] text-[#ffd54f] border border-[#ffd54f33]">
                          {tr(syn.conditionText)}
                        </span>
                      )}
                    </div>

                    {/* 하단: 버프 배지 목록 - 버프가 길어지면 줄바꿈하여 깔끔하게 표시 */}
                    {badges.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-white/5">
                        {badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold leading-tight"
                            style={{
                              backgroundColor: `${b.color}22`,
                              color: b.color,
                              border: `1px solid ${b.color}55`,
                            }}
                          >
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-[#101422] border border-white/5 text-center text-[10px] text-[#8b9bb4]">
              {tr('⚪ 발동 중인 3선발 시너지가 없습니다. (다양한 직업을 조합해 보세요)')}
            </div>
          )}
        </div>

        {/* 2. 3인의 진형 포지션 고유 효과 나열 (채비실 형식) */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
          <div className="text-[10.5px] font-bold text-[#cfd8e8] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>🛡️</span>
              <span>{tr('3선발 진형 포지션 배치 효과')}</span>
            </span>
            <span className="text-[9px] text-[#8b9bb4]">
              {tr('편성 창에서 포지션 변경 가능')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {displayMain.map((h, idx) => {
              const posKey: PositionSlot = (h?.position as PositionSlot) || (idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back');
              const posMeta = posConfig[posKey];

              if (!h) {
                return (
                  <div
                    key={`pos_empty_${idx}`}
                    className="p-1.5 rounded-lg bg-[#0e1322] border border-white/5 flex items-center gap-1.5 text-[9.5px] text-[#556987]"
                  >
                    <span>{posMeta.icon}</span>
                    <span>{tr('선발')} {idx + 1} {tr('미배치')}</span>
                  </div>
                );
              }

              return (
                <div
                  key={h.id}
                  className="p-1.5 rounded-lg bg-[#111728] border border-[#212f45] flex flex-col gap-0.5 text-[9.5px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">{h.name}</span>
                    <span
                      className="px-1 py-0.2 rounded font-bold font-mono text-[8.5px]"
                      style={{
                        backgroundColor: `${posMeta.color}22`,
                        color: posMeta.color,
                        border: `1px solid ${posMeta.color}66`,
                      }}
                    >
                      {posMeta.icon} {posMeta.label}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-[#8b9bb4] leading-tight">
                    {posMeta.perk}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
