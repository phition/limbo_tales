import React, { useState } from 'react';
import { Mercenary, PartySynergy } from '../types/game';
import { ALL_PARTY_SYNERGIES, calculatePartySynergies } from '../data/synergies';
import { ANCESTRAL_BLESSINGS_CONFIG } from '../data/ancestralBlessings';

interface Props {
  open: boolean;
  onClose: () => void;
  party: Mercenary[];
}

const ANCESTRAL_SYNERGIES: PartySynergy[] = Object.values(ANCESTRAL_BLESSINGS_CONFIG).map(cfg => ({
  id: cfg.id,
  name: cfg.name,
  icon: cfg.icon,
  category: 'ancestral',
  conditionText: `전사한 [${cfg.classId}] 계열 결속`,
  description: `${cfg.baseDescription} (용병 등급에 따라 최대 2.2배 강화)`,
  buffs: cfg.baseBuffs,
}));

const ALL_COMBINED_SYNERGIES: PartySynergy[] = [...ALL_PARTY_SYNERGIES, ...ANCESTRAL_SYNERGIES];

export const SynergyGuideModal: React.FC<Props> = ({ open, onClose, party }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'role' | 'formation' | 'tier' | 'ancestral'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!open) return null;

  const activeSynergies = calculatePartySynergies(party);
  const activeIds = new Set(activeSynergies.map(s => s.id));

  const filteredSynergies = ALL_COMBINED_SYNERGIES.filter(def => {
    if (activeTab !== 'all' && def.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      def.name.toLowerCase().includes(q) ||
      (def.conditionText?.toLowerCase() || '').includes(q) ||
      def.description.toLowerCase().includes(q)
    );
  });

  const getBuffBadges = (buffs: typeof ALL_PARTY_SYNERGIES[0]['buffs']) => {
    const badges: { text: string; color: string }[] = [];
    if (buffs.allStatsBonus) {
      const pct = Math.round((buffs.allStatsBonus - 1) * 100);
      badges.push({ text: `전 능력치 +${pct}%`, color: '#c8aa6e' });
    }
    if (buffs.atkBonus) {
      const diff = Math.round((buffs.atkBonus - 1) * 100);
      const sign = diff > 0 ? `+${diff}%` : `${diff}%`;
      badges.push({ text: `공격력 ${sign}`, color: diff > 0 ? '#ef5350' : '#8b9bb4' });
    }
    if (buffs.defBonus) {
      const diff = Math.round((buffs.defBonus - 1) * 100);
      const sign = diff > 0 ? `+${diff}%` : `${diff}%`;
      badges.push({ text: `방어력 ${sign}`, color: diff > 0 ? '#42a5f5' : '#8b9bb4' });
    }
    if (buffs.spdBonus) {
      const pct = Math.round((buffs.spdBonus - 1) * 100);
      badges.push({ text: `속도 +${pct}%`, color: '#66bb6a' });
    }
    if (buffs.maxHpBonus) {
      const pct = Math.round((buffs.maxHpBonus - 1) * 100);
      badges.push({ text: `최대 HP +${pct}%`, color: '#26a69a' });
    }
    if (buffs.luckBonus) {
      badges.push({ text: `행운 +${buffs.luckBonus}`, color: '#ce93d8' });
    }
    if (buffs.hpRegenPct) {
      const pct = Math.round(buffs.hpRegenPct * 100);
      badges.push({ text: `턴당 체력 ${pct}% 재생`, color: '#38ef7d' });
    }
    if (buffs.mpRegenPerTurn) {
      badges.push({ text: `턴당 마나 +${buffs.mpRegenPerTurn} MP`, color: '#4fc3f7' });
    }
    if (buffs.frontlineGuardPct) {
      const pct = Math.round(buffs.frontlineGuardPct * 100);
      badges.push({ text: `전열 후열보호 ${pct}%`, color: '#64b5f6' });
    }
    if (buffs.midRowEvasionBonus) {
      const pct = Math.round(buffs.midRowEvasionBonus * 100);
      badges.push({ text: `중열 회피 +${pct}%`, color: '#81c784' });
    }
    if (buffs.startBattleShieldPct) {
      const pct = Math.round(buffs.startBattleShieldPct * 100);
      const turns = buffs.startBattleShieldTurns ? ` (${buffs.startBattleShieldTurns}턴)` : '';
      badges.push({ text: `개시 보호막 ${pct}%${turns}`, color: '#ffb74d' });
    }
    if (buffs.lowHpExecuteBonus) {
      const pct = Math.round(buffs.lowHpExecuteBonus * 100);
      badges.push({ text: `처형 피해 +${pct}%`, color: '#e57373' });
    }
    if (buffs.damageReductionPct) {
      const pct = Math.round(buffs.damageReductionPct * 100);
      badges.push({ text: `받는 피해 -${pct}%`, color: '#ab47bc' });
    }
    if (buffs.critRateBonus) {
      badges.push({ text: `치명타율 +${buffs.critRateBonus}%`, color: '#ffd54f' });
    }
    if (buffs.critDmgBonus) {
      const pct = Math.round(buffs.critDmgBonus * 100);
      badges.push({ text: `치명타 피해 +${pct}%`, color: '#ff7043' });
    }
    if (buffs.defPenetrationBonus) {
      badges.push({ text: `방어 관통 +${buffs.defPenetrationBonus}%`, color: '#ba68c8' });
    }
    if (buffs.drainBonus) {
      badges.push({ text: `흡혈 +${buffs.drainBonus}%`, color: '#e91e63' });
    }
    return badges;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-lg max-h-[85vh] bg-[#0c101a] border border-[#c8aa6e44] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2738] bg-[#080b11] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white">
                  원정대 시너지 도감
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#c8aa6e22] text-[#c8aa6e] font-bold border border-[#c8aa6e44]">
                  현재 {activeSynergies.length}개 발동 중
                </span>
              </div>
              <div className="text-[11px] text-[#8b9bb4]">
                다양한 직업 조합, 진형 배치, 전직 단계에 따라 강력한 파티 패시브가 활성화됩니다.
              </div>
            </div>
          </div>
          <button className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg" style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }} onClick={onClose}>
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>

        {/* 탭 바 & 검색창 */}
        <div className="p-3 border-b border-[#1f2738] bg-[#0e1320] flex flex-col gap-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {[
              { key: 'all', label: '🌟 전체보기', count: ALL_COMBINED_SYNERGIES.length },
              { key: 'role', label: '⚔️ 직업군 조합', count: ALL_PARTY_SYNERGIES.filter(s => s.category === 'role').length },
              { key: 'formation', label: '📐 진형 배치', count: ALL_PARTY_SYNERGIES.filter(s => s.category === 'formation').length },
              { key: 'tier', label: '🎖️ 전직/숙련도', count: ALL_PARTY_SYNERGIES.filter(s => s.category === 'tier').length },
              { key: 'ancestral', label: '⚰️ 영령의 가호 (24종)', count: ANCESTRAL_SYNERGIES.length },
            ].map(tab => (
              <button
                key={tab.key}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-[#c8aa6e] text-black shadow-md shadow-[#c8aa6e33]'
                    : 'bg-[#182030] text-[#cfd8e8] hover:bg-[#222d42]'
                }`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label} <span className="text-[10px] opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="시너지 이름, 발동 조건, 효과 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-[#141b29] border border-[#27354d] rounded-lg text-white placeholder-[#607d8b] focus:outline-none focus:border-[#c8aa6e]"
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b9bb4] hover:text-white"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* 시너지 조합 규칙 안내 배너 */}
          <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#c8aa6e10] border border-[#c8aa6e25] text-[#90caf9] flex items-center gap-1.5">
            <span className="shrink-0">💡</span>
            <span>원정대 시너지 상한: <b>직업군 최대 2개</b> + <b>진형 1개</b> + <b>숙련도 1개</b> (총 최대 4개 정예 적용)</span>
          </div>
        </div>

        {/* 시너지 목록 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
          {filteredSynergies.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8b9bb4]">
              검색 조건에 맞는 원정대 시너지가 없습니다.
            </div>
          ) : (
            filteredSynergies.map(def => {
              const isActive = activeIds.has(def.id);
              const badges = getBuffBadges(def.buffs);

              return (
                <div
                  key={def.id}
                  className={`p-3 rounded-xl border transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#12141a] to-[#121c2e] border-[#c8aa6e] shadow-[0_0_15px_rgba(200, 170, 110,0.25)]'
                      : 'bg-[#121724] border-[#1e283d] opacity-75 hover:opacity-95'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-2xl shrink-0 p-1 rounded-lg bg-black/40 border border-white/10">
                        {def.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-sm ${isActive ? 'text-[#c8aa6e]' : 'text-white'}`}>
                            {def.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#182030] text-[#ffd54f] border border-[#ffd54f33]">
                            {def.conditionText}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        isActive
                          ? 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44] animate-pulse'
                          : 'bg-[#8b9bb415] text-[#8b9bb4] border border-[#8b9bb433]'
                      }`}
                    >
                      {isActive ? '● 활성화됨' : '○ 미발동'}
                    </span>
                  </div>

                  <div className="text-xs text-[#cfd8e8] mb-2 leading-relaxed">
                    {def.description}
                  </div>

                  {/* 수치 버프 뱃지 태그 */}
                  <div className="flex flex-wrap gap-1">
                    {badges.map((b, bi) => (
                      <span
                        key={bi}
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
                        style={{ background: `${b.color}18`, color: b.color, border: `1px solid ${b.color}33` }}
                      >
                        {b.text}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t border-[#1f2738] bg-[#080b11] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8b9bb4]">
            💡 직업군 및 진형 시너지는 중첩 적용되며, 전직/숙련도 시너지는 가장 상위 1개만 적용됩니다.
          </span>
          <button className="btn btn-primary text-xs px-4 py-1.5 font-bold" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
