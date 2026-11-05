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
  children,
}) => {
  const { tr } = useI18n();
  const [sheetHeight, setSheetHeight] = useState<'standard' | 'expanded'>('standard');

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
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end select-none">
      {/* ── 배경 어둡고 깊은 섀도우 딤드 (클릭 시 닫기) ── */}
      <div
        className="absolute inset-0 bg-[#08090b]/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* ── 모바일 바텀시트 / PC 스플릿 패널 본체 ── */}
      <div
        className={`relative z-10 flex flex-col w-full md:w-[580px] lg:w-[640px] bg-[#121418] border-t md:border-t-0 md:border-l border-[#3d372e] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] transition-all duration-300 ${
          sheetHeight === 'expanded' ? 'h-[94vh]' : 'h-[85vh] md:h-full'
        } rounded-t-2xl md:rounded-none overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 상단 드래그 핸들 */}
        <div 
          onClick={() => setSheetHeight(h => (h === 'standard' ? 'expanded' : 'standard'))}
          className="md:hidden flex items-center justify-center py-2 bg-[#0d0f14] cursor-pointer hover:bg-[#15171f]"
          title={tr('높이 조절')}
        >
          <div className="w-10 h-1 rounded-full bg-[#3d372e]" />
        </div>

        {/* ── 1. 시설 헤더 바 ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0b0e] border-b border-[#242732] shrink-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl drop-shadow">{icon}</span>}
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm md:text-base font-bold text-[#ededed] tracking-tight">
                  {title}
                </h2>
                {levelBadge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b89758]/15 text-[#dcc496] border border-[#b89758]/40">
                    Lv.{levelBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-[#9da3af] line-clamp-1">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {headerExtra}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1a1c22] border border-[#2c303b] text-[#9da3af] hover:text-[#dcc496] hover:border-[#b89758] transition-colors cursor-pointer"
              title={tr('닫기 (Esc)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── 2. 시네마틱 무대 프레임 (Cinematic Stage, 상단 35%) ── */}
        <div className="relative w-full h-44 md:h-48 bg-[#0a0b0e] border-b border-[#3d372e] shrink-0 overflow-hidden">
          {/* 배경 이미지 */}
          {bgImage ? (
            <img
              src={bgImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#161820] to-[#0a0b0e] flex items-center justify-center opacity-60">
              <span className="text-5xl opacity-20 filter grayscale">{icon || '🏰'}</span>
            </div>
          )}

          {/* 스모키 비네팅 & 하단 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-transparent to-black/40 pointer-events-none" />

          {/* NPC 스탠딩 (우측) */}
          {npcImage && (
            <div className="absolute bottom-0 right-4 h-40 md:h-44 pointer-events-none">
              <img
                src={npcImage}
                alt={npcName || 'NPC'}
                className="h-full w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              />
            </div>
          )}

          {/* NPC MUD 대사창 (하단 좌측 오버레이) */}
          {npcDialogue && (
            <div className="absolute bottom-2 left-3 right-20 md:right-32 p-2 rounded bg-[#08090b]/85 border border-[#3d372e] backdrop-blur-sm shadow-md">
              {npcName && (
                <div className="text-[10px] font-bold text-[#b89758] mb-0.5">
                  {npcName}
                </div>
              )}
              <div className="text-[11px] text-[#ededed] italic leading-snug line-clamp-2">
                "{npcDialogue}"
              </div>
            </div>
          )}
        </div>

        {/* ── 3. 하단 상세 워크벤치 & 액션 덱 영역 (스크롤 지원) ── */}
        <div className="flex-1 overflow-y-auto tg-scrollbar p-3 md:p-4 bg-[#121418]">
          {children}
        </div>
      </div>
    </div>
  );
};
