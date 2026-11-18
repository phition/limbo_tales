import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { useI18n } from '../../hooks/useI18n';
import { NEMESIS_BOSS_CONFIG, NemesisBossPartConfig } from '../../data/nemesis';
import { NemesisPartId } from '../../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
  initialPart?: NemesisPartId | null;
}

export const NemesisIntelModal: React.FC<Props> = ({
  open,
  onClose,
  initialPart = 'head',
}) => {
  const { tr } = useI18n();
  const [activeTab, setActiveTab] = useState<'parts' | 'phases'>('parts');
  const [selectedPartId, setSelectedPartId] = useState<NemesisPartId>(initialPart || 'head');

  useEffect(() => {
    if (initialPart) {
      setSelectedPartId(initialPart);
      setActiveTab('parts');
    }
  }, [initialPart, open]);

  const partsList: NemesisBossPartConfig[] = [
    NEMESIS_BOSS_CONFIG.parts.head,
    NEMESIS_BOSS_CONFIG.parts.body,
    NEMESIS_BOSS_CONFIG.parts.tail,
  ];

  const currentPart = NEMESIS_BOSS_CONFIG.parts[selectedPartId] || NEMESIS_BOSS_CONFIG.parts.head;

  const partWeaknesses: Record<NemesisPartId, { weakness: string; breakEffect: string; theme: string }> = {
    head: {
      weakness: tr('마법 & 원거리 관통 취약 (마법 방어력 30% 감소)'),
      breakEffect: tr('머리 파괴 시: 보스의 강력한 브레스 및 즉사기 발동 봉인'),
      theme: '#ef5350',
    },
    body: {
      weakness: tr('물리 강타 & 둔기 타격 취약 (치명타 저항 25% 감소)'),
      breakEffect: tr('몸통 파괴 시: 보스의 지속 방어막 생성 및 마나 강탈 차단'),
      theme: '#ce93d8',
    },
    tail: {
      weakness: tr('연타 & 급소 찌르기 취약 (상태이상 저항 40% 감소)'),
      breakEffect: tr('꼬리 파괴 시: 후열 기습 휩쓸기 공격 및 전체 침묵 영구 봉인'),
      theme: '#ffd54f',
    },
  };

  const partMeta = partWeaknesses[selectedPartId];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">👾</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm sm:text-base">{tr('크로노스 전술 인텔 & 약점 분석')}</span>
            <span className="text-[10px] text-[#ce93d8] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#ce93d81a] border border-[#ce93d844]">
              TACTICAL INTEL
            </span>
          </div>
        </div>
      }
      maxWidth="max-w-[95vw] sm:max-w-[620px]"
    >
      <div className="flex flex-col gap-3 text-xs text-[#cfd8e8]">
        {/* 상단 탭 */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-[#0d121f] border border-[#1e2a40]">
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'parts'
                ? 'bg-gradient-to-r from-[#ce93d8] to-[#ab47bc] text-white shadow-md shadow-[#ce93d833]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎯</span>
            <span>{tr('3대 부위별 전술 & 스킬')}</span>
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'phases'
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white shadow-md shadow-[#ff416c33]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔮</span>
            <span>{tr('3단계 페이즈 전황 분석')}</span>
          </button>
        </div>

        {/* 1. 3대 부위 전술 탭 */}
        {activeTab === 'parts' && (
          <div className="flex flex-col gap-2.5">
            {/* 3부위 선택 세그먼트 */}
            <div className="grid grid-cols-3 gap-1.5">
              {partsList.map(p => {
                const isSelected = selectedPartId === p.id;
                const pColor = p.id === 'head' ? '#ef5350' : p.id === 'body' ? '#ce93d8' : '#ffd54f';
                const cleanName = (p.name || '').replace(/\s*\(.*?\)/g, '').trim();
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartId(p.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#1e142e] shadow-lg scale-[1.02]'
                        : 'bg-[#0f1422] border-[#1e2a40] opacity-75 hover:opacity-100 hover:bg-[#151c2e]'
                    }`}
                    style={{ borderColor: isSelected ? pColor : undefined }}
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="font-bold text-xs" style={{ color: isSelected ? pColor : '#cfd8dc' }}>
                      {tr(cleanName)}
                    </span>
                    <span className="text-[9px] text-[#8b9bb4] font-mono">
                      {(p.maxHp / 1000000).toFixed(1)}M HP
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 선택된 부위 상세 인텔 카드 */}
            <div className="p-3 rounded-xl bg-[#140e1c] border border-[#ce93d844] flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentPart.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{tr(currentPart.name)}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-[#ffd54f]">
                        {currentPart.position.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#ce93d8]">{tr(currentPart.archetype)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#8b9bb4]">{tr('최대 생명력')}</div>
                  <div className="font-mono font-bold text-xs text-[#ffd54f]">
                    {currentPart.maxHp.toLocaleString()} HP
                  </div>
                </div>
              </div>

              {/* 약점 및 파괴 효과 칩 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
                <div className="p-2 rounded-lg bg-[#1a1222] border border-[#ce93d833]">
                  <span className="font-bold text-[#ffd54f] flex items-center gap-1 mb-0.5">
                    <span>⚡</span>
                    <span>{tr('공략 약점')}</span>
                  </span>
                  <span className="text-[#cfd8dc]">{partMeta.weakness}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#221016] border border-[#ef535044]">
                  <span className="font-bold text-[#ff80ab] flex items-center gap-1 mb-0.5">
                    <span>💥</span>
                    <span>{tr('부위 격파 효과')}</span>
                  </span>
                  <span className="text-[#ffcdd2]">{partMeta.breakEffect}</span>
                </div>
              </div>

              {/* 보유 스킬 리스트 */}
              <div className="mt-1">
                <div className="text-[11px] font-bold text-[#8b9bb4] mb-1 flex items-center gap-1">
                  <span>⚔️</span>
                  <span>{tr('사용 스킬 패턴')} ({currentPart.skills.length})</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {currentPart.skills.map(sk => (
                    <div
                      key={sk.id}
                      className="p-2 rounded-lg bg-[#0e1322] border border-[#1e2a40] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{sk.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">
                            {tr(sk.name)}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4] line-clamp-1">
                            {tr(sk.desc)}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#ffd54f] font-bold">
                          {Math.round(sk.power * 100)}% {tr('위력')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. 페이즈 전황 탭 */}
        {activeTab === 'phases' && (
          <div className="flex flex-col gap-2.5">
            {NEMESIS_BOSS_CONFIG.phases.map(ph => (
              <div
                key={ph.phase}
                className="p-3 rounded-xl border bg-[#120e1a] flex flex-col gap-1.5"
                style={{ borderColor: `${ph.badgeColor}44` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${ph.badgeColor}22`,
                        color: ph.badgeColor,
                        border: `1px solid ${ph.badgeColor}66`,
                      }}
                    >
                      Phase {ph.phase}
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">{tr(ph.name)}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#ffd54f] font-bold">
                    {ph.threshold === 1.0 ? '100% ~ 70%' : ph.threshold === 0.7 ? '70% ~ 30%' : '30% ~ 0%'} HP
                  </span>
                </div>
                <p className="text-[11px] text-[#cfd8dc] leading-relaxed">
                  {tr(ph.desc)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-[#1e2a40] flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary text-xs px-4 py-2 font-bold shadow-md shadow-[#c8aa6e22]"
          >
            {tr('닫기')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
