import React from 'react';
import { Mercenary } from '../types/game';
import { HeroCard } from './HeroCard';

interface Props {
  party: Mercenary[];
  selectedIndex?: number;
  onSelectHero?: (index: number) => void;
  compact?: boolean;
}

export const PartyStatus: React.FC<Props> = ({ party, selectedIndex, onSelectHero, compact }) => {
  if (party.length === 0) {
    return <div className="panel p-3 text-center text-sm text-[#8b9bb4]">파티에 용병이 없습니다.</div>;
  }

  const POS_ORDER: Record<string, number> = { front: 1, mid: 2, back: 3 };
  const sortedParty = [...party].sort((a, b) => (POS_ORDER[a.position || 'mid'] || 2) - (POS_ORDER[b.position || 'mid'] || 2));

  return (
    <div className="flex flex-col gap-1.5">
      {sortedParty.map((hero, i) => (
        <HeroCard key={hero.id} hero={hero} selected={selectedIndex === i} onClick={() => onSelectHero?.(i)} compact={compact} />
      ))}
    </div>
  );
};
