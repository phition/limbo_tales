import React, { useState, useEffect } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { GameManager } from '../managers/GameManager';
import { GameIcon } from './GameIcon';
import { getEquipmentTemplateId } from '../data/equipment';
import { getRarityBorderStyle } from '../utils/rarity';
import { gameAlert, gameConfirm } from '../services/DialogService';

export interface LootSelectionModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  completeButtonText?: string;
  onComplete?: () => void;
}

export const LootSelectionModal: React.FC<LootSelectionModalProps> = ({
  open,
  onClose,
  title = '전리품 선별 및 배낭 공간 확보',
  completeButtonText,
  onComplete,
}) => {
  const { state, gm } = useGameManager();
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!open) return;
    const update = () => setVersion(v => v + 1);
    gm.on('pendingLootUpdated', update);
    gm.on('dungeonInventoryUpdated', update);
    return () => {
      gm.off('pendingLootUpdated', update);
      gm.off('dungeonInventoryUpdated', update);
    };
  }, [gm, open]);

  if (!open) return null;

  const handleFinish = async () => {
    if (gm.pendingLoot.length > 0) {
      const ok = await gameConfirm({
        title: '전리품을 두고 떠날까요?',
        message: '아직 챙기지 못한 전리품이 남아있습니다.\n두고 가면 심연 속으로 영구히 사라집니다.',
        icon: '📦',
        confirmText: '두고 떠나기',
        cancelText: '더 챙기기',
        tone: 'danger'
      });
      if (ok) {
        gm.clearPendingLoot();
        if (onComplete) {
          onComplete();
        } else {
          onClose();
        }
      }
    } else {
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    }
  };

  const handleAbandonAll = async () => {
    const ok = await gameConfirm({
      title: '전리품 모두 포기',
      message: '미수령 상태인 모든 전리품을 포기하시겠습니까?',
      icon: '🗑️',
      confirmText: '모두 포기',
      cancelText: '취소',
      tone: 'danger'
    });
    if (ok) {
      gm.clearPendingLoot();
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    }
  };

  const currentCapacity = state.backpackCapacity || gm.backpackCapacity || 16;
  const currentInv = gm.dungeonInventory;
  const pendingItems = gm.pendingLoot;

  const defaultCompleteText = pendingItems.length === 0
    ? '✅ 정리 완료'
    : '정리 완료';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 animate-fade-in backdrop-blur-sm">
      <div className="bg-[#0e131f] border border-[#c8aa6e55] rounded-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1f293d] flex items-center justify-between bg-[#131929]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <span className="font-bold text-sm text-white">{title}</span>
          </div>
          <span className="text-xs text-[#8b9bb4]">
            배낭 공간: <span className="text-[#c8aa6e] font-bold">{currentInv.length}</span> / {currentCapacity}칸
          </span>
        </div>

        {/* 2-Column Body: 배낭 보관함 vs 미수령 전리품 */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 왼쪽 모달: 🎒 현재 배낭 보관함 */}
          <div className="bg-[#121826] border border-[#222f47] rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#222f47]">
              <span className="text-xs font-bold text-[#c8aa6e] flex items-center gap-1">
                <span>🎒</span> 현재 배낭 아이템 ({currentInv.length}/{currentCapacity})
              </span>
              <span className="text-[11px] text-[#8b9bb4]">버릴 아이템 선택</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-1.5 pr-1">
              {currentInv.length === 0 ? (
                <div className="text-center text-xs text-[#64748b] py-8">배낭이 비어 있습니다.</div>
              ) : (
                currentInv.map((slot, idx) => {
                  const slotRarity = (slot as any).equipmentData?.rarity;
                  const rMeta = GameManager.getResourceMeta(slot.key);
                  const displayLabel = slot.label || rMeta?.name || slot.key;
                  const displayIcon = slot.icon || rMeta?.icon;
                  return (
                    <div key={slot.slotId || idx} className="flex items-center justify-between p-2 rounded-lg bg-[#182033] border border-[#2a3a59]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="p-1 rounded-md bg-[#323d4e] border shrink-0 flex items-center justify-center shadow-sm transition-all"
                          style={getRarityBorderStyle(slotRarity)}
                        >
                          <GameIcon name={(slot as any).equipmentData?.templateId || getEquipmentTemplateId((slot as any).equipmentData) || slot.key} icon={displayIcon} size={24} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{displayLabel}</div>
                          <div className="text-[10px] text-[#8b9bb4]">수량: <span className="text-[#c8aa6e] font-bold">{slot.qty}</span>개 (최대 {slot.maxStack})</div>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger text-[11px] px-2.5 py-1 shrink-0"
                        onClick={() => {
                          gm.discardDungeonSlot(idx, slot.qty);
                        }}
                      >
                        🗑️ 버리기
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 오른쪽 모달: 📦 미수령 전리품 (임시 보관함) */}
          <div className="bg-[#181424] border border-[#3d2547] rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#3d2547]">
              <span className="text-xs font-bold text-[#ffd54f] flex items-center gap-1">
                <span>📦</span> 미수령 전리품 ({pendingItems.length}개)
              </span>
              <span className="text-[11px] text-[#ff80ab]">배낭으로 수령 또는 포기</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-1.5 pr-1">
              {pendingItems.length === 0 ? (
                <div className="text-center text-xs text-[#81c784] py-8">모든 전리품을 수령했습니다! 🎉</div>
              ) : (
                pendingItems.map(item => {
                  const itemRarity = (item as any).equipmentData?.rarity || (item as any).rarity;
                  const itemKey = item.key || (item as any).id;
                  const rMeta = GameManager.getResourceMeta(itemKey);
                  const displayLabel = item.label || rMeta?.name || itemKey;
                  const displayIcon = item.icon || rMeta?.icon;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-[#241a33] border border-[#4d3266]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="p-1 rounded-md bg-[#323d4e] border shrink-0 flex items-center justify-center shadow-sm transition-all"
                          style={getRarityBorderStyle(itemRarity)}
                        >
                          <GameIcon name={(item as any).equipmentData?.templateId || getEquipmentTemplateId((item as any).equipmentData) || item.key || item.id} icon={displayIcon} size={24} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#ffd54f] truncate">{displayLabel}</div>
                          <div className="text-[10px] text-[#ce93d8]">수량: <span className="text-white font-bold">{item.qty}</span>개</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="btn btn-primary text-[11px] px-2.5 py-1"
                          onClick={() => {
                            const success = gm.takePendingLoot(item.id);
                            if (!success) {
                              gameAlert({
                                icon: '🎒',
                                title: '배낭이 가득 찼습니다',
                                message: '배낭에 빈 슬롯이 없습니다!\n왼쪽 배낭에서 불필요한 아이템을 먼저 버려주세요.',
                                tone: 'warning'
                              });
                            }
                          }}
                        >
                          📥 챙기기
                        </button>
                        <button
                          className="btn btn-ghost text-[11px] px-2 py-1 text-red-400 hover:text-red-300"
                          onClick={() => gm.removePendingLoot(item.id)}
                        >
                          ✕ 포기
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 py-3 border-t border-[#1f293d] flex items-center justify-between bg-[#131929] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {pendingItems.length > 0 && (
              <button
                className="btn btn-primary text-xs px-3 py-1.5"
                onClick={() => {
                  const res = gm.claimAllPendingLoot();
                  if (res.claimed > 0 && res.remaining > 0) {
                    gameAlert({
                      icon: '🎒',
                      title: '일부만 담았습니다',
                      message: `${res.claimed}개 아이템을 배낭에 담았습니다.\n배낭이 가득 차 남은 ${res.remaining}개는 대기 중입니다.`,
                      tone: 'warning'
                    });
                  } else if (res.claimed === 0 && res.remaining > 0) {
                    gameAlert({
                      icon: '🎒',
                      title: '배낭 공간 부족',
                      message: '배낭에 빈 공간이 없습니다.\n왼쪽에서 아이템을 버려 공간을 확보하세요.',
                      tone: 'danger'
                    });
                  }
                }}
              >
                📥 가능한 전리품 모두 담기
              </button>
            )}
            {pendingItems.length > 0 && (
              <button
                className="btn btn-ghost text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
                onClick={handleAbandonAll}
              >
                🗑️ 남은 전리품 모두 포기
              </button>
            )}
          </div>

          <button
            className={`btn text-xs px-4 py-2 ${pendingItems.length === 0 ? 'btn-success font-bold' : 'btn-ghost text-[#8b9bb4]'}`}
            onClick={handleFinish}
          >
            {completeButtonText || defaultCompleteText}
          </button>
        </div>
      </div>
    </div>
  );
};
