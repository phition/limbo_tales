import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types/game';
import { useI18n } from '../hooks/useI18n';
import { GameIcon } from './GameIcon';

const LOG_ICON_MAP: Record<string, string> = {
  // 6대 기본 자원
  '🪙': 'gold',
  '✨': 'ether',
  '🪵': 'wood',
  '🪨': 'stone',
  '⚙️': 'iron',
  '⚙': 'iron',
  '🍖': 'food',
  '🌾': 'food',
  // 던전 파밍 재료 (5종)
  '🌿': 'herb',
  '🥋': 'leather',
  '🧱': 'leather',
  '🧵': 'silk',
  '🕸️': 'silk',
  '🕸': 'silk',
  '⚫': 'coal',
  '⬛': 'coal',
  '🦴': 'bone',
  // 심연 희귀 유물 및 인챈트석
  '💎': 'crystal',
  '🔮': 'crystal',
  '🌌': 'void_shard',
  '💠': 'void_shard',
  '🌑': 'dark_essence',
  '⭐': 'prefix_stone',
  '🌟': 'pure_prefix_stone',
  '🪐': 'pure_suffix_stone',
  // 10대 보스 신화 유물
  '🖤': 'relic_floor_1',
  '👻': 'relic_floor_2',
  '🫀': 'relic_floor_3',
  '⚓': 'relic_floor_4',
  '👁️': 'relic_floor_5',
  '👁': 'relic_floor_5',
  '🍷': 'relic_floor_6',
  '🎖️': 'relic_floor_8',
  '🎖': 'relic_floor_8',
  '🪞': 'relic_floor_9',
  // 보급품 및 던전 아이템
  '🩹': 'bandage',
  '🕯️': 'torch',
  '🕯': 'torch',
  '🔥': 'bonfire',
  '⛏️': 'pickaxe',
  '⛏': 'pickaxe',
  '🧪': 'holy_water',
  '💧': 'holy_water',
  '🗝️': 'skeleton_key',
  '🗝': 'skeleton_key',
  '🧭': 'compass',
  '🍱': 'enhanced_food',
  // 영지 및 기타
  '🏛️': 'cabin',
  '🏛': 'cabin',
  '👑': 'crown',
  '💀': 'skull_key',
  '📜': 'scroll',
  '⚔️': 'vanguard',
  '⚔': 'vanguard',
  '🛡️': 'paladin',
  '🛡': 'paladin',
};

const EMOJI_REGEX_STR = Object.keys(LOG_ICON_MAP)
  .sort((a, b) => b.length - a.length)
  .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const TOKEN_REGEX = new RegExp(
  `(\\[[^\\]]+\\]|-[0-9]+(?:,[0-9]{3})*(?:\\.[0-9]+)?(?:[a-zA-Z가-힣%]+)?|\\+[0-9]+(?:,[0-9]{3})*(?:\\.[0-9]+)?(?:[a-zA-Z가-힣%]+)?|💨\\s*\\[[^\\]]+\\]\\s*회피(?:\\(EVADE\\))?|💨\\s*회피(?:\\(EVADE\\))?|💨\\s*빗나감(?:\\(MISS\\))?|\\(보호막\\s*[0-9,]+\\s*(?:흡수)?\\)|\\(방어력\\s*차단\\)|\\bEVADE\\b|\\bMISS\\b|\\||➔|→|${EMOJI_REGEX_STR})`,
  'g'
);

interface Props {
  logs: LogEntry[];
  maxHeight?: number;
  emptyMessage?: string;
  isBattle?: boolean;
}

