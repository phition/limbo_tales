import React, { useState } from 'react';
import { Quest, GameResources } from '../types/game';
import { SoundManager } from '../managers/SoundManager';
import { CustomAssetService } from '../services/CustomAssetService';
import { GameIcon } from './GameIcon';

interface Props {
  quest: Quest;
  onClose: () => void;
  onClaim: (choice: 'domain' | 'expedition') => void;
}

const RN: Record<string, string> = {
  wood: '목재',
  stone: '석재',
  iron: '철광',
  food: '식량',
  herb: '약초',
  leather: '가죽',
  silk: '실크',
  coal: '석탄',
  crystal: '마력 수정',
  void_shard: '공허 파편',
  prefix_stone: '일반 접두석',
  suffix_stone: '일반 접미석',
  pure_prefix_stone: '순수 접두석',
  pure_suffix_stone: '순수 접미석',
};

export const EpicQuestDialogueModal: React.FC<Props> = ({ quest, onClose, onClaim }) => {
  const [selectedChoice, setSelectedChoice] = useState<'domain' | 'expedition'>('domain');
  const epicStory = quest.epicStory;

  if (!epicStory) return null;

  const domainChoice = epicStory.choices.find(c => c.id === 'domain') || epicStory.choices[0];
  const expeditionChoice = epicStory.choices.find(c => c.id === 'expedition') || epicStory.choices[1];

  const getPurifiedFloors = (questId: string): number[] => {
    switch (questId) {
      case 'Q_EPIC_LORE_01': return [1, 2];
      case 'Q_EPIC_LORE_02': return [3, 4];
      case 'Q_EPIC_LORE_03': return [5];
      case 'Q_EPIC_LORE_04': return [6, 7];
      case 'Q_EPIC_LORE_05': return [8, 9];
      case 'Q_SLAY_BOSS_10':
      case 'Q_EPIC_AVICI_ENDING': return [10];
      default: return [];
    }
  };
  const purifiedFloors = getPurifiedFloors(quest.id);

  const handleConfirm = () => {
    SoundManager.getInstance().play('quest_complete');
    onClaim(selectedChoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#0c0f18] border-2 border-[#e040fb66] rounded-2xl flex flex-col shadow-[0_0_60px_rgba(224,64,251,0.25)] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 상단 헤더 ── */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1b0a2a] via-[#101524] to-[#1b0a2a] border-b border-[#e040fb44] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 rounded-lg bg-[#e040fb22] border border-[#e040fb55] shadow-md shadow-[#e040fb33]">
              👑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#e040fb33] text-[#e040fb] border border-[#e040fb55]">
                  EPIC SCENARIO
                </span>
                <span className="text-xs text-[#ffd54f] font-mono">Chapter {quest.chapter}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {epicStory.epilogueTitle || quest.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost text-xs px-2.5 py-1 text-[#8b9bb4] hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ── 본문 스크롤 영역 ── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 max-h-[calc(92vh-140px)]">
          {/* 1. 시나리오 대화 흐름 */}
          <div className="flex flex-col gap-3 bg-[#080b12] p-3.5 rounded-xl border border-[#1f293d]">
            <div className="text-xs font-bold text-[#e040fb] flex items-center gap-1.5 mb-1">
              <span>📜</span>
              <span>스토리 대화 서사</span>
            </div>
            {epicStory.dialogues.map((dlg, idx) => {
              const customAvatar = CustomAssetService.getNpcOverride(dlg.speakerName) || (dlg.speakerRole ? CustomAssetService.getNpcOverride(dlg.speakerRole) : undefined);
              const isImage = customAvatar && (
                customAvatar.startsWith('data:') ||
                customAvatar.startsWith('http://') ||
                customAvatar.startsWith('https://') ||
                customAvatar.startsWith('/') ||
                customAvatar.startsWith('assets/') ||
                customAvatar.includes('.png') ||
                customAvatar.includes('.jpg') ||
                customAvatar.includes('.jpeg') ||
                customAvatar.includes('.webp') ||
                customAvatar.includes('.gif')
              );

              return (
                <div key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className={`w-10 h-10 rounded-xl bg-[#141b2d] border ${customAvatar ? 'border-[#e040fb66]' : 'border-[#2b3954]'} flex items-center justify-center shrink-0 shadow-md overflow-hidden`}>
                    {isImage ? (
                      <img src={customAvatar} alt={dlg.speakerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{customAvatar || dlg.speakerAvatar || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1 bg-[#101626] p-3 rounded-xl border border-[#222e46] shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#ffd54f]">{dlg.speakerName}</span>
                      {dlg.speakerRole && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono border border-[#00d2ff33]">
                          {dlg.speakerRole}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#cfd8e8] leading-relaxed whitespace-pre-line">
                      {dlg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✨ 심연의 연무 정화 혜택 안내 배너 */}
          {purifiedFloors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#064e3b55] via-[#05966928] to-[#064e3b55] border border-[#10b98166] flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.18)] animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-[#064e3b] border border-[#10b981] flex items-center justify-center text-xl shrink-0 shadow-md">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-[#34d399]">
                    [심연 정화] 심연 {purifiedFloors.map(f => `${f}층`).join(' & ')} 짙은 연무 영구 정화!
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#10b98133] text-[#a7f3d0] border border-[#10b98155]">
                    PERMANENT
                  </span>
                </div>
                <div className="text-[11px] text-[#d1fae5] mt-1 leading-relaxed">
                  고대 보스의 유물이 제단에 바쳐지며 해당 층의 심연 연무가 완전히 걷힙니다. 차후 반복 파밍 시 <strong className="text-[#ffd54f]">마물들의 공격력과 방어력 강화(+{purifiedFloors.map(f => `${f * 5}%`).join(', +')})가 영구 해제</strong>되어 한결 수월하게 탐험할 수 있습니다!
                </div>
              </div>
            </div>
          )}

          {/* 2. 지휘관의 전략적 선택지 (영지 발전 vs 원정단 육성) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                <span>⚖️</span>
                <span>지휘관의 중대 결단 : 보상 노선 선택</span>
              </div>
              <span className="text-[11px] text-[#8b9bb4]">원하는 보상 방침을 클릭하세요</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 🏛️ 옵션 A: 영지 발전 */}
              {domainChoice && (
                <div
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 select-none ${
                    selectedChoice === 'domain'
                      ? 'bg-[#0f1f18] border-[#38ef7d] shadow-lg shadow-[#38ef7d22]'
                      : 'bg-[#101626] border-[#222e46] hover:border-[#38ef7d66] opacity-75'
                  }`}
                  onClick={() => setSelectedChoice('domain')}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#38ef7d]">
                        <span>{domainChoice.title}</span>
                      </div>
                      <input
                        type="radio"
                        name="epicChoice"
                        checked={selectedChoice === 'domain'}
                        onChange={() => setSelectedChoice('domain')}
                        className="accent-[#38ef7d] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-[11px] text-[#cfd8e8] leading-relaxed">
                      {domainChoice.desc}
                    </div>
                    <div className="text-[11px] text-[#ffd54f] italic bg-[#00000044] p-2 rounded border border-[#38ef7d33]">
                      {domainChoice.flavorChoice}
                    </div>
                  </div>

                  {/* 보상 뱃지 */}
                  <div className="pt-2 border-t border-[#1f2b3a] flex flex-wrap gap-1.5">
                    {domainChoice.rewards.gold && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] font-mono font-bold border border-[#ffd54f33] flex items-center gap-1">
                        <GameIcon name="gold" icon="🪙" size={13} /> {domainChoice.rewards.gold}G
                      </span>
                    )}
                    {domainChoice.rewards.ether && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono font-bold border border-[#00d2ff33] flex items-center gap-1">
                        <GameIcon name="ether" icon="✨" size={13} /> {domainChoice.rewards.ether}
                      </span>
                    )}
                    {domainChoice.rewards.resources &&
                      Object.entries(domainChoice.rewards.resources).map(([k, amt]) => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#38ef7d15] text-[#38ef7d] font-mono font-bold border border-[#38ef7d33] flex items-center gap-1">
                          <GameIcon name={k} size={13} /> {RN[k] || k} +{amt}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* ⚔️ 옵션 B: 원정단 육성 */}
              {expeditionChoice && (
                <div
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 select-none ${
                    selectedChoice === 'expedition'
                      ? 'bg-[#220d2b] border-[#e040fb] shadow-lg shadow-[#e040fb22]'
                      : 'bg-[#101626] border-[#222e46] hover:border-[#e040fb66] opacity-75'
                  }`}
                  onClick={() => setSelectedChoice('expedition')}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#e040fb]">
                        <span>{expeditionChoice.title}</span>
                      </div>
                      <input
                        type="radio"
                        name="epicChoice"
                        checked={selectedChoice === 'expedition'}
                        onChange={() => setSelectedChoice('expedition')}
                        className="accent-[#e040fb] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-[11px] text-[#cfd8e8] leading-relaxed">
                      {expeditionChoice.desc}
                    </div>
                    <div className="text-[11px] text-[#ce93d8] italic bg-[#00000044] p-2 rounded border border-[#e040fb33]">
                      {expeditionChoice.flavorChoice}
                    </div>
                  </div>

                  {/* 장비 및 스킬북 프리뷰 뱃지 */}
                  <div className="pt-2 border-t border-[#341842] flex flex-col gap-1.5">
                    {expeditionChoice.rewards.equipment && (
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-[#2c133a] border border-[#e040fb44] text-[11px]">
                        <span className="text-base shrink-0">
                          <GameIcon name={expeditionChoice.rewards.equipment.id} icon={expeditionChoice.rewards.equipment.icon || '🗡️'} size={18} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#ffd54f] truncate">
                            {expeditionChoice.rewards.equipment.name}
                          </div>
                          <div className="text-[10px] text-[#ce93d8] font-mono">
                            공격+{expeditionChoice.rewards.equipment.stats?.atk || 0} 치명+{expeditionChoice.rewards.equipment.stats?.critRate || 0}% HP+{expeditionChoice.rewards.equipment.stats?.hp || 0}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 골드 & 에테르 */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {expeditionChoice.rewards.gold && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd54f15] text-[#ffd54f] font-mono font-bold border border-[#ffd54f33] flex items-center gap-1">
                          <GameIcon name="gold" icon="🪙" size={13} /> {expeditionChoice.rewards.gold}G
                        </span>
                      )}
                      {expeditionChoice.rewards.ether && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] font-mono font-bold border border-[#00d2ff33] flex items-center gap-1">
                          <GameIcon name="ether" icon="✨" size={13} /> {expeditionChoice.rewards.ether}
                        </span>
                      )}
                    </div>

                    {/* 보급품 풀세트 */}
                    {expeditionChoice.rewards.supplies && expeditionChoice.rewards.supplies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {expeditionChoice.rewards.supplies.map((s, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#e040fb15] text-[#e040fb] font-mono font-bold border border-[#e040fb33] flex items-center gap-1">
                            <GameIcon name={s.key} icon={s.icon} size={13} /> {s.name} ×{s.qty}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 자원 (있을 경우) */}
                    {expeditionChoice.rewards.resources &&
                      Object.entries(expeditionChoice.rewards.resources).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {Object.entries(expeditionChoice.rewards.resources).map(([k, amt]) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#ab47bc15] text-[#ce93d8] font-mono font-bold border border-[#ab47bc33] flex items-center gap-1">
                              <GameIcon name={k} size={13} /> {RN[k] || k} +{amt}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 하단 버튼 바 ── */}
        <div className="px-5 py-3.5 bg-[#080b12] border-t border-[#1f293d] flex items-center justify-between shrink-0">
          <button
            type="button"
            className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]"
            onClick={onClose}
          >
            뒤로가기
          </button>
          <button
            type="button"
            className="btn btn-primary text-xs sm:text-sm font-bold px-6 py-2.5 shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            style={{
              background: selectedChoice === 'domain'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
            }}
            onClick={handleConfirm}
          >
            <span>{selectedChoice === 'domain' ? '🏛️' : '⚔️'}</span>
            <span>
              {selectedChoice === 'domain' ? '영지 발전 보상 수령' : '결사대 무장 보상 수령'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
