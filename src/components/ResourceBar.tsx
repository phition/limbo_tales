import React, { useState, useEffect } from 'react';
import { GameResources } from '../types/game';
import { GameManager } from '../managers/GameManager';
import { GameIcon } from './GameIcon';
import { useI18n } from '../hooks/useI18n';
import { formatDuration } from '../utils/timeUtils';

interface Props {
  resources: GameResources;
  bonfireStacks: number;
  bonfireWarmthTime: number;
  onOpenMenu?: () => void;
}

const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙', wood: '🪵', stone: '🪨', iron: '⚙️',
  food: '🍖', ether: '✨',
};

export const ResourceBar: React.FC<Props> = ({
  resources,
  bonfireStacks,
  bonfireWarmthTime,
  onOpenMenu
}) => {
  const { tr, lang } = useI18n();
  const [upkeepTicker, setUpkeepTicker] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const gm = GameManager.getInstance();
    const handleUpkeepPaid = (data: unknown) => {
      const payload = data as { message?: string; paidParts?: string[] };
      const text = payload?.message || '유지비가 결제되었습니다.';
      const newId = Date.now();
      setUpkeepTicker({ id: newId, text });

      setTimeout(() => {
        setUpkeepTicker(prev => (prev?.id === newId ? null : prev));
      }, 4200);
    };

    gm.on('upkeepPaid', handleUpkeepPaid);
    return () => {
      gm.off('upkeepPaid', handleUpkeepPaid);
    };
  }, []);

  const mainResources = [
    { key: 'gold', val: resources.gold },
    { key: 'wood', val: resources.wood },
    { key: 'stone', val: resources.stone },
    { key: 'iron', val: resources.iron },
    { key: 'food', val: resources.food },
    { key: 'ether', val: resources.ether },
  ];
  const fmt = (n: number) => {
    if (n >= 1_000_000_000) {
      return `${(n / 1_000_000_000).toFixed(2)}B`;
    }
    if (n >= 1_000_000) {
      const inM = n / 1_000_000;
      return `${inM >= 10 ? inM.toFixed(1) : inM.toFixed(2)}M`;
    }
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  };

  const bonfireTooltip = bonfireWarmthTime > 0
    ? `🔥 ${tr('방주의 성화 온기 유지 중')} (${tr('남은 시간')}: ${formatDuration(bonfireWarmthTime, lang)})`
    : '';
  const menuTooltip = tr('시스템 메뉴 & 도움말 열기');

  return (
    <div id="global-resource-bar" className="relative flex items-center justify-between px-3 py-1.5 bg-[#0c0f17] border-b border-[#1f2738] shrink-0 z-20 w-full overflow-hidden">
      {/* 🌟 유지비 결제 시 상단 자원바 위로 스르륵 흘러지나가는 티커 알림 */}
      {upkeepTicker && (
        <div
          key={upkeepTicker.id}
          className="absolute inset-0 bg-[#0c0f17f2] backdrop-blur-md flex items-center justify-center px-4 z-30 pointer-events-none overflow-hidden animate-upkeep-banner border-b border-[#ffd54f55]"
        >
          <div className="flex items-center gap-1.5 text-xs text-[#ffd54f] font-bold tracking-wide text-center truncate max-w-full shadow-sm">
            <span className="text-sm shrink-0">🏢</span>
            <span className="truncate">{tr(upkeepTicker.text)}</span>
          </div>
        </div>
      )}

      {/* 좌측: 주요 자원 목록 */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0 overflow-x-auto no-scrollbar py-0.5">
        {mainResources.map(({ key, val }) => (
          <span
            key={key}
            className="flex items-center gap-0.5 text-[11px] sm:text-xs font-mono text-[#cfd8e8] shrink-0 select-none cursor-default"
            title={`${GameManager.getResourceMeta(key as any)?.name || key}: ${val.toLocaleString()}`}
          >
            <GameIcon name={key} icon={RESOURCE_ICONS[key]} size={13} className="shrink-0" />
            <span>{fmt(val)}</span>
          </span>
        ))}
      </div>

      {/* 우측: 성화 온기 + 햄버거 메뉴 버튼 */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {bonfireWarmthTime > 0 && (
          <span
            className={`text-sm flex items-center justify-center bg-[#ffd54f15] px-1.5 py-0.5 rounded border border-[#ffd54f33] transition-all select-none cursor-help ${
              bonfireWarmthTime <= 60
                ? 'animate-flame-warn border-[#ff704388] text-[#ff7043]'
                : 'drop-shadow-[0_0_4px_rgba(255,213,79,0.6)] text-[#ffd54f]'
            }`}
            title={bonfireTooltip}
          >
            <GameIcon name="bonfire" icon="🔥" size={13} />
          </span>
        )}

        {/* 가장 오른쪽 햄버거 메뉴 버튼 */}
        <button
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141a29] border border-[#27354d] text-white hover:border-[#c8aa6e] hover:text-[#c8aa6e] active:scale-95 transition-all text-sm shadow-sm cursor-pointer ml-0.5"
          onClick={onOpenMenu}
          title={menuTooltip}
        >
          ☰
        </button>
      </div>
    </div>
  );
};

