import React from 'react';
import { Mercenary, STATUS_EFFECT_META } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { GameManager, HERO_TRAITS } from '../managers/GameManager';
import { GameIcon } from './GameIcon';
import { CustomAssetService } from '../services/CustomAssetService';
import { getHeroEquippedBossSet, getWeaponTrait, getEquipmentTemplateId } from '../data/equipment';
import { getRarityBorderStyle } from '../utils/rarity';

interface Props {
  hero: Mercenary | null;
  gm: GameManager;
  onClose: () => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const HeroDetailModal: React.FC<Props> = ({ hero, gm, onClose }) => {
  if (!hero) return null;
  const stats = gm.getHeroEffectiveStats(hero);
  const hpPct = clamp((hero.currentHp / stats.maxHp) * 100, 0, 100);
  const mpPct = clamp((hero.currentMp / stats.maxMp) * 100, 0, 100);
  const posLabel = hero.position === 'front' ? '전열' : hero.position === 'back' ? '후열' : '중열';
  const posColor = hero.position === 'front' ? '#ef5350' : hero.position === 'back' ? '#42a5f5' : '#ffd54f';

  const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === hero.classId);
  const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
    || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative panel-accent w-full max-w-[440px] p-4 bg-[#0d1424] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-scale-up max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2.5">
          <div className="flex items-center gap-2">
            {customPortrait ? (
              <img
                src={customPortrait}
                alt={hero.name}
                className="w-11 h-11 object-cover rounded-xl border border-[#00d2ff55] shadow-md shrink-0"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <span className="p-1.5 rounded-lg bg-[#11192e] border border-[#22324f] flex items-center justify-center">
                <GameIcon name={cls?.skills[0]?.id || hero.classId} icon={cls?.skills[0]?.icon ?? '⚔️'} size={24} />
              </span>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white">{hero.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]">
                  {hero.grade}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold" style={{ background: `${posColor}22`, color: posColor, border: `1px solid ${posColor}44` }}>
                  [{posLabel}]
                </span>
                {gm.isHeroAlienated(hero.id) && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ef535022] text-[#ef5350] border border-[#ef535044] animate-pulse">
                    소외감 (-10%)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8b9bb4]">
                {cls?.name || hero.classId} • Lv.{hero.level}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost text-xs px-2 py-1 hover:bg-[#c560601f]" style={{ borderColor: '#c56060', color: '#c56060' }} onClick={onClose}>
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>

        {/* 소외감 경고 배너 */}
        {gm.isHeroAlienated(hero.id) && (
          <div className="p-2 rounded-lg bg-[#ef535015] border border-[#ef535044] flex items-center gap-2 text-[11px] text-[#ff8a80]">
            <span className="text-base shrink-0">💔</span>
            <div>
              <span className="font-bold">대원 간 소외감 상태:</span> 다른 두 대원은 유대가 깊고 본인만 고립되어 모든 능력치가 10% 감소합니다.
            </div>
          </div>
        )}

        {/* 체력 & 마나 바 */}
        <div className="flex flex-col gap-1.5 font-mono">
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#8b9bb4]">체력 (HP)</span>
              <span className="font-bold text-[#ef5350]">{Math.round(hero.currentHp)} / {Math.round(stats.maxHp)} ({Math.round(hpPct)}%)</span>
            </div>
            <div className="bar-track h-2 bg-[#11192e] rounded-full overflow-hidden">
              <div className="bar-fill-hp h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#8b9bb4]">마나 (MP)</span>
              <span className="font-bold text-[#42a5f5]">{Math.round(hero.currentMp)} / {Math.round(stats.maxMp)} ({Math.round(mpPct)}%)</span>
            </div>
            <div className="bar-track h-2 bg-[#11192e] rounded-full overflow-hidden">
              <div className="bar-fill-mp h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
            </div>
          </div>
        </div>

        {/* 4대 주요 스탯 그리드 */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">공격력</span>
            <span className="text-xs font-bold text-[#ef5350]">{stats.atk}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">방어력</span>
            <span className="text-xs font-bold text-[#42a5f5]">{stats.def}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">속도</span>
            <span className="text-xs font-bold text-[#ffd54f]">{stats.spd}</span>
          </div>
          <div className="bg-[#11192e] p-2 rounded-lg border border-[#22324f]">
            <span className="text-[9px] text-[#8b9bb4] block">행운</span>
            <span className="text-xs font-bold text-[#ab47bc]">🍀 {stats.luck}</span>
          </div>
        </div>

        {/* 보조 전투 스탯 (치명타/저항/명중/회피/흡혈) */}
        <div className="px-2.5 py-1.5 rounded-lg bg-[#0c1220] border border-[#1e2d45] text-[10px] text-[#8b9bb4] flex justify-between font-mono flex-wrap gap-1">
          <span>치명타: <strong className="text-[#ce93d8]">{(gm.getCritChance(stats.luck) + (stats.critRateBonus || 0)).toFixed(1)}%</strong></span>
          {stats.drainPercent > 0 && <span>흡혈: <strong className="text-[#e91e63]">+{stats.drainPercent}%</strong></span>}
          <span>저항: <strong className="text-[#38ef7d]">{Math.min(50, stats.luck * 0.35).toFixed(1)}%</strong></span>
          <span>명중: <strong className="text-[#00d2ff]">+{ (stats.luck * 0.2).toFixed(1)}%</strong></span>
          <span>회피: <strong className="text-[#ffd54f]">+{Math.min(70, stats.luck * 0.3).toFixed(1)}%</strong></span>
        </div>

        {/* 장착 장비 현황 */}
        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-[#38ef7d] flex items-center justify-between">
            <span>🛡️ 장착 장비</span>
            <span className="text-[10px] text-[#8b9bb4]">
              {Object.values(hero.equipment || {}).filter(Boolean).length}/3 슬롯
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
            {(['weapon', 'armor', 'accessory'] as const).map(slot => {
              const eq = hero.equipment?.[slot];
              const slotName = slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : '장신구';
              const defaultEmoji = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍';
              const slotIconKey = slot === 'weapon' ? 'weapon_sword' : slot === 'armor' ? 'armor_heavy' : 'ring';
              const rarityColor = eq?.rarity === 'legendary' ? '#ff416c'
                : eq?.rarity === 'epic' ? '#ffd54f'
                : eq?.rarity === 'unique' ? '#ab47bc'
                : eq?.rarity === 'rare' ? '#42a5f5'
                : '#cfd8dc';

              return (
                <div
                  key={slot}
                  className="p-1.5 rounded-lg bg-[#252f40] border border-[#3f4d66] flex flex-col items-center justify-center min-h-[52px] shadow-sm"
                >
                  <span className="text-[10px] text-[#cfd8e8] flex items-center gap-1.5">
                    {eq ? (
                      <span className="p-0.5 rounded bg-[#323d4e] border flex items-center justify-center transition-all" style={getRarityBorderStyle(eq.rarity)}>
                        <GameIcon name={eq.templateId || getEquipmentTemplateId(eq) || eq.id || eq.baseName || slotIconKey} icon={eq.icon || defaultEmoji} size={18} />
                      </span>
                    ) : (
                      <span>{defaultEmoji}</span>
                    )}
                    <span className="font-medium">{slotName}</span>
                  </span>
                  {eq ? (
                    <>
                      <span
                        className="text-[10px] font-bold truncate max-w-full px-1"
                        style={{ color: rarityColor }}
                        title={`${eq.name} (+${eq.level})`}
                      >
                        {eq.name}
                      </span>
                      {slot === 'weapon' && (() => {
                        const wt = eq.weaponTrait || getWeaponTrait(eq);
                        if (!wt) return null;
                        return (
                          <span
                            className="text-[8px] px-1 py-0.2 rounded font-bold mt-0.5 shadow-sm"
                            style={{ color: wt.color, backgroundColor: wt.bgColor, border: `1px solid ${wt.color}55` }}
                            title={`${wt.name}: ${wt.description}`}
                          >
                            {wt.badge}
                          </span>
                        );
                      })()}
                    </>
                  ) : (
                    <span className="text-[10px] text-[#546e7a]">비어있음</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 👑 활성화된 보스 세트 보너스 배너 */}
          {(() => {
            const bossSet = getHeroEquippedBossSet(hero);
            if (!bossSet) return null;
            const isFull = bossSet.count >= 3;
            return (
              <div className="mt-1 p-2 rounded-lg bg-gradient-to-r from-[#2a1b08] to-[#121c2d] border border-[#ffd54f88] flex flex-col gap-1 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-[#ffd54f]">
                  <span className="flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{bossSet.setName} ({bossSet.count}/3 세트)</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${
                    isFull 
                      ? 'text-[#38ef7d] bg-[#38ef7d22] border-[#38ef7d44]' 
                      : 'text-[#ffd54f] bg-[#ffd54f22] border-[#ffd54f44]'
                  }`}>
                    {isFull ? '✨ 3/3 풀세트 완성' : '⚡ 2/3 세트 효과 활성'}
                  </span>
                </div>
                <div className="text-[10px] flex flex-col gap-1 mt-0.5">
                  <div className="flex items-start gap-1.5 text-[#b9f6ca] bg-[#38ef7d15] p-1 rounded border border-[#38ef7d25]">
                    <span className="text-[#38ef7d] font-bold shrink-0">[2세트]</span>
                    <span className="leading-tight">{bossSet.twoPieceDesc}</span>
                  </div>
                  <div className={`flex items-start gap-1.5 p-1 rounded border ${
                    isFull 
                      ? 'text-[#ffe082] bg-[#ffd54f15] border-[#ffd54f35]' 
                      : 'text-[#78909c] bg-[#1e293b44] border-[#33415533]'
                  }`}>
                    <span className={`font-bold shrink-0 ${isFull ? 'text-[#ffd54f]' : 'text-[#546e7a]'}`}>[3세트]</span>
                    <span className="leading-tight">{bossSet.threePieceDesc}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 활성화된 상태이상 목록 */}
        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-[#00d2ff] flex items-center justify-between">
            <span>🛡️ 적용 중인 상태이상</span>
            <span className="text-[10px] text-[#8b9bb4] font-mono">{(hero.statusEffects || []).length}개 활성</span>
          </div>
          {(!hero.statusEffects || hero.statusEffects.length === 0) ? (
            <div className="text-[11px] text-[#546e7a] py-0.5">현재 적용 중인 상태이상이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {hero.statusEffects.map((se, idx) => {
                const meta = STATUS_EFFECT_META[se.type] || { icon: '✨', label: se.type, color: '#00d2ff', desc: '' };
                const magnitudeDesc = se.type === 'shield'
                  ? `${se.magnitude} 피해 흡수`
                  : se.magnitude
                  ? `${Math.round(se.magnitude * 100)}% 효과`
                  : '';
                return (
                  <div key={idx} className="p-1.5 rounded bg-[#162035] border border-[#273859] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <GameIcon name={se.type} icon={meta.icon} size={16} />
                      <span className="font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-[10px] text-[#cfd8dc]">({magnitudeDesc || meta.desc})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#0d1424] text-[#ffd54f]">
                      남은 턴: {se.turnsLeft}턴
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 개인 성향 & 스킬 정보 */}
        <div className="p-2.5 rounded-lg bg-[#11192e] border border-[#22324f] flex flex-col gap-1.5 text-xs">
          {(() => {
            const traitKey = hero.trait || hero.title || '';
            const traitInfo = HERO_TRAITS[traitKey];
            if (!traitKey) return null;
            return (
              <div className="p-2 rounded-lg bg-[#162035] border border-[#273859] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#ffd54f] font-bold flex items-center gap-1">
                    <span>✨ 개인 성향:</span>
                    <span className="text-white font-mono">[{traitKey}]</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44]">
                    스탯 영구 반영
                  </span>
                </div>
                {traitInfo && (
                  <div className="text-[10px] text-[#cfd8dc] leading-relaxed">
                    💡 <strong className="text-[#ffd54f]">효과:</strong> {traitInfo.desc}
                  </div>
                )}
              </div>
            );
          })()}
          <div className="text-[11px] text-[#8b9bb4] mt-0.5 flex flex-col gap-0.5">
            <div>
              장착 스킬: {(hero.equippedSkills || []).length > 0 ? (hero.equippedSkills || []).map(sid => gm.resolveSkillData(sid, hero)?.name || sid).join(', ') : '기본 직업 스킬'}
            </div>
            <div className="text-[10px] text-[#78909c] flex items-center gap-2">
              <span>습득 완료: <strong className="text-[#00d2ff]">{(hero.learnedSkills || []).length}/6</strong></span>
              <span>·</span>
              <span>학습(연독) 중: <strong className="text-[#ffd54f]">{(hero.studyingSkills || []).length}/6</strong></span>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end pt-1">
          <button className="btn btn-ghost text-xs px-4 py-1.5 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1" style={{ borderColor: '#c56060', color: '#c56060', borderWidth: '1.5px', borderStyle: 'solid' }} onClick={onClose}>
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span> <span>닫기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
