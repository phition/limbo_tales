import React, { useRef, useEffect, useState } from 'react';

interface TerritoryDioramaViewProps {
  onOpenFacility?: (facilityKey: string) => void;
  onOpenExplore?: () => void;
  className?: string;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  className = '',
}) => {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');

  // 끊김 없는 크로스페이드 시간 (초 단위)
  const FADE_SEC = 1.6;
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    // 초기 재생
    vA.currentTime = 0;
    vA.play().catch(() => {});

    // Video A가 끝나기 FADE_SEC 초 전에 Video B를 시작하고 페이드인
    const handleTimeUpdateA = () => {
      if (!vA.duration || isTransitioningRef.current) return;
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
      if (!vB.duration || isTransitioningRef.current) return;
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
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#08090b] overflow-hidden select-none pointer-events-none ${className}`}>
      {/* ── 1. 다크 고딕 부유 성채 2.5D 전경 배경 비디오 (이중 크로스페이드 무한 루프) ── */}
      <div className="absolute inset-0 bg-[#08090b]">
        {/* 비디오 레이어 A */}
        <video
          ref={videoRefA}
          muted
          playsInline
          poster="assets/citadel_bonfire.jpg"
          className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-110 brightness-105 saturate-110 transition-opacity duration-1500 ease-in-out ${
            activeVideo === 'A' ? 'opacity-95 z-10' : 'opacity-0 z-0'
          }`}
        >
          <source src="assets/citadel_territory.mp4" type="video/mp4" />
          <source src="assets/citadel_bonfire.mp4" type="video/mp4" />
        </video>

        {/* 비디오 레이어 B (교차 페이드용) */}
        <video
          ref={videoRefB}
          muted
          playsInline
          poster="assets/citadel_bonfire.jpg"
          className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-110 brightness-105 saturate-110 transition-opacity duration-1500 ease-in-out ${
            activeVideo === 'B' ? 'opacity-95 z-10' : 'opacity-0 z-0'
          }`}
        >
          <source src="assets/citadel_territory.mp4" type="video/mp4" />
          <source src="assets/citadel_bonfire.mp4" type="video/mp4" />
        </video>

        {/* 정적 폴백 이미지 (비디오 로딩 전 기본 베이스) */}
        <img
          src="assets/citadel_bonfire.jpg"
          alt="Ark Citadel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 pointer-events-none z-[-1]"
        />
        
        {/* 가장자리 은은한 비네팅 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-transparent pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/40 via-transparent to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
};
