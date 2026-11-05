import React from 'react';

interface TerritoryDioramaViewProps {
  onOpenFacility?: (facilityKey: string) => void;
  onOpenExplore?: () => void;
  className?: string;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 w-full h-full bg-[#08090b] overflow-hidden select-none pointer-events-none ${className}`}>
      {/* ── 1. 다크 고딕 부유 성채 2.5D 전경 배경 아트 ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090b] via-[#0f1218] to-[#08090b]">
        {/* 원경 성채 실루엣 및 흑무 안개 오버레이 */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2e2617] via-transparent to-transparent pointer-events-none" />
        
        {/* 거점 배경 이미지 */}
        <img
          src="assets/citadel_bonfire.jpg"
          alt="Ark Citadel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-65 filter contrast-125 brightness-95 transition-all duration-700"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* 스모키 다크 비네팅 & 은은한 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/75 via-transparent to-[#08090b]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/50 via-transparent to-[#08090b]/30 pointer-events-none" />
      </div>
    </div>
  );
};
