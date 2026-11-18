import React, { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { useI18n } from '../../hooks/useI18n';
import { useGameManager } from '../../hooks/useGameManager';
import { CHARACTER_CLASSES } from '../../data/classes';
import { CustomAssetService } from '../../services/CustomAssetService';
import { SoundManager } from '../../managers/SoundManager';
import { Mercenary, PositionSlot } from '../../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSlotIdx?: number; // 0, 1, 2: 선발 1~3, 3: 오퍼레이터
}

export const NemesisQuickSquadModal: React.FC<Props> = ({
  open,
  onClose,
  initialSlotIdx = 0,
}) => {
  const { tr } = useI18n();
  const { state, gm } = useGameManager();
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(initialSlotIdx);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 덱 정보
  const { mainHeroes, leaderHero } = gm.getDimensionalDeck();
  const currentSlots: (Mercenary | null)[] = [
    mainHeroes[0] || null,
    mainHeroes[1] || null,
    mainHeroes[2] || null,
    leaderHero || null,
  ];

  // 포지션 메타 설정
  const posConfig: Record<PositionSlot, { label: string; color: string; perk: string; icon: string }> = {
    front: { label: tr('전열'), color: '#ef5350', perk: tr('피격률↑ 피해-10%'), icon: '🛡️' },
    mid:   { label: tr('중열'), color: '#ffd54f', perk: tr('치명타+10% 회피+10%'), icon: '🎯' },
    back:  { label: tr('후열'), color: '#42a5f5', perk: tr('마나-15% 마법+15%'), icon: '🔮' },
  };

  // 포지션 순환 핸들러 (전열 ➔ 중열 ➔ 후열 ➔ 전열)
  const handleCyclePosition = (hero: Mercenary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const curPos: PositionSlot = (hero.position as PositionSlot) || 'mid';
    const nextMap: Record<PositionSlot, PositionSlot> = {
      front: 'mid',
      mid: 'back',
      back: 'front',
    };
    const nextPos = nextMap[curPos] || 'mid';
    gm.setHeroPosition(hero.id, nextPos);
    SoundManager.getInstance().play('click');
  };

  // 특정 포지션 직접 지정 핸들러
  const handleSetPosition = (hero: Mercenary, targetPos: PositionSlot) => {
    gm.setHeroPosition(hero.id, targetPos);
    SoundManager.getInstance().play('click');
  };

  // 보유 중인 전체 영웅 풀 (중복 제거)
  const allHeroes = useMemo(() => {
    const list = [...state.barracks, ...state.party];
    return list.filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
  }, [state.barracks, state.party]);

  // 필터링된 영웅 목록 (전투력 순 정렬)
  const filteredHeroes = useMemo(() => {
    return allHeroes
      .filter(h => {
        if (filterClass !== 'all') {
          const cls = CHARACTER_CLASSES[h.classId];
          const archetype = cls?.role || cls?.archetype || '';
          if (filterClass === 'warrior' && !h.classId.includes('warrior') && !h.classId.includes('knight') && !h.classId.includes('paladin') && !archetype.includes('tank')) return false;
          if (filterClass === 'mage' && !h.classId.includes('mage') && !h.classId.includes('priest') && !h.classId.includes('cleric') && !archetype.includes('magic')) return false;
          if (filterClass === 'rogue' && !h.classId.includes('rogue') && !h.classId.includes('assassin') && !h.classId.includes('archer') && !h.classId.includes('hunter')) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const cls = CHARACTER_CLASSES[h.classId];
          const nameMatch = h.name.toLowerCase().includes(q);
          const classMatch = (cls?.name || '').toLowerCase().includes(q);
          if (!nameMatch && !classMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pA = a.stats.atk * 3 + a.stats.def * 2 + a.maxHp / 5;
        const pB = b.stats.atk * 3 + b.stats.def * 2 + b.maxHp / 5;
        return pB - pA;
      });
  }, [allHeroes, filterClass, searchQuery]);

  // 슬롯 할당 핸들러
  const handleAssignHero = (hero: Mercenary) => {
    const mainIds = [
      currentSlots[0]?.id || '',
      currentSlots[1]?.id || '',
      currentSlots[2]?.id || '',
    ];
    let leaderId = currentSlots[3]?.id || '';

    // 만약 이미 다른 슬롯에 배치되어 있다면 스왑
    const prevSlotIdx = currentSlots.findIndex(s => s && s.id === hero.id);
    if (prevSlotIdx !== -1 && prevSlotIdx !== activeSlotIdx) {
      const targetSlotPrevHero = currentSlots[activeSlotIdx];
      if (activeSlotIdx < 3) {
        mainIds[activeSlotIdx] = hero.id;
      } else {
        leaderId = hero.id;
      }

      if (prevSlotIdx < 3) {
        mainIds[prevSlotIdx] = targetSlotPrevHero ? targetSlotPrevHero.id : '';
      } else {
        leaderId = targetSlotPrevHero ? targetSlotPrevHero.id : '';
      }
    } else {
      // 신규 할당
      if (activeSlotIdx < 3) {
        mainIds[activeSlotIdx] = hero.id;
      } else {
        leaderId = hero.id;
      }
    }

    gm.setDimensionalDeck({
      mainHeroIds: mainIds.filter(Boolean),
      leaderHeroId: leaderId,
      operatorHeroId: leaderId,
    });

    SoundManager.getInstance().play('equip');

    // 다음 빈 슬롯이 있다면 자동으로 포커스 이동
    if (activeSlotIdx < 3) {
      setActiveSlotIdx(prev => Math.min(3, prev + 1));
    }
  };

  // 자동 편성
  const handleAutoAssign = () => {
    const ok = gm.autoAssignDimensionalDeck();
    if (ok) {
      SoundManager.getInstance().play('equip');
    }
  };

  const slotLabels = [
    { title: tr('선발 1'), color: '#c8aa6e' },
    { title: tr('선발 2'), color: '#ce93d8' },
    { title: tr('선발 3'), color: '#90caf9' },
    { title: tr('오퍼레이터'), color: '#ffd54f' },
  ];

  const activeSlotHero = currentSlots[activeSlotIdx];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🛡️</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm sm:text-base">{tr('차원 원정대 편성 & 포지션 설정')}</span>
            <span className="text-[10px] text-[#ffd54f] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#ffd54f1a] border border-[#ffd54f44]">
              SQUAD & FORMATION
            </span>
          </div>
        </div>
      }
      maxWidth="max-w-[95vw] sm:max-w-[660px]"
    >
      <div className="flex flex-col gap-3 text-xs text-[#cfd8e8]">
        {/* 상단 4인 슬롯 상태 바 */}
        <div className="p-2.5 rounded-xl bg-[#0b101d] border border-[#1e2a40] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-white flex items-center gap-1">
              <span>🎯</span>
              <span>{tr('배치 슬롯 선택')}</span>
              <span className="text-[10px] text-[#8b9bb4]">({tr('슬롯 터치 후 아래 영웅을 선택하세요')})</span>
            </span>
            <button
              onClick={handleAutoAssign}
              className="btn btn-primary text-[10px] px-2.5 py-1 font-bold flex items-center gap-1 shadow-sm shadow-[#c8aa6e22] cursor-pointer"
            >
              <span>⚡</span>
              <span>{tr('자동 편성')}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {currentSlots.map((hero, sIdx) => {
              const isSelected = activeSlotIdx === sIdx;
              const meta = slotLabels[sIdx];
              const customPortrait = hero ? CustomAssetService.getHeroPortrait(hero) : null;
              const cls = hero ? CHARACTER_CLASSES[hero.classId] : null;
              const isVanguard = sIdx < 3;
              const posKey: PositionSlot = (hero?.position as PositionSlot) || (sIdx === 0 ? 'front' : sIdx === 1 ? 'mid' : 'back');
              const posMeta = posConfig[posKey];

              return (
                <div
                  key={`deck_slot_${sIdx}`}
                  onClick={() => setActiveSlotIdx(sIdx)}
                  className={`p-1.5 rounded-xl border flex flex-col items-center text-center transition-all min-w-0 relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a233a] border-[#ffd54f] ring-2 ring-[#ffd54f55] scale-[1.02] shadow-lg'
                      : 'bg-[#101626] border-[#1e2a40] hover:bg-[#151d32]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5 text-[8.5px] font-bold">
                    <span style={{ color: meta.color }}>{meta.title}</span>
                    {isVanguard && hero ? (
                      <span style={{ color: posMeta.color }}>[{posMeta.label}]</span>
                    ) : (
                      <span className="text-[#8b9bb4]">[{sIdx === 3 ? tr('지휘') : tr('미배치')}]</span>
                    )}
                  </div>

                  {hero ? (
                    <>
                      {customPortrait ? (
                        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden my-1 shrink-0 bg-[#0c121f]">
                          <img src={customPortrait} alt={hero.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-base my-0.5">{cls?.skills[0]?.icon || '🛡️'}</div>
                      )}
                      <span className="text-[10px] font-bold text-white truncate w-full">
                        {hero.name}
                      </span>
                      <span className="text-[8.5px] text-[#c8aa6e] truncate w-full">
                        Lv.{hero.level}
                      </span>

                      {/* 선발 영웅의 원터치 포지션 순환 버튼 */}
                      {isVanguard && (
                        <button
                          onClick={(e) => handleCyclePosition(hero, e)}
                          className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all flex items-center gap-0.5 shadow-xs cursor-pointer hover:brightness-125"
                          style={{
                            borderColor: `${posMeta.color}88`,
                            color: posMeta.color,
                            backgroundColor: `${posMeta.color}15`,
                          }}
                          title={tr('터치 시 전열/중열/후열 포지션 순환')}
                        >
                          <span>{posMeta.icon}</span>
                          <span>{posMeta.label}</span>
                          <span className="text-[7.5px] opacity-70">↻</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center my-2 text-center">
                      <span className="text-base opacity-30">➕</span>
                      <span className="text-[8px] text-[#556987] font-mono mt-0.5">{tr('미배치')}</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-[#ffd54f] text-black text-[7px] font-bold">
                      선택
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 🛡️ 선택된 선발 영웅의 채비실 스타일 3단 포지션 퀵 셀렉터 */}
          {activeSlotIdx < 3 && activeSlotHero && (
            <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between gap-2 bg-[#080d17] p-2 rounded-lg">
              <div className="text-[10px] text-[#ffd54f] font-bold flex items-center gap-1 shrink-0">
                <span>🛡️</span>
                <span>[{activeSlotHero.name}] {tr('포지션 설정')}:</span>
              </div>

              <div className="flex items-center gap-1 flex-1 justify-end">
                {(['front', 'mid', 'back'] as PositionSlot[]).map((pSlot) => {
                  const pMeta = posConfig[pSlot];
                  const isCurrentPos = (activeSlotHero.position || 'mid') === pSlot;
                  return (
                    <button
                      key={pSlot}
                      onClick={() => handleSetPosition(activeSlotHero, pSlot)}
                      className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        isCurrentPos
                          ? 'shadow-sm brightness-125 ring-1'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: isCurrentPos ? pMeta.color : `${pMeta.color}44`,
                        color: isCurrentPos ? '#ffffff' : pMeta.color,
                        backgroundColor: isCurrentPos ? pMeta.color : `${pMeta.color}15`,
                      }}
                    >
                      <span>{pMeta.icon}</span>
                      <span>{pMeta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 필터 및 검색창 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1 p-0.5 rounded-lg bg-[#0d121f] border border-[#1e2a40]">
            {[
              { id: 'all', label: tr('전체') },
              { id: 'warrior', label: tr('전사/탱커') },
              { id: 'mage', label: tr('마법/사제') },
              { id: 'rogue', label: tr('도적/궁수') },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterClass(f.id)}
                className={`flex-1 py-1 text-[10px] font-bold rounded cursor-pointer ${
                  filterClass === f.id
                    ? 'bg-[#c8aa6e] text-black'
                    : 'text-[#8b9bb4] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-28 sm:w-36 shrink-0">
            <input
              type="text"
              placeholder={tr('영웅 검색...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-[11px] rounded-lg bg-[#0d121f] border border-[#1e2a40] text-white placeholder-[#556987] focus:outline-none focus:border-[#c8aa6e]"
            />
          </div>
        </div>

        {/* 영웅 목록 그리드 (포지션 설정 버튼 포함) */}
        <div className="max-h-[300px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {filteredHeroes.map(h => {
            const cls = CHARACTER_CLASSES[h.classId];
            const customPortrait = CustomAssetService.getHeroPortrait(h);
            const inDeckSlotIdx = currentSlots.findIndex(s => s && s.id === h.id);
            const isInDeck = inDeckSlotIdx !== -1;
            const assignedMeta = isInDeck ? slotLabels[inDeckSlotIdx] : null;
            const heroPos: PositionSlot = (h.position as PositionSlot) || 'mid';
            const heroPosMeta = posConfig[heroPos];

            return (
              <div
                key={h.id}
                onClick={() => handleAssignHero(h)}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all min-w-0 cursor-pointer ${
                  isInDeck
                    ? 'bg-[#182030] border-[#ffd54f88] shadow-sm'
                    : 'bg-[#0f1422] border-[#1e2a40] hover:bg-[#151c2e] hover:border-[#c8aa6e44]'
                }`}
              >
                {customPortrait ? (
                  <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden shrink-0 bg-[#0c121f]">
                    <img src={customPortrait} alt={h.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-[#151c2e] text-lg shrink-0">
                    {cls?.skills[0]?.icon || '👤'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white text-xs truncate">{h.name}</span>
                    <span className="text-[9px] text-[#ffd54f] font-mono shrink-0">Lv.{h.level}</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] truncate flex items-center justify-between">
                    <span>{tr(cls?.name || h.classId)}</span>

                    {/* 포지션 원터치 순환 버튼 (채비실 형식) */}
                    <button
                      onClick={(e) => handleCyclePosition(h, e)}
                      className="px-1.5 py-0.2 rounded font-bold text-[8px] border transition-all hover:brightness-125 cursor-pointer ml-1"
                      style={{
                        borderColor: `${heroPosMeta.color}88`,
                        color: heroPosMeta.color,
                        backgroundColor: `${heroPosMeta.color}15`,
                      }}
                      title={tr('포지션 변경 (터치 시 전/중/후열 순환)')}
                    >
                      {heroPosMeta.icon} {heroPosMeta.label}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[8.5px] font-mono">
                    <span className="text-[#ff80ab]">공 {h.stats.atk}</span>
                    <span className="text-[#90caf9]">방 {h.stats.def}</span>
                    {isInDeck && assignedMeta && (
                      <span
                        className="px-1 rounded font-bold"
                        style={{ backgroundColor: `${assignedMeta.color}22`, color: assignedMeta.color }}
                      >
                        {assignedMeta.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredHeroes.length === 0 && (
          <div className="text-center py-6 text-[#8b9bb4] text-xs">
            {tr('조건에 맞는 영웅이 없습니다.')}
          </div>
        )}

        <div className="pt-2 border-t border-[#1e2a40] flex justify-between items-center">
          <span className="text-[10px] text-[#8b9bb4]">
            {tr('총 보유 영웅')}: {allHeroes.length}{tr('명')}
          </span>
          <button
            onClick={onClose}
            className="btn btn-primary text-xs px-4 py-2 font-bold shadow-md shadow-[#c8aa6e22] cursor-pointer"
          >
            {tr('편성 및 진형 설정 완료')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
