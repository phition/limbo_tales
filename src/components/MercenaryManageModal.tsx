import React, { useState } from 'react';
import { Mercenary, Skill } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { GameManager } from '../managers/GameManager';
import { SoundManager } from '../managers/SoundManager';
import { CustomAssetService } from '../services/CustomAssetService';
import { PartySynergyPanel } from './PartySynergyPanel';
import { GameIcon } from './GameIcon';
import { useI18n } from '../hooks/useI18n';

interface Props {
  open: boolean;
  onClose: () => void;
  charges: number;
  inTransitHero: { targetSlot: number; heroId: string; heroName: string; turnsLeft: number } | null;
}

export const MercenaryManageModal: React.FC<Props> = ({ open, onClose, charges, inTransitHero }) => {
  const { tr } = useI18n();
  const gm = GameManager.getInstance();
  const party = gm.party;
  const deadHero = party.find(h => h.currentHp <= 0);

  const [activeTab, setActiveTab] = useState<'formation' | 'skills' | 'transport'>('formation');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(() => party[0]?.id || '');
  const [selectedSkillSlot, setSelectedSkillSlot] = useState<number>(0);
  const [leaveHeroId, setLeaveHeroId] = useState<string>(() => deadHero?.id || party[0]?.id || '');
  const [joinHeroId, setJoinHeroId] = useState<string>('');

  if (!open) return null;

  const currentSelectedHero = party.find(h => h.id === selectedHeroId) || party[0];
  const normalAnchorCount = gm.getDungeonItemCount('rift_anchor');
  const enhancedAnchorCount = gm.getDungeonItemCount('enhanced_rift_anchor');
  const totalAnchorCount = normalAnchorCount + enhancedAnchorCount;
  const hasEnhanced = enhancedAnchorCount > 0;
  const deadHeroes = party.filter(h => h.currentHp <= 0);

  const availableBarracksCandidates = gm.barracks.filter(b => 
    !party.some(p => p.id === b.id) && 
    !gm.infirmaryPatients.includes(b.id) &&
    b.id !== inTransitHero?.heroId
  );

  const cycleHeroPosition = (heroId: string, currentPos: string) => {
    const nextPosMap: Record<string, 'front' | 'mid' | 'back'> = {
      front: 'mid',
      mid: 'back',
      back: 'front',
    };
    const nextPos = nextPosMap[currentPos] || 'mid';
    gm.setHeroPosition(heroId, nextPos);
    SoundManager.getInstance().play('button_click');
  };

  const handleEquipSkill = (hero: Mercenary, skillId: string, slotIdx: number) => {
    gm.equipSkillToSlot(hero.id, skillId, slotIdx);
    SoundManager.getInstance().play('equip');
  };

  const handleStartTransport = () => {
    if (!leaveHeroId || !joinHeroId) return;
    const success = gm.startEmergencyTransport(leaveHeroId, joinHeroId);
    if (success) {
      onClose();
    }
  };

  // 영웅 초상화 가져오기 헬퍼 (성별 및 커스텀 오버라이드 지원)
  const getHeroPortrait = (hero: Mercenary | any) => {
    return CustomAssetService.getHeroPortrait(hero);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#0c121e] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* ── 상단 헤더 ── */}
        <div className="px-4 py-3 bg-[#11192a] border-b border-[#1f2d47] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">{tr('원정대 용병 관리')}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  charges > 0 
                    ? 'bg-[#38ef7d18] text-[#38ef7d] border-[#38ef7d44]' 
                    : 'bg-[#ff525218] text-[#ff5252] border-[#ff525244]'
                }`}>
                  {tr(`관리 잔여: ${charges}/1회`)}
                </span>
              </div>
              <div className="text-[10px] text-[#8b9bb4]">
                {tr('진형 포지션 배치 · 스킬 교체 · 차원의 닻 긴급 이송')}
              </div>
            </div>
          </div>
          <button 
            className="w-7 h-7 rounded-lg bg-[#15171e] text-[#8b9bb4] hover:text-white hover:bg-[#22324d] flex items-center justify-center text-sm font-bold transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="flex border-b border-[#1f2d47] bg-[#0f1624] shrink-0">
          <button
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'formation'
                ? 'border-[#876739] text-[#f3e5c8] bg-[#5c452422]'
                : 'border-transparent text-[#8b9bb4] hover:text-[#cfd8e8]'
            }`}
            onClick={() => { setActiveTab('formation'); SoundManager.getInstance().play('button_click'); }}
          >
            <span>🛡️</span>
            <span>{tr('포지션 & 시너지')}</span>
          </button>

          <button
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'skills'
                ? 'border-[#ce93d8] text-[#ce93d8] bg-[#ce93d810]'
                : 'border-transparent text-[#8b9bb4] hover:text-[#cfd8e8]'
            }`}
            onClick={() => { setActiveTab('skills'); SoundManager.getInstance().play('button_click'); }}
          >
            <span>⚔️</span>
            <span>{tr('스킬 교체')}</span>
          </button>

          <button
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'transport'
                ? 'border-[#ffd54f] text-[#ffd54f] bg-[#ffd54f10]'
                : 'border-transparent text-[#8b9bb4] hover:text-[#cfd8e8]'
            }`}
            onClick={() => { setActiveTab('transport'); SoundManager.getInstance().play('button_click'); }}
          >
            <span>🚚</span>
            <span>{tr('긴급 이송')}</span>
            {deadHeroes.length > 0 && (
              <span className="text-[9px] bg-[#ef5350] text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {tr(`💀 사망 ${deadHeroes.length}`)}
              </span>
            )}
            {inTransitHero && (
              <span className="w-2 h-2 rounded-full bg-[#ff7043] animate-ping" />
            )}
          </button>
        </div>

        {/* ── 탭 컨텐츠 영역 ── */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          
          {/* ════════ 1. 포지션 & 진형 시너지 탭 ════════ */}
          {activeTab === 'formation' && (
            <div className="space-y-3">
              <div className="bg-[#121927] p-2.5 rounded-xl border border-[#1f2d45]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#f3e5c8]">{tr('🛡️ 원정대 배치 진형 (채비실)')}</span>
                  <span className="text-[10px] text-[#8b9bb4]">{tr('버튼을 클릭하여 전열/중열/후열 전환')}</span>
                </div>

                <div className="space-y-2">
                  {party.map((hero) => {
                    const pos = hero.position || 'mid';
                    const posMeta = {
                      front: { label: '🛡️ 전열', color: '#ef5350', perk: '피격률↑ 피해 -10%' },
                      mid:   { label: '🎯 중열', color: '#ffd54f', perk: '치명타+10% 회피+10%' },
                      back:  { label: '🔮 후열', color: '#42a5f5', perk: '마나소모-15% 마법+15%' },
                    }[pos];
                    const cls = CHARACTER_CLASSES[hero.classId];
                    const portrait = getHeroPortrait(hero);
                    const eff = gm.getHeroEffectiveStats(hero);
                    const hpPct = Math.max(0, Math.min(100, (hero.currentHp / eff.maxHp) * 100));
                    const mpPct = Math.max(0, Math.min(100, (hero.currentMp / eff.maxMp) * 100));
                    const isDead = hero.currentHp <= 0;

                    return (
                      <div 
                        key={hero.id} 
                        className={`flex items-center justify-between p-2 rounded-xl border gap-2 transition-all ${
                          isDead 
                            ? 'bg-[#12141c] border-[#3e4452] grayscale opacity-75' 
                            : 'bg-[#172133] border-[#243550]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[#0e1524] border border-[#243550] flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
                            {portrait ? (
                              <img src={portrait} alt={hero.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{cls?.skills[0]?.icon || '⚔️'}</span>
                            )}
                            {isDead && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs">
                                💀
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold ${isDead ? 'text-[#8b9bb4] line-through' : 'text-white'}`}>{tr(hero.name)}</span>
                              <span className="text-[10px] text-[#c8aa6e]">{tr(cls?.name || hero.classId)}</span>
                              <span className="text-[10px] text-[#ffd54f]">Lv.{hero.level}</span>
                              {isDead && (
                                <span className="text-[9px] bg-[#ef5350] text-white px-1.5 py-0.2 rounded font-bold">
                                  {tr('💀 전사')}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#ffd54f] font-mono mt-0.5">
                              {isDead ? tr('⚰️ 심연에서 전사 (유해 긴급 이송 필요)') : tr(posMeta.perk)}
                            </div>
                            {/* HP / MP 미니바 */}
                            <div className="flex gap-1 mt-1 max-w-[140px]">
                              <div className="bar-track flex-1 h-1.5"><div className="bar-fill-hp h-full" style={{ width: `${hpPct}%` }} /></div>
                              <div className="bar-track flex-1 h-1.5"><div className="bar-fill-mp h-full" style={{ width: `${mpPct}%` }} /></div>
                            </div>
                          </div>
                        </div>

                        {isDead ? (
                          <button
                            className="btn text-xs px-2.5 py-1.5 font-bold border border-[#ef5350] text-[#ef5350] bg-[#ef535015] hover:bg-[#ef535033] transition-all shrink-0 rounded-lg shadow-sm"
                            onClick={() => {
                              setLeaveHeroId(hero.id);
                              setActiveTab('transport');
                              SoundManager.getInstance().play('button_click');
                            }}
                          >
                            {tr('⚰️ 유해 운구')}
                          </button>
                        ) : (
                          <button
                            className="btn text-xs px-3 py-1.5 font-bold border transition-all shrink-0 rounded-lg shadow-sm"
                            style={{ borderColor: posMeta.color, color: posMeta.color, background: `${posMeta.color}15` }}
                            onClick={() => cycleHeroPosition(hero.id, pos)}
                          >
                            {tr(posMeta.label)}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* 이송 중인 슬롯 표시 */}
                  {inTransitHero && (
                    <div className="p-3 rounded-xl bg-[#1e1528] border border-[#ff704366] flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌀</span>
                        <div>
                          <div className="text-xs font-bold text-[#ff7043]">
                            {tr(`차원 이송 대기 중: [${inTransitHero.heroName}]`)}
                          </div>
                          <div className="text-[10px] text-[#cfd8e8]">
                            {tr(`방주로부터 현장까지 이동 중 (합류까지 ${inTransitHero.turnsLeft}턴 남음)`)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#ffd54f] bg-[#ffd54f22] px-2 py-0.5 rounded border border-[#ffd54f44]">
                        {tr(`${inTransitHero.turnsLeft} 턴 남음`)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 활성 시너지 패널 연동 */}
              <PartySynergyPanel party={party} />
            </div>
          )}

          {/* ════════ 2. 스킬 교체 탭 ════════ */}
          {activeTab === 'skills' && currentSelectedHero && (() => {
            const isSelectedHeroDead = currentSelectedHero.currentHp <= 0;
            return (
              <div className="space-y-3">
                {/* 파티원 선택 셀렉터 */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {party.map(hero => {
                    const isSelected = hero.id === currentSelectedHero.id;
                    const cls = CHARACTER_CLASSES[hero.classId];
                    const isHeroDead = hero.currentHp <= 0;
                    return (
                      <button
                        key={hero.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                          isSelected 
                            ? 'border-[#ce93d8] bg-[#ce93d822] text-white shadow-[0_0_10px_rgba(206,147,216,0.3)]' 
                            : isHeroDead
                            ? 'border-[#3e2723] bg-[#1a1418] text-[#8b9bb4]'
                            : 'border-[#22324f] bg-[#121927] text-[#8b9bb4] hover:text-white'
                        } ${isHeroDead ? 'grayscale opacity-75' : ''}`}
                        onClick={() => {
                          setSelectedHeroId(hero.id);
                          SoundManager.getInstance().play('button_click');
                        }}
                      >
                        <span>{isHeroDead ? '💀' : (cls?.skills[0]?.icon || '⚔️')}</span>
                        <span>{tr(hero.name)}</span>
                        {isHeroDead && <span className="text-[9px] text-[#ef5350] font-bold">{tr('[전사]')}</span>}
                      </button>
                    );
                  })}
                </div>

                {isSelectedHeroDead ? (
                  <div className="bg-[#1a1418] p-5 rounded-xl border border-[#ef535044] text-center space-y-2.5 my-2">
                    <div className="text-3xl">⚰️💀</div>
                    <div className="text-xs font-bold text-[#ef5350]">{tr('전사한 용병은 스킬을 변경할 수 없습니다.')}</div>
                    <p className="text-[11px] text-[#cfd8e8] max-w-sm mx-auto leading-relaxed">
                      {tr('사경을 헤매다 끝내 전사한 대원입니다. [긴급 이송] 탭에서 유해를 방주(영주 성채 묘지)로 운구하고 대기소의 후방 지원 용병을 소환하세요.')}
                    </p>
                    <button
                      className="btn text-xs px-3.5 py-1.5 font-bold border border-[#ef5350] text-[#ef5350] bg-[#ef535018] hover:bg-[#ef535033] rounded-lg transition-all"
                      onClick={() => {
                        setLeaveHeroId(currentSelectedHero.id);
                        setActiveTab('transport');
                        SoundManager.getInstance().play('button_click');
                      }}
                    >
                      {tr('🚚 긴급 이송으로 유해 운구하기')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 현재 장착 중인 스킬 2개 슬롯 */}
                    <div className="bg-[#121927] p-2.5 rounded-xl border border-[#1f2d45]">
                      <div className="text-xs font-bold text-[#ce93d8] mb-2 flex items-center justify-between">
                        <span>{tr('⚔️ 현재 장착 스킬 슬롯 (교체할 슬롯을 클릭)')}</span>
                        <span className="text-[10px] text-[#8b9bb4]">{tr(`선택된 슬롯: 슬롯 ${selectedSkillSlot + 1}`)}</span>
                      </div>

                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map(slotIdx => {
                    const skillId = currentSelectedHero.equippedSkills?.[slotIdx];
                    const skill = skillId ? gm.resolveSkillData(skillId, currentSelectedHero) : null;
                    const isSlotSelected = selectedSkillSlot === slotIdx;

                    return (
                      <div
                        key={slotIdx}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSlotSelected
                            ? 'border-[#ce93d8] bg-[#ce93d818] shadow-[0_0_12px_rgba(206,147,216,0.3)] scale-[1.01]'
                            : 'border-[#22324f] bg-[#162134] hover:border-[#384e72]'
                        }`}
                        onClick={() => {
                          setSelectedSkillSlot(slotIdx);
                          SoundManager.getInstance().play('button_click');
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#8b9bb4] mb-1">
                          <span className="font-bold">{tr(`슬롯 ${slotIdx + 1}`)} {isSlotSelected && tr('👈 선택됨')}</span>
                          {skill && <span className="text-[#64b5f6] font-mono">{skill.manaCost} MP</span>}
                        </div>
                        {skill ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-0.5">
                              <GameIcon name={skill.id} icon={skill.icon} size={16} />
                              <span className="truncate">{tr(skill.name)}</span>
                            </div>
                            <div className="text-[10px] text-[#8b9bb4] line-clamp-2 leading-relaxed">
                              {tr(skill.description)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2 text-xs text-[#607d8b]">
                            {tr('장착된 스킬 없음')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 습득 완료한 스킬 목록 */}
              <div className="bg-[#121927] p-2.5 rounded-xl border border-[#1f2d45]">
                <div className="text-xs font-bold text-[#ffd54f] mb-2 flex items-center justify-between">
                  <span>{tr(`📜 습득 완료 스킬 목록 (${currentSelectedHero.learnedSkills?.length || 0}종)`)}</span>
                  <span className="text-[10px] text-[#8b9bb4]">{tr(`슬롯 ${selectedSkillSlot + 1}에 장착할 스킬 선택`)}</span>
                </div>

                {(() => {
                  const heroClass = CHARACTER_CLASSES[currentSelectedHero.classId];
                  // 습득 스킬 아이디 목록
                  const learnedIds = Array.from(new Set([
                    ...(heroClass?.skills?.map(s => s.id) || []),
                    ...(currentSelectedHero.learnedSkills || [])
                  ]));

                  const skillsList: Skill[] = learnedIds
                    .map(sid => gm.resolveSkillData(sid, currentSelectedHero))
                    .filter((s): s is Skill => Boolean(s));

                  if (skillsList.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-[#8b9bb4]">
                        {tr('습득한 스킬이 없습니다. 마도서를 통해 새로운 스킬을 습득해보세요.')}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {skillsList.map((sk, skIdx) => {
                        const isEquippedInSlot1 = currentSelectedHero.equippedSkills?.[0] === sk.id;
                        const isEquippedInSlot2 = currentSelectedHero.equippedSkills?.[1] === sk.id;
                        const isEquippedHere = currentSelectedHero.equippedSkills?.[selectedSkillSlot] === sk.id;
                        const isEquipped = isEquippedInSlot1 || isEquippedInSlot2;

                        return (
                          <div
                            key={`${sk.id}_${skIdx}`}
                            className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                              isEquippedHere
                                ? 'border-[#876739] bg-[#5c452422]'
                                : isEquipped
                                ? 'border-[#2c3d59] bg-[#141d2d] opacity-75'
                                : 'border-[#22324f] bg-[#162134] hover:border-[#384e72]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                                  <GameIcon name={sk.id} icon={sk.icon} size={16} />
                                  <span>{tr(sk.name)}</span>
                                </div>
                                <span className="text-[10px] text-[#64b5f6] font-mono font-bold">
                                  {sk.manaCost} MP
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] line-clamp-2 leading-relaxed mb-2">
                                {tr(sk.description)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-[#1f2d45]">
                              <span className="text-[9px] text-[#8b9bb4]">
                                {sk.positionBonus ? `${tr('위치:')} ${tr(sk.positionBonus)}` : tr('자유 위치')}
                              </span>

                              <button
                                className={`btn text-[10px] px-2.5 py-1 font-bold rounded-lg transition-colors ${
                                  isEquippedHere
                                    ? 'btn-ghost text-[#c8aa6e] border border-[#c8aa6e55] cursor-default'
                                    : 'btn-primary bg-[#ce93d8] hover:bg-[#ba68c8] text-black'
                                }`}
                                disabled={isEquippedHere}
                                onClick={() => handleEquipSkill(currentSelectedHero, sk.id, selectedSkillSlot)}
                              >
                                {isEquippedHere ? tr('장착 중') : tr(`슬롯 ${selectedSkillSlot + 1}에 장착`)}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
                    </>
                  )}
                </div>
              );
            })()}

          {/* ════════ 3. 긴급 이송 탭 ════════ */}
          {activeTab === 'transport' && (
            <div className="space-y-3">
              {/* 시스템 설명 안내문 */}
              <div className="bg-[#121927] p-3 rounded-xl border border-[#1f2d45] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                    <span>{hasEnhanced ? '⚓✨' : '⚓'}</span>
                    <span>{hasEnhanced ? tr('차원 심연의 닻 긴급 이송 & 유해 운구 시스템') : tr('차원 균열의 닻 긴급 이송 & 유해 운구 시스템')}</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {enhancedAnchorCount > 0 && (
                      <span className="text-xs font-mono font-bold text-[#b388ff] bg-[#b388ff18] px-2 py-0.5 rounded border border-[#b388ff44] flex items-center gap-1">
                        <span>⚓✨</span>
                        <span>{tr(`심연의 닻: ${enhancedAnchorCount}개 (2턴)`)}</span>
                      </span>
                    )}
                    {normalAnchorCount > 0 && (
                      <span className="text-xs font-mono font-bold text-[#c8aa6e] bg-[#c8aa6e18] px-2 py-0.5 rounded border border-[#c8aa6e44] flex items-center gap-1">
                        <span>⚓</span>
                        <span>{tr(`균열의 닻: ${normalAnchorCount}개 (3턴)`)}</span>
                      </span>
                    )}
                    {totalAnchorCount === 0 && (
                      <span className="text-xs font-mono font-bold text-[#ef5350] bg-[#ef535018] px-2 py-0.5 rounded border border-[#ef535044]">
                        {tr('보유 닻 없음 (0개)')}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[#cfd8e8] leading-relaxed">
                  {tr('심연 탐험 중 위기에 처한 생존 용병을 방주로 무사 귀환시키거나, 끝내 사경을 넘지 못하고 완전 전사한 용병의 유해를 영주(성채 묘지)로 안전히 운구하여 유품을 회수하고 방주 대기소의 후방 용병을 원정대로 호출합니다.')}
                </p>
                <div className={`text-[10px] p-2.5 rounded-lg border leading-relaxed ${
                  hasEnhanced
                    ? 'text-[#d1c4e9] bg-[#b388ff14] border-[#b388ff44]'
                    : gm.activeCatalysts.includes('compass')
                    ? 'text-[#38ef7d] bg-[#38ef7d18] border-[#38ef7d44]'
                    : 'text-[#ffd54f] bg-[#ffd54f12] border-[#ffd54f33]'
                }`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {hasEnhanced ? (
                        <span className="text-[#b388ff] flex items-center gap-1">
                          <span>⚓✨</span>
                          <span>{tr('심연의 닻 적용 중: 고대 시공간 안정화 권능으로 기본 이송 턴이 2턴으로 단축됩니다! (일반 균열의 닻 3턴 ➔ 2턴)')}</span>
                        </span>
                      ) : (
                        <span className="text-[#ffd54f] flex items-center gap-1">
                          <span>⚓</span>
                          <span>{tr('균열의 닻 적용: 소환된 대원은 차원 균열을 통해 3턴 후 원정대에 도착하여 합류합니다.')}</span>
                        </span>
                      )}
                    </div>
                    {gm.activeCatalysts.includes('chrono_compass') || (gm.activeCatalysts.includes('compass') && gm.hasChronoCompass) || gm.hasChronoCompass ? (
                      <div className="text-[#38ef7d] flex items-center gap-1 font-bold">
                        <span>🧭⌛✨</span>
                        <span>{tr('시공간의 나침반 활성화: 초월 시공간 왜곡 권능으로 대기 턴 없이 즉시 합류(0턴)합니다!')}</span>
                      </div>
                    ) : gm.activeCatalysts.includes('compass') ? (
                      <div className="text-[#38ef7d] flex items-center gap-1 font-bold">
                        <span>🧭✨</span>
                        <span>{tr(`차원의 나침반 활성화 중: 시공간 왜곡 권능으로 소환 대원의 이송 턴이 추가 1턴 단축됩니다! (${hasEnhanced ? '심연의 닻: 1턴' : '균열의 닻: 2턴'})`)}</span>
                      </div>
                    ) : (
                      <div className="text-[#8b9bb4]">
                        <span>{tr('💡 팁: 차원의 나침반 촉매를 채비하면 이송 턴이 추가로 1턴 더 단축됩니다.')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 이미 이송 중인 경우 알림 */}
              {inTransitHero ? (
                <div className="p-4 rounded-xl bg-[#1e1528] border border-[#ff7043] text-center space-y-2">
                  <div className="text-2xl animate-bounce">🚚</div>
                  <div className="text-sm font-bold text-[#ff7043]">
                    {tr('현재 차원 이송 작전이 진행 중입니다!')}
                  </div>
                  <div className="text-xs text-[#cfd8e8]">
                    <span>{tr(`소환 대원: [${inTransitHero.heroName}] · 합류까지 남은 이동: ${inTransitHero.turnsLeft}턴`)}</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4]">
                    {tr('이송이 완료된 후 다음 긴급 이송을 요청할 수 있습니다.')}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 단계 1: 귀환/운구할 파티원 선택 */}
                  <div className="bg-[#121927] p-2.5 rounded-xl border border-[#1f2d45]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#ff5252]">
                        {tr('1단계: 방주로 복귀/운구할 원정대원 선택')}
                      </span>
                      {deadHeroes.length > 0 && (
                        <span className="text-[10px] text-[#ef5350] font-bold">
                          {tr(`💀 전사자 ${deadHeroes.length}명 대기 중`)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {party.map(hero => {
                        const isSelected = hero.id === leaveHeroId;
                        const cls = CHARACTER_CLASSES[hero.classId];
                        const isDead = hero.currentHp <= 0;
                        const portrait = getHeroPortrait(hero);
                        const eff = gm.getHeroEffectiveStats(hero);
                        const hpPct = Math.max(0, Math.min(100, (hero.currentHp / eff.maxHp) * 100));
                        const mpPct = Math.max(0, Math.min(100, (hero.currentMp / eff.maxMp) * 100));
                        const posMeta = {
                          front: { label: '전열', color: '#ef5350' },
                          mid:   { label: '중열', color: '#ffd54f' },
                          back:  { label: '후열', color: '#42a5f5' },
                        }[hero.position || 'mid'];

                        return (
                          <div
                            key={hero.id}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                              isSelected
                                ? 'border-[#ff5252] bg-[#ff525222] shadow-[0_0_12px_rgba(255,82,82,0.3)] scale-[1.01]'
                                : isDead
                                ? 'border-[#553030] bg-[#1a1418] hover:border-[#ff5252]'
                                : 'border-[#22324f] bg-[#162134] hover:border-[#384e72]'
                            }`}
                            onClick={() => {
                              setLeaveHeroId(hero.id);
                              SoundManager.getInstance().play('button_click');
                            }}
                          >
                            <div className={`flex items-center gap-2 ${isDead ? 'grayscale' : ''}`}>
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#c8aa6e55] bg-[#0e1524] flex items-center justify-center relative shadow-inner">
                                {portrait ? (
                                  <img
                                    src={portrait}
                                    alt={hero.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-sm">{cls?.skills[0]?.icon || '⚔️'}</span>
                                )}
                                {isDead && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">
                                    💀
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-xs font-bold truncate ${isDead ? 'text-[#8b9bb4] line-through' : 'text-white'}`}>
                                    {tr(hero.name)}
                                  </span>
                                  <span
                                    className="text-[8.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                    style={{ color: posMeta.color, background: `${posMeta.color}18`, border: `1px solid ${posMeta.color}44` }}
                                  >
                                    [{tr(posMeta.label)}]
                                  </span>
                                  {isDead && (
                                    <span className="text-[8.5px] bg-[#ef5350] text-white px-1 py-0.1 rounded font-bold shrink-0">
                                      {tr('사망')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[9.5px] text-[#8b9bb4] mt-0.5">
                                  <span className="text-[#c8aa6e] truncate">{tr(cls?.name || hero.classId)} Lv.{hero.level}</span>
                                </div>
                              </div>
                            </div>

                            {/* 정보패널 스타일 HP / MP 수치 & 프로그레스바 */}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[9.5px] font-mono">
                                {isDead ? (
                                  <span className="text-[#ef5350] font-bold font-sans">{tr('⚰️ 유해 운구 필요')}</span>
                                ) : (
                                  <span className="flex items-center gap-0.5">
                                    <span className={hero.currentHp / eff.maxHp < 0.3 ? 'text-[#ef5350] font-bold' : 'text-[#38ef7d]'}>
                                      {Math.round(hero.currentHp)}
                                    </span>
                                    <span className="text-[#607d8b]">/{Math.round(eff.maxHp)}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <span className="text-[#64b5f6]">{Math.round(hero.currentMp)}</span>
                                  <span className="text-[#607d8b]">/{Math.round(eff.maxMp)}</span>
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <div className="bar-track flex-1" style={{ height: 4 }}>
                                  <div className="bar-fill-hp h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                                </div>
                                <div className="bar-track flex-1" style={{ height: 4 }}>
                                  <div className="bar-fill-mp h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 단계 2: 대체 소환할 대기 용병 선택 */}
                  <div className="bg-[#121927] p-2.5 rounded-xl border border-[#1f2d45]">
                    <span className="text-xs font-bold text-[#38ef7d] block mb-2">
                      {tr('2단계: 방주 대기소에서 호출할 후방 용병 선택')}
                    </span>
                    {availableBarracksCandidates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-0.5">
                        {availableBarracksCandidates.map(candidate => {
                          const isSelected = candidate.id === joinHeroId;
                          const cls = CHARACTER_CLASSES[candidate.classId];
                          const portrait = getHeroPortrait(candidate);
                          const eff = gm.getHeroEffectiveStats(candidate);
                          const hpPct = Math.max(0, Math.min(100, (candidate.currentHp / eff.maxHp) * 100));
                          const mpPct = Math.max(0, Math.min(100, (candidate.currentMp / eff.maxMp) * 100));
                          const posMeta = {
                            front: { label: '전열', color: '#ef5350' },
                            mid:   { label: '중열', color: '#ffd54f' },
                            back:  { label: '후열', color: '#42a5f5' },
                          }[candidate.position || 'mid'];

                          return (
                            <div
                              key={candidate.id}
                              className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'border-[#38ef7d] bg-[#38ef7d22] shadow-[0_0_12px_rgba(56,239,125,0.3)] scale-[1.01]'
                                  : 'border-[#22324f] bg-[#162134] hover:border-[#384e72]'
                              }`}
                              onClick={() => {
                                setJoinHeroId(candidate.id);
                                SoundManager.getInstance().play('button_click');
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#c8aa6e55] bg-[#0e1524] flex items-center justify-center relative shadow-inner">
                                    {portrait ? (
                                      <img
                                        src={portrait}
                                        alt={candidate.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                      />
                                    ) : (
                                      <span className="text-sm">{cls?.skills[0]?.icon || '⚔️'}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="text-xs font-bold text-white truncate">{tr(candidate.name)}</span>
                                      <span
                                        className="text-[8.5px] px-1 py-0.1 rounded font-bold shrink-0"
                                        style={{ color: posMeta.color, background: `${posMeta.color}18`, border: `1px solid ${posMeta.color}44` }}
                                      >
                                        [{tr(posMeta.label)}]
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[#c8aa6e] truncate">
                                      Lv.{candidate.level} {tr(cls?.name || candidate.classId)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[9.5px] font-mono shrink-0 flex items-center gap-0.5">
                                  <span className={candidate.currentHp / eff.maxHp < 0.3 ? 'text-[#ef5350] font-bold' : 'text-[#38ef7d]'}>
                                    {Math.round(candidate.currentHp)}
                                  </span>
                                  <span className="text-[#607d8b]">/{Math.round(eff.maxHp)}</span>
                                  <span className="text-[#607d8b] mx-0.5">|</span>
                                  <span className="text-[#64b5f6]">{Math.round(candidate.currentMp)}</span>
                                  <span className="text-[#607d8b]">/{Math.round(eff.maxMp)}</span>
                                </div>
                              </div>

                              {/* 정보패널 스타일 HP & MP 프로그레스바 */}
                              <div className="flex gap-1">
                                <div className="bar-track flex-1" style={{ height: 4 }}>
                                  <div className="bar-fill-hp h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                                </div>
                                <div className="bar-track flex-1" style={{ height: 4 }}>
                                  <div className="bar-fill-mp h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-[#8b9bb4]">
                        {tr('호출 가능한 대기 용병이 없습니다 (성채 대기소에 다른 용병이 필요합니다).')}
                      </div>
                    )}
                  </div>

                  {/* 이송 실행 버튼 */}
                  {(() => {
                    const selectedLeaveHero = party.find(h => h.id === leaveHeroId);
                    const selectedJoinHero = availableBarracksCandidates.find(h => h.id === joinHeroId);
                    const isTargetDead = selectedLeaveHero && selectedLeaveHero.currentHp <= 0;
                    
                    // 심연의 닻(enhanced_rift_anchor) 우선 소모 체크
                    const baseTurns = hasEnhanced ? 2 : 3;
                    const hasChronoCompass = gm.activeCatalysts.includes('chrono_compass') || (gm.activeCatalysts.includes('compass') && gm.hasChronoCompass) || gm.hasChronoCompass;
                    const hasCompass = gm.activeCatalysts.includes('compass') || gm.activeCatalysts.includes('chrono_compass');
                    
                    let finalTurns = baseTurns;
                    if (hasChronoCompass) {
                      finalTurns = 0;
                    } else if (hasCompass) {
                      finalTurns = Math.max(1, baseTurns - 1);
                    }

                    const activeAnchorName = hasEnhanced ? '심연의 닻' : '균열의 닻';
                    const activeAnchorIcon = hasEnhanced ? '⚓✨' : '⚓';

                    return (
                      <div className="pt-2">
                        <button
                          className="btn w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
                          style={{
                            background: totalAnchorCount >= 1 && joinHeroId && leaveHeroId 
                              ? isTargetDead 
                                ? 'linear-gradient(135deg, #4a1c1c 0%, #662020 100%)'
                                : hasEnhanced
                                ? 'linear-gradient(135deg, #2b1f48 0%, #452b75 100%)'
                                : 'linear-gradient(135deg, #423219 0%, #5c4524 100%)' 
                              : '#15171d',
                            color: totalAnchorCount >= 1 && joinHeroId && leaveHeroId ? '#f3e5c8' : '#607d8b',
                            border: totalAnchorCount >= 1 && joinHeroId && leaveHeroId 
                              ? isTargetDead ? '1px solid #a83232' : hasEnhanced ? '1px solid #9c27b0' : '1px solid #876739' 
                              : '1px solid #2a384e',
                            boxShadow: totalAnchorCount >= 1 && joinHeroId && leaveHeroId 
                              ? hasEnhanced ? '0 4px 14px rgba(156, 39, 176, 0.4)' : '0 4px 14px rgba(66, 50, 25, 0.5)' 
                              : 'none',
                            cursor: totalAnchorCount >= 1 && joinHeroId && leaveHeroId ? 'pointer' : 'not-allowed'
                          }}
                          disabled={totalAnchorCount < 1 || !joinHeroId || !leaveHeroId}
                          onClick={handleStartTransport}
                        >
                          <span className="text-base">{isTargetDead ? '⚰️' : activeAnchorIcon}</span>
                          <span>
                            {totalAnchorCount < 1 
                              ? tr('차원의 닻 부족 (균열의 닻 또는 심연의 닻 1개 필요)') 
                              : !leaveHeroId
                              ? tr('1단계: 귀환/운구 대상을 선택하세요')
                              : !joinHeroId 
                              ? tr('2단계: 호출할 후방 용병을 선택하세요') 
                              : isTargetDead
                              ? tr(`전사자 [${selectedLeaveHero?.name}] 유해 운구 & [${selectedJoinHero?.name}] 후방 호출 (${activeAnchorName} 소모 · ${finalTurns === 0 ? '즉시 합류' : `${finalTurns}턴 소요`})`)
                              : tr(`[${selectedLeaveHero?.name}] 긴급 귀환 & [${selectedJoinHero?.name}] 후방 호출 (${activeAnchorName} 소모 · ${finalTurns === 0 ? '즉시 합류' : `${finalTurns}턴 소요`})`)}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── 하단 닫기 바 ── */}
        <div className="px-4 py-2.5 bg-[#0f1624] border-t border-[#1f2d47] flex justify-end">
          <button 
            className="btn btn-ghost text-xs px-4 py-1.5 font-bold rounded-lg border border-[#2a3a55] text-[#8b9bb4] hover:text-white"
            onClick={onClose}
          >
            {tr('닫기')}
          </button>
        </div>
      </div>
    </div>
  );
};

