import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { FirebaseService, GuestbookMessage, UserProfile } from '../services/FirebaseService';
import { SoundManager } from '../managers/SoundManager';
import { useGameManager } from '../hooks/useGameManager';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile | null;
}

const PAGE_SIZE = 10;

/** ⏱️ 타임스탬프를 YYYY.MM.DD HH:mm 형식으로 포맷팅 */
function formatTimestamp(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export const GuestbookModal: React.FC<Props> = ({
  open,
  onClose,
  currentUserProfile,
}) => {
  const { gm } = useGameManager();
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 실시간 방명록 데이터 구독
  useEffect(() => {
    if (!open) return;
    const fb = FirebaseService.getInstance();
    const unsubscribe = fb.listenGuestbookMessages((updatedMessages) => {
      setMessages(updatedMessages);
    });
    return () => {
      unsubscribe();
    };
  }, [open]);

  if (!open) return null;

  const fb = FirebaseService.getInstance();
  const isAnonymous = currentUserProfile?.isAnonymous ?? fb.isAnonymousUser();
  const currentNick = currentUserProfile?.nickname || '지휘관';
  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageMessages = messages.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnonymous) {
      setErrorMessage('익명(게스트) 지휘관은 방명록을 작성할 수 없습니다. 정식 계정으로 로그인해 주세요.');
      return;
    }

    const clean = inputContent.trim();
    if (!clean) {
      setErrorMessage('내용을 입력해 주세요.');
      return;
    }
    if (clean.length > 100) {
      setErrorMessage('최대 100자까지 작성할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fb.addGuestbookMessage(clean);
      if (res.success) {
        setInputContent('');
        setCurrentPage(1); // 새 글이 최상단에 있으므로 1페이지로 이동
        SoundManager.getInstance().play('forge_success');
        gm.addLog(`💬 [방명록 등록] "${clean.slice(0, 15)}..." 글이 전 서버 게시판에 등록되었습니다.`, 'system');
      } else {
        setErrorMessage(res.error || '글 등록에 실패했습니다.');
        SoundManager.getInstance().play('click');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📋 방주 지휘관 방명록 (게시판)"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[10px] text-[#8b9bb4]">
            총 <strong className="text-[#00d2ff]">{messages.length}</strong>개의 교신 기록 (최대 200개 보존)
          </div>
          <ActionButton label="닫기" variant="primary" size="sm" onClick={onClose} />
        </div>
      }
    >
      <div className="flex flex-col gap-3 max-h-[75vh] overflow-hidden">
        {/* 상단 100자 글쓰기 카드 (익명 지휘관은 작성 불가 안내) */}
        {isAnonymous ? (
          <div className="p-3 rounded-xl bg-[#1a1424] border border-[#ab47bc44] flex items-center gap-3 shrink-0 shadow-sm animate-fade-in">
            <span className="text-2xl p-2 rounded-xl bg-[#ab47bc22] text-[#ce93d8] shrink-0">🔒</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#ce93d8] flex items-center gap-1.5">
                <span>방명록 작성 불가 (익명 지휘관)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ab47bc22] text-[#ce93d8] font-mono font-bold">
                  GUEST
                </span>
              </div>
              <div className="text-[11px] text-[#90a4ae] mt-0.5 leading-relaxed">
                익명(게스트) 계정은 방명록을 열람할 수만 있으며 글을 작성할 수 없습니다. 소통에 참여하시려면 정식 계정(Google 또는 이메일)으로 로그인해 주세요.
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-xl bg-[#101726] border border-[#23324d] flex flex-col gap-2 shrink-0 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎖️</span>
                <span className="text-xs font-bold text-[#00d2ff] truncate max-w-[160px]">
                  {currentNick}
                </span>
                <span className="text-[10px] text-[#8b9bb4]">지휘관님의 방명록 한마디</span>
              </div>
              <span
                className={`text-[10px] font-mono ${
                  inputContent.length > 90 ? 'text-[#ff9800] font-bold' : 'text-[#8b9bb4]'
                }`}
              >
                {inputContent.length} / 100자
              </span>
            </div>

            <div className="flex gap-2">
              <textarea
                rows={2}
                maxLength={100}
                value={inputContent}
                onChange={(e) => {
                  setInputContent(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="방주 지휘관들에게 남길 응원과 전술 조언을 작성하세요 (최대 100자)"
                className="flex-1 p-2 rounded-lg bg-[#080d17] border border-[#1e2a3e] text-white text-xs placeholder-[#50607d] resize-none focus:border-[#00d2ff] focus:outline-none transition-colors"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !inputContent.trim()}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center cursor-pointer ${
                  isSubmitting || !inputContent.trim()
                    ? 'bg-[#182338] text-[#50607d] cursor-not-allowed'
                    : 'bg-[#00d2ff] hover:bg-[#38bdf8] text-black shadow-md shadow-[#00d2ff33] active:scale-95'
                }`}
              >
                <span>{isSubmitting ? '...' : '✍️'}</span>
                <span>등록</span>
              </button>
            </div>

            {errorMessage && (
              <div className="text-[10.5px] text-[#ef5350] font-bold flex items-center gap-1 animate-fade-in">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        )}

        {/* 게시글 목록 (새 글이 항상 위로 올라오도록 정렬, 10개씩 페이징) */}
        <div className="flex-1 overflow-y-auto min-h-[240px] max-h-[350px] flex flex-col gap-1.5 pr-1">
          {pageMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8b9bb4] gap-2">
              <span className="text-3xl">💬</span>
              <div className="text-xs font-bold text-[#cfd8e8]">등록된 방명록이 없습니다.</div>
              <div className="text-[11px]">첫 번째 방주 지휘관 메시지를 남겨보세요!</div>
            </div>
          ) : (
            pageMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-[#0c121e] border border-[#1b2537] hover:border-[#00d2ff55] flex items-center justify-between gap-2.5 transition-all shadow-xs"
              >
                {/* 1. 가장 왼쪽: 지휘관 아이디(콜사인) */}
                <div className="flex items-center gap-1 shrink-0 w-[88px] sm:w-[110px]">
                  <span className="text-xs">🎖️</span>
                  <span
                    className="text-xs font-bold text-[#00d2ff] truncate block"
                    title={msg.authorName}
                  >
                    {msg.authorName}
                  </span>
                </div>

                {/* 2. 중앙: 본문 내용 (최대 100자) */}
                <div className="flex-1 min-w-0 text-xs text-[#cfd8dc] break-words whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* 3. 글 끝: 등록 날짜와 시간 스탬프 (작게 표시) */}
                <div className="shrink-0 text-[10px] text-[#8b9bb4] font-mono whitespace-nowrap text-right ml-1">
                  {formatTimestamp(msg.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 페이지네이션 (10개 단위) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-[#1e2a3e] shrink-0">
            <button
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#141b2c] border border-[#23324d] text-white hover:border-[#00d2ff] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              disabled={safePage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                SoundManager.getInstance().play('click');
              }}
            >
              ◀ 이전
            </button>

            <span className="text-xs font-mono font-bold text-[#00d2ff] px-2">
              {safePage} / {totalPages}
            </span>

            <button
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#141b2c] border border-[#23324d] text-white hover:border-[#00d2ff] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              disabled={safePage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                SoundManager.getInstance().play('click');
              }}
            >
              다음 ▶
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
