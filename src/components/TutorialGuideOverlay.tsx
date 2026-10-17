import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TutorialStep, TUTORIAL_STEPS } from '../data/tutorialSteps';
import { CustomAssetService } from '../services/CustomAssetService';
import { I18nService } from '../i18n/I18nService';

interface Props {
  currentStepId: string;
  onAdvanceStep: (nextStepId?: string) => void;
  onSkipTutorial: () => void;
  isOpen: boolean;
}

export const TutorialGuideOverlay: React.FC<Props> = ({
  currentStepId,
  onAdvanceStep,
  onSkipTutorial,
  isOpen
}) => {
  const currentStep = TUTORIAL_STEPS.find(s => s.id === currentStepId);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isDialogueDismissed, setIsDialogueDismissed] = useState(false);
  const [resourceBarBottom, setResourceBarBottom] = useState<number>(0);
  const [, setLangTick] = useState(0);
  const typingTimerRef = useRef<number | null>(null);

  // 언어 변경 실시간 구독
  useEffect(() => {
    return I18nService.getInstance().subscribe(() => {
      setLangTick(t => t + 1);
    });
  }, []);

  const tr = useCallback((text: string) => {
    return I18nService.getInstance().tr(text);
  }, []);

  // 자원 표시줄 하단 위치 추적 (모바일 노치 / 상태바 및 자원 표시줄 침범 방지)
  const updateResourceBarBottom = useCallback(() => {
    const el = document.getElementById('global-resource-bar') || document.querySelector('.game-column > div:first-child');
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0) {
        setResourceBarBottom(rect.bottom);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateResourceBarBottom();
    const interval = window.setInterval(updateResourceBarBottom, 350);
    window.addEventListener('resize', updateResourceBarBottom);
    window.addEventListener('scroll', updateResourceBarBottom, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateResourceBarBottom);
      window.removeEventListener('scroll', updateResourceBarBottom, true);
    };
  }, [isOpen, updateResourceBarBottom]);

  // 현재 표정에 따른 일레인 포트레이트
  const elainePortrait = CustomAssetService.getElainePortrait(currentStep?.emotion || 'normal');

  // 타깃 요소 위치 추적
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const element = document.querySelector(currentStep.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep?.targetSelector]);

  // 타깃 요소를 화면 중앙으로 자동 스크롤
  useEffect(() => {
    if (!isOpen || !currentStep?.targetSelector) return;
    const timer = setTimeout(() => {
      const element = document.querySelector(currentStep.targetSelector!);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [isOpen, currentStepId, currentStep?.targetSelector]);

  // 주기적으로 타깃 위치 업데이트 (DOM 변경, 스크롤, 애니메이션 대응)
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    updateTargetRect();
    const interval = window.setInterval(updateTargetRect, 250);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  // 스텝 전환 시 메시지 인덱스 및 대화창 닫힘 상태 초기화
  useEffect(() => {
    setCurrentMessageIndex(0);
    setIsDialogueDismissed(false);
  }, [currentStepId]);

  // 타이핑 효과 구현 (현재 설정된 언어로 자동 번역 적용)
  useEffect(() => {
    if (!currentStep) return;
    const rawMessage = currentStep.message[currentMessageIndex] || '';
    const fullText = tr(rawMessage);
    setDisplayedText('');
    setIsTyping(true);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let charIdx = 0;
    typingTimerRef.current = window.setInterval(() => {
      charIdx++;
      if (charIdx <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIdx));
      } else {
        setIsTyping(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 22);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [currentStep, currentMessageIndex, tr]);

  // 언어 실시간 변경 시 이미 타이핑 완료된 텍스트 즉시 언어 갱신
  useEffect(() => {
    if (!currentStep) return;
    const rawMessage = currentStep.message[currentMessageIndex] || '';
    const fullText = tr(rawMessage);
    if (!isTyping) {
      setDisplayedText(fullText);
    }
  }, [currentStep, currentMessageIndex, isTyping, tr]);

  if (!isOpen || !currentStep) return null;

  // 🧭 탐색 정찰 및 전투 중 관전 스텝: 대화창이 닫히면 전체 오버레이 완전 숨김 (자유 탐색 및 전투 진행)
  if (isDialogueDismissed && (
    currentStep.id === 'TUTORIAL_EXPLORE_SCOUT' ||
    currentStep.id === 'TUTORIAL_BATTLE_COMBO' ||
    currentStep.id === 'TUTORIAL_BATTLE_FEVER_GUIDE' ||
    currentStep.id === 'TUTORIAL_BATTLE_FEVER_PRAISE'
  )) {
    return null;
  }

  const rawMessage = currentStep.message[currentMessageIndex] || '';
  const fullText = tr(rawMessage);
  const isLastMessage = currentMessageIndex >= currentStep.message.length - 1;

  // 대사창 클릭 시 처리: 타이핑 중이면 즉시 완료, 완료되었으면 다음 대사 또는 다음 스텝
  const handleDialogueClick = () => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    if (!isLastMessage) {
      setCurrentMessageIndex(prev => prev + 1);
    } else if (currentStep.hideDialogueOnAcknowledge) {
      // 대사 확인 후 대화창을 숨기고 타깃 스포트라이트만 강조 유지
      setIsDialogueDismissed(true);
    } else if (currentStep.allowOverlayClickNext) {
      const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStepId);
      const nextStep = TUTORIAL_STEPS[currentIndex + 1];
      onAdvanceStep(nextStep?.id);
    }
  };

  // 타깃 클릭 핸들러 (스포트라이트 홀 클릭 시 실제 엘리먼트 클릭 및 다음 단계 전이)
  const handleTargetHoleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogueDismissed(false);
    if (!currentStep.targetSelector) return;

    // 🌟 단순 정보 확인/점검 패널 스텝인 경우:
    // 패널 내부의 자식 버튼(심연의 백과 도감 버튼 등)을 임의로 클릭하지 않고 다음 스텝으로만 전이
    if (
      currentStep.id === 'TUTORIAL_PREP_SYNERGY' ||
      currentStep.id === 'TUTORIAL_PREP_BACKPACK' ||
      currentStep.id === 'TUTORIAL_BATTLE_COMBO' ||
      currentStep.id === 'TUTORIAL_BATTLE_FEVER_GUIDE'
    ) {
      const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStepId);
      const nextStep = TUTORIAL_STEPS[currentIndex + 1];
      onAdvanceStep(nextStep?.id);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      // 실제 클릭 가능한 버튼 요소 찾아서 클릭
      const clickable = (el.tagName === 'BUTTON' ? el : el.querySelector('button') || el) as HTMLElement;
      try {
        clickable.click();
      } catch (err) {
        console.warn('Tutorial target click failed:', err);
      }
    }

    // ⚔️ 원정대 출전 배치 스텝인 경우:
    // 파티 출전 버튼 클릭 후 ActionButton 내부에서 togglePartyMember와 튜토리얼 전이가 직접 처리됨
    if (currentStep.id === 'TUTORIAL_DEPLOY_HERO') {
      return;
    }

    // 🎁 정제소 보상 수령 스텝인 경우:
    // 유저가 영지 시설들(안식처, 벌채소, 시추소)을 자유롭게 건설하며 라운지 건설 조건이 될 때까지 일레인이 잠시 화면에서 퇴장
    if (currentStep.id === 'TUTORIAL_CLAIM_REWARD') {
      onAdvanceStep('WAITING_TAVERN_UNLOCK');
      return;
    }

    // 🔨 건설 단계인 경우 즉시 넘기지 않고, 완공될 때까지 대기 상태로 전이
    if (currentStep.id === 'TUTORIAL_BUILD_REFINERY' || currentStep.id === 'TUTORIAL_BUILD_TAVERN') {
      onAdvanceStep('WAITING_CONSTRUCTION_' + currentStep.id);
      return;
    }

    // 🧭 탐색 정찰 단계: 유저가 3회 탐색하여 마물과 조우할 때까지 대화창 숨김
    if (currentStep.id === 'TUTORIAL_EXPLORE_SCOUT') {
      setIsDialogueDismissed(true);
      return;
    }

    // ⚔️ 전투 타깃 지정 스텝: 몬스터 카드 클릭 시 BattleScreen 내부에서 전이 처리
    if (currentStep.id === 'TUTORIAL_BATTLE_TARGET') {
      return;
    }

    // 🏕️ 야영 단계: 모닥불 담소 모달을 닫을 때 다음 스텝(횃불)으로 전이 처리
    if (currentStep.id === 'TUTORIAL_EXPLORE_CAMP') {
      return;
    }

    // 🔥 횃불 단계: toggleTorch 함수 내부에서 다음 스텝(귀환)으로 전이 처리
    if (currentStep.id === 'TUTORIAL_EXPLORE_TORCH') {
      return;
    }

    // ⚓ 귀환 단계: returnToCitadel 함수 내부에서 성채 최종 스텝으로 전이 처리
    if (currentStep.id === 'TUTORIAL_EXPLORE_RETURN') {
      return;
    }

    // 다음 스텝으로 진행
    const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStepId);
    const nextStep = TUTORIAL_STEPS[currentIndex + 1];
    onAdvanceStep(nextStep?.id);
  };

  // 감정 태그 라벨 및 색상
  const emotionMeta = {
    normal: { label: '전술 보고', color: '#c8aa6e' },
    serious: { label: '경계 지휘', color: '#ffd54f' },
    smile: { label: '안도 / 격려', color: '#38ef7d' },
    worry: { label: '주의 / 염려', color: '#ff7043' },
  }[currentStep.emotion];

  // 자원 표시줄 바로 아래 안전 마진 계산 (모바일 알림표시줄 및 자원바 침범 방지)
  const topSafeOffset = resourceBarBottom > 0
    ? `${resourceBarBottom + 6}px`
    : 'calc(env(safe-area-inset-top, 0px) + 48px)';

  const chipSafeOffset = resourceBarBottom > 0
    ? `${resourceBarBottom + 44}px`
    : 'calc(env(safe-area-inset-top, 0px) + 86px)';

  const dialogueSafeTop = resourceBarBottom > 0
    ? `${resourceBarBottom + 40}px`
    : 'calc(env(safe-area-inset-top, 0px) + 82px)';

  return (
    <div className={`fixed inset-0 z-[9999] select-none font-sans overflow-hidden ${
      isDialogueDismissed ? 'pointer-events-none' : 'pointer-events-auto'
    }`}>
      {/* ── 1. 스포트라이트 SVG 마스크 오버레이 ── */}
      <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
        isDialogueDismissed ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
      }`}>
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* 전체 하얀색 (마스크 투과) */}
            <rect width="100%" height="100%" fill="white" />
            {/* 타깃 영역 검은색 (구멍 뚫기) */}
            {targetRect && (
              <rect
                x={targetRect.x - 6}
                y={targetRect.y - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* 어두운 반투명 배경 (타깃 영역 외 클릭 차단, 인게임 화면 가시성 확보) */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 8, 16, 0.40)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* ── 2. 스포트라이트 타깃 클릭 영역 & 펄스 링 ── */}
      {targetRect && !isDialogueDismissed && (
        <div
          onClick={handleTargetHoleClick}
          className="absolute z-10 cursor-pointer pointer-events-auto"
          style={{
            top: targetRect.y - 6,
            left: targetRect.x - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* 황금빛 펄스 테두리 */}
          <div className="w-full h-full rounded-xl border-2 border-[#ffd54f] animate-pulse shadow-[0_0_20px_rgba(255,213,79,0.7)] pointer-events-none" />

          {/* 포인트 앤 클릭 안내 태그 */}
          <div
            className={`absolute pointer-events-none whitespace-nowrap z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1408] border border-[#ffd54f] text-[#ffd54f] text-xs font-bold shadow-lg animate-bounce ${
              currentStep.pointerPosition === 'top'
                ? '-top-10 left-1/2 -translate-x-1/2'
                : currentStep.pointerPosition === 'bottom'
                ? '-bottom-10 left-1/2 -translate-x-1/2'
                : currentStep.pointerPosition === 'left'
                ? '-left-36 top-1/2 -translate-y-1/2'
                : '-right-36 top-1/2 -translate-y-1/2'
            }`}
          >
            <span>👉</span>
            <span>{tr(currentStep.targetLabel || '여기를 터치하세요')}</span>
          </div>
        </div>
      )}

      {/* ── 3. 상단 튜토리얼 헤더 (스킵 및 단계 표시: 자원표시줄 바로 아래 안전 배치) ── */}
      <div
        className="absolute right-3 sm:right-4 z-30 flex items-center gap-2 pointer-events-auto transition-all duration-200"
        style={{ top: topSafeOffset }}
      >
        <span className="text-[11px] font-mono text-[#8b9bb4] bg-[#0c121e]/90 border border-[#202d44] px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
          {tr('튜토리얼 STEP')} {currentStep.order} / {TUTORIAL_STEPS.length}
        </span>
        <button
          onClick={onSkipTutorial}
          className="text-xs px-3 py-1.5 rounded-full bg-[#241414]/95 border border-[#ef5350aa] text-[#ef5350] hover:bg-[#ef5350] hover:text-white transition-all font-bold shadow-lg cursor-pointer active:scale-95 flex items-center gap-1 backdrop-blur-sm min-h-[30px]"
        >
          <span>{tr('건너뛰기 ✕')}</span>
        </button>
      </div>

      {/* ── 4. SRPG식 상반신 포트레이트 및 대사창 (화면 하단 또는 타깃이 하단일 때 상단) ── */}
      {isDialogueDismissed ? (
        /* 대화창 일시 숨김 시 상단에 깔끔한 안내 칩 표시 (자원표시줄 및 스킵 헤더 아래) */
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1322]/95 border-2 border-[#ffd54f] text-[#ffd54f] text-xs font-bold shadow-[0_4px_20px_rgba(255,213,79,0.4)] backdrop-blur-md animate-bounce pointer-events-auto max-w-[92%]"
          style={{ top: chipSafeOffset }}
        >
          <span>👉</span>
          <span className="truncate">
            {(() => {
              if (currentStep.id === 'TUTORIAL_PREP_POSITION') {
                return tr('🛡️ 대원들의 포지션을 자유롭게 설정한 후, 화면 하단의 [다음: 시너지 확인 ▶] 플로팅 버튼을 터치하세요!');
              }
              if (currentStep.id === 'TUTORIAL_PREP_SUPPLIES') {
                return tr('🎒 무료 배낭(가벼운 백팩)을 선택하고 [기본 (1,1,1,닻1)] 보급품을 챙겨 출정을 준비하세요!');
              }
              if (currentStep.targetSelector) {
                return tr('강조된 [{0}]을 터치하세요!').replace('{0}', tr(currentStep.targetLabel || '버튼'));
              }
              return tr('🔍 상세 창으로 성향과 스킬을 확인한 후 마음에 드는 용병을 [🤝 고용]하세요!');
            })()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogueDismissed(false);
            }}
            className="ml-2 text-[10px] text-[#8b9bb4] hover:text-white underline cursor-pointer shrink-0"
          >
            {tr('대화 다시보기')}
          </button>
        </div>
      ) : (
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-[95%] max-w-[850px] z-20 cursor-pointer pointer-events-auto transition-all duration-300 ${
            targetRect && targetRect.y > (typeof window !== 'undefined' ? window.innerHeight * 0.45 : 400) ? '' : 'bottom-4'
          }`}
          style={
            targetRect && targetRect.y > (typeof window !== 'undefined' ? window.innerHeight * 0.45 : 400)
              ? { top: dialogueSafeTop }
              : undefined
          }
          onClick={handleDialogueClick}
        >
          {/* 세로형 모바일 최적화: 외부 좌상단 오버랩 포트레이트 & 발화자 배지 */}
          <div className="absolute -top-6 sm:-top-7 left-3 sm:left-4 z-30 flex items-end gap-2.5 pointer-events-none">
            {/* 일레인 초상화 아바타 (오버행 스쿼클 뱃지) */}
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#c8aa6e] bg-[#090d17] shadow-[0_4px_16px_rgba(200, 170, 110,0.45)] relative group">
                <img
                  src={elainePortrait}
                  alt={tr('수석 오퍼레이터 일레인')}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                {/* 통신 홀로그램 스캔라인 효과 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#c8aa6e22] to-transparent pointer-events-none animate-pulse" />
              </div>

              {/* 감정 뱃지 (아바타 우하단 앵커링) */}
              <span
                className="absolute -bottom-1 -right-1.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full border shadow-md whitespace-nowrap"
                style={{
                  color: emotionMeta.color,
                  borderColor: `${emotionMeta.color}88`,
                  backgroundColor: '#0c1322'
                }}
              >
                ● {tr(emotionMeta.label)}
              </span>
            </div>

            {/* 발화자 소속 & 이름 태그 */}
            <div className="flex items-center gap-1.5 pb-0.5 sm:pb-1">
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-[#c8aa6e25] text-[#c8aa6e] border border-[#c8aa6e55] backdrop-blur-md shadow">
                {tr('통제실')}
              </span>
              <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide">
                {tr(currentStep.speaker)}
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl bg-gradient-to-r from-[#0c1322]/96 via-[#10192e]/96 to-[#0b101c]/96 border-2 border-[#384c72] shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md pt-5 pb-3 px-3.5 sm:pt-4 sm:pb-3.5 sm:px-5 flex flex-col justify-between">
            {/* 상단 우측 스텝 타이틀 */}
            <div className="flex items-center justify-end pb-1 mb-1.5 border-b border-[#223352]/60 min-h-[20px]">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#8b9bb4]">
                {tr(currentStep.title)}
              </span>
            </div>

            {/* 대사 본문 영역 (전체 폭 100% 활용) */}
            <div className="w-full min-w-0">
              {/* 대사 텍스트 (타이핑 효과) */}
              <p className="text-sm sm:text-base text-[#d8e3f5] leading-relaxed min-h-[46px] sm:min-h-[48px]">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-[#c8aa6e] ml-1 animate-ping" />
                )}
              </p>

                {/* 1) 대화 확인 후 일시 숨김 바로가기 버튼 */}
                {currentStep.hideDialogueOnAcknowledge && isLastMessage && !isTyping && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDialogueDismissed(true);
                      }}
                      className="btn btn-primary text-xs px-3.5 py-1.5 font-bold shadow-lg flex items-center gap-1.5 animate-pulse bg-gradient-to-r from-[#ffd54f] to-[#ffb300] text-black border-none cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                    >
                      <span>👁️</span>
                      <span>
                        {tr(currentStep.acknowledgeButtonLabel || (
                          currentStep.targetSelector
                            ? '출전 버튼 확인하기 (대화창 닫기) ▶'
                            : '용병 후보 검토 및 고용하기 (대화창 닫기) ▶'
                        ))}
                      </span>
                    </button>
                  </div>
                )}

                {/* 2) 대화 확인 후 다음 단계 바로가기 버튼 (allowOverlayClickNext) */}
                {currentStep.allowOverlayClickNext && isLastMessage && !isTyping && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStepId);
                        const nextStep = TUTORIAL_STEPS[currentIndex + 1];
                        onAdvanceStep(nextStep?.id);
                      }}
                      className="btn btn-primary text-xs px-4 py-2 font-bold shadow-lg flex items-center gap-1.5 bg-gradient-to-r from-[#c8aa6e] via-[#00aaff] to-[#0088ff] text-white border border-[#80e5ff] cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(200, 170, 110,0.4)]"
                    >
                      <span>{tr(currentStep.nextButtonLabel || '다음 단계로 ▶')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 하단 진행 안내 힌트 */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#71829e] pt-1">
                <span>
                  {currentStep.hideDialogueOnAcknowledge ? (
                    <span className="text-[#ffd54f] font-bold">
                      💡 {currentStep.targetSelector
                        ? tr('터치 시 대화창이 닫히며 화면의 [{0}]이 강조됩니다.').replace('{0}', tr(currentStep.targetLabel || ''))
                        : tr('터치 시 대화창이 닫히며 자유롭게 용병 후보들을 검토하고 고용하실 수 있습니다.')}
                    </span>
                  ) : currentStep.targetSelector ? (
                    <span className="text-[#ffd54f] font-bold">
                      💡 {tr('화면에 강조된 [{0}]를 터치하여 진행하세요.').replace('{0}', tr(currentStep.targetLabel || ''))}
                    </span>
                  ) : (
                    <span>
                      {isLastMessage ? tr('▶ 화면을 터치하여 다음 단계로 이동') : tr('▶ 계속하려면 터치하세요')}
                    </span>
                  )}
                </span>

                <span className="font-mono text-[10px]">
                  {currentMessageIndex + 1} / {currentStep.message.length}
                </span>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};
