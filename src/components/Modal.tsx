import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { registerBackButtonHandler } from '../utils/nativeBridge';

interface Props {
  title: React.ReactNode;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: string;
  maxWidth?: string;
  /** Tailwind 클래스 문자열 (예: 'max-h-[92dvh]', 'h-[88vh] max-h-[88dvh]') */
  maxHeight?: string;
  className?: string;
}

/**
 * 공용 모달
 * - document.body 로 포털 렌더링: 바텀시트/드로어의 transform·overflow·flex 정렬에 갇히지 않음
 * - 백드롭(배경 딤 + 블러)을 카드의 "부모"에 적용하고, 카드에는 opacity 0 에서 시작하는 진입 애니메이션을 쓰지 않음
 *   (안드로이드 WebView 에서 backdrop-filter 형제 레이어 위에 opacity 애니메이션 카드를 올리면
 *    카드 타일이 합성되지 않고 화면 회전/접기·화면 OFF→ON 등 강제 리페인트 전까지 보이지 않는 문제 방지)
 */
export const Modal: React.FC<Props> = ({
  title,
  open,
  onClose,
  children,
  footer,
  zIndex = 'z-50',
  maxWidth = 'max-w-[95vw] sm:max-w-[560px] md:max-w-[680px]',
  maxHeight = 'max-h-[90vh]',
  className = ''
}) => {
  // 📱 모달 활성화 시 뒤로가기 버튼(하드웨어/브라우저)으로 모달 닫기
  useEffect(() => {
    if (!open) return;
    const unregister = registerBackButtonHandler(() => {
      onClose();
      return true;
    });
    return () => unregister();
  }, [open, onClose]);

  if (!open) return null;

  const modalNode = (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-xs select-none`}
      onClick={e => {
        // 포털 내부 클릭이 React 트리상의 부모(드로어 백드롭 등)로 전파되지 않도록 차단
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative panel-accent w-full ${maxWidth} ${maxHeight} flex flex-col shadow-2xl ${className}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2738] shrink-0 gap-2">
          <div className="text-sm font-bold text-[#f3e5c8] min-w-0 flex-1 leading-snug break-words">{title}</div>
          <button
            type="button"
            className="btn btn-ghost text-xs px-2 py-0.5 shrink-0 hover:bg-[#c560601f]"
            style={{ borderColor: '#c56060', color: '#c56060' }}
            onClick={onClose}
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>
        <div className="px-3 sm:px-4 py-3 overflow-y-auto overscroll-contain flex-1 min-h-0 flex flex-col">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-[#1f2738] flex gap-2 justify-end shrink-0 flex-wrap">{footer}</div>}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
