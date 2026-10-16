import React, { useEffect } from 'react';
import { SoundManager } from '../managers/SoundManager';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenQuests?: () => void;
}

export const IntroStoryModal: React.FC<Props> = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      SoundManager.getInstance().play('camp_fire');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      {/* 어두운 배경 딤 처리 */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* 모달 본체 컨테이너 */}
      <div className="relative w-full max-w-[440px] bg-[#0c101a] border border-[#333d4e] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10 animate-scale-up">
        
        {/* ── 1. 상단 시네마틱 성화 일러스트 배너 ── */}
        <div className="relative h-36 w-full overflow-hidden shrink-0 border-b border-[#1f2a3f]">
          <img
            src="assets/citadel_bonfire.jpg"
            alt="방주 성채"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-[#0c101a]/60 to-transparent" />
          
          {/* 배너 상단 엠블럼 & 타이틀 */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#ffd54f] font-mono tracking-wider">
                <span>🔥</span>
                <span className="font-bold">PROLOGUE: LIMBO TALES</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-wide mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                방주의 각성: 꺼져가는 불씨 속에서
              </h2>
            </div>
            <span className="text-2xl animate-pulse shrink-0">⚔️</span>
          </div>
        </div>

        {/* ── 2. 서사 본문 영역 ── */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[58vh] text-xs leading-relaxed text-[#c7d2e5]">
          
          {/* 1막: 심연의 잠식과 최후의 피난처 */}
          <div className="p-3.5 rounded-xl bg-[#121826] border border-[#1e2a40] flex flex-col gap-1.5 shadow-inner">
            <div className="text-[11px] font-bold text-[#f3e5c8] flex items-center gap-1">
              <span>🌌</span>
              <span>세상이 심연에 잠긴 지 오랜 세월</span>
            </div>
            <p className="text-[#a0aec0] leading-relaxed">
              온 세상이 공허의 흑무에 집어삼켜지고 지상의 문명들이 모두 무너져 내린 지 오랜 세월... 
              간신히 살아남은 자들과 함께 심연 밖까지 겨우 탈출해 도달한 최후의 안식처, 
              <strong className="text-white font-medium"> [방주 성채]</strong>만이 차가운 허공 위에 간신히 떠 있습니다.
            </p>
          </div>

          {/* 2막: 첫 척후의 비극과 지휘관의 부상 */}
          <div className="p-3.5 rounded-xl bg-[#1a1216] border border-[#ef535044] flex flex-col gap-1.5 shadow-inner">
            <div className="text-[11px] font-bold text-[#ef5350] flex items-center gap-1">
              <span>💀</span>
              <span>쓰러진 전우와 사령관의 각성</span>
            </div>
            <p className="text-[#e2b8b8] leading-relaxed">
              하지만 방주를 재가동하기 위한 첫 진입로 정찰 전투에서, 
              마물의 기습으로 인해 <strong className="text-[#ff8a80] font-bold">원정대의 동료 1인이 전사</strong>하는 참담한 비극을 겪었습니다. 
              방주로 긴급 후송되던 도중 충격과 마기 중독으로 의식을 잃었던 사령관님께서… 이제 막 희미한 눈을 떴습니다.
            </p>
          </div>

          {/* 3막: 재건의 사명 */}
          <div className="p-3.5 rounded-xl bg-[#131b2c] border border-[#00d2ff33] flex flex-col gap-1.5 shadow-sm">
            <div className="text-[11px] font-bold text-[#00d2ff] flex items-center gap-1">
              <span>🔥</span>
              <span>꺼져가는 성화, 그리고 남겨진 자들</span>
            </div>
            <p className="text-[#b0cde5] leading-relaxed">
              방주의 동력로는 식어가고 생존자들은 불안에 떨고 있습니다. 
              쓰러진 전우의 희생을 헛되이 하지 않고 방주를 다시 일으켜 세우려면, 
              사령관님의 단호한 지휘와 거점 재건이 절실합니다.
            </p>
          </div>
        </div>

        {/* ── 3. 하단 액션 버튼 영역: 단일 [확인] 버튼 ── */}
        <div className="p-4 bg-[#080b12] border-t border-[#1a2335] flex justify-end">
          <button
            onClick={() => {
              SoundManager.getInstance().play('click');
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1c2c48] to-[#14233c] hover:from-[#253a60] hover:to-[#1a2f50] text-[#00d2ff] hover:text-white border border-[#00d2ff66] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00d2ff22] transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>👁️</span>
            <span>정신을 차리고 눈을 뜬다 [확인]</span>
          </button>
        </div>

      </div>
    </div>
  );
};
