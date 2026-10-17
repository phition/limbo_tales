import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { useGameManager } from '../hooks/useGameManager';
import { useCustomAssetVersion } from '../hooks/useCustomAssetVersion';
import { FallenHero } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import {
  ANCESTRAL_BLESSINGS_CONFIG,
  GRADE_BLESSING_MULT,
  createActiveBlessingForHero,
  getOfferingEtherCost,
} from '../data/ancestralBlessings';
import { CustomAssetService } from '../services/CustomAssetService';
import { EncyclopediaBadge } from './EncyclopediaBadge';
import { GoogleAdService } from '../services/GoogleAdService';

interface Props {
  onBack: () => void;
}

const GRADE_INFO: Record<string, { label: string; color: string; border: string; bg: string }> = {
  rookie: { label: 'N', color: '#9e9e9e', border: '#75757544', bg: '#42424222' },
  veteran: { label: 'V', color: '#4caf50', border: '#4caf5044', bg: '#4caf5022' },
  hero: { label: 'H', color: '#29b6f6', border: '#29b6f644', bg: '#29b6f622' },
  elite: { label: 'H', color: '#29b6f6', border: '#29b6f644', bg: '#29b6f622' },
  epic: { label: 'E', color: '#ab47bc', border: '#ab47bc44', bg: '#ab47bc22' },
  legend: { label: 'L', color: '#ffd54f', border: '#ffd54f44', bg: '#ffd54f22' },
};

const formatCooldown = (ms: number): string => {
  if (ms <= 0) return '0초';
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
  return `${secs}초`;
};

