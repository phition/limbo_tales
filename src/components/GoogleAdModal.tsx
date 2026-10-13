import React, { useEffect, useState } from 'react';
import { GoogleAdService, AdPlaybackState } from '../services/GoogleAdService';

export const GoogleAdModal: React.FC = () => {
  const [adState, setAdState] = useState<AdPlaybackState>(() => GoogleAdService.getInstance().getCurrentState());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = GoogleAdService.getInstance().subscribe((state) => {
      setAdState(state);
      if (!state.isOpen) {
        setShowExitConfirm(false);
      }
    });
    return unsubscribe;
  }, []);

  if (!adState.isOpen) return null;

  const progressPct = ((adState.totalDuration - adState.secondsRemaining) / adState.totalDuration) * 100;

  const handleCloseClick = () => {
    if (adState.canClose) {
      GoogleAdService.getInstance().closeAd(false);
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    GoogleAdService.getInstance().closeAd(true);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="relative w-full max-w-[420px] bg-[#0c101a] border border-[#27354d] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* 🏷️ 상단 Google AdMob 공식 헤더 바 */}
        <div className="px-3.5 py-2.5 bg-[#070a12] border-b border-[#1b2538] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1a2336] px-2 py-0.5 rounded text-[11px] font-bold text-white border border-[#2b3a56]">
              <span className="text-[#4285f4] font-black">G</span>
              <span className="text-[#ea4335] font-black">o</span>
              <span className="text-[#fbbc05] font-black">o</span>
              <span className="text-[#4285f4] font-black">g</span>
              <span className="text-[#34a853] font-black">l</span>
              <span className="text-[#ea4335] font-black">e</span>
              <span className="text-[#a0aec0] font-normal ml-1">AdMob</span>
            </div>
            {GoogleAdService.getInstance().isProductionMode() ? (
              <span className="text-[10px] text-[#38ef7d] px-1.5 py-0.2 rounded bg-[#38ef7d15] border border-[#38ef7d33] font-mono">
                실제 광고 모드
              </span>
            ) : (
              <span className="text-[10px] text-[#ffd54f] px-1.5 py-0.2 rounded bg-[#ffd54f15] border border-[#ffd54f33] font-mono">
                테스트 모드
              </span>
            )}
          </div>

          <button
            onClick={handleCloseClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              adState.canClose
                ? 'bg-[#38ef7d] text-black hover:scale-110 shadow-[0_0_10px_rgba(56,239,125,0.5)] cursor-pointer'
                : 'bg-[#1b2333] text-[#8b9bb4] hover:text-white cursor-pointer'
            }`}
            title={adState.canClose ? '보상 획득 완료 및 닫기' : '닫기 (보상 미지급)'}
          >
            ✕
          </button>
        </div>

        {/* 🎬 광고 메인 비주얼 영역 */}
        <div className="p-4 flex flex-col items-center justify-center text-center relative bg-gradient-to-b from-[#101726] to-[#0c101a]">
          {/* 타이틀 및 배치 배너 */}
          <div className="mb-3">
            <span className="text-[10px] text-[#00d2ff] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00d2ff15] border border-[#00d2ff33]">
              {adState.title || '스폰서 보상형 비디오'}
            </span>
            <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
              {adState.description || 'Project: Limbo Tales 공식 후원사 광고'}
            </h3>
          </div>

          {/* 비디오 시뮬레이션 인터랙티브 프레임 */}
          <div className="w-full h-44 rounded-xl bg-[#070b13] border border-[#1f2d45] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d293d] via-transparent to-transparent opacity-50" />
            
            <div className="text-4xl mb-2 animate-bounce select-none">
              {adState.canClose ? '🎉' : '🛡️✨'}
            </div>

            <div className="text-xs font-bold text-white z-10">
              {adState.canClose ? '시청 완료! 보상이 지급되었습니다' : '방주의 등불을 밝히는 후원사 영상'}
            </div>

            <div className="text-[10px] text-[#8b9bb4] mt-1 z-10 max-w-[260px] text-center">
              {adState.canClose
                ? '우측 상단 ✕ 버튼을 누르면 게임으로 복귀합니다.'
                : adState.placement === 'loot_double'
                ? '광고를 끝까지 시청하시면 파밍 전리품 자원이 2배로 증폭 입고됩니다.'
                : '광고를 끝까지 시청하시면 약속된 보상과 심연 촉매가 지급됩니다.'}
            </div>

            {/* 하단 진행 프로그레스 바 */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#141b2a]">
              <div
                className="h-full bg-gradient-to-r from-[#00d2ff] to-[#38ef7d] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ⏱️ 카운트다운 및 보상 안내 */}
          <div className="w-full mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🎁</span>
              <span className="text-xs font-bold text-[#ffd54f]">
                {adState.rewardText || '보상 획득'}
              </span>
            </div>

            <div>
              {adState.canClose ? (
                <span className="text-xs font-bold text-[#38ef7d] flex items-center gap-1">
                  ✓ 지급 완료
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-[#00d2ff] bg-[#00d2ff15] px-2 py-0.5 rounded border border-[#00d2ff33]">
                  {adState.secondsRemaining}초 후 보상 지급
                </span>
              )}
            </div>
          </div>

          {/* 💡 1타 2피 촉매 지급 안내 (전리품 2배 광고는 촉매 제외) */}
          {adState.placement !== 'loot_double' && (
            <div className="w-full mt-2.5 p-2 rounded-lg bg-[#2a133844] border border-[#ce93d844] text-[10px] text-[#e1bee7] flex items-center justify-center gap-1.5">
              <span>✨</span>
              <span className="font-bold">보너스:</span>
              <span>다음 원정에서 쓸 <strong className="text-[#ffd54f]">심연 촉매 슬롯(최대 2개)</strong> 동시 개방!</span>
            </div>
          )}

          {/* 완료 시 하단 큰 닫기 버튼 */}
          {adState.canClose && (
            <button
              onClick={() => GoogleAdService.getInstance().closeAd(false)}
              className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[#38ef7d] to-[#00d2ff] text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              확인하고 보상 받기 ➔
            </button>
          )}
        </div>

        {/* ⚠️ 조기 이탈 경고 팝업 오버레이 */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-3xl mb-2">⚠️</span>
            <h4 className="text-sm font-bold text-white mb-1">광고를 중단하시겠습니까?</h4>
            <p className="text-xs text-[#8b9bb4] mb-4 leading-relaxed">
              지금 나가시면 성화, 짐수레, 헌화 버프 및 심연 촉매 활성화 혜택을 받을 수 없습니다.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-primary flex-1 text-xs py-2 font-bold bg-[#00d2ff] text-black"
              >
                계속 시청하기
              </button>
              <button
                onClick={handleConfirmExit}
                className="btn btn-ghost flex-1 text-xs py-2 text-[#ef5350] border border-[#ef535055]"
              >
                나가기 (보상 포기)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
