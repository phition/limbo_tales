import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { GameManager } from '../managers/GameManager';
import { FallenHero } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { ANCESTRAL_BLESSINGS_CONFIG, GRADE_BLESSING_MULT, createActiveBlessingForHero, getOfferingEtherCost } from '../data/ancestralBlessings';
import { GoogleAdService } from '../services/GoogleAdService';

interface Props {
  open: boolean;
  onClose: () => void;
  gm: GameManager;
}

const GRADE_INFO: Record<string, { label: string; color: string; border: string; bg: string }> = {
  rookie: { label: '일반 (N)', color: '#9e9e9e', border: '#75757544', bg: '#42424222' },
  veteran: { label: '베테랑 (V)', color: '#4caf50', border: '#4caf5044', bg: '#4caf5022' },
  hero: { label: '영웅 (H)', color: '#29b6f6', border: '#29b6f644', bg: '#29b6f622' },
  elite: { label: '엘리트 (H)', color: '#29b6f6', border: '#29b6f644', bg: '#29b6f622' },
  epic: { label: '에픽 (E)', color: '#ab47bc', border: '#ab47bc44', bg: '#ab47bc22' },
  legend: { label: '전설 (L)', color: '#ffd54f', border: '#ffd54f44', bg: '#ffd54f22' },
};

const formatCooldown = (ms: number): string => {
  if (ms <= 0) return '0초';
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
  return `${secs}초`;
};

