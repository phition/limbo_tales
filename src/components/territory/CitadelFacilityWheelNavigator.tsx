import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BuildingId } from '../../types/game';
import { SoundManager } from '../../managers/SoundManager';
import { useI18n } from '../../hooks/useI18n';

export interface WorkstationItem {
  key: string;
  name: string;
  sub: string;
  icon: string;
  image: string;
  isBuilt: boolean;
  buildingId?: BuildingId;
  badge?: string | null;
}

interface CitadelFacilityWheelNavigatorProps {
  items: WorkstationItem[];
  onSelect: (item: WorkstationItem, cardEl: HTMLElement) => void;
  tutorialStepId?: string;
  buildingLevels: Record<string, number | undefined>;
  registerableCodexCount?: number;
}

export const CitadelFacilityWheelNavigator: React.FC<CitadelFacilityWheelNavigatorProps> = ({
  items,
  onSelect,
  tutorialStepId,
  buildingLevels,
  registerableCodexCount = 0,
}) => {
  const { tr } = useI18n();
  const N = items.length;

  // 튜토리얼 중 주점 진입 단계인 경우 주점을 기본 선택
  const initialIndex = React.useMemo(() => {
    if (tutorialStepId === 'TUTORIAL_ENTER_TAVERN') {
      const tavernIdx = items.findIndex(it => it.key === 'tavern');
      if (tavernIdx >= 0) return tavernIdx;
    }
    return 0;
  }, [tutorialStepId, items]);

  // 회전 상태 (부동소수점 인덱스)
  const posRef = useRef<number>(initialIndex);
  const targetPosRef = useRef<number>(initialIndex);
  const velocityRef = useRef<number>(0);
  const [displayPos, setDisplayPos] = useState<number>(initialIndex);
  const [activeIdx, setActiveIdx] = useState<number>(initialIndex);

  // 반응형 화면 감지 (리사이즈 동기화)
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 드래그/터치 인터랙션 추적
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(initialIndex);
  const lastYRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityHistoryRef = useRef<{ dy: number; dt: number }[]>([]);
  const isInertiaRef = useRef<boolean>(false);
  const lastTickIndexRef = useRef<number>(initialIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // 🔊 카드 인덱스 통과 틱 사운드 (너무 잦지 않게 쓰로틀링)
  const lastSoundTimeRef = useRef<number>(0);
  const playTickSound = useCallback(() => {
    const now = performance.now();
    if (now - lastSoundTimeRef.current > 75) {
      lastSoundTimeRef.current = now;
      try {
        SoundManager.getInstance().play('click');
      } catch {}
    }
  }, []);

  // 🎯 물리 애니메이션 루프 (감속, 관성, 스프링 스냅)
  const updatePhysics = useCallback(() => {
    const now = performance.now();

    if (!isDraggingRef.current) {
      if (isInertiaRef.current) {
        // 🚀 관성 비행 상태 (플릭 감속)
        posRef.current += velocityRef.current;
        velocityRef.current *= 0.925; // 공기 저항 감속

        // 정수 경계 통과 시 틱 사운드
        const currentInt = Math.round(posRef.current);
        if (currentInt !== lastTickIndexRef.current) {
          lastTickIndexRef.current = currentInt;
          playTickSound();
        }

        // 속도가 충분히 줄어들면 가장 가까운 카드로 스냅 시작
        if (Math.abs(velocityRef.current) < 0.007) {
          isInertiaRef.current = false;
          velocityRef.current = 0;
          targetPosRef.current = Math.round(posRef.current);
        }
      } else {
        // 🧲 목표 카드로 부드러운 스프링 착지
        const diff = targetPosRef.current - posRef.current;
        if (Math.abs(diff) > 0.0005) {
          posRef.current += diff * 0.22; // 탄력적인 스냅 반응성
          const currentInt = Math.round(posRef.current);
          if (currentInt !== lastTickIndexRef.current && Math.abs(diff) > 0.3) {
            lastTickIndexRef.current = currentInt;
            playTickSound();
          }
        } else {
          posRef.current = targetPosRef.current;
        }
      }

      setDisplayPos(posRef.current);
      const normalizedActive = ((Math.round(posRef.current) % N) + N) % N;
      setActiveIdx(normalizedActive);
    }

    animFrameRef.current = requestAnimationFrame(updatePhysics);
  }, [N, playTickSound]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updatePhysics]);

  // 🎯 특정 인덱스로 회전 스냅
  const snapToIndex = useCallback((targetIndex: number) => {
    isInertiaRef.current = false;
    velocityRef.current = 0;

    // 현재 pos에서 가장 가까운 targetIndex의 모듈로 위치 계산
    const current = posRef.current;
    let diff = ((targetIndex - (current % N)) % N + N) % N;
    if (diff > N / 2) diff -= N;

    targetPosRef.current = Math.round(current + diff);
    playTickSound();
  }, [N, playTickSound]);

  // 🔼🔽 이전 / 다음 시설 이동
  const handleStep = useCallback((delta: number) => {
    isInertiaRef.current = false;
    velocityRef.current = 0;
    targetPosRef.current = Math.round(posRef.current) + delta;
    playTickSound();
  }, [playTickSound]);

  // 🖱️ 데스크탑 마우스 휠 이벤트 (가속 및 반응형 휠 지원)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelTimeout: NodeJS.Timeout | null = null;
    let accumulatedDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 휠 델타 누적 및 부드러운 연속 회전
      accumulatedDelta += e.deltaY;
      const stepThreshold = 60; // 휠 틱 반응 임계치

      if (Math.abs(accumulatedDelta) >= stepThreshold) {
        const step = accumulatedDelta > 0 ? 1 : -1;
        accumulatedDelta = 0;
        handleStep(step);
      }

      // 빠른 휠 회전 시 가속 관성 살짝 부여
      const impulse = (e.deltaY / 100) * 0.05;
      if (Math.abs(impulse) > 0.08) {
        isInertiaRef.current = true;
        velocityRef.current = Math.max(-0.4, Math.min(0.4, velocityRef.current + impulse * 0.5));
      }

      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        accumulatedDelta = 0;
      }, 150);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [handleStep]);

  // 📱 포인터 드래그 & 모바일 플릭(튕기기) 제스처
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 버튼 클릭 등 명시적 터치 방해 금지
    if ((e.target as HTMLElement).closest('button')) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    isInertiaRef.current = false;
    velocityRef.current = 0;
    dragStartYRef.current = e.clientY;
    dragStartPosRef.current = posRef.current;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityHistoryRef.current = [];

    // 포인터 캡처
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const currentY = e.clientY;
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const dy = currentY - lastYRef.current;

    if (Math.abs(currentY - dragStartYRef.current) > 7) {
      hasDraggedRef.current = true;
    }

    // 감도: 화면 높이에 따라 적절한 픽셀-대-카드 비율 (모바일 ~155px, 대형화면 ~240px)
    const cardSpacing = isLargeScreen ? 240 : 155;
    const posDelta = -((currentY - dragStartYRef.current) / cardSpacing);
    posRef.current = dragStartPosRef.current + posDelta;

    // 속도 계산 및 이력 보존 (최근 50ms)
    if (dt > 4) {
      const v = -dy / dt;
      velocityHistoryRef.current.push({ dy: -dy, dt });
      if (velocityHistoryRef.current.length > 5) {
        velocityHistoryRef.current.shift();
      }
      lastYRef.current = currentY;
      lastTimeRef.current = now;
    }

    setDisplayPos(posRef.current);
    const normalizedActive = ((Math.round(posRef.current) % N) + N) % N;
    setActiveIdx(normalizedActive);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // 🚀 플릭(Flick) 속도 계산 (가속 가미)
    let avgVelocity = 0;
    if (velocityHistoryRef.current.length > 0) {
      const totalDy = velocityHistoryRef.current.reduce((s, p) => s + p.dy, 0);
      const totalDt = velocityHistoryRef.current.reduce((s, p) => s + p.dt, 0);
      avgVelocity = totalDt > 0 ? totalDy / totalDt : 0;
    }

    const flickThreshold = 0.35; // 튕기기 제스처 기준 속도
    if (Math.abs(avgVelocity) > flickThreshold) {
      // ⚡ "튕기듯이 돌렸을 때 살짝 가속되면서 돌아가는 느낌" - 가속 부스트 계수 1.35x 적용
      const flickBoost = 1.35;
      const initialV = avgVelocity * 0.024 * flickBoost;
      velocityRef.current = Math.max(-0.55, Math.min(0.55, initialV));
      isInertiaRef.current = true;
    } else {
      // 일반 드래그 종료: 가장 가까운 정수 인덱스로 스냅
      isInertiaRef.current = false;
      targetPosRef.current = Math.round(posRef.current);
    }

    // 드래그 종료 직후 onClick 차단 보호 (50ms 뒤 리셋)
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  // ⌨️ 키보드 상/하 화살표 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleStep(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleStep(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep]);

  // 활성 아이템
  const currentItem = items[activeIdx];

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden touch-none"
      style={{ perspective: '1100px' }}
    >
      {/* 🌌 배경 미세 비네팅 & 원통형 심도 조명 */}
      <div className="absolute inset-0 bg-radial from-[#131722]/30 via-transparent to-[#07090e]/95 pointer-events-none" />

      {/* 상단/하단 심도 페이드 그라데이션 (원통 회전 깊이감 연출) */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-[#0a0d14] via-[#0a0d14]/70 to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-transparent pointer-events-none z-30" />

      {/* 🔼 상단 퀵 스텝 버튼 */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        className="absolute top-2 z-40 px-3 py-1 rounded-full bg-[#161a24]/80 hover:bg-[#b89758]/20 border border-[#2b3548] hover:border-[#b89758]/60 text-[#c8aa6e] text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer backdrop-blur-xs"
        title={tr('위로 회전 (ArrowUp)')}
      >
        <span>▲</span>
        <span className="text-[10.5px] hidden sm:inline">{tr('이전 시설')}</span>
      </button>

      {/* 🎡 3D 세로 휠 실린더 컨테이너 */}
      <div
        className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl h-full flex items-center justify-center pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {items.map((item, i) => {
          // 순환 모듈로 상대 거리 계산 (-N/2 ~ N/2)
          let offset = ((i - displayPos) % N + N) % N;
          if (offset > N / 2) offset -= N;

          const absOffset = Math.abs(offset);

          // 화면 밖 아이템은 렌더링 최적화 생략
          if (absOffset > 2.8) return null;

          const isCenter = absOffset < 0.42;
          const isLocked = !item.isBuilt;
          const buildingLevel = item.buildingId ? buildingLevels[item.buildingId] : undefined;

          // 3D 원통형 변환 계산
          // offset에 따라 Y이동, Z깊이, X축 회전각도, 스케일, 불투명도 부여
          const yStep = isLargeScreen ? 200 : 105;
          const translateY = offset * yStep;
          const rotateX = -offset * 22; // 원통형 굽힘 각도 (위는 뒤로, 아래는 앞으로)
          const translateZ = -Math.pow(absOffset, 1.35) * (isLargeScreen ? 110 : 70); // 뒤로 밀림
          const scale = Math.max(0.68, 1 - absOffset * 0.13);
          const opacity = Math.max(0, 1 - Math.pow(absOffset / 2.6, 1.6));
          const zIndex = Math.round(100 - absOffset * 20);

          return (
            <div
              key={item.key}
              id={`workstation-card-${item.key}`}
              data-tutorial-target={item.key === 'tavern' && !isLocked && isCenter ? 'enter-tavern' : undefined}
              onClick={(e) => {
                if (hasDraggedRef.current) return;
                if (isCenter) {
                  onSelect(item, e.currentTarget);
                } else {
                  snapToIndex(i);
                }
              }}
              style={{
                transform: `translate3d(0, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents: 'auto',
                willChange: 'transform, opacity',
              }}
              className={`absolute w-[92%] sm:w-[520px] md:w-[580px] rounded-2xl overflow-hidden border transition-shadow duration-200 cursor-pointer shadow-2xl flex flex-col ${
                isCenter
                  ? isLocked
                    ? 'bg-[#10141f] border-[#4a5568] shadow-[0_0_25px_rgba(0,0,0,0.85)]'
                    : 'bg-[#10141d] border-2 border-[#b89758] shadow-[0_0_30px_rgba(184,151,88,0.45)] ring-1 ring-[#ffd54f]/50'
                  : 'bg-[#0d1017]/90 border-[#222b3d]/80 hover:border-[#b89758]/50 filter brightness-90 hover:brightness-105'
              }`}
            >
              {/* ── 시설 내부 배너 이미지 (큰 화면: 1376x768 16:9 기준 이미지 전체 온전히 대형 표시, 작은 화면: 컴팩트 96px 유지) ── */}
              <div 
                className="relative w-full overflow-hidden bg-[#07090e] border-b border-[#242b3b]"
                style={{
                  height: isLargeScreen ? 'auto' : '96px',
                  aspectRatio: isLargeScreen ? '1376 / 768' : undefined,
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className={`facility-banner-img w-full h-full object-cover transition-all duration-500 ${
                    isLocked
                      ? 'grayscale brightness-[0.45] contrast-110'
                      : isCenter
                      ? 'grayscale-0 brightness-105 contrast-105 saturate-110'
                      : 'grayscale-[0.35] brightness-[0.75]'
                  }`}
                />

                {/* 상단 비네팅 & 블렌드 */}
                <div className="absolute inset-x-0 top-0 h-12 sm:h-16 bg-gradient-to-b from-[#08090b]/80 via-[#08090b]/20 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-10 sm:h-14 bg-gradient-to-t from-[#10141d] via-[#10141d]/40 to-transparent pointer-events-none" />

                {/* 좌측 상단: 아이콘 + 시설 타이틀 */}
                <div className="absolute top-2 left-2.5 sm:top-3 sm:left-3.5 z-10 flex items-center gap-2 max-w-[calc(100%-80px)]">
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-base sm:text-xl shrink-0 shadow-md backdrop-blur-xs transition-colors ${
                      isLocked
                        ? 'bg-black/60 border border-[#2a3447]/60 text-[#718096]'
                        : isCenter
                        ? 'bg-black/80 border border-[#ffd54f] text-white shadow-[0_0_10px_rgba(255,213,79,0.4)]'
                        : 'bg-black/70 border border-[#b89758]/60 text-white'
                    }`}
                  >
                    <span className="leading-none drop-shadow">{item.icon}</span>
                  </div>
                  <h4
                    className={`text-xs sm:text-base font-extrabold tracking-tight truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                      isLocked
                        ? 'text-[#8896ab]'
                        : isCenter
                        ? 'text-[#ffd54f]'
                        : 'text-[#ededed]'
                    }`}
                  >
                    {item.name}
                  </h4>
                </div>

                {/* 우측 상단: 레벨 뱃지 및 상태 태그 */}
                <div className="absolute top-2 right-2.5 sm:top-3 sm:right-3.5 z-10 flex items-center gap-1.5">
                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-bold font-mono bg-black/80 text-[#8896ab] border border-[#374154] backdrop-blur-xs shadow-md flex items-center gap-1">
                      <span>🔒</span>
                      <span>{tr('미해금')}</span>
                    </span>
                  ) : (
                    <>
                      {buildingLevel !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-mono font-bold bg-[#b89758]/30 text-[#ffd54f] border border-[#b89758]/70 backdrop-blur-xs shadow-md">
                          Lv.{buildingLevel}
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-black shadow-md backdrop-blur-xs ${
                            item.key === 'codex' && registerableCodexCount > 0
                              ? 'bg-[#ef5350] text-white animate-pulse'
                              : 'bg-gradient-to-r from-[#ffd54f] to-[#b89758] text-[#08090b]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* 미해금 중앙 락 오버레이 */}
                {isLocked && isCenter && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                    <div className="px-3 py-1.5 rounded-xl bg-[#090b10]/90 border border-[#3b475e]/80 text-[#cfd8e8] text-xs font-bold shadow-2xl flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>{tr('시설 미건설 (터치하여 건설하기)')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 하단 설명 및 입장 액션 바 ── */}
              <div className="p-2 sm:p-3 flex flex-col justify-between flex-1 gap-1.5 bg-[#10141d]">
                <p
                  className={`text-[11px] sm:text-xs line-clamp-1 leading-relaxed ${
                    isLocked
                      ? 'text-[#5a6578]'
                      : isCenter
                      ? 'text-[#cfd8e8]'
                      : 'text-[#8b9bb4]'
                  }`}
                >
                  {isLocked
                    ? tr('성채 시설 관리에서 해당 시설을 건설하면 즉시 이용할 수 있습니다.')
                    : item.sub}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-[#1e2330]/80">
                  <span
                    className={`text-[10.5px] sm:text-[11.5px] font-bold ${
                      isLocked ? 'text-[#7d8ba1]' : 'text-[#b89758]'
                    }`}
                  >
                    {isLocked ? `🔨 ${tr('건설 필요')}` : `✨ ${tr('성채 핵심 거점')}`}
                  </span>

                  {isLocked ? (
                    <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#141924] border border-[#26334a] text-[#8896ab] text-[11px] sm:text-xs font-bold flex items-center gap-1">
                      <span>{tr('건설하러 가기')}</span>
                      <span>➔</span>
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-xs sm:text-[13px] font-black transition-all shadow-xs flex items-center gap-1 ${
                        isCenter
                          ? 'bg-gradient-to-r from-[#b89758] to-[#ffd54f] text-[#08090b] shadow-[0_0_12px_rgba(184,151,88,0.5)] scale-102'
                          : 'bg-[#181f2c] border border-[#2e3b52] text-[#8b9bb4]'
                      }`}
                    >
                      <span>{tr('입장하기')}</span>
                      <span className="text-[10px] sm:text-xs">▶</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔽 하단 퀵 스텝 버튼 */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        className="absolute bottom-2 z-40 px-3 py-1 rounded-full bg-[#161a24]/80 hover:bg-[#b89758]/20 border border-[#2b3548] hover:border-[#b89758]/60 text-[#c8aa6e] text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer backdrop-blur-xs"
        title={tr('아래로 회전 (ArrowDown)')}
      >
        <span>▼</span>
        <span className="text-[10.5px] hidden sm:inline">{tr('다음 시설')}</span>
      </button>

      {/* 🧭 우측 세로 네비게이터 인디케이터 (12개 휠 위치 직관 트래킹) */}
      <div className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 py-2 px-1 rounded-full bg-black/60 border border-[#2b3447]/60 backdrop-blur-xs shadow-lg">
        {items.map((it, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => snapToIndex(idx)}
              className={`rounded-full transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'w-3 h-3 bg-gradient-to-b from-[#ffd54f] to-[#b89758] shadow-[0_0_8px_#ffd54f] scale-110'
                  : 'w-1.5 h-1.5 bg-[#4a5568] hover:bg-[#a0aec0]'
              }`}
              title={it.name}
            />
          );
        })}
      </div>

      {/* 🔢 좌측 하단 현재 시설 순서 (예: 1 / 12) */}
      <div className="absolute left-3 bottom-2 z-40 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/70 border border-[#2b3447]/60 text-[#dcc496] backdrop-blur-xs">
        {activeIdx + 1} / {N}
      </div>
    </div>
  );
};
