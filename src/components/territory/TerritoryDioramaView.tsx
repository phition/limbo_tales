import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TerritoryDioramaViewProps {
  onOpenFacility?: (facilityKey: string) => void;
  onOpenExplore?: () => void;
  className?: string;
  isLit?: boolean;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  className = '',
  isLit = false,
}) => {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');

  // 모바일 / 세로 모드(portrait 9:16) 화면 반응형 감지
  const isMobile = useIsMobile();
  const imageSrc = isMobile ? 'assets/citadel_9x16_mobile.jpg' : 'assets/citadel_bonfire.jpg';
  const videoSrc = isMobile ? 'assets/citadel_9x16_mobile.mp4' : 'assets/citadel_bonfire.mp4';

  // 10초 영상 길이에 최적화된 매끄러운 크로스오버 페이드 시간 (2.4초 오버랩)
  const FADE_SEC = 2.4;
  const isTransitioningRef = useRef(false);

  // 화면 비율 전환(모바일 9:16 vs 데스크톱 16:9) 시 비디오 소스 교체 및 동기화
  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    const currentSrcA = vA.currentSrc || vA.src;
    if (!currentSrcA.includes(videoSrc)) {
      vA.src = videoSrc;
      vA.load();
      vB.src = videoSrc;
      vB.load();
      if (isLit) {
        const active = activeVideo === 'A' ? vA : vB;
        active.play().catch(() => {});
      }
    }
  }, [videoSrc, isLit, activeVideo]);

  // 성화 점화(isLit) 상태에 따른 비디오 재생 및 정지 제어
  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    if (isLit) {
      if (activeVideo === 'A') {
        vA.play().catch(() => {});
      } else {
        vB.play().catch(() => {});
      }
    } else {
      vA.pause();
      vB.pause();
    }
  }, [isLit, activeVideo]);

  // 성화 점화 중일 때 이중 플레이어 크로스페이드 루프 수행
  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    // Video A가 끝나기 FADE_SEC 초 전에 Video B를 시작하고 페이드인
    const handleTimeUpdateA = () => {
      if (!isLit || !vA.duration || isTransitioningRef.current) return;
      const timeLeft = vA.duration - vA.currentTime;
      if (timeLeft <= FADE_SEC && timeLeft > 0) {
        isTransitioningRef.current = true;
        vB.currentTime = 0;
        vB.play().catch(() => {});
        setActiveVideo('B');

        setTimeout(() => {
          vA.pause();
          vA.currentTime = 0;
          isTransitioningRef.current = false;
        }, FADE_SEC * 1000);
      }
    };

    // Video B가 끝나기 FADE_SEC 초 전에 Video A를 시작하고 페이드인
    const handleTimeUpdateB = () => {
      if (!isLit || !vB.duration || isTransitioningRef.current) return;
      const timeLeft = vB.duration - vB.currentTime;
      if (timeLeft <= FADE_SEC && timeLeft > 0) {
        isTransitioningRef.current = true;
        vA.currentTime = 0;
        vA.play().catch(() => {});
        setActiveVideo('A');

        setTimeout(() => {
          vB.pause();
          vB.currentTime = 0;
          isTransitioningRef.current = false;
        }, FADE_SEC * 1000);
      }
    };

    vA.addEventListener('timeupdate', handleTimeUpdateA);
    vB.addEventListener('timeupdate', handleTimeUpdateB);

    return () => {
      vA.removeEventListener('timeupdate', handleTimeUpdateA);
      vB.removeEventListener('timeupdate', handleTimeUpdateB);
    };
  }, [isLit]);

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#08090b] overflow-hidden select-none pointer-events-none z-0 ${className}`}>
      {/* ── 1. 다크 고딕 부유 성채 2.5D 전경 배경 (점화 시 비디오 루프 / 소멸 시 기존 정적 이미지) ── */}
      <div className="absolute inset-0 bg-[#08090b] z-0">
        {/* 기존 정적 이미지 (성화 꺼짐 시 표시 - 모바일 9:16 및 데스크톱 16:9 반응형 picture 지원) */}
        <picture className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
          isLit ? 'opacity-0 z-0' : 'opacity-95 z-[1]'
        }`}>
          <source media="(max-width: 768px), (orientation: portrait)" srcSet="assets/citadel_9x16_mobile.jpg" />
          <img
            src={imageSrc}
            alt="Ark Citadel Extinguished"
            className="w-full h-full object-cover object-center filter contrast-110 brightness-105 saturate-110"
          />
        </picture>

        {/* 비디오 레이어 A (성화 점화 시 활성화) */}
        <video
          ref={videoRefA}
          muted
          playsInline
          poster={imageSrc}
          src={videoSrc}
          style={{ transitionDuration: `${FADE_SEC}s` }}
          className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-110 brightness-105 saturate-110 transition-opacity ease-in-out ${
            isLit && activeVideo === 'A' ? 'opacity-95 z-[2]' : 'opacity-0 z-[1]'
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* 비디오 레이어 B (교차 페이드용) */}
        <video
          ref={videoRefB}
          muted
          playsInline
          poster={imageSrc}
          src={videoSrc}
          style={{ transitionDuration: `${FADE_SEC}s` }}
          className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-110 brightness-105 saturate-110 transition-opacity ease-in-out ${
            isLit && activeVideo === 'B' ? 'opacity-95 z-[2]' : 'opacity-0 z-[1]'
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* 가장자리 은은한 비네팅 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-transparent pointer-events-none z-[3]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/40 via-transparent to-transparent pointer-events-none z-[3]" />
      </div>
    </div>
  );
};