export const CemeteryDrawer: React.FC<Props> = ({ onBack }) => {
  const { state, gm } = useGameManager();
  useCustomAssetVersion();
  const [selectedHero, setSelectedHero] = useState<FallenHero | null>(null);
  const [, setTick] = useState(0);

  // 1초마다 쿨다운 및 버프 잔여 시간 실시간 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isAdLoading, setIsAdLoading] = useState(false);

  const cemetery = state.cemetery || gm.cemetery || [];
  const lockedCount = cemetery.filter(h => h.isLocked).length;
  const heroCount = Math.min(5, cemetery.length);
  // 영웅 수에 따라 기본 10% ~ 최대 30% (영웅 1명: 10%, 2명: 15%, 3명: 20%, 4명: 25%, 5명: 30%)
  const expBonusPct = heroCount > 0 ? Math.min(30, 10 + (heroCount - 1) * 5) : 10;
  const isExpBuffActive = state.memorialExpBuffUntil > Date.now();
  const expBuffMsLeft = Math.max(0, state.memorialExpBuffUntil - Date.now());
  const activeBlessing = state.activeAncestralBlessing || gm.activeAncestralBlessing;

  const handleToggleLock = (e?: React.MouseEvent, heroId?: string) => {
    if (e) e.stopPropagation();
    if (!heroId) return;
    const res = gm.toggleCemeteryHeroLock(heroId);
    if (res.success && selectedHero && selectedHero.id === heroId) {
      setSelectedHero({ ...selectedHero, isLocked: res.isLocked });
    }
    setTick(t => t + 1);
  };

  const handlePayRespectAll = async () => {
    if (heroCount === 0 || isAdLoading) return;
    setIsAdLoading(true);
    try {
      const res = await GoogleAdService.getInstance().showRewardedAd({
        placement: 'cemetery',
        title: '영령 추모 헌화',
        description: `위령비에 등불을 바치고 5분간 전투 EXP +${expBonusPct}% 가호를 얻습니다.`,
        rewardText: `전투 EXP +${expBonusPct}% 가호 (5분) & 심연 촉매 슬롯 개방`,
      });
      if (res.rewarded) {
        gm.payMemorialRespectAd();
        setTick(t => t + 1);
      }
    } finally {
      setIsAdLoading(false);
    }
  };

  const handleBindBlessing = (hero: FallenHero) => {
    gm.bindAncestralBlessing(hero.id);
    setTick(t => t + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-[#cfd8e8]">
      {/* ── 0. 드로어 최상단 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2738] bg-[#070a10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">🪦</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-[#e2ecf8]">성채 묘지</span>
            <span className="text-[10px] text-[#8b9bb4]">영령의 안식처</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff416c22] text-[#ff7043] font-mono font-bold border border-[#ff416c44]">
              {cemetery.length}/5명
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                lockedCount > 0
                  ? 'bg-[#ffd54f22] text-[#ffd54f] border-[#ffd54f55]'
                  : 'bg-[#78909c22] text-[#90a4ae] border-[#78909c44]'
              }`}
              title="안치 잠금: 최대 3명까지 잠금 설정 시 새로운 전사자가 생겨도 묘지에서 밀려나지 않습니다."
            >
              🔒 {lockedCount}/3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EncyclopediaBadge query="묘지" tab="systems" label="묘지 백과" />
          <button
            className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onBack}
            aria-label="닫기"
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>
      </div>

      {/* ── 1. 🌟 드로우 패널 상단: 결속 현황 섹션 ── */}
      <div className="p-3 bg-[#0d121c] border-b border-[#1c273a] shrink-0 shadow-sm">
        {/* 현재 결속된 영령 요약 줄 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#141022] border border-[#2d1b44] text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm shrink-0">✨</span>
            <span className="text-[#a48cb6] shrink-0 font-medium">영령 결속 가호:</span>
            {activeBlessing ? (
              <span className="font-bold text-[#ffd54f] truncate">
                [{activeBlessing.name}] <span className="text-[#ce93d8] font-normal">({activeBlessing.heroName})</span>
              </span>
            ) : (
              <span className="text-[#78909c] truncate">미결속 (아래 영웅 선택 후 가호 결속 가능)</span>
            )}
          </div>
          {activeBlessing && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c866] font-bold shrink-0">
              다음 1회 원정
            </span>
          )}
        </div>
      </div>

      {/* ── 2. 🌟 영웅 간략 리스트 (얼굴, 클래스, 이름, 레벨, 등급) ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {cemetery.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2.5">
            <span className="text-4xl opacity-50 select-none">🕊️</span>
            <div className="text-xs font-bold text-[#cfd8e8]">
              아직 성채 묘지에 안장된 영웅이 없습니다.
            </div>
            <div className="text-[11px] text-[#607d8b]">
              모든 결사대원이 사경을 헤치고 살아남아 성채의 등불을 지켜내고 있습니다.
            </div>
          </div>
        ) : (
          cemetery.slice(0, 5).map((h, idx) => {
            const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === h.classId);
            const gradeStyle = GRADE_INFO[h.grade] || GRADE_INFO['rookie'];
            const isBound = activeBlessing?.heroId === h.id;
            const cooldownLeft = gm.getHeroOfferingCooldownLeft(h.id);
            const onCooldown = cooldownLeft > 0;

            const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(h.classId)
              || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
              || (h.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(h.portraitPromptKey) : undefined)
              || CustomAssetService.getInstance().getMercenaryOverride(h.id)
              || CustomAssetService.getInstance().getMercenaryOverride(h.name);

            return (
              <div
                key={h.id || idx}
                onClick={() => setSelectedHero(h)}
                className={`relative p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm select-none ${
                  isBound
                    ? 'bg-gradient-to-r from-[#211138] to-[#141026] border-[#ba68c8aa] shadow-[0_0_12px_rgba(186,104,200,0.25)] hover:border-[#ba68c8]'
                    : h.isLocked
                    ? 'bg-[#151722] border-[#ffd54f55] hover:border-[#ffd54faa] shadow-[0_0_8px_rgba(255,213,79,0.15)]'
                    : onCooldown
                    ? 'bg-[#0a0d14] border-[#1c2436] opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
                    : 'bg-[#101624] hover:bg-[#141d2f] border-[#202d44] hover:border-[#c8aa6e66]'
                }`}
              >
                {/* 좌측: 얼굴(초상화) + 클래스/이름/레벨/등급 */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* 얼굴/아이콘 */}
                  <div className="w-11 h-11 rounded-lg bg-[#182030] border border-[#2d3d5a] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {customPortrait ? (
                      <img
                        src={customPortrait}
                        alt={h.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl">{cls?.skills[0]?.icon ?? '⚔️'}</span>
                    )}
                  </div>

                  {/* 영웅 정보 */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {h.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#ffd54f]">
                        Lv.{h.level}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                        style={{
                          color: gradeStyle.color,
                          background: gradeStyle.bg,
                          border: `1px solid ${gradeStyle.border}`,
                        }}
                      >
                        [{gradeStyle.label}]
                      </span>
                    </div>

                    <div className="text-[11px] text-[#8b9bb4] truncate mt-0.5">
                      {cls?.name || '결사대원'} · {h.title}
                    </div>
                  </div>
                </div>

                {/* 우측: 뱃지 (잠금 버튼 / 결속 중 뱃지 / 쿨다운 블라인드 뱃지 / 상세 화살표) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleLock(e, h.id)}
                    className={`px-2 py-1 rounded text-xs transition-all border flex items-center gap-1 ${
                      h.isLocked
                        ? 'bg-[#ffd54f22] text-[#ffd54f] border-[#ffd54f88] hover:bg-[#ffd54f33]'
                        : 'bg-[#1e293b44] text-[#64748b] border-[#334155] hover:text-[#e2e8f0] hover:border-[#64748b]'
                    }`}
                    title={
                      h.isLocked
                        ? '안치 잠금 해제 (클릭 시 잠금 해제)'
                        : lockedCount >= 3
                        ? '최대 3명까지만 잠금할 수 있습니다.'
                        : '안치 잠금 (새 유해가 들어와도 밀려나지 않음)'
                    }
                  >
                    <span>{h.isLocked ? '🔒' : '🔓'}</span>
                    <span className="text-[10px] font-bold">{h.isLocked ? '잠금' : '잠금'}</span>
                  </button>

                  {isBound && (
                    <span className="px-2 py-0.5 rounded bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c888] font-bold text-[10px] shadow-[0_0_8px_rgba(186,104,200,0.35)] animate-pulse">
                      ✨ 결속 중
                    </span>
                  )}
                  {onCooldown && !isBound && (
                    <span className="px-2 py-0.5 rounded bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono text-[10px]">
                      ⏳ 쿨다운 {formatCooldown(cooldownLeft)}
                    </span>
                  )}
                  {!isBound && !onCooldown && (
                    <span className="text-[11px] text-[#c8aa6e] opacity-80 flex items-center gap-0.5">
                      <span>상세</span>
                      <span className="text-[9px]">▶</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 2.5 🌟 패널 하단: 가로길이 반응형 헌화하기 버튼 바 (광고 완전 대체) ── */}
      <div className="p-3 bg-[#08090d] border-t border-[#1c273a] shrink-0">
        <div className="max-w-md w-full mx-auto">
          <button
            type="button"
            onClick={handlePayRespectAll}
            disabled={heroCount === 0 || isAdLoading}
            className={`w-full py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-between transition-all select-none shadow-md ${
              heroCount > 0
                ? 'bg-gradient-to-r from-[#ffd54f22] via-[#ffb30033] to-[#ffd54f22] hover:from-[#ffd54f33] hover:to-[#ffb30055] text-[#ffd54f] border-[#ffd54f88] cursor-pointer hover:shadow-[0_0_15px_rgba(255,213,79,0.25)] active:scale-[0.98]'
                : 'bg-[#121722] text-[#607d8b] border-[#202b3c] cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">🎬</span>
              <div className="text-left min-w-0">
                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{isAdLoading ? '광고 로딩 중...' : '광고 보고 영령 위령비 헌화하기'}</span>
                  {isExpBuffActive && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] font-mono font-bold border border-[#38ef7d44]">
                      가호 활성 중 ({formatCooldown(expBuffMsLeft)})
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#a0aec0] font-normal truncate mt-0.5">
                  안장된 {heroCount}명의 영령 추모 (기본 10% + 영령당 5%, 최대 30%) ➔ 5분간 전투 EXP +{expBonusPct}% 가호 & 심연 촉매 슬롯 동시 개방!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs ml-2">
              <span className="px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 bg-[#38ef7d15] border-[#38ef7d44] text-[#38ef7d]">
                <span>EXP</span>
                <span>+{expBonusPct}%</span>
              </span>
              {isExpBuffActive && (
                <span className="text-[10px] text-[#ffd54f] bg-[#ffd54f15] px-1.5 py-1 rounded border border-[#ffd54f33]">
                  +5분 연장
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ── 3. 🌟 영웅 상세 모달 (정보 표시 + 결속하기 버튼) ── */}
      {selectedHero && (() => {
        const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === selectedHero.classId);
        const blessingConfig = ANCESTRAL_BLESSINGS_CONFIG[selectedHero.classId] || ANCESTRAL_BLESSINGS_CONFIG['squire'];
        const gradeMult = GRADE_BLESSING_MULT[selectedHero.grade] || 1.0;
        const gradeStyle = GRADE_INFO[selectedHero.grade] || GRADE_INFO['rookie'];
        const previewBlessing = createActiveBlessingForHero(selectedHero);
        const isBound = activeBlessing?.heroId === selectedHero.id;
        const cooldownLeft = gm.getHeroOfferingCooldownLeft(selectedHero.id);
        const onCooldown = cooldownLeft > 0;
        const ETHER_COST = getOfferingEtherCost(selectedHero.grade);
        const currentEther = state.resources.ether || 0;
        const hasEther = currentEther >= ETHER_COST;

        const customPortrait = CustomAssetService.getInstance().getMercenaryOverride(selectedHero.classId)
          || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
          || (selectedHero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(selectedHero.portraitPromptKey) : undefined)
          || CustomAssetService.getInstance().getMercenaryOverride(selectedHero.id)
          || CustomAssetService.getInstance().getMercenaryOverride(selectedHero.name);

        return (
          <Modal
            title={`🪦 [${selectedHero.name}]의 영령 제단`}
            open={!!selectedHero}
            onClose={() => setSelectedHero(null)}
            footer={
              <div className="flex gap-2 w-full">
                <ActionButton
                  label="닫기"
                  variant="ghost"
                  className="w-20 shrink-0"
                  onClick={() => setSelectedHero(null)}
                />
                <ActionButton
                  label={
                    selectedHero.isLocked
                      ? '🔒 안치 잠금 해제'
                      : `🔒 영구 안치 (${lockedCount}/3)`
                  }
                  variant={selectedHero.isLocked ? 'secondary' : 'ghost'}
                  disabled={!selectedHero.isLocked && lockedCount >= 3}
                  className="w-36 shrink-0 text-xs"
                  onClick={(e) => handleToggleLock(e, selectedHero.id)}
                />
                <ActionButton
                  label={
                    isBound
                      ? '✨ 현재 원정에 결속됨 (활성)'
                      : onCooldown
                      ? `⏳ 영령 안식 쿨다운 (${formatCooldown(cooldownLeft)})`
                      : !hasEther
                      ? `🔮 에테르 부족 (${ETHER_COST}개 필요)`
                      : activeBlessing
                      ? `⚰️ 기존 가호 교체 & 결속 (에테르 ${ETHER_COST}개)`
                      : `⚰️ 기도와 공물 바치기 (에테르 ${ETHER_COST}개)`
                  }
                  variant={isBound ? 'secondary' : 'primary'}
                  disabled={isBound || onCooldown || !hasEther}
                  className="flex-1 font-bold text-xs"
                  onClick={() => {
                    handleBindBlessing(selectedHero);
                  }}
                />
              </div>
            }
          >
            <div className="flex flex-col gap-3 py-1">
              {/* 영웅 프로필 헤더 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0e1320] border border-[#253248]">
                <div className="w-12 h-12 rounded-xl bg-[#182030] border border-[#3b4c6c] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {customPortrait ? (
                    <img
                      src={customPortrait}
                      alt={selectedHero.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{cls?.skills[0]?.icon ?? '⚔️'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-white">
                      {selectedHero.name}
                    </span>
                    <span className="text-xs text-[#ffd54f] font-mono font-bold">
                      Lv.{selectedHero.level}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                      style={{
                        color: gradeStyle.color,
                        background: gradeStyle.bg,
                        border: `1px solid ${gradeStyle.border}`,
                      }}
                    >
                      [{gradeStyle.label}]
                    </span>
                  </div>
                  <div className="text-xs text-[#8b9bb4] mt-0.5">
                    {cls?.name || '결사대원'} · {selectedHero.title}
                  </div>
                </div>
              </div>

              {/* 비문 카드 */}
              <div className="p-3 rounded-xl bg-[#0a0b10] border border-[#202c40] text-xs text-[#cfd8e8] italic leading-relaxed">
                "{selectedHero.epitaph}"
              </div>

              {/* 영령의 가호 상세 섹션 */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1d122d] to-[#0f111d] border border-[#ba68c866] shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl select-none">{blessingConfig.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-[#ba68c8] flex items-center gap-1.5">
                        <span>영령의 가호: {blessingConfig.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ba68c822] text-[#f48fb1] border border-[#ba68c844]">
                          다음 원정 1회 적용
                        </span>
                      </span>
                      <div className="text-[10px] text-[#ffd54f] mt-0.5">
                        등급 가호 배율: x{gradeMult.toFixed(2)} ([{gradeStyle.label}])
                      </div>
                    </div>
                  </div>
                  {isBound ? (
                    <span className="px-2 py-0.5 rounded bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c866] font-bold text-[10px] shrink-0">
                      ✨ 결속 발동 중
                    </span>
                  ) : onCooldown ? (
                    <span className="px-2 py-0.5 rounded bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono text-[10px] shrink-0">
                      ⏳ 쿨다운 {formatCooldown(cooldownLeft)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e44] text-[10px] shrink-0">
                      결속 가능
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#e1bee7] leading-relaxed bg-[#140b20] p-2.5 rounded-lg border border-[#3b2456]">
                  {previewBlessing.description}
                </div>

                {/* 🔮 공물(에테르) 소모량 및 상태 명확 표기 */}
                <div className="p-2.5 rounded-lg bg-[#0e1320] border border-[#232f45] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base select-none">🔮</span>
                    <span className="text-[#8b9bb4]">필요 공물:</span>
                    <span className="font-bold text-[#c8aa6e]">에테르 {ETHER_COST}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#8b9bb4]">현재 보유:</span>
                    <span className={`font-bold font-mono ${hasEther ? 'text-[#38ef7d]' : 'text-[#ff5252]'}`}>
                      {currentEther}개
                    </span>
                  </div>
                </div>

                {/* 📖 백과사전 상세 도움말 뱃지 */}
                <div className="pt-2 border-t border-[#37264a] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8b9bb4]">상세 규칙 & 24종 가호:</span>
                  <EncyclopediaBadge
                    query="묘지"
                    tab="systems"
                    label="백과: 영령의 가호"
                  />
                </div>
              </div>

              {/* 전사 기록 정보 */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-2.5 rounded-lg bg-[#141a29] border border-[#202c44]">
                  <span className="text-[10px] text-[#8b9bb4] block">전사 층계</span>
                  <span className="font-bold text-[#ff7043]">심연 {selectedHero.fallenFloor}층</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141a29] border border-[#202c44]">
                  <span className="text-[10px] text-[#8b9bb4] block">치명상을 입힌 마물</span>
                  <span className="font-bold text-[#ff5252] truncate block">{selectedHero.killerName}</span>
                </div>
              </div>

              {/* 생전 유품 무구 목록 */}
              {selectedHero.equipmentSummary && selectedHero.equipmentSummary.length > 0 && (
                <div className="p-2.5 rounded-lg bg-[#141a29] border border-[#202c44] text-left text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b9bb4]">생전 유품 무구</span>
                    <span className="text-[10px] text-[#c8aa6e]">📦 성채 보관함으로 회수 완료</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedHero.equipmentSummary.map((eq, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-[#1f2a3f] text-[#c8aa6e] border border-[#2e3e5c]">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
