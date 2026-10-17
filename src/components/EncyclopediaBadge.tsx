import React from 'react';
import { GameManager } from '../managers/GameManager';
import { EncyclopediaCategory } from './EncyclopediaModal';
import { SoundManager } from '../managers/SoundManager';

interface Props {
  query?: string;
  tab?: EncyclopediaCategory;
  label?: string;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export const EncyclopediaBadge: React.FC<Props> = ({
  query = '',
  tab = 'all',
  label = '백과사전',
  showLabel = false,
  compact = false,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      SoundManager.getInstance().play('click');
    } catch (_) {}
    GameManager.getInstance().openEncyclopedia(query, tab);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`[${label}] 관련 백과사전 공략 열기 (검색: ${query})`}
      aria-label={`[${label}] 백과사전 열기`}
      className={`inline-flex items-center justify-center p-1 px-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer select-none bg-[#c8aa6e14] hover:bg-[#c8aa6e25] text-[#c8aa6e] border-[#c8aa6e44] hover:border-[#c8aa6eaa] shadow-[0_0_8px_rgba(200, 170, 110,0.15)] active:scale-95 ${className}`}
    >
      <span className="text-xs select-none">📖</span>
      {showLabel && <span className="ml-1 text-[10.5px]">{label}</span>}
    </button>
  );
};