export const LogPanel: React.FC<Props> = ({
  logs,
  maxHeight = 270,
  emptyMessage = '기록된 로그가 없습니다.',
  isBattle = false,
}) => {
  const { tr, lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const prevLastLogIdRef = useRef<string>('');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  // 최하단 위치 판정 헬퍼 (45px 여유 허용)
  const checkIfAtBottom = (el: HTMLElement) => {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 45;
  };

  // 최하단으로 스크롤 이동
  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
      userScrolledUpRef.current = false;
      setShowScrollBottomBtn(false);
    }
  };

  // 스크롤 이벤트 감지: 스크롤 위치가 바닥에 도달하면 수동 스크롤 상태 자동 해제
  const handleScroll = () => {
    if (!containerRef.current) return;
    const isAtBottom = checkIfAtBottom(containerRef.current);
    if (isAtBottom) {
      userScrolledUpRef.current = false;
      setShowScrollBottomBtn(false);
    }
  };

  // 유저의 실제 입력(휠 / 터치) 명시적 감지 이벤트 리스너 등록
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < -1) {
        // 위로 휠 조작 -> 유저가 과거 로그를 확인 중임을 명확히 기록
        userScrolledUpRef.current = true;
        setShowScrollBottomBtn(true);
      } else if (e.deltaY > 1) {
        // 아래로 휠 조작 -> 바닥에 근접하면 수동 모드 해제
        if (checkIfAtBottom(el)) {
          userScrolledUpRef.current = false;
          setShowScrollBottomBtn(false);
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartYRef.current;
      if (diff > 8) {
        // 손가락을 아래로 끌어내림 -> 위쪽 과거 로그를 보려고 함
        userScrolledUpRef.current = true;
        setShowScrollBottomBtn(true);
      } else if (diff < -8 && checkIfAtBottom(el)) {
        // 아래로 밀어올림 -> 최하단 도착 시 수동 모드 해제
        userScrolledUpRef.current = false;
        setShowScrollBottomBtn(false);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // 로그 변경 시 스마트 스크롤 처리
  useEffect(() => {
    if (!containerRef.current) return;

    const currentLastLogId = logs.length > 0 ? logs[logs.length - 1].id : '';
    const isNewLogAdded = logs.length > 0 && currentLastLogId !== prevLastLogIdRef.current;
    const isInitialRender = prevLastLogIdRef.current === '';

    prevLastLogIdRef.current = currentLastLogId;

    if (isInitialRender) {
      // 초기 로딩 시 최하단으로 즉시 스크롤
      userScrolledUpRef.current = false;
      setShowScrollBottomBtn(false);
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
      return;
    }

    // 신규 로그가 추가되었거나 렌더링 변경 시
    if (isNewLogAdded) {
      if (!userScrolledUpRef.current) {
        // 유저가 수동으로 위를 보고 있지 않다면 최신 로그로 항상 신속하게 자동 스크롤
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
        setTimeout(() => {
          if (containerRef.current && !userScrolledUpRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 0);
      } else {
        // 유저가 직접 과거 로그를 확인 중일 때만 "최신 로그 알림 버튼" 표시
        setShowScrollBottomBtn(true);
      }
    }
  }, [logs]);

  const getLogClass = (type: LogEntry['type']) => {
    const map: Record<string, string> = {
      normal: 'log-normal', reward: 'log-reward', danger: 'log-danger',
      story: 'log-story', system: 'log-system',
      bonfire0: 'log-bonfire0', bonfire1: 'log-bonfire1', bonfire2: 'log-bonfire2',
      bonfire3: 'log-bonfire3', bonfire4: 'log-bonfire4', bonfire5: 'log-bonfire5',
      bonfire_extend: 'log-bonfire_extend',
    };
    return map[type] ?? 'log-normal';
  };

  const renderFormattedLogText = (text: string): React.ReactNode => {
    if (!text) return null;

    // Split regex to extract brackets, damages, upkeep costs, status icons, absorbs, separators, and resource emojis
    const parts = text.split(TOKEN_REGEX);

    return parts.map((part, idx) => {
      if (!part) return null;

      // 1. Bracketed tags
      if (part.startsWith('[') && part.endsWith(']')) {
        const content = part.slice(1, -1);

        // Special System / Quest / Upkeep tags
        if (content.includes('심연 정화') || content.includes('深淵浄化') || content.includes('Abyssal Purification')) {
          return (
            <span key={idx} className="font-bold text-[#38ef7d] bg-[#38ef7d22] px-1.5 py-0.5 rounded border border-[#38ef7d55] text-[11px] sm:text-xs mx-0.5 inline-flex items-center gap-1">
              <GameIcon name="abyss_purify" icon="✨" size={13} />
              <span>{part}</span>
            </span>
          );
        }
        if (content.includes('유지비 체납') || content.includes('Upkeep Arrears') || content.includes('維持費滞納')) {
          return (
            <span key={idx} className="font-extrabold text-[#ff4d4f] bg-[#ff4d4f22] px-1.5 py-0.5 rounded border border-[#ff4d4f55] text-[11px] sm:text-xs mx-0.5 inline-block animate-pulse">
              {part}
            </span>
          );
        }
        if (content.includes('시설 복구') || content.includes('Facility Restored') || content.includes('施設復旧')) {
          return (
            <span key={idx} className="font-bold text-[#38ef7d] bg-[#38ef7d22] px-1.5 py-0.5 rounded border border-[#38ef7d55] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        if (content.includes('퀘스트 보상 수령') || content.includes('Quest Reward Claimed') || content.includes('クエスト報酬受取完了')) {
          return (
            <span key={idx} className="font-bold text-[#ffd54f] bg-[#ffd54f22] px-1.5 py-0.5 rounded border border-[#ffd54f55] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }

        // Block / Guard
        if (content === 'Block!' || content.includes('Block') || content.includes('Guard') || content.includes('수호') || content.includes('엄호') || content.includes('ガード')) {
          return (
            <span key={idx} className="font-bold text-[#60a5fa] bg-[#1e3a8a33] px-1 py-0.5 rounded border border-[#2563eb44] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Critical
        if (content.includes('치명타') || content.includes('치명') || content.includes('CRIT') || content.includes('Critical') || content.includes('会心') || content.includes('クリティカル')) {
          return (
            <span key={idx} className="font-extrabold text-[#f87171] bg-[#7f1d1d33] px-1 py-0.5 rounded border border-[#dc262644] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Burn
        if (content.includes('화상') || content.includes('Burn') || content.includes('火傷')) {
          return (
            <span key={idx} className="font-bold text-[#fb923c] bg-[#7c2d1233] px-1 py-0.5 rounded border border-[#ea580c44] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Bleed
        if (content.includes('출혈') || content.includes('Bleed') || content.includes('出血')) {
          return (
            <span key={idx} className="font-bold text-[#f472b6] bg-[#83184333] px-1 py-0.5 rounded border border-[#db277744] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Stun
        if (content.includes('기절') || content.includes('Stun') || content.includes('気絶')) {
          return (
            <span key={idx} className="font-bold text-[#facc15] bg-[#713f1233] px-1 py-0.5 rounded border border-[#ca8a0444] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Poison
        if (content.includes('독') || content.includes('맹독') || content.includes('중독') || content.includes('Poison') || content.includes('毒') || content.includes('猛毒')) {
          return (
            <span key={idx} className="font-bold text-[#a3e635] bg-[#36531433] px-1 py-0.5 rounded border border-[#65a30d44] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Freeze / Chill / Frostbite
        if (content.includes('동결') || content.includes('빙결') || content.includes('냉각') || content.includes('동상') || content.includes('결빙') || content.includes('Freeze') || content.includes('Frostbite') || content.includes('Chill') || content.includes('凍結') || content.includes('氷結') || content.includes('凍傷')) {
          return (
            <span key={idx} className="font-bold text-[#dfc488] bg-[#0c4a6e33] px-1 py-0.5 rounded border border-[#0284c744] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Status - Blind
        if (content.includes('실명') || content.includes('Blind') || content.includes('暗闇') || content.includes('盲目')) {
          return (
            <span key={idx} className="font-bold text-[#c084fc] bg-[#581c8733] px-1 py-0.5 rounded border border-[#9333ea44] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Buff / Immunity / Resist
        if (content.includes('면역') || content.includes('저항') || content.includes('사선의 맹세') || content.includes('Immune') || content.includes('Resist') || content.includes('Oath') || content.includes('免疫') || content.includes('抵抗')) {
          return (
            <span key={idx} className="font-bold text-[#34d399] bg-[#064e3b33] px-1 py-0.5 rounded border border-[#05966944] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }
        // Counter
        if (content.includes('반격') || content.includes('Counter') || content.includes('反撃')) {
          return (
            <span key={idx} className="font-bold text-[#fde047] bg-[#854d0e33] px-1 py-0.5 rounded border border-[#eab30844] text-[11px] sm:text-xs mx-0.5 inline-block">
              {part}
            </span>
          );
        }

        // Default Bracket (e.g. [용병이름] or [스킬명])
        return (
          <span key={idx} className="font-bold text-[#93c5fd] bg-[#1e293b66] px-1 py-0.2 rounded border border-[#33415566] text-[11px] sm:text-xs mx-0.5 inline-block">
            {part}
          </span>
        );
      }

      // 2. Evasion / Miss
      if (part.includes('회피') || part.includes('빗나감') || part === 'EVADE' || part === 'MISS') {
        return (
          <span key={idx} className="font-bold text-[#34d399] bg-[#064e3b33] px-1 py-0.5 rounded border border-[#05966944] text-[11px] sm:text-xs mx-0.5 inline-block">
            {part}
          </span>
        );
      }

      // 3. Shield Absorb / Def Block
      if (part.startsWith('(') && (part.includes('보호막') || part.includes('방어력 차단'))) {
        return (
          <span key={idx} className="font-bold text-[#60a5fa] font-mono text-xs mx-0.5">
            {part}
          </span>
        );
      }

      // 4. Damage / Cost / Upkeep (-[숫자,콤마])
      if (/^-[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?/.test(part)) {
        return (
          <span key={idx} className="font-extrabold text-[#f87171] font-mono text-xs sm:text-sm mx-0.5">
            {part}
          </span>
        );
      }

      // 5. Positive / Healing / Production (+[숫자,콤마])
      if (/^\+[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?/.test(part)) {
        return (
          <span key={idx} className="font-extrabold text-[#4ade80] font-mono text-xs sm:text-sm mx-0.5">
            {part}
          </span>
        );
      }

      // 6. Separator (|)
      if (part === '|') {
        return (
          <span key={idx} className="text-[#64748b] font-bold mx-1.5 opacity-80">
            |
          </span>
        );
      }

      // 7. Arrow (➔, →)
      if (part === '➔' || part === '→') {
        return (
          <span key={idx} className="text-[#64748b] font-bold mx-1">
            {part}
          </span>
        );
      }

      // 8. Custom GameIcon for resource/currency/supplies/building emojis
      const cleanPart = part.replace(/\uFE0F/g, '');
      const iconKey = LOG_ICON_MAP[part] || LOG_ICON_MAP[cleanPart];
      if (iconKey) {
        return (
          <GameIcon
            key={idx}
            name={iconKey}
            icon={part}
            size={14}
            className="inline-block align-middle mx-0.5 -mt-0.5 shrink-0"
          />
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="panel overflow-y-auto px-3 py-2 text-sm leading-relaxed flex-1 min-h-0"
        style={{ maxHeight, minHeight: 90 }}
      >
        {logs.length === 0 ? (
          <div className="text-xs text-[#8b9bb4] italic py-2 text-center">
            {tr(emptyMessage)}
          </div>
        ) : (
          (() => {
            const effectiveIsBattle = isBattle || logs.some(l => l.category === 'battle');

            return logs.map((log) => {
              // 🚩 1) 라운드 구분선 렌더링 (type === 'round_divider' 또는 텍스트에 라운드 표기가 포함된 경우)
              const isRoundDivider = log.type === 'round_divider' ||
                (log.category === 'battle' && /^(?:━+|─+|\s)*🚩\s*(?:라운드\s*[0-9]+|[0-9]+\s*라운드|Round\s*[0-9]+)/i.test(log.text.trim()));

              if (isRoundDivider) {
                const roundMatch = log.text.match(/([0-9]+)\s*(?:라운드|round)/i) || log.text.match(/(?:라운드|round)\s*([0-9]+)/i);
                const roundNum = log.round ?? (roundMatch ? parseInt(roundMatch[1], 10) : 1);
                return (
                  <div key={log.id} className="flex items-center gap-2 my-2.5 py-0.5 first:mt-0 select-none w-full min-w-0">
                    <div className="h-[1px] flex-1 min-w-[8px] bg-gradient-to-r from-transparent via-[#ffd54f55] to-[#ffd54f99]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#ffd54f] px-3 py-0.5 rounded-full bg-[#ffd54f18] border border-[#ffd54f55] shadow-sm flex items-center gap-1.5 shrink-0">
                      <span>🚩</span>
                      <span>{roundNum}{lang === 'ko' ? '라운드' : lang === 'ja' ? 'ラウンド' : ' Round'}</span>
                    </span>
                    <div className="h-[1px] flex-1 min-w-[8px] bg-gradient-to-l from-transparent via-[#ffd54f55] to-[#ffd54f99]" />
                  </div>
                );
              }

              // ⏳ 2) 턴 구분선 렌더링 (type === 'turn_divider' 또는 텍스트에 턴 구분자 패턴이 포함된 경우)
              const isTurnDivider = log.type === 'turn_divider' ||
                (log.category === 'battle' && /^(?:─+|━+|\s)*⏳\s*.*턴/i.test(log.text.trim()));

              if (isTurnDivider) {
                // 주인 이름 및 턴 번호 추출
                const turnMatch = log.text.match(/([0-9]+)\s*턴/i);
                const turnNum = log.turn ?? (turnMatch ? parseInt(turnMatch[1], 10) : 1);
                const actorMatch = log.text.match(/\[(.*?)\]/);
                const actorName = log.actorName || (actorMatch ? actorMatch[1] : '행동자');

                return (
                  <div key={log.id} className="flex items-center gap-2 my-1.5 py-0.5 select-none w-full min-w-0">
                    <div className="h-[1px] flex-1 min-w-[8px] bg-gradient-to-r from-transparent via-[#c8aa6e33] to-[#c8aa6e66]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#c8aa6e] px-2.5 py-0.5 rounded-full bg-[#c8aa6e14] border border-[#c8aa6e3a] shadow-sm flex items-center gap-1.5 shrink-0 max-w-[85%] min-w-0">
                      <span>⏳</span>
                      <span className="truncate max-w-[130px] sm:max-w-[200px] text-white font-medium">{tr(actorName)}</span>
                      <span className="text-[#80d8ff] font-mono text-[9px] sm:text-[10px] shrink-0">({turnNum}{lang === 'ko' ? '턴' : lang === 'ja' ? 'ターン' : 'T'})</span>
                    </span>
                    <div className="h-[1px] flex-1 min-w-[8px] bg-gradient-to-l from-transparent via-[#c8aa6e33] to-[#c8aa6e66]" />
                  </div>
                );
              }

              return (
                <div key={log.id} className={`${getLogClass(log.type)} mb-1 flex items-start flex-wrap`}>
                  {!effectiveIsBattle && (
                    <span className="text-[#4a5568] font-mono text-xs mr-2 shrink-0">{log.timestamp}</span>
                  )}
                  <div className="flex-1 min-w-0 leading-normal break-words overflow-hidden text-[11px] sm:text-xs md:text-sm">{renderFormattedLogText(tr(log.text))}</div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* 위로 스크롤 중 새로운 로그가 들어왔을 때 유저에게 알리고 즉시 최신으로 이동시키는 플로팅 버튼 */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-2 right-3 z-20 px-2.5 py-1 rounded-full text-xs font-bold bg-[#5c4524] hover:bg-[#6e522b] text-[#f3e5c8] border border-[#876739] shadow-lg shadow-black/50 transition-all flex items-center gap-1 animate-bounce"
        >
          <span>⬇️</span>
          <span>{tr('최신 로그 보기')}</span>
        </button>
      )}
    </div>
  );
};
