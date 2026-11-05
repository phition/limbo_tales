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
import { useI18n } from '../hooks/useI18n';
import { formatCooldownMs } from '../utils/timeUtils';

interface Props {
  onBack: () => void;
}

const GRADE_INFO: Record<string, { label: string; color: string; border: string; bg: string }> = {
  rookie: { label: 'N', color: '#8a95a5', border: '#8a95a533', bg: '#8a95a515' },
  veteran: { label: 'V', color: '#66bb6a', border: '#66bb6a33', bg: '#66bb6a15' },
  hero: { label: 'H', color: '#dcc496', border: '#dcc49644', bg: '#dcc49618' },
  elite: { label: 'H', color: '#dcc496', border: '#dcc49644', bg: '#dcc49618' },
  epic: { label: 'E', color: '#ba68c8', border: '#ba68c844', bg: '#ba68c818' },
  legend: { label: 'L', color: '#f59e0b', border: '#f59e0b44', bg: '#f59e0b20' },
};

export const CemeteryDrawer: React.FC<Props> = ({ onBack }) => {
  const { tr, lang } = useI18n();
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
        title: tr('영령 추모 헌화'),
        description: tr(`위령비에 등불을 바치고 5분간 전투 EXP +${expBonusPct}% 가호를 얻습니다.`),
        rewardText: tr(`전투 EXP +${expBonusPct}% 가호 (5분) & 심연 촉매 슬롯 개방`),
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
    <div className="flex flex-col h-full bg-[#08090b] text-[#cfd8e8]">
      {/* ── 0. 상단 툴바 (중복 헤더 제거 및 다크 고딕 서브바) ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c0e14] border-b border-[#3d372e]/60 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-serif font-bold text-[#dcc496]">{tr('영령의 안식처')}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1710] text-[#dcc496] font-mono font-bold border border-[#b89758]/30">
              {cemetery.length}/5{tr('명')}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                lockedCount > 0
                  ? 'bg-[#b89758]/20 text-[#dcc496] border-[#b89758]/40'
                  : 'bg-[#10131a] text-[#8a95a5] border-[#222733]'
              }`}
              title={tr('안치 잠금: 최대 3명까지 잠금 설정 시 새로운 전사자가 생겨도 묘지에서 밀려나지 않습니다.')}
            >
              🔒 {lockedCount}/3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EncyclopediaBadge query="묘지" tab="systems" label={tr('묘지 백과')} />
        </div>
      </div>

      {/* ── 1. 🌟 드로우 패널 상단: 결속 현황 섹션 ── */}
      <div className="p-3 bg-[#08090b] border-b border-[#3d372e]/60 shrink-0 shadow-sm">
        {/* 현재 결속된 영령 요약 줄 */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-[#1a1226] to-[#0e0c18] border border-[#7a4891]/50 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm shrink-0">✨</span>
            <span className="text-[#a48cb6] shrink-0 font-serif font-medium">{tr('영령 결속 가호:')}</span>
            {activeBlessing ? (
              <span className="font-serif font-bold text-[#dcc496] truncate">
                [{activeBlessing.name}] <span className="text-[#ce93d8] font-normal">({activeBlessing.heroName})</span>
              </span>
            ) : (
              <span className="text-[#8a95a5] truncate">{tr('미결속 (아래 영웅 선택 후 가호 결속 가능)')}</span>
            )}
          </div>
          {activeBlessing && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ba68c8]/25 text-[#f48fb1] border border-[#ba68c8]/50 font-serif font-bold shrink-0 shadow-sm">
              {tr('다음 1회 원정')}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. 🌟 영웅 간략 리스트 (얼굴, 클래스, 이름, 레벨, 등급) ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0 bg-[#08090b]">
        {cemetery.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2.5 bg-[#10131a]/60 border border-[#222733] rounded-xl">
            <span className="text-4xl opacity-50 select-none">🕊️</span>
            <div className="text-xs font-serif font-bold text-[#dcc496]">
              {tr('아직 성채 묘지에 안장된 영웅이 없습니다.')}
            </div>
            <div className="text-[11px] text-[#8a95a5]">
              {tr('모든 결사대원이 사경을 헤치고 살아남아 성채의 등불을 지켜내고 있습니다.')}
            </div>
          </div>
        ) : (
          cemetery.slice(0, 5).map((h, idx) => {
            const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === h.classId);
            const gradeStyle = GRADE_INFO[h.grade] || GRADE_INFO['rookie'];
            const isBound = activeBlessing?.heroId === h.id;
            const cooldownLeft = gm.getHeroOfferingCooldownLeft(h.id);
            const onCooldown = cooldownLeft > 0;

            const customPortrait = CustomAssetService.getHeroPortrait(h);

            return (
              <div
                key={h.id || idx}
                onClick={() => setSelectedHero(h)}
                className={`relative p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm select-none ${
                  isBound
                    ? 'bg-gradient-to-r from-[#211236] to-[#140d22] border-2 border-[#ba68c8] shadow-[0_0_15px_rgba(186,104,200,0.3)] hover:border-[#dcc496]'
                    : h.isLocked
                    ? 'bg-gradient-to-r from-[#1c1810] to-[#12100a] border border-[#b89758]/60 shadow-[0_0_10px_rgba(184,151,88,0.2)] hover:border-[#b89758]'
                    : onCooldown
                    ? 'bg-[#0a0c10] border border-[#1c222e] opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
                    : 'bg-[#10131a] hover:bg-[#161a24] border border-[#222733] hover:border-[#3d372e]'
                }`}
              >
                {/* 좌측: 얼굴(초상화) + 클래스/이름/레벨/등급 */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* 얼굴/아이콘 */}
                  <div className="w-11 h-11 rounded-lg bg-[#08090b] border border-[#2a261f] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
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
                      <span className="text-xs font-serif font-bold text-white truncate max-w-[120px]">
                        {h.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#dcc496]">
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

                    <div className="text-[11px] text-[#8a95a5] truncate mt-0.5">
                      {tr(cls?.name || '결사대원')}
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
                        ? 'bg-[#b89758]/20 text-[#dcc496] border-[#b89758]/60 hover:bg-[#b89758]/30 font-serif font-bold'
                        : 'bg-[#1a1c24] text-[#8a95a5] border border-[#2a261f] hover:text-[#dcc496] hover:border-[#3d372e]'
                    }`}
                    title={
                      h.isLocked
                        ? tr('안치 잠금 해제 (클릭 시 잠금 해제)')
                        : lockedCount >= 3
                        ? tr('최대 3명까지만 잠금할 수 있습니다.')
                        : tr('안치 잠금 (새 유해가 들어와도 밀려나지 않음)')
                    }
                  >
                    <span>{h.isLocked ? '🔒' : '🔓'}</span>
                    <span className="text-[10px] font-bold">{h.isLocked ? tr('잠금') : tr('잠금')}</span>
                  </button>

                  {isBound && (
                    <span className="px-2 py-0.5 rounded bg-[#ba68c8]/25 text-[#f48fb1] border border-[#ba68c8]/60 font-serif font-bold text-[10px] shadow-[0_0_10px_rgba(186,104,200,0.35)] animate-pulse">
                      ✨ {tr('결속 중')}
                    </span>
                  )}
                  {onCooldown && !isBound && (
                    <span className="px-2 py-0.5 rounded bg-[#ef5350]/15 text-[#ef5350] border border-[#ef5350]/30 font-mono text-[10px]">
                      ⏳ {tr('쿨다운')} {formatCooldownMs(cooldownLeft, lang)}
                    </span>
                  )}
                  {!isBound && !onCooldown && (
                    <span className="text-[11px] text-[#dcc496] opacity-90 flex items-center gap-0.5 font-serif">
                      <span>{tr('상세')}</span>
                      <span className="text-[9px]">▶</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 2.5 🌟 패널 하단: 가로길이 반응형 헌화하기 버튼 바 ── */}
      <div className="p-3 bg-[#0c0e14] border-t border-[#3d372e]/60 shrink-0">
        <div className="max-w-md w-full mx-auto">
          <button
            type="button"
            onClick={handlePayRespectAll}
            disabled={heroCount === 0 || isAdLoading}
            className={`w-full py-3 px-4 rounded-xl border font-serif font-bold text-sm flex items-center justify-between transition-all select-none shadow-md ${
              heroCount > 0
                ? 'bg-gradient-to-r from-[#2a2215] via-[#1c160e] to-[#2a2215] hover:from-[#3d321f] hover:to-[#2a2215] text-[#dcc496] border border-[#b89758]/60 shadow-[#b89758]/15 hover:shadow-[0_0_18px_rgba(184,151,88,0.25)] cursor-pointer active:scale-[0.98]'
                : 'bg-[#10131a] text-[#5a6578] border-[#222733] cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">🎬</span>
              <div className="text-left min-w-0">
                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{isAdLoading ? tr('광고 로딩 중...') : tr('광고 보고 영령 위령비 헌화하기')}</span>
                  {isExpBuffActive && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#34d399]/20 text-[#34d399] font-mono font-bold border border-[#34d399]/40">
                      {tr('가호 활성 중')} ({formatCooldownMs(expBuffMsLeft, lang)})
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#8a95a5] font-normal truncate mt-0.5">
                  {lang === 'en'
                    ? `Memorialize ${heroCount} Enshrined Spirits (Base 10% + 5%/spirit, max 30%) ➔ 5m Combat EXP +${expBonusPct}% Blessing & Catalyst Slots Unlocked!`
                    : lang === 'ja'
                    ? `安置された${heroCount}名の英霊追悼 (基本10% + 英霊ごと5%、最大30%) ➔ 5分間戦闘EXP +${expBonusPct}%加護＆深淵触媒スロット同時開放！`
                    : `안장된 ${heroCount}명의 영령 추모 (기본 10% + 영령당 5%, 최대 30%) ➔ 5분간 전투 EXP +${expBonusPct}% 가호 & 심연 촉매 슬롯 동시 개방!`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs ml-2">
              <span className="px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 bg-[#34d399]/15 border-[#34d399]/40 text-[#34d399]">
                <span>EXP</span>
                <span>+{expBonusPct}%</span>
              </span>
              {isExpBuffActive && (
                <span className="text-[10px] text-[#dcc496] bg-[#b89758]/20 px-1.5 py-1 rounded border border-[#b89758]/40">
                  {tr('+5분 연장')}
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

        const customPortrait = CustomAssetService.getHeroPortrait(selectedHero);

        return (
          <Modal
            title={`🪦 [${selectedHero.name}]의 영령 제단`}
            open={!!selectedHero}
            onClose={() => setSelectedHero(null)}
            footer={
              <div className="flex gap-2 w-full">
                <ActionButton
                  label={tr('닫기')}
                  variant="ghost"
                  className="w-20 shrink-0"
                  onClick={() => setSelectedHero(null)}
                />
                <ActionButton
                  label={
                    selectedHero.isLocked
                      ? tr('🔒 안치 잠금 해제')
                      : `🔒 ${tr('영구 안치')} (${lockedCount}/3)`
                  }
                  variant={selectedHero.isLocked ? 'secondary' : 'ghost'}
                  disabled={!selectedHero.isLocked && lockedCount >= 3}
                  className="w-36 shrink-0 text-xs"
                  onClick={(e) => handleToggleLock(e, selectedHero.id)}
                />
                <ActionButton
                  label={
                    isBound
                      ? tr('✨ 현재 원정에 결속됨 (활성)')
                      : onCooldown
                      ? `⏳ ${tr('영령 안식 쿨다운')} (${formatCooldownMs(cooldownLeft, lang)})`
                      : !hasEther
                      ? `🔮 ${tr('에테르 부족')} (${ETHER_COST}${tr('개 필요')})`
                      : activeBlessing
                      ? `⚰️ ${tr('기존 가호 교체 & 결속')} (${tr('에테르')} ${ETHER_COST}${tr('개')})`
                      : `⚰️ ${tr('기도와 공물 바치기')} (${tr('에테르')} ${ETHER_COST}${tr('개')})`
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
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0e14] border border-[#2a261f]">
                <div className="w-12 h-12 rounded-xl bg-[#08090b] border border-[#3d372e] flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-inner">
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
                    <span className="font-serif font-bold text-base text-white">
                      {selectedHero.name}
                    </span>
                    <span className="text-xs text-[#dcc496] font-mono font-bold">
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
                  <div className="text-xs text-[#8a95a5] mt-0.5">
                    {tr(cls?.name || '결사대원')}
                  </div>
                </div>
              </div>

              {/* 비문 카드 */}
              <div className="p-3 rounded-xl bg-[#08090b] border border-[#3d372e] text-xs text-[#dcc496] italic leading-relaxed shadow-inner">
                "{selectedHero.epitaph}"
              </div>

              {/* 영령의 가호 상세 섹션 */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1a1028] to-[#0c0814] border border-[#ba68c8]/60 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl select-none">{blessingConfig.icon}</span>
                    <div>
                      <span className="text-xs font-serif font-bold text-[#ba68c8] flex items-center gap-1.5">
                        <span>{tr('영령의 가호')}: {blessingConfig.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ba68c8]/25 text-[#f48fb1] border border-[#ba68c8]/50">
                          {tr('다음 원정 1회 적용')}
                        </span>
                      </span>
                      <div className="text-[10px] text-[#dcc496] mt-0.5">
                        {tr('등급 가호 배율')}: x{gradeMult.toFixed(2)} ([{gradeStyle.label}])
                      </div>
                    </div>
                  </div>
                  {isBound ? (
                    <span className="px-2 py-0.5 rounded bg-[#ba68c8]/25 text-[#f48fb1] border border-[#ba68c8]/60 font-serif font-bold text-[10px] shrink-0 shadow-sm animate-pulse">
                      ✨ {tr('결속 발동 중')}
                    </span>
                  ) : onCooldown ? (
                    <span className="px-2 py-0.5 rounded bg-[#ef5350]/15 text-[#ef5350] border border-[#ef5350]/30 font-mono text-[10px] shrink-0">
                      ⏳ {tr('쿨다운')} {formatCooldownMs(cooldownLeft, lang)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#b89758]/20 text-[#dcc496] border border-[#b89758]/40 text-[10px] font-serif shrink-0">
                      {tr('결속 가능')}
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#e1bee7] leading-relaxed bg-[#08060c] p-2.5 rounded-lg border border-[#7a4891]/40">
                  {previewBlessing.description}
                </div>

                {/* 🔮 공물(에테르) 소모량 및 상태 명확 표기 */}
                <div className="p-2.5 rounded-lg bg-[#0c0e14] border border-[#2a261f] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base select-none">🔮</span>
                    <span className="text-[#8a95a5]">{tr('필요 공물:')}</span>
                    <span className="font-bold text-[#dcc496] font-serif">{tr('에테르')} {ETHER_COST}{tr('개')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#8a95a5]">{tr('현재 보유:')}</span>
                    <span className={`font-bold font-mono ${hasEther ? 'text-[#34d399]' : 'text-[#ef5350]'}`}>
                      {currentEther}{tr('개')}
                    </span>
                  </div>
                </div>

                {/* 📖 백과사전 상세 도움말 뱃지 */}
                <div className="pt-2 border-t border-[#37264a] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8a95a5]">{tr('상세 규칙 & 24종 가호')}:</span>
                  <EncyclopediaBadge
                    query="묘지"
                    tab="systems"
                    label="백과: 영령의 가호"
                  />
                </div>
              </div>

              {/* 전사 기록 정보 */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-2.5 rounded-lg bg-[#0c0e14] border border-[#2a261f]">
                  <span className="text-[10px] text-[#8a95a5] block">{tr('전사 층계')}</span>
                  <span className="font-bold text-[#ff7043]">{tr('심연')} {selectedHero.fallenFloor}{tr('층')}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0c0e14] border border-[#2a261f]">
                  <span className="text-[10px] text-[#8a95a5] block">{tr('치명상을 입힌 마물')}</span>
                  <span className="font-bold text-[#ef5350] truncate block">{selectedHero.killerName}</span>
                </div>
              </div>

              {/* 생전 착용 무구 및 회수된 유품 목록 */}
              {selectedHero.equipmentSummary && selectedHero.equipmentSummary.length > 0 && (
                <div className="p-2.5 rounded-lg bg-[#0c0e14] border border-[#2a261f] text-left text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8a95a5]">{tr('생전 착용 무구')}</span>
                    <span className="text-[10px] text-[#dcc496] font-serif">{tr('📦 유품 1점 회수 / 잔여 무구 유실')}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedHero.equipmentSummary.map((eq, i) => {
                      const isRecoveredMemento = selectedHero.mementoItemName
                        ? selectedHero.mementoItemName === eq
                        : i === 0;
                      return (
                        <span
                          key={i}
                          className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                            isRecoveredMemento
                              ? 'bg-[#311b92]/30 text-[#ce93d8] border-[#7e57c2]/60 font-bold shadow-xs'
                              : 'bg-[#151821]/40 text-[#64748b] border-[#222733] line-through opacity-50'
                          }`}
                          title={isRecoveredMemento ? tr('🪦 성채로 회수된 유품 (영령 가호 시 성능 +10%)') : tr('심연 속으로 영구 유실됨')}
                        >
                          {isRecoveredMemento ? tr('🪦 [유품] ') : tr('💀 [유실] ')}
                          {tr(eq)}
                        </span>
                      );
                    })}
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
