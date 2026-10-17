import React from 'react';
import { GameIcon } from './GameIcon';
import { Skill, Mercenary } from '../types/game';
import { useGameManager } from '../hooks/useGameManager';
import {
  getSkillTags,
  getTriggerableCombos,
  getEffectivePositionBonus,
  getTagMeta
} from '../utils/skillComboUtils';

export interface SkillDetailModalProps {
  skill: Skill | null;
  hero?: Mercenary;
  canCast?: boolean;
  onCast?: () => void;
  onClose: () => void;
  gm?: ReturnType<typeof useGameManager>['gm'];
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  hero,
  canCast,
  onCast,
  onClose,
  gm
}) => {
  if (!skill) return null;
  const isBasic = skill.id === 'basic_attack' || skill.id === 'basic';
  const effectivePos = skill.positionBonus || getEffectivePositionBonus(skill);
  const posLabel = effectivePos === 'front' ? '전열 특화' : effectivePos === 'back' ? '후열 저격' : effectivePos === 'any' ? '전/후열 대응' : null;
  const posColor = effectivePos === 'front' ? '#ef5350' : effectivePos === 'back' ? '#42a5f5' : '#ab47bc';

  const targetLabel = skill.targetType === 'all_enemies' ? '적 전체 (광역)'
    : skill.targetType === 'single_enemy' ? '단일 적'
    : skill.targetType === 'all_allies' ? '아군 전체'
    : skill.targetType === 'single_ally' ? '단일 아군'
    : skill.targetType === 'self' ? '자신 (시전자)'
    : '단일 대상';

  const actualMpCost = gm ? gm.getSkillManaCost(skill.manaCost, undefined, hero) : skill.manaCost;
  const tags = getSkillTags(skill);
  const combos = getTriggerableCombos(skill);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative panel-accent w-full max-w-[380px] p-4 bg-[#0d1424] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#11192e] border border-[#22324f] flex items-center justify-center">
              <GameIcon name={skill.id} icon={skill.icon || '⚔️'} size={28} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white">{skill.name}</span>
                {skill.isSpecial && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                    {skill.name.includes('[궁극기]') ? '궁극기' : '고유기'}
                  </span>
                )}
                {skill.isUnique && <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ce93d822] text-[#ce93d8] border border-[#ce93d844]">보스 신화</span>}
              </div>
              <div className="text-[11px] text-[#8b9bb4]">
                {isBasic ? '기초 물리 타격' : `${hero ? `${hero.name}의 ` : ''}전투 기술`}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost text-xs px-2 py-1 text-[#8b9bb4] hover:text-white" onClick={onClose}>✕</button>
        </div>

        {/* 🏷️ 스킬 특성 태그 뱃지 바 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map(t => (
            <span
              key={t.id}
              className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">마나 소모</span>
            <span className="text-xs font-bold text-[#64b5f6]">{actualMpCost} MP</span>
            {gm && (gm.dungeonFloor || 1) > 1 && skill.manaCost > 0 && (
              <span className="text-[9px] text-[#ff7043] block">({gm.dungeonFloor}F +{(gm.dungeonFloor - 1) * 10}%)</span>
            )}
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">쿨다운</span>
            <span className="text-xs font-bold text-[#ffd54f]">{skill.cooldown || 0}턴</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">위력 계수</span>
            <span className="text-xs font-bold text-[#38ef7d]">{Math.round((skill.power || 1.0) * 100)}%</span>
            {(() => {
              const baseSkill = gm?.resolveSkillData(skill.id, 1);
              const basePowerPct = Math.round((baseSkill?.power || 1.0) * 100);
              const curPowerPct = Math.round((skill.power || 1.0) * 100);
              return curPowerPct !== basePowerPct ? (
                <span className="text-[8px] text-[#ffd54f] font-mono block">(초기 {basePowerPct}%)</span>
              ) : null;
            })()}
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">대상</span>
            <span className="text-[10px] font-bold text-[#cfd8dc] truncate block">{targetLabel}</span>
          </div>
        </div>

        {effectivePos && (
          <div className="p-2 rounded-lg bg-[#162035] border text-xs flex items-center justify-between" style={{ borderColor: `${posColor}44` }}>
            <span className="font-bold flex items-center gap-1" style={{ color: posColor }}>
              <span>📍 포지션 특화:</span>
              <span>[{posLabel}]</span>
            </span>
            <span className="text-[10px] text-[#90a4ae]">
              {effectivePos === 'front' ? '전열 타격 시 +25% & 보호막 연계' : effectivePos === 'back' ? '후열 저격 시 +20% & 치명타' : '전열/후열 대응'}
            </span>
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-[#c8aa6e]">📖 스킬 상세 효과</div>
          <div className="text-xs text-[#cfd8dc] leading-relaxed whitespace-pre-line">{skill.description}</div>
        </div>

        {/* ⚡ 상태이상 연계 콤보 안내 섹션 */}
        {combos.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#13151b] border border-[#c8aa6e33] flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-[#ffd54f] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>⚡ 상태이상 연계 메커니즘</span>
              </span>
              <span className="text-[9px] text-[#8b9bb4] font-normal">적 상태이상 시 발동</span>
            </div>
            <div className="flex flex-col gap-1">
              {combos.map(c => (
                <div key={c.comboName} className="text-xs p-2 rounded-lg bg-[#0b101b] border border-[#1d273a] flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1">
                      <span>{c.icon}</span>
                      <span>{c.comboName}</span>
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                      style={{ backgroundColor: `${c.bannerColor}18`, color: c.bannerColor, border: `1px solid ${c.bannerColor}44` }}
                    >
                      필요 적 상태: {c.triggerStatus}
                    </span>
                  </div>
                  {/* 연계 스킬 태그 뱃지 */}
                  <div className="flex items-center gap-1 flex-wrap text-[9px]">
                    <span className="text-[#8b9bb4]">연계 스킬 태그:</span>
                    {c.requiredTagIds.map(tId => {
                      const tMeta = getTagMeta(tId);
                      return (
                        <span
                          key={tId}
                          className="px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5"
                          style={{ backgroundColor: tMeta.bg, color: tMeta.text, border: `1px solid ${tMeta.border}` }}
                        >
                          <span>{tMeta.icon}</span>
                          <span>{tMeta.label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#cfd8dc] leading-snug">{c.fullDesc}</div>
                </div>
              ))}
            </div>
            {/* 💡 연계 메커니즘 안내 팁 */}
            <div className="p-2 rounded bg-[#0a1220] border border-[#223652] text-[10px] text-[#90caf9] flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span>
                적에게 해당 상태이상이 걸려 있을 때 일치하는 태그 스킬로 공격하면 연계 콤보가 폭발합니다.
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={onClose}>닫기</button>
          {onCast && (
            <button
              className="btn btn-primary text-xs px-4 py-1.5"
              disabled={!canCast}
              onClick={() => {
                onCast();
                onClose();
              }}
            >
              시전하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
