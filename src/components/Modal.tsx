import React from 'react';

interface Props {
  title: React.ReactNode;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: string;
}

export const Modal: React.FC<Props> = ({ title, open, onClose, children, footer, zIndex = 'z-50' }) => {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4`}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />
      <div className="relative panel-accent w-full max-w-[440px] animate-fade-in max-h-[90dvh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2738] shrink-0 gap-2">
          <div className="text-sm font-bold text-[#f3e5c8] min-w-0 flex-1 leading-snug break-words">{title}</div>
          <button className="btn btn-ghost text-xs px-2 py-0.5 shrink-0 hover:bg-[#c560601f]" style={{ borderColor: '#c56060', color: '#c56060' }} onClick={onClose}>
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>
        <div className="px-4 py-3 max-h-[70dvh] overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-[#1f2738] flex gap-2 justify-end shrink-0 flex-wrap">{footer}</div>}
      </div>
    </div>
  );
};
