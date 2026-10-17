import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { GameIcon } from './GameIcon';
import { CraftProgressModal } from './CraftProgressModal';
import { GameManager } from '../managers/GameManager';
import { Mercenary, Skill, GameResources } from '../types/game';
import { getSkillBookRarity, GRIMOIRE_RARITY_META } from '../data/skillBooks';

interface Props {
  open: boolean;
  hero: Mercenary | null;
  skill: Skill | null;
  onClose: () => void;
  gm: GameManager;
}

export const GrimoireEnhanceModal: React.FC<Props> = ({ open, hero, skill, onClose, gm }) => {
  if (!open || !hero || !skill) return null;

  // Reactivity trigger: listen to GM updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    const events = ['resourcesChanged', 'partyUpdated', 'heroesUpdated', 'buildingUpdated', 'update'];
    events.forEach(ev => gm.on(ev, handler));
    return () => {
      events.forEach(ev => gm.off(ev, handler));
    };
  }, [gm]);

  // 항상 최신 용병 상태 참조 (강화 후 스킬 레벨 갱신 반영)
  const currentHero = (gm.barracks || []).find(h => h.id === hero.id) || (gm.party || []).find(h => h.id === hero.id) || hero;
  const curLv = currentHero.skillLevels?.[skill.id] || 1;
  const isMaxLv = curLv >= 10;

  const alchemyLv = gm.buildings['alchemy']?.level || 1;
  const isPaused = gm.buildings['alchemy']?.isPaused || false;
  const maxEnhanceAllowed = GameManager.getAlchemyMaxEnhanceLevel(alchemyLv);
  const isBuildingLvTooLow = !isMaxLv && curLv >= maxEnhanceAllowed;

  // 장비 강화와 동일한 성공/실패/하락 확률 산출
  const rateInfo = GameManager.getEnhanceRateInfo(curLv);

  // 기본 스킬 기준 위력 및 MP 소모 스케일링 계산 (+12% per Lv)
  const baseSkill = gm.resolveSkillData(skill.id, 1) || skill;
  const baseP = baseSkill.power || 1.0;
  const baseMp = baseSkill.manaCost || 10;

  const curPower = Math.round(baseP * (1 + (curLv - 1) * 0.12) * 100);
  const curMp = Math.max(1, Math.round(baseMp * (1 + (curLv - 1) * 0.25)));

  const nextPower = Math.round(baseP * (1 + curLv * 0.12) * 100);
  const nextMp = Math.max(1, Math.round(baseMp * (1 + curLv * 0.25)));

  // 현재 레벨 및 다음 레벨 스킬 데이터 (복합 효과 수치 계산 반영)
  const curSkillResolved = gm.resolveSkillData(skill.id, curLv) || skill;
  const nextSkillResolved = !isMaxLv ? (gm.resolveSkillData(skill.id, curLv + 1) || skill) : null;

  // 복합 스킬 여부 판별 (설명 내 2개 이상의 % 계수 또는 2개 이상의 효과 키워드)
  const isCompositeSkill = useMemo(() => {
    const d = skill.description || '';
    const pctCount = (d.match(/\d+%/g) || []).length;
    const keywords = ['공격', '방어', '회복', '치유', '보호막', '기절', '출혈', '중독', '화상', '빙결', '냉각', '실명', '정화', '면역', '재생', '치명타', '은신', '반격', '도발'];
    const matched = keywords.filter(k => d.includes(k));
    return pctCount >= 2 || matched.length >= 2;
  }, [skill.description]);

  // 연금 재화 비용
  const enhanceCost = useMemo(() => {
    if (isMaxLv) return {};
    return GameManager.getGrimoireEnhanceCost(curLv);
  }, [curLv, isMaxLv]);

  const canAffordRes = useMemo(() => {
    if (isMaxLv || isBuildingLvTooLow || isPaused) return false;
    const res = gm.resources as unknown as Record<string, number>;
    return Object.entries(enhanceCost).every(([k, v]) => (res[k] || 0) >= (v as number));
  }, [isMaxLv, isBuildingLvTooLow, isPaused, enhanceCost, gm.resources]);

  const canEnhance = !isMaxLv && !isBuildingLvTooLow && !isPaused && canAffordRes;

  const rType = getSkillBookRarity(skill.rank || 1);
  const rMeta = GRIMOIRE_RARITY_META[rType] || GRIMOIRE_RARITY_META.common;

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<'success' | 'keep' | 'drop' | undefined>(undefined);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    result: 'success' | 'keep' | 'drop' | 'error';
    newLevel: number;
    error?: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const targetLv = curLv + 1;
  // ⏳ 스킬 강화 레벨별 점진적 소요 시간 (Lv.2~3: 1.5초, Lv.4~6: 2.2초, Lv.7~9: 3.2초, Lv.10: 4.2초)
  const enhanceDurationMs = targetLv <= 3 ? 1500 : (targetLv <= 6 ? 2200 : (targetLv <= 9 ? 3200 : 4200));

  const handleEnhance = () => {
    if (!canEnhance || isEnhancing) return;
    const rate = GameManager.getEnhanceRateInfo(curLv);
    const roll = Math.random() * 100;
    const outcome: 'success' | 'keep' | 'drop' = roll < rate.successRate
      ? 'success'
      : (roll < rate.successRate + rate.failKeepRate ? 'keep' : 'drop');
    setPendingOutcome(outcome);
    setIsEnhancing(true);
  };

  const handleEnhanceComplete = () => {
    setIsEnhancing(false);
    const res = gm.enhanceHeroLearnedSkill(currentHero.id, skill.id, pendingOutcome);
    setLastResult(res);
    setPendingOutcome(undefined);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <Modal
      title="🧪 에테르 공방 — 스킬 비전 강화"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-2 w-full">
          <ActionButton
            label="닫기"
            variant="ghost"
            className="w-24 shrink-0"
            onClick={onClose}
          />
          <ActionButton
            label={
              isEnhancing
                ? '⏳ 강화 각인 진행 중...'
                : isMaxLv
                ? '★ 최고 강화 단계 (+10)'
                : isBuildingLvTooLow
                ? `공방 증축 필요 (최대 Lv.${maxEnhanceAllowed})`
                : isPaused
                ? '⚠️ 공방 가동 중단됨'
                : !canAffordRes
                ? '재료 부족'
                : `⚡ 스킬 비전 강화 시도 (성공률 ${rateInfo.successRate}%)`
            }
            variant={canEnhance && !isEnhancing ? 'primary' : 'ghost'}
            disabled={!canEnhance || isEnhancing}
            className="flex-1 font-bold text-xs"
            onClick={handleEnhance}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-1 text-left">
        {/* 대상 영웅 및 스킬 헤더 */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl bg-[#0e1320] border"
          style={{ borderColor: `${rMeta.color}66` }}
        >
          <div
            className="w-13 h-13 rounded-xl bg-[#141d2f] border flex items-center justify-center text-3xl shrink-0 shadow-md"
            style={{ borderColor: `${rMeta.color}88` }}
          >
            <GameIcon name={skill.id} icon={skill.icon || '📖'} size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-bold text-white truncate">{skill.name}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold"
                style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.borderColor}` }}
              >
                {rMeta.label}
              </span>
              <span className={`text-xs font-mono font-bold ${isMaxLv ? 'text-[#ffd54f]' : 'text-[#38ef7d]'}`}>
                [Lv.{curLv}/10]
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b9bb4] mt-0.5">
              <span>👤 {currentHero.name}의 습득 기술</span>
            </div>
          </div>
        </div>

        {/* 위력 및 MP 소모량 비교 카드 (파워와 함께 MP 소모도 증가) */}
        <div className="p-3 rounded-xl bg-[#12141a] border border-[#1e2a3f] flex flex-col gap-2.5">
          <div className="text-xs font-bold text-[#80cbc4] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>⚡ 위력 및 마나(MP) 변화</span>
              {isCompositeSkill && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#9c27b033] border border-[#ba68c855] text-[#e1bee7] font-normal">
                  ✨ 복합 효과 동반 강화
                </span>
              )}
            </span>
            <span className="text-[10px] text-[#ffd54f]">강화 시 전체 계수 +12% / 소모 MP +25%</span>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#0a0d16] border border-[#1b263b]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-[#8b9bb4]">현재 상태 (Lv.{curLv})</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-[#64b5f6]">{curPower}% 주계수</span>
                <span className="text-xs font-mono text-[#81d4fa]">({curMp} MP)</span>
              </div>
            </div>
            {!isMaxLv ? (
              <div className="flex flex-col gap-0.5 border-l border-[#1f2738] pl-2.5">
                <span className="text-[10px] text-[#38ef7d]">강화 후 (Lv.{curLv + 1})</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-[#38ef7d]">
                    {nextPower}% <span className="text-[10px] text-[#81c784] font-normal">(+12%)</span>
                  </span>
                  <span className="text-xs font-mono text-[#ffd54f]">({nextMp} MP)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-l border-[#1f2738]">
                <span className="text-xs font-bold text-[#ffd54f]">★ 최고 위력 달성</span>
              </div>
            )}
          </div>

          {/* 스킬 설명 및 단계별 효과 프리뷰 (복합 효과 성장 수치 실시간 비교 노출) */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#0c101c] border border-[#1a2336] text-[11px]">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[#90a4ae] text-[10px] font-bold">
                <span>🔹 현재 적용 효과 [Lv.{curLv}]</span>
              </div>
              <div className="text-[#cfd8dc] leading-relaxed pl-1">
                {curSkillResolved.description}
              </div>
            </div>
            {!isMaxLv && nextSkillResolved && (
              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-[#1a2336]">
                <div className="flex items-center justify-between text-[#81c784] text-[10px] font-bold">
                  <span>✨ 다음 레벨 강화 시 [Lv.{curLv + 1}]</span>
                  <span className="text-[9px] text-[#38ef7d] font-normal">
                    {isCompositeSkill ? '주요 계수 및 부가 효과 동반 상승 (+12%)' : '위력 계수 +12% 성장'}
                  </span>
                </div>
                <div className="text-[#80cbc4] leading-relaxed pl-1 font-medium">
                  {nextSkillResolved.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🎲 강화 확률 상세 비교 게이지 & 안내 (장비 강화와 동일 확률) */}
        {!isMaxLv && (
          <div className="p-3 bg-[#131926] border border-[#222d42] rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">🎲 강화 확률 분석</span>
              <span className="text-[10px] text-[#8b9bb4]">
                {curLv < 3
                  ? '🟢 100% 안전 강화'
                  : curLv < 6
                  ? '🟡 실패 시 레벨 유지'
                  : '🔴 실패 시 레벨 하락 위험'}
              </span>
            </div>

            {/* 확률 프로그레스 바 (성공 / 유지 / 하락) */}
            <div className="h-3.5 w-full bg-[#1e2738] rounded-full overflow-hidden flex border border-[#2a374e]">
              {rateInfo.successRate > 0 && (
                <div
                  className="h-full bg-[#38ef7d] transition-all flex items-center justify-center text-[9px] font-bold text-black"
                  style={{ width: `${rateInfo.successRate}%` }}
                  title={`성공: ${rateInfo.successRate}%`}
                >
                  {rateInfo.successRate >= 15 ? `${rateInfo.successRate}%` : ''}
                </div>
              )}
              {rateInfo.failKeepRate > 0 && (
                <div
                  className="h-full bg-[#ffd54f] transition-all flex items-center justify-center text-[9px] font-bold text-black"
                  style={{ width: `${rateInfo.failKeepRate}%` }}
                  title={`실패 시 유지: ${rateInfo.failKeepRate}%`}
                >
                  {rateInfo.failKeepRate >= 15 ? `${rateInfo.failKeepRate}%` : ''}
                </div>
              )}
              {rateInfo.failDropRate > 0 && (
                <div
                  className="h-full bg-[#ef5350] transition-all flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${rateInfo.failDropRate}%` }}
                  title={`실패 시 하락: ${rateInfo.failDropRate}%`}
                >
                  {rateInfo.failDropRate >= 15 ? `${rateInfo.failDropRate}%` : ''}
                </div>
              )}
            </div>

            {/* 확률 뱃지 수치 */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono mt-0.5">
              <div className="p-1.5 rounded-lg bg-[#38ef7d15] border border-[#38ef7d33]">
                <div className="text-[10px] text-[#38ef7d] font-bold">✨ 성공 확률</div>
                <div className="text-sm font-bold text-[#38ef7d]">{rateInfo.successRate}%</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#ffd54f15] border border-[#ffd54f33]">
                <div className="text-[10px] text-[#ffd54f] font-bold">🛡️ 실패(유지)</div>
                <div className="text-sm font-bold text-[#ffd54f]">{rateInfo.failKeepRate}%</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#ef535015] border border-[#ef535033]">
                <div className="text-[10px] text-[#ef5350] font-bold">💥 실패(하락)</div>
                <div className="text-sm font-bold text-[#ef5350]">{rateInfo.failDropRate}%</div>
              </div>
            </div>
          </div>
        )}

        {/* 소모 재료 (연금 재료) */}
        {!isMaxLv && (
          <div className="p-3 rounded-xl bg-[#121826] border border-[#1f2a3f] flex flex-col gap-2">
            <div className="text-xs font-bold text-[#e2ecf8] flex items-center justify-between">
              <span>🔮 강화 필요 소모 재료</span>
              <span className="text-[10px] text-[#8b9bb4]">보유량 / 필요량</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 연금 자원 비용 */}
              {Object.entries(enhanceCost).map(([k, reqAmt]) => {
                const meta = GameManager.getResourceMeta(k as keyof GameResources);
                const cur = (gm.resources as unknown as Record<string, number>)[k] || 0;
                const isMet = cur >= (reqAmt as number);
                return (
                  <div
                    key={k}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-mono ${
                      isMet
                        ? 'bg-[#142018] border-[#38ef7d44] text-[#cfd8e8]'
                        : 'bg-[#291214] border-[#ef535044] text-[#ff8a80]'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span className="font-sans text-[11px] text-[#8b9bb4]">{meta.name}</span>
                    <span className={`font-bold ${isMet ? 'text-[#38ef7d]' : 'text-[#ef5350]'}`}>
                      {cur.toLocaleString()} / {(reqAmt as number).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🎉/⚠️ 스킬 강화 결과 배너 */}
        {lastResult && (
          <div
            className={`p-3 rounded-xl border flex flex-col gap-1.5 animate-fade-in ${
              lastResult.result === 'success'
                ? 'bg-[#18281d] border-[#38ef7d66] text-[#38ef7d]'
                : lastResult.result === 'keep'
                ? 'bg-[#292212] border-[#ffd54f66] text-[#ffd54f]'
                : lastResult.result === 'error'
                ? 'bg-[#2b1214] border-[#ef535066] text-[#ef5350]'
                : 'bg-[#2b1214] border-[#ef535066] text-[#ef5350]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span>{lastResult.result === 'success' ? '✨' : (lastResult.result === 'keep' ? '⚠️' : '💥')}</span>
                <span>
                  {lastResult.result === 'success'
                    ? `스킬 비전 강화 성공! (Lv.${lastResult.newLevel})`
                    : lastResult.result === 'keep'
                    ? `강화 실패 (현재 수치 Lv.${lastResult.newLevel} 유지)`
                    : lastResult.result === 'error'
                    ? `강화 실패 (${lastResult.error || '조건 미충족'})`
                    : `강화 대실패! 레벨 하락 (Lv.${lastResult.newLevel})`}
                </span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-black/40 border border-current">
                {lastResult.result.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-[#cfd8e8] leading-tight">
              {lastResult.result === 'success'
                ? `[${skill.name}] 스킬의 위력이 12% 증가하고 마도 영창이 강화되었습니다!`
                : lastResult.result === 'keep'
                ? '에테르 기류 불안정으로 강화에 실패했습니다. 스킬 레벨은 유지되며 연금 재료만 소모되었습니다.'
                : lastResult.result === 'error'
                ? (lastResult.error ? `강화 불가 원인: ${lastResult.error}` : '필요 재화 또는 공방 조건이 부족합니다.')
                : '마력 역류 충격으로 인해 스킬 레벨이 1단계 하락했습니다.'}
            </div>
          </div>
        )}

        {/* 공방 레벨 제한 안내 배너 */}
        <div className="p-2.5 rounded-xl bg-[#0f1523] border border-[#1a2538] flex items-center justify-between text-xs">
          <span className="text-[#8b9bb4]">에테르 공방 현황</span>
          <span className="text-xs font-medium text-[#cfd8e8]">
            공방 Lv.{alchemyLv} <span className="text-[#80cbc4] font-mono">(최대 강화 한도: Lv.{maxEnhanceAllowed})</span>
          </span>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* 🌟 스킬 비전 강화 연출 모달 🌟 */}
      <CraftProgressModal
        open={isEnhancing}
        type="enhance_skill"
        title="스킬 비전 과충전 강화"
        itemName={skill.name}
        itemIcon={skill.icon || '📖'}
        itemSub={`+${targetLv}강 비전 각인`}
        durationMs={enhanceDurationMs}
        outcome={pendingOutcome}
        onComplete={handleEnhanceComplete}
      />
    </Modal>
  );
};
