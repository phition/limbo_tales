import React, { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';

export interface FacilityWorkstationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  levelBadge?: string | number;
  icon?: string;
  
  // 시네마틱 무대 프레임 에셋
  bgImage?: string;
  npcImage?: string;
  npcName?: string;
  npcDialogue?: string;

  // 헤더 우측 옵션 액션 (예: [⬆ 시설 증축])
  headerExtra?: React.ReactNode;
  
  // 상단 시네마틱 헤더 숨김 여부 (내부 컨텐츠 전체화면 모드)
  hideHeader?: boolean;

  // 내부 워크벤치 & 액션 덱 본문
  children: React.ReactNode;
}

export const FacilityWorkstationModal: React.FC<FacilityWorkstationModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  levelBadge,
  icon,
  bgImage,
  npcImage,
  npcName,
  npcDialogue,
  headerExtra,
  hideHeader = false,
  children,
}) => {
  const { tr } = useI18n();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleClose = () => {
    try {
      SoundManager.getInstance().play('click');
    } catch {}
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end md:relative md:inset-auto md:w-[620px] lg:w-[700px] xl:w-[780px] md:h-full md:shrink-0 md:z-20 select-none">
      {/* ── 배경 어둡고 깊은 섀도우 딤드 (모바일 전용 백드롭, 데스크탑은 좌측 뷰가 노출되도록 숨김) ── */}
      <div
        className="absolute inset-0 bg-[#08090b]/80 backdrop-blur-sm transition-opacity animate-fade-in md:hidden"
        onClick={handleClose}
      />

      {/* ── 모바일 바텀시트 / PC 스플릿 패널 본체 ── */}
      <div
        className="relative z-10 flex flex-col w-full h-full bg-[#121418] border-t md:border-t-0 md:border-l border-[#3d372e] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] rounded-t-2xl md:rounded-none overflow-hidden animate-drawer-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 상단 드래그 핸들 */}
        <div 
          className="md:hidden flex items-center justify-center py-2 bg-[#0d0f14] shrink-0"
        >
          <div className="w-10 h-1 rounded-full bg-[#3d372e]" />
        </div>

        {/* ── 시네마틱 무대 프레임 (모바일은 위아래를 크롭하여 본문 작업 영역 확장, PC는 시네마틱 비율 유지) ── */}
        {!hideHeader && (
          <div className="relative w-full h-32 sm:h-44 md:h-54 lg:h-60 bg-[#0a0b0e] border-b border-[#3d372e] shrink-0 overflow-hidden animate-facility-banner-rise">
            {/* 배경 이미지 (모바일: object-cover object-center로 상하를 자연스럽게 크롭하여 본문 영역 극대화) */}
            {bgImage ? (
              <img
                src={bgImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-100 contrast-105 saturate-110 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#161820] to-[#0a0b0e] flex items-center justify-center opacity-60">
                <span className="text-4xl opacity-20 filter grayscale">🏰</span>
              </div>
            )}

            {/* 상단 은은한 비네팅 (타이틀 및 닫기 버튼 가독성 확보) */}
            <div className="absolute inset-x-0 top-0 h-12 sm:h-16 bg-gradient-to-b from-[#08090b]/80 via-[#08090b]/30 to-transparent pointer-events-none" />

            {/* 하단 연결 은은한 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-transparent to-transparent pointer-events-none" />

            {/* ── 이미지 내부 좌측 상단 시설 타이틀 (아이콘 제외) ── */}
            <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 max-w-[calc(100%-70px)] pointer-events-auto">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-xs sm:text-base font-extrabold text-[#ededed] tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                  {title}
                </h2>
                {levelBadge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] sm:text-[10px] font-bold bg-[#b89758]/25 text-[#ffd54f] border border-[#b89758]/60 backdrop-blur-md shadow-sm">
                    Lv.{levelBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[10px] sm:text-[11px] text-[#cfd8e8] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] line-clamp-1 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {/* ── 이미지 내부 우측 상단 닫기 및 옵션 액션 ── */}
            <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              {headerExtra}
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#08090b]/80 hover:bg-[#2a1618] border border-[#4a2426] text-[#c56060] hover:text-[#e07b7b] hover:border-[#85383b] transition-all cursor-pointer font-bold shadow-lg backdrop-blur-sm active:scale-95 text-xs sm:text-sm"
                title={tr('닫기 (Esc)')}
              >
                ✕
              </button>
            </div>

            {/* NPC 스탠딩 (우측) */}
            {npcImage && (
              <div className="absolute bottom-0 right-2 sm:right-4 h-28 sm:h-40 md:h-50 lg:h-56 pointer-events-none">
                <img
                  src={npcImage}
                  alt={npcName || 'NPC'}
                  className="h-full w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                />
              </div>
            )}

            {/* NPC MUD 대사창 (하단 좌측 오버레이) */}
            {npcDialogue && (
              <div className="absolute bottom-1.5 left-2.5 right-14 sm:right-24 md:right-32 py-1 px-2 rounded bg-[#08090b]/85 border border-[#3d372e] backdrop-blur-sm shadow-md">
                {npcName && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#b89758] mb-0.5">
                    {npcName}
                  </div>
                )}
                <div className="text-[10px] sm:text-[11px] text-[#ededed] italic leading-snug line-clamp-1 sm:line-clamp-2">
                  "{npcDialogue}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. 하단 상세 워크벤치 & 액션 덱 영역 (내부 드로어가 온전히 스크롤 및 탭을 관리하도록 flex 컨테이너 제공) ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#08090b]">
          {children}
        </div>
      </div>
    </div>
  );
};
