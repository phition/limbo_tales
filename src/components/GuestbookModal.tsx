import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { FirebaseService, GuestbookMessage, UserProfile } from '../services/FirebaseService';
import { SoundManager } from '../managers/SoundManager';
import { useGameManager } from '../hooks/useGameManager';
import { TranslationService } from '../services/TranslationService';
import { I18nService } from '../i18n/I18nService';

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
  const [messages, setMessages] = useState<GuestbookMessage[]>(() => FirebaseService.getInstance().getCachedGuestbookMessages());
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🌐 번역 상태 관리
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // 실시간 방명록 데이터 구독
  useEffect(() => {
    if (!open) return;
    const fb = FirebaseService.getInstance();
    // 모달이 열릴 때 캐시 즉시 반영 및 1회 즉시 페치
    setMessages(fb.getCachedGuestbookMessages());
    fb.fetchGuestbookMessages().catch(() => {});
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

  // 🌐 현재 언어 및 타겟 언어 라벨
  const currentLang = I18nService.getInstance().getCurrentLanguage();
  const targetLangLabel = currentLang === 'ja' ? '日本語' : currentLang === 'en' ? 'English' : '한국어';
  const tr = (k: string) => I18nService.getInstance().tr(k);

  // 🌐 단일 글 번역 토글
  const handleToggleTranslate = async (msg: GuestbookMessage) => {
    SoundManager.getInstance().play('click');
    setTranslationError(null);

    if (translatedMap[msg.id]) {
      // 이미 번역되어 있으면 원문으로 복귀
      setTranslatedMap((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      return;
    }

    setTranslatingIds((prev) => new Set(prev).add(msg.id));
    try {
      const res = await TranslationService.getInstance().translate(msg.content);
      setTranslatedMap((prev) => ({
        ...prev,
        [msg.id]: res.translatedText
      }));
    } catch (err: any) {
      setTranslationError(err?.message || '번역 중 오류가 발생했습니다.');
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(msg.id);
        return next;
      });
    }
  };

  // 🌐 현재 페이지 전체 일괄 번역 토글
  const handleToggleTranslateAll = async () => {
    SoundManager.getInstance().play('click');
    setTranslationError(null);

    const allTranslated = pageMessages.length > 0 && pageMessages.every((m) => !!translatedMap[m.id]);
    if (allTranslated) {
      // 전체 원문으로 복귀
      setTranslatedMap((prev) => {
        const next = { ...prev };
        pageMessages.forEach((m) => delete next[m.id]);
        return next;
      });
      return;
    }

    setIsTranslatingAll(true);
    try {
      const texts = pageMessages.map((m) => m.content);
      const results = await TranslationService.getInstance().translateBatch(texts);
      setTranslatedMap((prev) => {
        const next = { ...prev };
        pageMessages.forEach((m, idx) => {
          if (results[idx]?.translatedText) {
            next[m.id] = results[idx].translatedText;
          }
        });
        return next;
      });
    } catch (err: any) {
      setTranslationError(err?.message || '일괄 번역 중 오류가 발생했습니다.');
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnonymous) {
      setErrorMessage(tr('익명(게스트) 지휘관은 차원 메세지를 작성할 수 없습니다. 정식 계정으로 로그인해 주세요.'));
      return;
    }

    const clean = inputContent.trim();
    if (!clean) {
      setErrorMessage(tr('차원 메세지 내용을 입력해 주세요.'));
      return;
    }
    if (clean.length > 100) {
      setErrorMessage(tr('차원 메세지는 최대 100자까지 작성할 수 있습니다.'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fb.addGuestbookMessage(clean);
      if (res.success) {
        setInputContent('');
        setCurrentPage(1); // 새 글이 최상단에 있으므로 1페이지로 이동
        setMessages(fb.getCachedGuestbookMessages()); // 새 글 즉시 화면 반영
        SoundManager.getInstance().play('click');
        gm.addLog(`💬 [차원 메세지] "${clean.slice(0, 15)}..." 메세지가 전 차원에 송신되었습니다.`, 'system');
      } else {
        setErrorMessage(res.error || tr('메세지 전송에 실패했습니다.'));
        SoundManager.getInstance().play('click');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || tr('차원 메세지 전송 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr('[차원 메세지]')}
      maxWidth="w-[96vw] max-w-[560px] sm:max-w-[640px] md:max-w-[740px]"
      maxHeight="h-[88vh] max-h-[88dvh]"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="text-[10px] text-[#8b9bb4]">
              총 <strong className="text-[#c8aa6e]">{messages.length}</strong>{tr('개의 차원 교신 기록')}
            </div>
            <button
              type="button"
              onClick={() => {
                fb.fetchGuestbookMessages();
                SoundManager.getInstance().play('click');
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-[#12141a] border border-[#23324d] text-[#8b9bb4] hover:text-[#c8aa6e] hover:border-[#c8aa6e] transition-all cursor-pointer flex items-center gap-1"
              title={tr('최신 차원 메세지 새로고침')}
            >
              <span>🔄</span>
              <span>{tr('새로고침')}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleTranslateAll}
              disabled={isTranslatingAll || pageMessages.length === 0}
              className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                pageMessages.length > 0 && pageMessages.every((m) => !!translatedMap[m.id])
                  ? 'bg-[#c8aa6e22] text-[#c8aa6e] border-[#c8aa6e66]'
                  : 'bg-[#12141a] border-[#23324d] text-[#8b9bb4] hover:text-[#c8aa6e] hover:border-[#c8aa6e]'
              }`}
              title={tr('현재 페이지의 모든 글을 현재 게임 언어로 번역')}
            >
              <span>{isTranslatingAll ? '⏳' : '🌐'}</span>
              <span>
                {isTranslatingAll
                  ? tr('번역 중...')
                  : pageMessages.length > 0 && pageMessages.every((m) => !!translatedMap[m.id])
                  ? tr('원문 보기')
                  : `${tr('전체 번역')} (${targetLangLabel})`}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs px-3 py-1 font-bold rounded-lg border transition-all flex items-center gap-1.5 hover:bg-[#c560601f] cursor-pointer active:scale-95 ml-auto"
            style={{ borderColor: '#c56060', color: '#c56060', borderWidth: '1px', borderStyle: 'solid' }}
          >
            <span className="font-extrabold text-xs" style={{ color: '#c56060' }}>✕</span>
            <span>{tr('닫기')}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
        {/* ⚠️ 번역 오류 발생 시 상단 알림 배너 */}
        {translationError && (
          <div className="p-2.5 rounded-xl bg-[#261618] border border-[#c5606055] text-xs text-[#ef9a9a] flex items-center justify-between gap-2 shrink-0 animate-fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">⚠️</span>
              <span className="truncate">{translationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setTranslationError(null)}
              className="text-[10px] text-[#ef9a9a] hover:text-white px-1.5 py-0.5 rounded bg-black/40 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. 상단: 게시글 목록 (새 글이 항상 위로 올라오도록 정렬, 10개씩 페이징, 상하 확장) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pr-1 custom-scrollbar">
          {pageMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8b9bb4] gap-2">
              <span className="text-3xl">📡</span>
              <div className="text-xs font-bold text-[#cfd8e8]">{tr('등록된 차원 메세지가 없습니다.')}</div>
              <div className="text-[11px]">{tr('첫 번째 차원 메세지를 남겨보세요!')}</div>
            </div>
          ) : (
            pageMessages.map((msg) => {
              const isTranslated = !!translatedMap[msg.id];
              const isTranslating = translatingIds.has(msg.id);
              const textToShow = isTranslated ? translatedMap[msg.id] : msg.content;

              return (
                <div
                  key={msg.id}
                  className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537] hover:border-[#c8aa6e55] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3.5 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 1. 가장 왼쪽: 지휘관 아이디(콜사인) - 낮은 채도의 금색 */}
                    <div className="flex items-center gap-1 shrink-0 w-[92px] sm:w-[130px] md:w-[150px]">
                      <span className="text-xs">🎖️</span>
                      <span
                        className="text-xs sm:text-sm font-bold text-[#c8aa6e] truncate block"
                        title={msg.authorName}
                      >
                        {msg.authorName}
                      </span>
                    </div>

                    {/* 2. 중앙: 본문 내용 (최대 100자) 및 번역 태그 */}
                    <div className="flex-1 min-w-0 text-xs sm:text-[13px] text-[#cfd8dc] break-words whitespace-pre-wrap leading-relaxed">
                      <span>{textToShow}</span>
                      {isTranslated && (
                        <span className="inline-block ml-1.5 text-[9.5px] px-1.5 py-0.2 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e33] font-mono font-bold align-middle">
                          🌐 {targetLangLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. 글 끝: 번역 버튼 + 등록 날짜와 시간 스탬프 */}
                  <div className="shrink-0 flex items-center justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleTranslate(msg)}
                      disabled={isTranslating}
                      className={`text-[10.5px] px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                        isTranslated
                          ? 'bg-[#c8aa6e22] text-[#c8aa6e] border-[#c8aa6e66]'
                          : 'bg-[#14161c] border-[#262830] text-[#8b9bb4] hover:text-[#c8aa6e] hover:border-[#c8aa6e]'
                      }`}
                      title={isTranslated ? tr('원문으로 되돌리기') : `${targetLangLabel} ${tr('언어로 번역')}`}
                    >
                      <span>{isTranslating ? '⏳' : isTranslated ? '↩️' : '🌐'}</span>
                      <span>{isTranslating ? '...' : isTranslated ? tr('원문') : tr('번역')}</span>
                    </button>
                    <div className="text-[10px] sm:text-[11px] text-[#8b9bb4] font-mono whitespace-nowrap text-right">
                      {formatTimestamp(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. 중하단: 페이지네이션 (10개 단위) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-[#1e2a3e] shrink-0">
            <button
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#14161c] border border-[#23324d] text-white hover:border-[#c8aa6e] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              disabled={safePage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                SoundManager.getInstance().play('click');
              }}
            >
              {tr('◀ 이전')}
            </button>

            <span className="text-xs font-mono font-bold text-[#c8aa6e] px-2">
              {safePage} / {totalPages}
            </span>

            <button
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#14161c] border border-[#23324d] text-white hover:border-[#c8aa6e] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              disabled={safePage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                SoundManager.getInstance().play('click');
              }}
            >
              {tr('다음 ▶')}
            </button>
          </div>
        )}

        {/* 3. 하단: 100자 글쓰기 카드 (익명 지휘관은 작성 불가 안내) */}
        {isAnonymous ? (
          <div className="p-3 rounded-xl bg-[#1a1424] border border-[#ab47bc44] flex items-center gap-3 shrink-0 shadow-sm animate-fade-in">
            <span className="text-2xl p-2 rounded-xl bg-[#ab47bc22] text-[#ce93d8] shrink-0">🔒</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#ce93d8] flex items-center gap-1.5">
                <span>{tr('차원 메세지 작성 불가 (익명 지휘관)')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ab47bc22] text-[#ce93d8] font-mono font-bold">
                  GUEST
                </span>
              </div>
              <div className="text-[11px] text-[#90a4ae] mt-0.5 leading-relaxed">
                {tr('익명(게스트) 계정은 차원 메세지를 열람할 수만 있으며 글을 작성할 수 없습니다. 소통에 참여하시려면 정식 계정(Google 또는 이메일)으로 로그인해 주세요.')}
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-xl bg-[#12141a] border border-[#23324d] flex flex-col gap-2 shrink-0 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎖️</span>
                <span className="text-xs sm:text-sm font-bold text-[#c8aa6e] truncate max-w-[200px]">
                  {currentNick}
                </span>
                <span className="text-[10px] text-[#8b9bb4]">{tr('지휘관님의 차원 메세지')}</span>
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
                placeholder={tr('다른 차원의 지휘관들에게 남길 교신 메세지를 작성하세요 (최대 100자)')}
                className="flex-1 p-2 rounded-lg bg-[#090b0e] border border-[#1e2a3e] text-white text-xs placeholder-[#50607d] resize-none focus:border-[#c8aa6e] focus:outline-none transition-colors"
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
                    ? 'bg-[#15171e] text-[#50607d] cursor-not-allowed border border-transparent'
                    : 'bg-[#c8aa6e] hover:bg-[#d8bb7f] text-[#1c1408] border border-[#dfc48855] shadow-md shadow-[#c8aa6e22] active:scale-95'
                }`}
              >
                <span>{isSubmitting ? '...' : '✍️'}</span>
                <span>{tr('전송')}</span>
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
      </div>
    </Modal>
  );
};
