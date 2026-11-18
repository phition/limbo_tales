import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { registerBackButtonHandler } from '../utils/nativeBridge';

interface SheetModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
  className?: string;
}

/**
 * 🏛️ 방주의 성화 모달(Bonfire Modal) 스타일을 계승한 시설 건설·증축 전용 커스텀 모달
 *
 * 특징:
 *  - 전체화면이 아닌, 성화 모달과 100% 동일한 황금빛 림(Rim) & 흑요석 다크 테마의 반응형 플로팅 카드
 *  - 모바일(폴드 접힌 화면 포함)과 대화면 모두에서 균형 잡힌 뷰포트 비율 (max-w-[92vw] sm:max-w-[480px] md:max-w-[560px], max-h-[86vh])
 *  - 헤더(시설 정보, 레벨, 닫기)와 푸터(건설/입장 액션)는 상하단 고정(shrink-0), 본문 정보만 독립 스크롤(overflow-y-auto)
 *  - document.body 포털 마운트로 부모 드로어의 transform, overflow, flex 간섭 100% 배제
 *  - WebView 애니메이션 프리징을 방지하기 위해 opacity: 0 키프레임 지연 없이 즉시 고속 렌더링
 */
export const SheetModal: React.FC<SheetModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-[92vw] sm:max-w-[480px] md:max-w-[560px]',
  zIndex = 'z-[150]',
  className = '',
}) => {
  // 📱 안드로이드 하드웨어 뒤로가기 버튼 연동
  useEffect(() => {
    if (!open) return;
    const unregister = registerBackButtonHandler(() => {
      onClose();
      return true;
    });
    return () => unregister();
  }, [open, onClose]);

  // ⌨️ Esc 키 연동
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-[2px] select-none`}
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
      }}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[86vh] max-h-[86dvh] bg-[#0a0d14]/95 border border-[#b89758]/70 rounded-2xl p-3.5 sm:p-4.5 shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col gap-3 select-none overflow-hidden ${className}`}
        style={{
          backgroundImage: 'radial-gradient(ellipse at top, rgba(184, 151, 88, 0.15), transparent 70%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 1. 모달 상단 헤더 바 (성화 모달과 동일한 러스틱 골드 구분선 & 닫기 버튼) */}
        <div className="flex items-center justify-between border-b border-[#3d372e]/70 pb-2.5 shrink-0 gap-2">
          <div className="min-w-0 flex-1 leading-snug break-words">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#181113] border border-[#4a2426] text-[#c56060] hover:text-[#e07b7b] hover:bg-[#2a1618] hover:border-[#85383b] transition-all cursor-pointer font-bold shadow-xs active:scale-95 text-xs shrink-0"
            title="닫기 (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 2. 본문 콘텐츠 영역 (내부 독립 스크롤) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 tg-scrollbar">
          {children}
        </div>

        {/* 3. 하단 액션 버튼 바 */}
        {footer && (
          <div className="border-t border-[#3d372e]/60 pt-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
