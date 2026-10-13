import React from 'react';
import { Mercenary, STATUS_EFFECT_META } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { HERO_TRAITS, GameManager } from '../managers/GameManager';
import { GameIcon } from './GameIcon';
import { CustomAssetService } from '../services/CustomAssetService';

interface Props {
  hero: Mercenary;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const GRADE_META: Record<string, { label: string; tag: string; color: string }> = {
  rookie:  { label: 'N', tag: 'N', color: '#9e9e9e' },
  veteran: { label: 'V', tag: 'V', color: '#66bb6a' },
  hero:    { label: 'H', tag: 'H', color: '#00d2ff' },
  elite:   { label: 'H', tag: 'H', color: '#00d2ff' },
  epic:    { label: 'E', tag: 'E', color: '#ce93d8' },
  legend:  { label: 'E', tag: 'E', color: '#ce93d8' },
};

export const HeroCard: React.FC<Props> = ({ hero, selected, onClick, compact }) => {
  const cls = Object.values(CHARACTER_CLASSES).find((c) => c.id === hero.classId);
  const gm = GameManager.getInstance();
  const eff = gm.getHeroEffectiveStats(hero);
  const maxHp = eff.maxHp;
  const maxMp = eff.maxMp;
  const hpPct = Math.max(0, (hero.currentHp / maxHp) * 100);
  const mpPct = Math.max(0, (hero.currentMp / maxMp) * 100);
  const gMeta = GRADE_META[hero.grade] || GRADE_META.rookie;
  const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
    || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
    || (hero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(hero.portraitPromptKey) : undefined)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

  // 🛡️ 체력이 0보다 큰 생존 대원은 절대 사망(grayscale) 처리되지 않도록 엄격 보장
  const isDead = hero.currentHp <= 0;

  return (
    <div
      className={`panel px-2.5 py-1.5 cursor-pointer transition-all ${
        isDead ? 'grayscale opacity-75 bg-[#12141c] border-[#3e4452]' : ''
      } ${selected ? 'border-[#876739] bg-[#211a12]' : ''}`}
      style={selected ? { borderColor: '#876739', boxShadow: '0 0 10px rgba(135, 103, 57, 0.35)' } : {}}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="text-xl shrink-0 flex items-center justify-center">
          {customPortrait ? (
            <img
              src={customPortrait}
              alt={hero.name}
              className="w-7 h-7 object-cover rounded-full border border-[#00d2ff55] shadow-sm"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <GameIcon name={cls?.skills[0]?.id || hero.classId} icon={cls?.skills[0]?.icon ?? '⚔️'} size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {(() => {
            const posMeta = {
              front: { label: '전열', color: '#ef5350' },
              mid:   { label: '중열', color: '#ffd54f' },
              back:  { label: '후열', color: '#42a5f5' },
            }[hero.position || 'mid'];
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-bold text-xs truncate ${isDead ? 'line-through text-[#8b9bb4]' : ''}`}>{hero.name}</span>
                <span className="text-[10px] text-[#00d2ff] font-medium shrink-0">{cls?.name || hero.classId}</span>
                <span className="text-[10px] text-[#ffd54f] font-mono font-bold">Lv.{hero.level}</span>
                {isDead && (
                  <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ef535033] text-[#ef5350] border border-[#ef535066]">
                    💀 전사
                  </span>
                )}
                <span
                  className="text-[9px] px-1 py-0.2 rounded font-bold"
                  style={{ color: posMeta.color, background: `${posMeta.color}18`, border: `1px solid ${posMeta.color}44` }}
                >
                  [{posMeta.label}]
                </span>
                <span
                  className="text-[9px] px-1 py-0.2 rounded font-bold"
                  style={{ color: gMeta.color, background: `${gMeta.color}22`, border: `1px solid ${gMeta.color}44` }}
                >
                  [{gMeta.tag}]
                </span>
                {(hero.trait || hero.title) && (() => {
                  const tKey = hero.trait || hero.title || '';
                  const tInfo = HERO_TRAITS[tKey];
                  return (
                    <span
                      className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] truncate max-w-[120px] cursor-help"
                      title={tInfo ? `✨ ${tInfo.name}: ${tInfo.desc}` : tKey}
                    >
                      {tKey}
                    </span>
                  );
                })()}
                {gm.isHeroAlienated(hero.id) && (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ef535022] text-[#ef5350] border border-[#ef535044] animate-pulse"
                    title="💔 소외감: 다른 두 대원은 유대가 높고 본인만 고립되어 모든 능력치가 10% 감소합니다."
                  >
                    💔 소외감 (-10%)
                  </span>
                )}
              </div>
            );
          })()}
          {!compact && <div className="text-[10px] text-[#8b9bb4]">{cls?.name || hero.classId} Lv.{hero.level}</div>}
          <div className="bar-track mt-0.5" style={{ height: 7 }}><div className="bar-fill-hp h-full" style={{ width: `${hpPct}%` }} /></div>
          <div className="bar-track mt-0.5" style={{ height: 5 }}><div className="bar-fill-mp h-full" style={{ width: `${mpPct}%` }} /></div>
          {hero.statusEffects && hero.statusEffects.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {hero.statusEffects.map((se, idx) => {
                const meta = STATUS_EFFECT_META[se.type] || { icon: '✨', label: se.type, color: '#00d2ff' };
                const effectLabel = se.source || meta.label;
                return (
                  <span
                    key={idx}
                    className="text-[9px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5"
                    style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}55` }}
                    title={`${effectLabel}: 지속 ${se.turnsLeft}턴`}
                  >
                    <GameIcon name={se.type} icon={meta.icon} size={11} className="mr-0.5" />
                    <span>{effectLabel}</span>
                    <span className="opacity-80 font-mono">({se.turnsLeft}T)</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {!compact && (
          <div className="text-right text-[10px] text-[#8b9bb4] shrink-0 font-mono">
            <div>{Math.round(hero.currentHp)}/{Math.round(maxHp)}</div>
            <div className="text-blue-300">{Math.round(hero.currentMp)}/{Math.round(maxMp)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
