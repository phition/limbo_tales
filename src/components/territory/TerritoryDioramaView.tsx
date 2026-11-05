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
      <div className="absolute inset-0 bg-[#08090b]">
        {/* 거점 배경 이미지 (밝고 쨍하게 채도 및 밝기 보정) */}
        <img
          src="assets/citadel_bonfire.jpg"
          alt="Ark Citadel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-95 filter contrast-110 brightness-105 saturate-110 transition-all duration-700"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* 가장자리 은은한 비네팅만 남김 (어둡고 탁한 투명창 느낌 제거) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090b]/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
