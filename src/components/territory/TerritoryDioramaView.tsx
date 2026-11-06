import React, { useRef, useEffect } from 'react';

interface TerritoryDioramaViewProps {
  onOpenFacility?: (facilityKey: string) => void;
  onOpenExplore?: () => void;
  className?: string;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
        } catch {
          // 브라우저 정책 등으로 인한 자동재생 실패 대비
        }
      }
    };
    playVideo();
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#08090b] overflow-hidden select-none pointer-events-none ${className}`}>
      {/* ── 1. 다크 고딕 부유 성채 2.5D 전경 배경 비디오 (무한 루프) ── */}
      <div className="absolute inset-0 bg-[#08090b]">
        {/* 거점 배경 비디오 (밝고 쨍하게 채도 및 밝기 보정, 무한 반복) */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="assets/citadel_bonfire.jpg"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-95 filter contrast-110 brightness-105 saturate-110 transition-all duration-700"
        >
          <source src="assets/citadel_territory.mp4" type="video/mp4" />
          <source src="assets/citadel_bonfire.mp4" type="video/mp4" />
          {/* 폴백 정적 이미지 */}
          <img
            src="assets/citadel_bonfire.jpg"
            alt="Ark Citadel"
            className="w-full h-full object-cover object-center"
          />
        </video>
        
        {/* 가장자리 은은한 비네팅만 남김 (어둡고 탁한 투명창 느낌 제거) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
