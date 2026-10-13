import React, { useEffect } from 'react';
import { SoundManager } from '../managers/SoundManager';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenQuests: () => void;
}

export const IntroStoryModal: React.FC<Props> = ({ open, onClose, onOpenQuests }) => {
  useEffect(() => {
    if (open) {
      SoundManager.getInstance().play('camp_fire');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      {/* 어두운 배경 딤 처리 (클릭 시 닫힘 방지: 중요한 서사이므로 명시적 버튼 클릭 유도) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* 모달 본체 컨테이너 */}
      <div className="relative w-full max-w-[420px] bg-[#0c101a] border border-[#333d4e] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10 animate-scale-up">
        
        {/* ── 1. 상단 시네마틱 성화 일러스트 배너 ── */}
        <div className="relative h-36 w-full overflow-hidden shrink-0 border-b border-[#1f2a3f]">
          <img
            src="assets/citadel_bonfire.jpg"
            alt="방주 성채"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
            onError={(e) => {
              // 이미지 로드 실패 시 그라데이션 대체
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* 어두운 비네트 및 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-[#0c101a]/60 to-transparent" />
          
          {/* 배너 상단 엠블럼 & 타이틀 */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#ffd54f] font-mono tracking-wider">
                <span>🔥</span>
                <span className="font-bold">PROLOGUE: LIMBO TALES</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-wide mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                방주의 각성: 심연의 어둠 속에서
              </h2>
            </div>
            <span className="text-2xl animate-pulse shrink-0">⚔️</span>
          </div>
        </div>

        {/* ── 2. 서사 본문 영역 ── */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[58vh] text-xs leading-relaxed text-[#c7d2e5]">
          
          {/* 1막: 세계관 분위기 */}
          <div className="p-3 rounded-xl bg-[#121826] border border-[#1e2a40] flex flex-col gap-1.5 shadow-inner">
            <div className="text-[11px] font-bold text-[#f3e5c8] flex items-center gap-1">
              <span>🌌</span>
              <span>침묵에 잠긴 세계, 최후의 부유 요새</span>
            </div>
            <p className="text-[#a0aec0] leading-relaxed">
              끝없는 어둠과 공허의 흑무가 지상을 삼킨 지 오랜 세월... 
              모든 빛이 사그라든 세상에서 고대의 에테르로 부유하는 최후의 안식처, 
              <strong className="text-white font-medium"> [방주 성채]</strong>만이 심연의 차가운 정적 위를 떠돌고 있습니다.
            </p>
          </div>

          {/* 2막: 지휘관의 사명 */}
          <div className="p-3 rounded-xl bg-[#121826] border border-[#1e2a40] flex flex-col gap-1.5 shadow-inner">
            <div className="text-[11px] font-bold text-[#ffb74d] flex items-center gap-1">
              <span>🔥</span>
              <span>위태로운 성화와 지휘관의 서약</span>
            </div>
            <p className="text-[#a0aec0] leading-relaxed">
              성채 중심을 지탱하는 생명의 불꽃 <strong className="text-[#ffd54f] font-medium">[방주의 성화]</strong>는 
              연료가 다해 가쁜 숨을 몰아쉬고 있으며, 생존자들은 굶주림과 추위 속에 새로운 희망을 기다립니다. 
              최고 권한을 인계받은 <strong className="text-[#f3e5c8] font-medium">지휘관</strong>으로서 거점을 재건하고 심연 10층의 심층부를 돌파하십시오.
            </p>
          </div>

          {/* 3막: 퀘스트 확인 지침 안내 */}
          <div className="p-3 rounded-xl bg-[#0f241a] border border-[#10b98155] flex flex-col gap-1.5 shadow-sm">
            <div className="text-[11px] font-bold text-[#34d399] flex items-center gap-1">
              <span>📜</span>
              <span>작전 지침: 첫 번째 임무를 확인하십시오</span>
            </div>
            <p className="text-[#d1fae5] leading-relaxed">
              원정을 떠나기에 앞서, 방주 관리국에서 하달된 작전 지침을 확인해야 합니다. 
              <strong className="text-[#6ee7b7] font-bold underline underline-offset-2"> [📜 퀘스트]</strong> 목록을 열어 
              생존자들을 위한 <span className="text-[#fef08a] font-semibold">심연 생체 정제소</span>를 건설하고 첫 원정 채비를 갖추십시오.
            </p>
          </div>
        </div>

        {/* ── 3. 하단 액션 버튼 영역 ── */}
        <div className="p-4 bg-[#080b12] border-t border-[#1a2335] flex flex-col sm:flex-row gap-2">
          {/* 퀘스트 즉시 열기 버튼 (강조) */}
          <button
            onClick={() => {
              SoundManager.getInstance().play('click');
              onOpenQuests();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#423219] to-[#5c4524] hover:from-[#523e1f] hover:to-[#6e522b] text-[#f3e5c8] border border-[#876739] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#42321955] transition-all active:scale-[0.98]"
          >
            <span>📜</span>
            <span>첫 퀘스트 확인하러 가기</span>
          </button>

          {/* 성채 바로 진입하기 버튼 */}
          <button
            onClick={() => {
              SoundManager.getInstance().play('click');
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-[#141d2d] hover:bg-[#1a273e] text-[#8b9bb4] hover:text-[#f3e5c8] font-medium text-xs border border-[#23334d] transition-colors active:scale-[0.98]"
          >
            성채 둘러보기
          </button>
        </div>

      </div>
    </div>
  );
};
