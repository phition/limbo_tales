import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { GameManager } from '../managers/GameManager';
import { CODEX_COLLECTIONS } from '../data/codex';
import { CodexCollectionItem } from '../types/game';
import { SoundManager } from '../managers/SoundManager';
import { useI18n } from '../hooks/useI18n';

interface Props {
  open: boolean;
  onClose: () => void;
  gm: GameManager;
}

export const CodexModal: React.FC<Props> = ({ open, onClose, gm }) => {
  const { tr } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectedStory, setInspectedStory] = useState<CodexCollectionItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const completedMap = gm.codexUnlockedItems || {};
  const totalCount = CODEX_COLLECTIONS.length;
  const completedCount = CODEX_COLLECTIONS.filter(c => completedMap[c.id]).length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalBonus = gm.getCodexBonus();

  const categories = [
    { id: 'all', label: '전체 컬렉션', icon: '📜' },
    { id: 'armory', label: '병기창 무구', icon: '⚔️' },
    { id: 'boss_equip', label: '보스 세트', icon: '👑' },
    { id: 'skillbook', label: '비전 마도서', icon: '📖' },
    { id: 'lore', label: '서사 회고록', icon: '📜' },
    { id: 'artifact', label: '고대 오파츠', icon: '⚓' },
    { id: 'resource', label: '기초 자원', icon: '🏛️' },
    { id: 'supply', label: '탐험 보급', icon: '🎒' },
    { id: 'material', label: '심연 재료', icon: '💎' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? CODEX_COLLECTIONS
    : CODEX_COLLECTIONS.filter(c => c.category === selectedCategory);

  // 가장 마지막(최근)에 등록한 항목 ID
  const latestUnlockedId = useMemo(() => {
    if (!gm.codexUnlockOrder || gm.codexUnlockOrder.length === 0) return null;
    return gm.codexUnlockOrder[gm.codexUnlockOrder.length - 1];
  }, [gm.codexUnlockOrder, refreshKey]);

  // 🌟 도감 정렬:
  // 1순위: 등록 가능한 목록(✨ 등록 가능)을 가장 위에 둠
  // 2순위: 등록 가능한 목록이 없을 때(또는 등록 가능 목록 다음): 가장 마지막에 등록한 목록을 순서대로(최신순 내림차순) 보여줌
  // 3순위: 아직 미완료된 목록 (기본 도감 순서)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aCompleted = !!completedMap[a.id];
      const bCompleted = !!completedMap[b.id];
      const aCanRegister = !aCompleted && gm.canRegisterCodexItem(a);
      const bCanRegister = !bCompleted && gm.canRegisterCodexItem(b);

      // 1순위: 등록 가능한 항목 최상단 배치
      if (aCanRegister !== bCanRegister) {
        return aCanRegister ? -1 : 1;
      }
      if (aCanRegister && bCanRegister) {
        return 0; // 등록 가능한 항목끼리는 기본 정의 순서
      }

      // 2순위: 등록 가능한 항목이 아니거나 없을 때,
      // 이미 등록 완료된 항목이 아직 미등록된 항목보다 우선 배치
      if (aCompleted !== bCompleted) {
        return aCompleted ? -1 : 1;
      }

      // 3순위: 등록 완료된 항목들 간의 정렬 ➔ 가장 마지막에 등록한 목록을 순서대로(최신순 내림차순)
      if (aCompleted && bCompleted) {
        const aTime = gm.getCodexUnlockTime ? gm.getCodexUnlockTime(a.id) : 0;
        const bTime = gm.getCodexUnlockTime ? gm.getCodexUnlockTime(b.id) : 0;
        if (aTime !== bTime) {
          return bTime - aTime; // 내림차순: 가장 최근에 등록한 항목이 위로
        }
        return 0;
      }

      // 4순위: 둘 다 미완료된 항목인 경우 기본 정의 순서
      return 0;
    });
  }, [filteredItems, completedMap, gm, refreshKey, gm.codexUnlockOrder]);

  const handleRegister = (item: CodexCollectionItem) => {
    const res = gm.registerCodexCollection(item.id);
    if (res.success) {
      SoundManager.getInstance().play('reward');
      setRefreshKey(k => k + 1);
    } else {
      SoundManager.getInstance().play('debuff');
      gm.addLog(`⚠️ [컬렉션 등록 실패] ${res.message}`, 'danger', 'citadel');
    }
  };

  return (
    <Modal
      title="📜 심연의 백과 & 회고록 — 고대 컬렉션 (Abyssal Codex)"
      open={open}
      onClose={() => {
        setInspectedStory(null);
        onClose();
      }}
      footer={
        <ActionButton
          label="닫기"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setInspectedStory(null);
            onClose();
          }}
        />
      }
    >
      <div className="flex flex-col gap-3 py-1">
        {/* 상단 컬렉션 진행도 및 총 누적 패시브 헤더 */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#12192a] to-[#0c101c] border border-[#233550] shadow-md flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <div>
                <span className="text-xs font-bold text-white">백과 수집 진척도</span>
                <div className="text-[10px] text-[#8b9bb4]">
                  {completedCount} / {totalCount} 항목 완성 ({completionPct}%)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold text-[#ffd54f] bg-[#ffd54f18] px-2.5 py-1 rounded-lg border border-[#ffd54f33]">
              {completionPct}% 달성
            </span>
          </div>

          <div className="w-full bg-[#162035] h-2 rounded-full overflow-hidden border border-[#233352]">
            <div
              className="bg-gradient-to-r from-[#00d2ff] to-[#38ef7d] h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* 활성화된 종합 패시브 배지 요약 */}
          <div className="pt-2 border-t border-[#1c283f] flex items-center justify-between flex-wrap gap-2 text-[10px]">
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {totalBonus.allStatsBonus && totalBonus.allStatsBonus > 0 && <span className="px-1.5 py-0.5 rounded bg-[#00d2ff18] border border-[#00d2ff44] text-[#00d2ff] font-bold">전능력치 +{totalBonus.allStatsBonus}</span>}
            {totalBonus.atk > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ef535018] border border-[#ef535044] text-[#ef5350] font-bold">공격력 +{totalBonus.atk}</span>}
            {totalBonus.def > 0 && <span className="px-1.5 py-0.5 rounded bg-[#42a5f518] border border-[#42a5f544] text-[#42a5f5] font-bold">방어력 +{totalBonus.def}</span>}
            {totalBonus.hp > 0 && <span className="px-1.5 py-0.5 rounded bg-[#66bb6a18] border border-[#66bb6a44] text-[#66bb6a] font-bold">최대 HP +{totalBonus.hp}</span>}
            {totalBonus.mp > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ab47bc18] border border-[#ab47bc44] text-[#ab47bc] font-bold">최대 MP +{totalBonus.mp}</span>}
            {totalBonus.spd > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ffd54f18] border border-[#ffd54f44] text-[#ffd54f] font-bold">속도 +{totalBonus.spd}</span>}
            {totalBonus.luck > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ce93d818] border border-[#ce93d844] text-[#ce93d8] font-bold">행운 +{totalBonus.luck}</span>}
            {totalBonus.critRate > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ff704318] border border-[#ff704344] text-[#ff7043] font-bold">치명타 +{totalBonus.critRate}%</span>}
            {totalBonus.dmgReduction > 0 && <span className="px-1.5 py-0.5 rounded bg-[#38ef7d18] border border-[#38ef7d44] text-[#38ef7d] font-bold">피해감소 +{totalBonus.dmgReduction}%</span>}
            {totalBonus.allDmgPct > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ff416c18] border border-[#ff416c44] text-[#ff416c] font-bold">모든 피해 +{totalBonus.allDmgPct}%</span>}
            {totalBonus.upkeepDiscountPct > 0 && <span className="px-1.5 py-0.5 rounded bg-[#00d2ff18] border border-[#00d2ff44] text-[#00d2ff] font-bold">유지비 -{totalBonus.upkeepDiscountPct}%</span>}
            {totalBonus.productionBonusPct > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ffd54f18] border border-[#ffd54f44] text-[#ffd54f] font-bold">자원 생산 +{totalBonus.productionBonusPct}%</span>}
            {totalBonus.expBonusPct > 0 && <span className="px-1.5 py-0.5 rounded bg-[#80deea18] border border-[#80deea44] text-[#80deea] font-bold">경험치 +{totalBonus.expBonusPct}%</span>}
            {totalBonus.goldBonusPct > 0 && <span className="px-1.5 py-0.5 rounded bg-[#ffd54f18] border border-[#ffd54f44] text-[#ffd54f] font-bold">골드 획득 +{totalBonus.goldBonusPct}%</span>}
            {Object.entries(totalBonus).every(([_, v]) => (v ?? 0) === 0) && (
              <span className="text-[#607d8b] italic">아이템을 등록하여 영구 패시브를 해금하세요.</span>
            )}
            </div>
          </div>
        </div>

        {/* 카테고리 탭 네비게이션 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const readyCount = gm.getRegisterableCodexCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  selectedCategory === cat.id
                    ? 'bg-[#00d2ff22] text-[#00d2ff] border-[#00d2ff66]'
                    : 'bg-[#111726] text-[#8b9bb4] border-[#1e2a40] hover:bg-[#182136]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{tr(cat.label)}</span>
                {readyCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#ef5350] text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                    {readyCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 컬렉션 항목 카드 리스트 */}
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
          {sortedItems.map((item) => {
            const isCompleted = !!completedMap[item.id];
            
            // 모든 요구조건 충족 여부 계산 (자원, 보급품, 장비, 마도서, 쪽지, 오파츠 대응)
            let canRegister = true;
            const reqStatus = item.requirements.map(req => {
              let currentAmt = 0;
              if (req.type === 'cemetery_epitaph') {
                currentAmt = (gm.cemetery || []).length;
              } else if (req.type === 'resource' || req.type === 'material' || req.type === 'memoir_note' || req.type === 'ooparts') {
                currentAmt = (gm.resources as any)[req.key] ?? 0;
              } else if (req.type === 'supply') {
                currentAmt = gm.citadelSupplies[req.key] ?? 0;
              } else if (req.type === 'equipment') {
                currentAmt = (gm.equipmentInventory || []).filter(e =>
                  GameManager.isEquipmentMatchCodexRequirement(e, req)
                ).length;
              } else if (req.type === 'skillbook') {
                currentAmt = (gm.skillBookInventory || [])
                  .filter(b =>
                    b.bookId === req.key ||
                    b.bookId.startsWith(req.key) ||
                    b.name === req.name ||
                    b.name.includes(req.name) ||
                    (b.originMonsterName && (b.originMonsterName === req.name || b.originMonsterName.includes(req.name)))
                  )
                  .reduce((sum, b) => sum + (b.count || 1), 0);
              }
              const isMet = currentAmt >= req.amount;
              if (!isMet) canRegister = false;
              return { ...req, currentAmt, isMet };
            });

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                  isCompleted
                    ? item.id === latestUnlockedId
                      ? 'bg-[#0c182e] border-[#38ef7d88] shadow-[0_0_14px_rgba(56,239,125,0.15)]'
                      : 'bg-[#0b1424] border-[#00d2ff55] shadow-[0_0_12px_rgba(0,210,255,0.08)]'
                    : canRegister
                    ? 'bg-[#15121b] border-[#ef535088] shadow-[0_0_12px_rgba(239,83,80,0.15)]'
                    : 'bg-[#0f1422] border-[#222f46]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-[#162035] border border-[#263757]">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        {isCompleted ? (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                              item.id === latestUnlockedId
                                ? 'bg-[#38ef7d33] text-[#38ef7d] border border-[#38ef7d88] shadow-[0_0_8px_rgba(56,239,125,0.3)]'
                                : 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]'
                            }`}
                          >
                            {item.id === latestUnlockedId && <span>✨</span>}
                            <span>{item.id === latestUnlockedId ? '✓ 최근 등록' : '✓ 완성됨'}</span>
                          </span>
                        ) : canRegister ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535022] text-[#ff7043] border border-[#ef535055] font-extrabold animate-pulse">
                            ✨ 등록 가능
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-[#8b9bb4] leading-relaxed mt-0.5">
                        {(() => {
                          const desc = item.desc;
                          if (desc.includes('[에픽 등급 이상]')) {
                            const [pre, post] = desc.split('[에픽 등급 이상]');
                            return (
                              <>
                                {pre}
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold text-[#ce93d8] bg-[#ab47bc22] border border-[#ab47bc55]">
                                  [에픽 등급 이상]
                                </span>
                                {post}
                              </>
                            );
                          }
                          if (desc.includes('[희귀 등급 이상]')) {
                            const [pre, post] = desc.split('[희귀 등급 이상]');
                            return (
                              <>
                                {pre}
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold text-[#42a5f5] bg-[#42a5f522] border border-[#42a5f555]">
                                  [희귀 등급 이상]
                                </span>
                                {post}
                              </>
                            );
                          }
                          return desc;
                        })()}
                      </div>
                    </div>
                  </div>

                  {item.story && (
                    isCompleted ? (
                      <button
                        onClick={() => setInspectedStory(item)}
                        className="px-2.5 py-1 rounded bg-[#ab47bc22] hover:bg-[#ab47bc44] text-[#ce93d8] border border-[#ab47bc66] text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span>{item.category === 'artifact' ? '🏛️' : '📖'}</span>
                        <span>{item.category === 'artifact' ? '구세계 기록' : '회고록 열람'}</span>
                      </button>
                    ) : (
                      <div
                        title={item.category === 'artifact' ? '해당 층의 오파츠 페어를 모두 발굴하여 기증하면 구세계의 과거 기록이 해금됩니다.' : '해당 층의 쪽지를 모두 모아 등록하면 회고록이 해금됩니다.'}
                        className="px-2 py-1 rounded bg-[#161a26] text-[#78909c] border border-[#263248] text-[9px] font-bold shrink-0 flex items-center gap-1 opacity-70"
                      >
                        <span>🔒</span>
                        <span>미등록</span>
                      </div>
                    )
                  )}
                </div>

                {/* 영구 패시브 보너스 표시 */}
                <div className="px-2 py-1 rounded-lg bg-[#141c2e] border border-[#21304c] text-[11px] font-bold text-[#ffd54f] flex items-center justify-between">
                  <span>✨ 영구 효과</span>
                  <span>{item.bonus.label}</span>
                </div>

                {/* 요구 자원 슬롯 & 등록 버튼 */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#182338]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {reqStatus.map((req, idx) => {
                      let equipTooltip: string | undefined = undefined;
                      let rarityBadge: string | undefined = undefined;
                      if (req.type === 'equipment') {
                        if (req.minRarity === 'rare') {
                          rarityBadge = '✨희귀↑';
                        } else if (req.minRarity === 'epic') {
                          rarityBadge = '🌟에픽↑';
                        }
                        const candidates = (gm.equipmentInventory || [])
                          .filter(e => GameManager.isEquipmentMatchCodexRequirement(e, req))
                          .sort((a, b) => GameManager.compareEquipmentForCodexSacrifice(a, b));
                        const rarityRequirementText = req.minRarity ? ` (필요 등급: [${req.minRarity === 'epic' ? '에픽(EPIC)' : '희귀(RARE)'}] 이상)` : '';
                        if (candidates.length > 0) {
                          const topPick = candidates[0];
                          const hasEnch = !!(topPick.prefix || topPick.suffix || /\[.*?\]/.test(topPick.name));
                          equipTooltip = `[${req.name}]${rarityRequirementText}\n보관함 기증 가능: ${candidates.length}개 보유\n✓ 우선 기증 대상: ${topPick.name} (${topPick.rarity.toUpperCase()} / +${topPick.level || 0}강 / ${hasEnch ? '인챈트' : '노인챈트'})\n※ 복수 보유 시 [최저 등급 ➔ 최저 강화 ➔ 노 인챈트] 순으로 자동 기증됩니다.`;
                        } else {
                          equipTooltip = `[${req.name}]${rarityRequirementText}\n미착용 보관함에 조건(등급)을 충족하는 기증 가능 장비가 없습니다.`;
                        }
                      }

                      return (
                        <span
                          key={idx}
                          title={equipTooltip || (req.type === 'supply' ? `성채 보급품 [${req.name}]` : undefined)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border ${
                            isCompleted
                              ? 'bg-[#182338] text-[#8b9bb4] border-[#223350]'
                              : req.isMet
                              ? 'bg-[#10241a] text-[#38ef7d] border-[#1e4a30]'
                              : 'bg-[#241316] text-[#ef5350] border-[#4a1e24]'
                          }`}
                        >
                          <span>{req.icon}</span>
                          <span>{req.name}</span>
                          {rarityBadge && (
                            <span
                              className={`text-[9px] px-1 rounded font-sans font-bold border ${
                                req.minRarity === 'epic'
                                  ? 'bg-[#ab47bc22] text-[#ce93d8] border-[#ab47bc55]'
                                  : 'bg-[#42a5f522] text-[#42a5f5] border-[#42a5f555]'
                              }`}
                            >
                              {rarityBadge}
                            </span>
                          )}
                          <span className="font-bold">
                            {isCompleted ? `${req.amount}` : `${req.currentAmt}/${req.amount}`}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  {!isCompleted && (
                    <button
                      disabled={!canRegister}
                      onClick={() => handleRegister(item)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                        canRegister
                          ? 'bg-[#38ef7d22] hover:bg-[#38ef7d44] text-[#38ef7d] border-[#38ef7d88] shadow-sm cursor-pointer'
                          : 'bg-[#141a28] text-[#546e7a] border-[#222d42] cursor-not-allowed opacity-60'
                      }`}
                    >
                      기증·등록
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 서사 일지 / 회고록 / 구세계 기록 전문 모달 */}
        {inspectedStory && (
          <Modal
            title={inspectedStory.category === 'artifact' ? `🏛️ [${inspectedStory.name}] 구세계 발굴 기록` : `📖 [${inspectedStory.name}] 회고록`}
            open={!!inspectedStory}
            onClose={() => setInspectedStory(null)}
            footer={
              <ActionButton
                label="닫기"
                variant="ghost"
                className="w-full"
                onClick={() => setInspectedStory(null)}
              />
            }
          >
            <div className="flex flex-col gap-3 py-2">
              <div className="text-3xl text-center">{inspectedStory.category === 'artifact' ? '🏛️' : '📜'}</div>
              <div className="text-sm font-bold text-[#ffd54f] text-center">
                {inspectedStory.name}
              </div>
              <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#233550] text-xs text-[#cfd8e8] leading-relaxed italic whitespace-pre-line font-serif">
                "{inspectedStory.story}"
              </div>
              <div className="p-2.5 rounded-lg bg-[#101826] border border-[#1e2e48] text-xs text-[#38ef7d] font-bold text-center">
                ✨ 컬렉션 활성화 효과: {inspectedStory.bonus.label}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};
