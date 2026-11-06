import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { parsePassiveSkill } from '../utils/skillComboUtils';

export interface PassiveSkillCardProps {
  passiveDesc?: string;
  className?: string;
  compact?: boolean;
}

/**
 * 용병의 직업 고유 패시브 스킬 카드 컴포넌트
 * - compact: 방랑자 라운지 모험가 리스트 카드용 간결한 1줄 표기
 * - 기본: 원정단 편성, 스킬 관리, 용병 관리 등 모달/상세용 카드 뷰
 */
export const PassiveSkillCard: React.FC<PassiveSkillCardProps> = ({
  passiveDesc,
  className = '',
  compact = false,
}) => {
  const { tr } = useI18n();
  if (!passiveDesc) return null;

  const { name, desc } = parsePassiveSkill(passiveDesc, '직업 고유 패시브', tr);

  if (compact) {
    return (
      <div className={`text-[11px] text-[#90caf9] mt-0.5 truncate flex items-center gap-1.5 ${className}`}>
        <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff44] shrink-0 font-mono">
          🌟 {tr('패시브')}
        </span>
        <strong className="text-white truncate">[{name}]</strong>
        <span className="text-[10.5px] text-[#8b9bb4] truncate hidden sm:inline">{desc}</span>
      </div>
    );
  }

  return (
    <div className={`p-2.5 rounded-xl bg-[#0e1726] border border-[#00d2ff44] flex items-center justify-between shadow-xs ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-6 h-6 rounded-md bg-[#00d2ff18] border border-[#00d2ff44] flex items-center justify-center shrink-0 text-sm">
          🌟
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold border border-[#00d2ff44]">
              {tr('고유 패시브')}
            </span>
            <span className="font-bold text-xs text-white truncate">{name}</span>
          </div>
          <div className="text-[10px] text-[#90caf9] mt-0.5 leading-relaxed">{desc}</div>
        </div>
      </div>
      <span className="text-[9px] text-[#80deea] font-mono shrink-0 ml-1 px-1.5 py-0.5 rounded bg-[#00d2ff11] border border-[#00d2ff33] font-bold">
        {tr('상시 지속')}
      </span>
    </div>
  );
};
