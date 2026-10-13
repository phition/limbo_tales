import React, { useState, useEffect } from 'react';
import { gameDialog, DialogOptions } from '../services/DialogService';

type ActiveDialog = DialogOptions & { id: number; resolve: (result: boolean) => void };

export const GameDialogModal: React.FC = () => {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);

  useEffect(() => {
    return gameDialog.subscribe((current) => {
      setDialog(current);
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialog.isConfirm) {
          dialog.resolve(false);
        } else {
          dialog.resolve(true);
        }
      } else if (e.key === 'Enter') {
        dialog.resolve(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.resolve(true);
  };

  const handleCancel = () => {
    dialog.resolve(false);
  };

  const isDanger = dialog.tone === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in select-none">
      <div 
        className="bg-[#0e131f] border border-[#d4af3777] rounded-2xl w-full max-w-[390px] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.25)] overflow-hidden animate-scale-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="px-5 pt-5 pb-2 flex flex-col items-center text-center">
          {dialog.icon && (
            <span className="text-3xl mb-2 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {dialog.icon}
            </span>
          )}
          <h3 className="text-[#f3e5c8] font-bold text-base tracking-wide flex items-center gap-1.5">
            {dialog.title}
          </h3>
        </div>

        {/* 본문 메시지 */}
        <div className="px-5 py-3 text-[#cbd5e1] text-xs leading-relaxed text-center whitespace-pre-line break-keep font-sans">
          {dialog.message}
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-4 py-3 bg-[#131929] border-t border-[#1f293d] flex items-center justify-center gap-2.5">
          {dialog.isConfirm && (
            <button
              type="button"
              className="btn btn-ghost text-xs px-4 py-2 rounded-xl text-[#94a3b8] hover:text-white transition-colors min-w-[80px]"
              onClick={handleCancel}
            >
              {dialog.cancelText || '취소'}
            </button>
          )}
          <button
            type="button"
            className={`btn text-xs px-5 py-2 rounded-xl font-bold transition-all shadow-md min-w-[90px] ${
              isDanger
                ? 'btn-danger bg-[#b71c1c] hover:bg-[#d32f2f] text-white border border-[#ef535088]'
                : 'btn-primary bg-[#876739] hover:bg-[#9e7943] text-[#fff8e7] border border-[#ffd54f88] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
            }`}
            onClick={handleConfirm}
            autoFocus
          >
            {dialog.confirmText || '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};
