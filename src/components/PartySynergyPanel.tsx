import React, { useEffect, useState } from 'react';
import { Mercenary, PartySynergy } from '../types/game';
import { calculatePartySynergies } from '../data/synergies';
import { CODEX_COLLECTIONS } from '../data/codex';
import { GameManager } from '../managers/GameManager';

interface Props {
  party: Mercenary[];
  onOpenGuide?: () => void;
  onOpenCodex?: () => void;
  compact?: boolean;
}

export const PartySynergyPanel: React.FC<Props> = ({ party, onOpenGuide, onOpenCodex, compact = false }) => {
  const gm = GameManager.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    gm.on('codexUpdated', handler);
    gm.on('ancestralBlessingUpdated', handler);
    gm.on('partyUpdated', handler);
    return () => {
      gm.off('codexUpdated', handler);
      gm.off('ancestralBlessingUpdated', handler);
      gm.off('partyUpdated', handler);
    };
  }, [gm]);

  const activeSynergies: PartySynergy[] = gm.getActiveSynergies();
  const codexBonus = gm.getCodexBonus();
  const completedMap = gm.codexUnlockedItems || {};
  const totalCodexCount = CODEX_COLLECTIONS.length;
  const completedCodexCount = CODEX_COLLECTIONS.filter(c => completedMap[c.id]).length;
  const codexCompletionPct = totalCodexCount > 0 ? Math.round((completedCodexCount / totalCodexCount) * 100) : 0;

  const getBuffBadges = (buffs: PartySynergy['buffs']) => {
    if (!buffs) return [];
    const badges: { text: string; color: string }[] = [];
    if (buffs.allStatsBonus) badges.push({ text: `전능력치 +${Math.round((buffs.allStatsBonus - 1) * 100)}%`, color: '#00d2ff' });
    if (buffs.atkBonus) {
      const diff = Math.round((buffs.atkBonus - 1) * 100);
      badges.push({ text: `공격력 ${diff > 0 ? `+${diff}%` : `${diff}%`}`, color: diff > 0 ? '#ef5350' : '#8b9bb4' });
    }
    if (buffs.defBonus) {
      const diff = Math.round((buffs.defBonus - 1) * 100);
      badges.push({ text: `방어력 ${diff > 0 ? `+${diff}%` : `${diff}%`}`, color: diff > 0 ? '#42a5f5' : '#8b9bb4' });
    }
    if (buffs.spdBonus) badges.push({ text: `속도 +${Math.round((buffs.spdBonus - 1) * 100)}%`, color: '#66bb6a' });
    if (buffs.maxHpBonus) badges.push({ text: `최대HP +${Math.round((buffs.maxHpBonus - 1) * 100)}%`, color: '#26a69a' });
    if (buffs.luckBonus) badges.push({ text: `행운 +${buffs.luckBonus}`, color: '#ce93d8' });
    if (buffs.hpRegenPct) badges.push({ text: `턴당 체력 +${(buffs.hpRegenPct * 100).toFixed(1)}%`, color: '#38ef7d' });
    if (buffs.mpRegenPerTurn) badges.push({ text: `턴당 마나 +${buffs.mpRegenPerTurn} MP`, color: '#4fc3f7' });
    if (buffs.frontlineGuardPct) badges.push({ text: `전열 엄호 -${Math.round(buffs.frontlineGuardPct * 100)}%`, color: '#64b5f6' });
    if (buffs.midRowEvasionBonus) badges.push({ text: `중열 회피 +${Math.round(buffs.midRowEvasionBonus * 100)}%`, color: '#81c784' });
    if (buffs.startBattleShieldPct) {
      const turns = buffs.startBattleShieldTurns ? ` (${buffs.startBattleShieldTurns}턴)` : '';
      badges.push({ text: `개시 보호막 ${Math.round(buffs.startBattleShieldPct * 100)}%${turns}`, color: '#ffb74d' });
    }
    if (buffs.lowHpExecuteBonus) badges.push({ text: `처형 피해 +${Math.round(buffs.lowHpExecuteBonus * 100)}%`, color: '#e57373' });
    if (buffs.damageReductionPct) badges.push({ text: `피해감소 -${Math.round(buffs.damageReductionPct * 100)}%`, color: '#ab47bc' });
    if (buffs.critRateBonus) badges.push({ text: `치명타 +${buffs.critRateBonus}%`, color: '#ffd54f' });
    if (buffs.critDmgBonus) badges.push({ text: `치명피해 +${Math.round(buffs.critDmgBonus * 100)}%`, color: '#ff7043' });
    if (buffs.defPenetrationBonus) badges.push({ text: `관통 +${buffs.defPenetrationBonus}%`, color: '#ba68c8' });
    if (buffs.drainBonus) badges.push({ text: `흡혈 +${buffs.drainBonus}%`, color: '#e91e63' });
    return badges;
  };

  const getCodexBadges = (bonus: ReturnType<typeof gm.getCodexBonus>) => {
    const badges: { text: string; color: string }[] = [];
    if (bonus.allStatsBonus && bonus.allStatsBonus > 1) {
      badges.push({ text: `전능력치 +${Math.round((bonus.allStatsBonus - 1) * 100)}%`, color: '#00d2ff' });
    }
    if (bonus.allDmgPct > 0) badges.push({ text: `모든피해 +${bonus.allDmgPct}%`, color: '#ff416c' });
    if (bonus.atk > 0) badges.push({ text: `공격력 +${bonus.atk}`, color: '#ef5350' });
    if (bonus.def > 0) badges.push({ text: `방어력 +${bonus.def}`, color: '#42a5f5' });
    if (bonus.hp > 0) badges.push({ text: `최대HP +${bonus.hp}`, color: '#66bb6a' });
    if (bonus.mp > 0) badges.push({ text: `최대MP +${bonus.mp}`, color: '#ab47bc' });
    if (bonus.spd > 0) badges.push({ text: `속도 +${bonus.spd}`, color: '#81c784' });
    if (bonus.luck > 0) badges.push({ text: `행운 +${bonus.luck}`, color: '#ce93d8' });
    if (bonus.critRate > 0) badges.push({ text: `치명타 +${bonus.critRate}%`, color: '#ffd54f' });
    if (bonus.dmgReduction > 0) badges.push({ text: `피해감소 -${bonus.dmgReduction}%`, color: '#38ef7d' });
    if (bonus.expBonusPct > 0) badges.push({ text: `경험치 +${bonus.expBonusPct}%`, color: '#80deea' });
    if (bonus.goldBonusPct > 0) badges.push({ text: `골드 +${bonus.goldBonusPct}%`, color: '#ffd54f' });
    if (bonus.upkeepDiscountPct > 0) badges.push({ text: `유지비 -${bonus.upkeepDiscountPct}%`, color: '#00d2ff' });
    if (bonus.productionBonusPct > 0) badges.push({ text: `생산 +${bonus.productionBonusPct}%`, color: '#aed581' });
    return badges;
  };

  const codexBadges = getCodexBadges(codexBonus);
  const hasCodexBonus = completedCodexCount > 0 || codexBadges.length > 0;

  return (
    <div className="panel p-3 bg-[#111622] border border-[#1f2738] rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-[#00d2ff]">✨ 원정대 활성 시너지</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
              activeSynergies.length > 0
                ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                : 'bg-[#8b9bb422] text-[#8b9bb4]'
            }`}
          >
            {activeSynergies.length}개 발동 중
          </span>
          {gm.activeAncestralBlessing && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ab47bc22] text-[#f48fb1] border border-[#ba68c855] font-bold flex items-center gap-0.5">
              ⚰️ 영혼 결속
            </span>
          )}
          {hasCodexBonus && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f55] font-bold flex items-center gap-0.5">
              📜 도감 완성 ({completedCodexCount}종)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenCodex && (
            <button
              type="button"
              className="text-xs px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] font-bold hover:bg-[#ffd54f25] transition-all cursor-pointer flex items-center gap-1"
              onClick={onOpenCodex}
              title="심연의 백과 도감 열기"
              aria-label="심연의 백과 도감 열기"
            >
              <span>📜</span>
              {completedCodexCount > 0 && (
                <span className="text-[9px] font-mono opacity-80">({completedCodexCount})</span>
              )}
            </button>
          )}
          {onOpenGuide && (
            <button
              type="button"
              className="text-xs px-1.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] border border-[#00d2ff33] font-bold hover:bg-[#00d2ff25] transition-all cursor-pointer flex items-center gap-1"
              onClick={onOpenGuide}
              title="시너지 조합 도감 열기"
              aria-label="시너지 조합 도감 열기"
            >
              <span>📋</span>
            </button>
          )}
        </div>
      </div>

      {activeSynergies.length === 0 && !hasCodexBonus ? (
        <div className="p-2.5 rounded-lg bg-[#0d121c] border border-[#1e2738] text-[11px] text-[#8b9bb4] flex items-center justify-between gap-2">
          <div>
            💡 <span className="text-[#cfd8dc]">현재 발동된 원정대 시너지가 없습니다.</span>
            <div className="text-[10px] text-[#607d8b] mt-0.5">
              탱/딜/힐 역할군 조합, 진형 배치, 성채 묘지 영혼 결속, 또는 심연의 백과(도감) 수집을 통해 시너지를 발동할 수 있습니다.
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpenCodex && (
              <button
                type="button"
                className="btn btn-ghost text-[10px] px-2 py-1 text-[#ffd54f]"
                onClick={onOpenCodex}
              >
                도감 확인 ➔
              </button>
            )}
            {onOpenGuide && (
              <button
                type="button"
                className="btn btn-ghost text-[10px] px-2 py-1 text-[#00d2ff]"
                onClick={onOpenGuide}
              >
                조합 확인 ➔
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {activeSynergies.length === 0 && hasCodexBonus && (
            <div className="p-2 rounded-lg bg-[#0d121c] border border-[#1e2738] text-[10px] text-[#8b9bb4] flex items-center justify-between gap-2">
              <span>
                💡 <span className="text-[#cfd8dc]">현재 파티 조합 시너지는 없으나, 심연의 백과 도감 가호가 상시 적용 중입니다.</span>
              </span>
              {onOpenGuide && (
                <button
                  type="button"
                  className="btn btn-ghost text-[10px] px-2 py-0.5 text-[#00d2ff] shrink-0"
                  onClick={onOpenGuide}
                >
                  조합 확인 ➔
                </button>
              )}
            </div>
          )}

          <div className={`grid gap-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {activeSynergies.filter(syn => Boolean(syn && syn.buffs)).map((syn) => {
              const isAncestral = syn.category === 'ancestral';
              const badges = getBuffBadges(syn.buffs);
              return (
                <div
                  key={syn.id}
                  className={`p-2 rounded-lg border shadow-sm flex flex-col justify-between gap-1 transition-all ${
                    isAncestral
                      ? 'bg-gradient-to-r from-[#1f1032] to-[#131024] border-[#ba68c877] shadow-[0_0_8px_rgba(186,104,200,0.15)]'
                      : 'bg-gradient-to-r from-[#0e1c2e] to-[#121826] border-[#00d2ff44]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-base shrink-0">{syn.icon}</span>
                      <span className={`text-xs font-bold truncate ${isAncestral ? 'text-[#e1bee7]' : 'text-[#00d2ff]'}`}>
                        {syn.name}
                      </span>
                    </div>
                    {syn.conditionText && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                          isAncestral
                            ? 'bg-[#ab47bc22] text-[#ffd54f] border border-[#ba68c855]'
                            : 'bg-[#00d2ff18] text-[#ffd54f] border border-[#ffd54f33]'
                        }`}
                      >
                        {syn.conditionText}
                      </span>
                    )}
                  </div>

                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {badges.map((b, bi) => (
                        <span
                          key={bi}
                          className="text-[9px] px-1 py-0.2 rounded font-mono font-bold"
                          style={{ background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}33` }}
                        >
                          {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 📜 심연의 백과 도감 완성 종합 가호 카드 */}
            {hasCodexBonus && (
              <div
                className={`p-2.5 rounded-lg border shadow-sm flex flex-col justify-between gap-1.5 transition-all bg-gradient-to-r from-[#1f180a] via-[#141824] to-[#10141f] border-[#ffd54f66] shadow-[0_0_10px_rgba(255,213,79,0.12)] ${
                  onOpenCodex ? 'hover:border-[#ffd54f] hover:shadow-[0_0_12px_rgba(255,213,79,0.22)] cursor-pointer' : ''
                } ${compact ? '' : 'sm:col-span-2'}`}
                onClick={onOpenCodex}
                title={onOpenCodex ? '클릭하여 심연의 백과 도감 열기' : undefined}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-base shrink-0">📜</span>
                    <span className="text-xs font-bold text-[#ffd54f] truncate">
                      심연의 백과 (도감 완성 종합 가호)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] font-bold shrink-0">
                      영구 패시브
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#ffd54f18] text-[#ffd54f] border border-[#ffd54f33]">
                      {completedCodexCount}/{totalCodexCount} 항목 ({codexCompletionPct}%)
                    </span>
                    {onOpenCodex && (
                      <span className="text-[10px] text-[#ffd54f] font-bold opacity-80 hover:opacity-100 hidden sm:inline">
                        도감 열기 ➔
                      </span>
                    )}
                  </div>
                </div>

                {codexBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {codexBadges.map((b, bi) => (
                      <span
                        key={bi}
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                        style={{ background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}33` }}
                      >
                        {b.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