export const CemeteryModal: React.FC<Props> = ({ open, onClose, gm }) => {
  const [selectedHero, setSelectedHero] = useState<FallenHero | null>(null);
  const [, setTick] = useState(0);

  // 1초마다 쿨다운 및 버프 잔여 시간 실시간 갱신
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const [isAdLoading, setIsAdLoading] = useState(false);

  const cemetery = gm.cemetery || [];
  const lockedCount = cemetery.filter(h => h.isLocked).length;
  const heroCount = Math.min(5, cemetery.length);
  // 영웅 수에 따라 기본 10% ~ 최대 30% (영웅 1명: 10%, 2명: 15%, 3명: 20%, 4명: 25%, 5명: 30%)
  const expBonusPct = heroCount > 0 ? Math.min(30, 10 + (heroCount - 1) * 5) : 10;
  const isExpBuffActive = gm.memorialExpBuffUntil > Date.now() && heroCount > 0;
  const expBuffMsLeft = Math.max(0, gm.memorialExpBuffUntil - Date.now());
  const activeBlessing = gm.activeAncestralBlessing;

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
    <Modal
      title="🪦 성채 묘지 — 영령의 안식처 (Citadel Cemetery)"
      open={open}
      onClose={() => {
        setSelectedHero(null);
        onClose();
      }}
      footer={
        <ActionButton
          label="성채로 돌아가기"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSelectedHero(null);
            onClose();
          }}
        />
      }
    >
      <div className="flex flex-col gap-3 py-1">
        {/* 1. 상단 헌사 & 묘지 전용 헌화 액션 배너 */}
        <div className="p-3 rounded-xl bg-[#121620] border border-[#2b354d] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl select-none">🪦</span>
              <div>
                <div className="text-xs font-bold text-[#e2ecf8] flex items-center gap-1.5 flex-wrap">
                  <span>영원히 기억될 결사대의 비문</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff416c22] text-[#ff7043] font-mono font-bold">
                    전사자 {cemetery.length}명
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
                <div className="text-[11px] text-[#8b9bb4] mt-0.5 leading-relaxed">
                  {heroCount === 0
                    ? '묘지에 안장된 영웅이 없습니다. 심연의 흑무 속에서 전사한 영웅이 이곳에 안장됩니다.'
                    : `안장된 영령 ${heroCount}명 (기본 10% + 영령당 5%, 최대 30%) ➔ 광고 시청 시 5분간 전투 획득 경험치 +${expBonusPct}% 가호 (심연 촉매 동시 개방)`}
                </div>
              </div>
            </div>

            {/* 묘지 자체 헌화 버튼 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePayRespectAll}
                disabled={heroCount === 0 || isAdLoading}
                className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  heroCount > 0
                    ? 'bg-gradient-to-r from-[#ffd54f22] via-[#ffb30033] to-[#ffd54f22] hover:from-[#ffd54f33] hover:to-[#ffb30055] text-[#ffd54f] border-[#ffd54f88] cursor-pointer shadow-[0_0_10px_rgba(255,213,79,0.2)]'
                    : 'bg-[#151c2a] text-[#607d8b] border-[#253248] cursor-not-allowed opacity-60'
                }`}
                title={heroCount === 0 ? '안장된 영웅이 없어 헌화할 수 없습니다' : `광고 시청 ➔ 5분간 전투 획득 경험치 +${expBonusPct}% 가호 & 심연 촉매 슬롯 개방`}
              >
                <span>🎬</span>
                <span>{isAdLoading ? '광고 로딩 중...' : '광고 보고 헌화하기'}</span>
                <span className="text-[10px] opacity-90 font-mono text-[#38ef7d]">
                  (+{expBonusPct}% EXP)
                </span>
              </button>
            </div>
          </div>

          {/* 활성 상태 뱃지 줄 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#1e2638] text-[11px]">
            {/* 헌화 EXP 버프 현황 */}
            <div className={`flex items-center justify-between p-2 rounded-lg border ${
              isExpBuffActive
                ? 'bg-[#ffd54f12] border-[#ffd54f44] text-[#ffd54f]'
                : 'bg-[#151c2a] border-[#253248] text-[#8b9bb4]'
            }`}>
              <div className="flex items-center gap-1.5">
                <span>🕯️</span>
                <span className="font-semibold text-white">헌화 가호:</span>
                {isExpBuffActive ? (
                  <span className="font-mono font-bold text-[#ffd54f]">
                    전투 EXP +{expBonusPct}%
                  </span>
                ) : (
                  <span className="text-[10px] text-[#78909c]">비활성 (헌화 시 5분 부여)</span>
                )}
              </div>
              {isExpBuffActive && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#fff] border border-[#ffd54f44]">
                  {formatCooldown(expBuffMsLeft)}
                </span>
              )}
            </div>

            {/* 영령 결속 가호 현황 (다음 원정 1회 적용) */}
            <div className={`flex items-center justify-between p-2 rounded-lg border ${
              activeBlessing
                ? 'bg-[#ab47bc15] border-[#ba68c855] text-[#e1bee7]'
                : 'bg-[#151c2a] border-[#253248] text-[#8b9bb4]'
            }`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span>⚰️</span>
                <span className="font-semibold text-white shrink-0">결속된 영령:</span>
                {activeBlessing ? (
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-bold text-[#ffd54f] truncate">{activeBlessing.name}</span>
                    <span className="text-[10px] text-[#c8aa6e] shrink-0">({activeBlessing.heroName})</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#78909c]">미결속 (공물 봉헌 시 발동)</span>
                )}
              </div>
              {activeBlessing && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c866] font-bold shrink-0">
                  다음 1회 원정
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. 묘비 목록 */}
        {cemetery.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0a0b10] border border-[#1a2338] text-center flex flex-col items-center gap-2">
            <span className="text-4xl opacity-50">🕊️</span>
            <div className="text-xs font-bold text-[#cfd8e8]">
              아직 방주를 위해 전사한 영웅이 없습니다.
            </div>
            <div className="text-[11px] text-[#607d8b]">
              모든 대원이 사경을 헤치고 살아남아 성채의 등불을 지켜내고 있습니다.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto no-scrollbar pr-0.5">
            {cemetery.map((h) => {
              const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === h.classId);
              const dateStr = new Date(h.fallenAt).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const blessingConfig = ANCESTRAL_BLESSINGS_CONFIG[h.classId] || ANCESTRAL_BLESSINGS_CONFIG['squire'];
              const gradeMult = GRADE_BLESSING_MULT[h.grade] || 1.0;
              const gradeStyle = GRADE_INFO[h.grade] || GRADE_INFO['rookie'];
              const isBound = activeBlessing?.heroId === h.id;
              const cooldownLeft = gm.getHeroOfferingCooldownLeft(h.id);
              const onCooldown = cooldownLeft > 0;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHero(h)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2 ${
                    isBound
                      ? 'bg-gradient-to-b from-[#201035] to-[#120f22] border-[#ba68c8aa] shadow-[0_0_12px_rgba(186,104,200,0.2)]'
                      : h.isLocked
                      ? 'bg-gradient-to-b from-[#181824] to-[#0f111a] border-[#ffd54f66] shadow-[0_0_8px_rgba(255,213,79,0.15)] hover:border-[#ffd54faa]'
                      : 'bg-gradient-to-b from-[#111624] to-[#0c0f18] border-[#26344d] hover:border-[#ffd54f88]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-[#182030] border border-[#2d3d5a] flex items-center justify-center text-xl shrink-0 grayscale group-hover:grayscale-0 transition-all">
                      {cls?.skills[0]?.icon ?? '⚔️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white group-hover:text-[#ffd54f] transition-colors truncate">
                          {h.name}
                        </span>
                        <span className="text-[10px] text-[#ffd54f] font-mono font-bold">
                          Lv.{h.level}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                          style={{ color: gradeStyle.color, background: gradeStyle.bg, border: `1px solid ${gradeStyle.border}` }}
                        >
                          {gradeStyle.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] truncate">
                        {cls?.name || '결사대원'} · {h.title}
                      </div>
                      <div className="text-[9px] text-[#ef5350] mt-0.5 flex items-center gap-1">
                        <span>💀 심연 {h.fallenFloor}층에서 전사</span>
                      </div>
                    </div>
                  </div>

                  {/* 영령의 가호 요약 배너 */}
                  <div className="p-2 rounded-lg bg-[#0e1422] border border-[#1d273a] flex flex-col gap-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#ba68c8] font-bold">
                        <span>{blessingConfig.icon}</span>
                        <span>{blessingConfig.name}</span>
                        <span className="text-[9px] text-[#ffd54f] font-mono font-normal">
                          (x{gradeMult.toFixed(2)})
                        </span>
                      </div>
                      {isBound ? (
                        <span className="px-1.5 py-0.2 rounded bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c866] font-bold text-[9px]">
                          ✨ 결속 중 (1회)
                        </span>
                      ) : onCooldown ? (
                        <span className="px-1.5 py-0.2 rounded bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono text-[9px]">
                          ⏳ {formatCooldown(cooldownLeft)}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e44] text-[9px]">
                          🔮 에테르 {getOfferingEtherCost(h.grade)}개
                        </span>
                      )}
                    </div>
                    <div className="text-[#8b9bb4] text-[9px] line-clamp-1">
                      {blessingConfig.baseDescription}
                    </div>
                  </div>

                  {/* 하단 버튼 바 */}
                  <div className="pt-2 border-t border-[#1c2538] flex items-center justify-between text-[10px] text-[#607d8b] gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleLock(e, h.id)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all border flex items-center gap-1 ${
                        h.isLocked
                          ? 'bg-[#ffd54f22] text-[#ffd54f] border-[#ffd54f88] hover:bg-[#ffd54f33]'
                          : 'bg-[#1e293b44] text-[#64748b] border-[#334155] hover:text-[#e2e8f0] hover:border-[#64748b]'
                      }`}
                      title={
                        h.isLocked
                          ? '안치 잠금 해제'
                          : lockedCount >= 3
                          ? '최대 3명까지만 잠금할 수 있습니다.'
                          : '안치 잠금 (새 유해가 들어와도 밀려나지 않음)'
                      }
                    >
                      <span>{h.isLocked ? '🔒' : '🔓'}</span>
                      <span className="font-bold">{h.isLocked ? '잠금' : '잠금'}</span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="truncate hidden sm:inline">{dateStr}</span>
                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded font-bold text-[10px] transition-all flex items-center gap-1 ${
                          isBound
                            ? 'bg-[#ba68c833] text-[#f48fb1] border border-[#ba68c866]'
                            : 'bg-[#ab47bc18] hover:bg-[#ab47bc33] text-[#ce93d8] border border-[#ba68c844]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHero(h);
                        }}
                        title="영령의 가호 상세 확인 및 공물 결속"
                      >
                        <span>⚰️</span>
                        <span>{isBound ? '결속 확인' : '가호 결속'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. 선택한 영령 모달: 기도와 공물(등급별 에테르 30~100개)로 가호만 획득 */}
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
          const currentEther = gm.resources.ether || 0;
          const hasEther = currentEther >= ETHER_COST;

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
                  <div className="w-12 h-12 rounded-xl bg-[#182030] border border-[#3b4c6c] flex items-center justify-center text-2xl shrink-0">
                    {cls?.skills[0]?.icon ?? '⚔️'}
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
                        style={{ color: gradeStyle.color, background: gradeStyle.bg, border: `1px solid ${gradeStyle.border}` }}
                      >
                        {gradeStyle.label}
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
                      <span className="text-2xl">{blessingConfig.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-[#ba68c8] flex items-center gap-1.5">
                          <span>영령의 가호: {blessingConfig.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ba68c822] text-[#f48fb1] border border-[#ba68c844]">
                            다음 원정 1회 적용
                          </span>
                        </span>
                        <div className="text-[10px] text-[#ffd54f] mt-0.5">
                          등급 가호 배율: x{gradeMult.toFixed(2)} ({gradeStyle.label})
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
                      <span className="text-base">🔮</span>
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

                  {/* 규칙 설명 안내 */}
                  <div className="text-[10px] text-[#90a4ae] space-y-1 pt-1 leading-relaxed border-t border-[#37264a]">
                    <div className="flex items-start gap-1 text-[#ffd54f]">
                      <span>⚡</span>
                      <span><strong>원정 1회 적용:</strong> 가호는 다음 심연 탐험 1회 동안만 지속되며, 원정 귀환이나 전멸 정산 시 자동으로 해제됩니다.</span>
                    </div>
                    <div className="flex items-start gap-1 text-[#ce93d8]">
                      <span>🔄</span>
                      <span><strong>가호 덮어쓰기:</strong> 다른 영령에게 공물을 바치면 이전 가호는 즉시 해제되고 새로운 가호로 교체됩니다.</span>
                    </div>
                    <div className="flex items-start gap-1 text-[#80cbc4]">
                      <span>⏳</span>
                      <span><strong>1시간 쿨다운:</strong> 공물을 바친 영웅은 1시간 동안 안식 상태에 들어가며 재공물이 제한됩니다.</span>
                    </div>
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
    </Modal>
  );
};
