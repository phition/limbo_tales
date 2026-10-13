import React from 'react';
import { Skill } from '../types/game';
import { GameIcon } from './GameIcon';

interface Props {
  skill: Skill;
  currentMp: number;
  cooldownLeft?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const SkillButton: React.FC<Props> = ({ skill, currentMp, cooldownLeft = 0, onClick, disabled }) => {
  const canUse = currentMp >= skill.manaCost && cooldownLeft === 0 && !disabled;
  return (
    <button
      className={`btn w-full flex-col text-left gap-0.5 py-2 px-3 ${canUse ? 'btn-primary' : 'btn-ghost opacity-50'}`}
      disabled={!canUse} onClick={onClick} style={{ borderRadius: 10 }}
    >
      <div className="flex items-center justify-between w-full">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <GameIcon name={skill.id} icon={skill.icon} size={18} />
          <span>{skill.name}</span>
        </span>
        <span className="text-xs text-blue-300 font-mono">{skill.manaCost} MP</span>
      </div>
      <div className="text-[11px] text-[#8b9bb4] line-clamp-2">{skill.description}</div>
      {cooldownLeft > 0 && <div className="text-[10px] text-[#ff7043]">쿨다운: {cooldownLeft}턴</div>}
    </button>
  );
};
