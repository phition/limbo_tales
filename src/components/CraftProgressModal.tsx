import React, { useEffect, useState, useRef } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { SoundManager } from '../managers/SoundManager';
import { GameIcon } from './GameIcon';

export type CraftActionType = 'forge' | 'enhance_equipment' | 'enchant_equipment' | 'craft_grimoire' | 'enhance_skill' | 'purify_equipment';

interface Props {
  open: boolean;
  type: CraftActionType;
  title: string;
  itemName: string;
  itemIcon?: string;
  itemSub?: string;
  durationMs: number;
  outcome?: 'success' | 'keep' | 'drop';
  onComplete: () => void;
}

export const CraftProgressModal: React.FC<Props> = ({
  open,
  type,
  title,
  itemName,
  itemIcon = '⚒️',
  itemSub,
  durationMs,
  outcome,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('');
  const [isFailing, setIsFailing] = useState(false);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const hasFinishedRef = useRef(false);

  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;
  const outcomeRef = useRef(outcome);
  outcomeRef.current = outcome;
  const typeRef = useRef(type);
  typeRef.current = type;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setPhaseText('');
      setIsFailing(false);
      hasFinishedRef.current = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    startRef.current = performance.now();
    hasFinishedRef.current = false;
    setIsFailing(false);

    const currentType = typeRef.current;
    if (currentType === 'forge') {
      SoundManager.getInstance().play('anvil');
    } else if (currentType === 'enhance_equipment') {
      SoundManager.getInstance().play('enhance');
    } else if (currentType === 'enchant_equipment') {
      SoundManager.getInstance().play('charge');
    } else if (currentType === 'craft_grimoire') {
      SoundManager.getInstance().play('craft');
      setTimeout(() => SoundManager.getInstance().play('charge'), 400);
    } else if (currentType === 'enhance_skill') {
      SoundManager.getInstance().play('charge');
    } else if (currentType === 'purify_equipment') {
      SoundManager.getInstance().play('anvil');
      setTimeout(() => SoundManager.getInstance().play('charge'), 350);
    }
    triggerHaptic('medium');

    const tick = (now: number) => {
      const totalDuration = Math.max(800, durationRef.current);
      const curType = typeRef.current;
      const curOutcome = outcomeRef.current;
      const elapsed = now - startRef.current;
      const t = Math.min(1, Math.max(0, elapsed / totalDuration));

      let currentPct = 0;
      let currentPhase = '';

      if (curType === 'enhance_equipment' || curType === 'enhance_skill' || curType === 'enchant_equipment') {
        const isFailure = curOutcome === 'keep' || curOutcome === 'drop';
        const isEnchant = curType === 'enchant_equipment';

        if (isFailure) {
          // 💥 실패 시: 0~55% 동안 72%까지 올랐다가, 이후 마력 붕괴로 0%까지 줄어들며 실패
          if (t <= 0.55) {
            currentPct = Math.floor((t / 0.55) * 72);
            setIsFailing(false);
            currentPhase = isEnchant
              ? '고대 인챈트 석판과 장비의 공명 유도 중...'
              : (t < 0.28
                ? '강화 마도석과 장비의 공명 유도 중...'
                : '심연의 마력 에너지 한계 집속 중...');
          } else {
            setIsFailing(true);
            const dropRatio = (t - 0.55) / 0.45;
            // 72%에서 0%로 급격히 감소
            currentPct = Math.max(0, Math.floor(72 * (1 - dropRatio)));
            currentPhase = isEnchant
              ? '⚠️ 마력 분산! 룬 결속 불안정...'
              : (curOutcome === 'drop'
                ? '💥 마력 역류 발생! 마도 공명 대붕괴 중...'
                : '⚠️ 마력 불안정화! 마도 공명 붕괴 중...');
          }
        } else {
          // ✨ 성공 시: 단계에 따라 긴장감 있는 증감(wobble) 후 100% 도달
          setIsFailing(false);
          if (isEnchant) {
            // 인챈트 성공: 매끄럽고 신비로운 룬 각인 상승
            currentPct = Math.floor(t * 100);
            currentPhase = t < 0.35
              ? '고대 인챈트 석판과 장비의 공명 유도 중...'
              : (t < 0.75 ? '심연의 마도 룬 슬롯 각인 및 파동 집속 중...' : '✨ 고대 마도 룬 영구 결속 성공!');
          } else if (totalDuration <= 1800) {
            // 안전 강화 (1~3강): 매끄러운 100% 상승
            currentPct = Math.floor(t * 100);
            currentPhase = t < 0.35
              ? '강화 마도석과 장비의 공명 유도 중...'
              : (t < 0.75 ? '심연의 마력 에너지 한계 집속 중...' : '마도 각인 안정화 및 정착 중...');
          } else if (totalDuration <= 2800) {
            // 4~6강: 1회 마력 불안정 감쇄 후 돌파
            if (t < 0.45) {
              currentPct = Math.floor((t / 0.45) * 65);
              currentPhase = '강화 마도석과 장비의 공명 유도 중...';
            } else if (t < 0.60) {
              const dipT = (t - 0.45) / 0.15;
              currentPct = Math.floor(65 - dipT * 18); // 65% -> 47%
              currentPhase = '⚡ 마력 불안정! 파동 억제 중...';
            } else {
              const surgeT = (t - 0.60) / 0.40;
              currentPct = Math.min(100, Math.floor(47 + surgeT * 53)); // 47% -> 100%
              currentPhase = t > 0.90 ? '✨ 마도 각인 안정화 성공!' : '심연의 마력 에너지 한계 집속 중...';
            }
          } else {
            // 7~10강: 2회 긴장감 넘치는 마력 저항 증감 후 100% 폭발
            if (t < 0.35) {
              currentPct = Math.floor((t / 0.35) * 60);
              currentPhase = '강화 마도석과 장비의 공명 유도 중...';
            } else if (t < 0.48) {
              const dip1 = (t - 0.35) / 0.13;
              currentPct = Math.floor(60 - dip1 * 16); // 60% -> 44%
              currentPhase = '⚡ 마력 불안정! 파동 억제 중...';
            } else if (t < 0.72) {
              const surge1 = (t - 0.48) / 0.24;
              currentPct = Math.floor(44 + surge1 * 38); // 44% -> 82%
              currentPhase = '심연의 마력 에너지 한계 집속 중...';
            } else if (t < 0.83) {
              const dip2 = (t - 0.72) / 0.11;
              currentPct = Math.floor(82 - dip2 * 12); // 82% -> 70%
              currentPhase = '🔮 마도 각인 공명 저항 돌파 중!';
            } else {
              const surge2 = (t - 0.83) / 0.17;
              currentPct = Math.min(100, Math.floor(70 + surge2 * 30)); // 70% -> 100%
              currentPhase = '✨ 마도 각인 완전 정착 성공!';
            }
          }
        }
      } else if (curType === 'forge') {
        // ⚒️ 대장간 단조: 소요 시간에 따라 높은 등급(희귀/영웅/전설)을 암시하며 100% 도달
        currentPct = Math.min(100, Math.floor(t * 100));
        setIsFailing(false);
        if (t < 0.30) {
          currentPhase = '심연 광석 용해 및 불순물 정제 중...';
        } else if (t < 0.65) {
          currentPhase = '마도 룬 형상 주조 및 모루 타격 중...';
        } else if (t < 0.95) {
          if (totalDuration >= 4000) {
            currentPhase = '👑 태초의 신성 마도핵 융합 중... (★ 전설 신화 강림!)';
          } else if (totalDuration >= 3000) {
            currentPhase = '🌟 심연의 마도 룬 공명 폭발 중... (영웅 등급 개화!)';
          } else if (totalDuration >= 2000) {
            currentPhase = '✨ 고농도 에테르 급랭 중... (희귀 등급 각성!)';
          } else {
            currentPhase = '신성 에테르 급랭 및 담금질 중...';
          }
        } else {
          currentPhase = '장비 단조 완성!';
        }
      } else if (curType === 'purify_equipment') {
        // ✨ 장비 정화 공정
        const isFailure = curOutcome === 'drop' || curOutcome === 'keep';
        if (isFailure) {
          if (t <= 0.55) {
            currentPct = Math.floor((t / 0.55) * 68);
            setIsFailing(false);
            currentPhase = t < 0.28
              ? '침식된 심연의 마기 추출 중...'
              : '신성 에테르 불꽃으로 정화로 가열 중...';
          } else {
            setIsFailing(true);
            const dropRatio = (t - 0.55) / 0.45;
            currentPct = Math.max(0, Math.floor(68 * (1 - dropRatio)));
            currentPhase = '⚠️ 심연 침식 폭주! 장비 균열 파괴 발생...';
          }
        } else {
          currentPct = Math.min(100, Math.floor(t * 100));
          setIsFailing(false);
          if (t < 0.35) {
            currentPhase = '침식된 심연의 마기 추출 중...';
          } else if (t < 0.75) {
            currentPhase = '신성 에테르 불꽃으로 정화로 가열 중...';
          } else {
            currentPhase = '✨ 심연 불순물 제거 및 순정 형태 복원 완료!';
          }
        }
      } else if (curType === 'craft_grimoire') {
        // 🧪 마도서 연성 공정 (정화/강화처럼 드라마틱한 긴장감 & 붕괴 실패 연출)
        const isFailure = curOutcome === 'drop' || curOutcome === 'keep';
        if (isFailure) {
          if (t <= 0.55) {
            currentPct = Math.floor((t / 0.55) * 75);
            setIsFailing(false);
            currentPhase = t < 0.28
              ? '순수 에테르 기류 농축 및 촉매 주입 중...'
              : '비전 양피지에 고대 마도 영창 각인 중...';
          } else {
            setIsFailing(true);
            const dropRatio = (t - 0.55) / 0.45;
            currentPct = Math.max(0, Math.floor(75 * (1 - dropRatio)));
            currentPhase = '⚠️ 에테르 마력 공명 붕괴! 마도 영창 소멸...';
          }
        } else {
          setIsFailing(false);
          if (t < 0.35) {
            currentPct = Math.floor((t / 0.35) * 52);
            currentPhase = '순수 에테르 기류 농축 및 촉매 반응 유도 중...';
          } else if (t < 0.50) {
            // 긴장감 밀당 구간 (52% -> 43%)
            const dip = (t - 0.35) / 0.15;
            currentPct = Math.floor(52 - dip * 9);
            currentPhase = '⚡ 마력 불안정 진동! 에테르 결계 제어 중...';
          } else if (t < 0.75) {
            const surge1 = (t - 0.50) / 0.25;
            currentPct = Math.floor(43 + surge1 * 37); // 43% -> 80%
            currentPhase = '비전 양피지에 고대 마도 영창 각인 중...';
          } else if (t < 0.88) {
            const surge2 = (t - 0.75) / 0.13;
            currentPct = Math.floor(80 + surge2 * 15); // 80% -> 95%
            currentPhase = '신비로운 에테르 지혜 결계 영구 봉인 중...';
          } else {
            currentPct = 100;
            currentPhase = '✨ 비전 마도서 연성 및 완전 제본 성공!';
          }
        }
      } else {
        // 🧪 기본 공정
        currentPct = Math.min(100, Math.floor(t * 100));
        setIsFailing(false);
        currentPhase = '작업 진행 중...';
      }

      setProgress(currentPct);
      setPhaseText(currentPhase);

      if (elapsed < totalDuration) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          triggerHaptic('heavy');
          setTimeout(() => {
            onCompleteRef.current?.();
          }, 250);
        }
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const typeConfig: Record<CraftActionType, { bgGradient: string; glowColor: string; animIcon: string; badge: string; iconKey: string }> = {
    forge: {
      bgGradient: 'from-[#2a1309] to-[#0c0d13]',
      glowColor: '#ff7043',
      animIcon: '🔨',
      badge: '대장간 단조 공정',
      iconKey: 'forge',
    },
    enhance_equipment: {
      bgGradient: 'from-[#111e38] to-[#0c0d13]',
      glowColor: isFailing ? '#ef5350' : '#c8aa6e',
      animIcon: isFailing ? '💥' : '⚡',
      badge: isFailing ? '⚠️ 마력 공명 붕괴' : '마도 장비 강화',
      iconKey: 'enhance_equipment',
    },
    enchant_equipment: {
      bgGradient: 'from-[#251538] to-[#0c0d13]',
      glowColor: isFailing ? '#ef5350' : '#ce93d8',
      animIcon: isFailing ? '💥' : '🔮',
      badge: isFailing ? '⚠️ 룬 결속 실패' : '마도 장비 인챈트',
      iconKey: 'enchant_equipment',
    },
    craft_grimoire: {
      bgGradient: isFailing ? 'from-[#380e15] to-[#0c0d13]' : 'from-[#182a22] to-[#0c0d13]',
      glowColor: isFailing ? '#ef5350' : '#26a69a',
      animIcon: isFailing ? '💥' : '📜',
      badge: isFailing ? '⚠️ 에테르 공명 붕괴' : '에테르 비전 제본',
      iconKey: 'craft_grimoire',
    },
    enhance_skill: {
      bgGradient: 'from-[#241335] to-[#0c0d13]',
      glowColor: isFailing ? '#ef5350' : '#ab47bc',
      animIcon: isFailing ? '💥' : '🌌',
      badge: isFailing ? '⚠️ 마력 역류 발생' : '스킬 비전 강화',
      iconKey: 'enhance_skill',
    },
    purify_equipment: {
      bgGradient: isFailing ? 'from-[#380e15] to-[#0c0d13]' : 'from-[#0e2a20] to-[#0c0d13]',
      glowColor: isFailing ? '#ef5350' : '#38ef7d',
      animIcon: isFailing ? '💀' : '✨',
      badge: isFailing ? '⚠️ 침식 폭주 파괴' : '병기창 신성 정화',
      iconKey: 'purify_equipment',
    }
  };

  const cfg = typeConfig[type];
  const activeGlow = isFailing ? '#ef5350' : cfg.glowColor;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        className={`relative w-full max-w-[380px] rounded-2xl border bg-gradient-to-b ${cfg.bgGradient} p-6 shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex flex-col items-center text-center overflow-hidden transition-all duration-300`}
        style={{
          borderColor: isFailing ? '#ef535088' : '#2b3a55',
          boxShadow: `0 0 35px ${activeGlow}33, inset 0 0 20px ${activeGlow}22`
        }}
      >
        {/* 상단 뱃지 */}
        <div
          className="text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border shadow-sm transition-all duration-300"
          style={{
            color: activeGlow,
            borderColor: `${activeGlow}66`,
            backgroundColor: `${activeGlow}18`
          }}
        >
          {cfg.badge}
        </div>

        {/* 타이틀 */}
        <h3 className="text-base font-extrabold text-white tracking-wide mb-1">
          {title}
        </h3>

        {/* 대상 아이템 정보 */}
        <div className="text-xs text-[#a0aec0] mb-5 flex items-center justify-center gap-1.5 font-medium">
          <span className="text-sm">{itemIcon}</span>
          <span className="font-bold text-[#e2e8f0]">{itemName}</span>
          {itemSub && <span className="text-[10px] text-[#ffd54f]">({itemSub})</span>}
        </div>

        {/* 🌟 중앙 비주얼 애니메이션 챔버 🌟 */}
        <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
          {/* 회전하는 마도진 아우터 링 */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed animate-spin transition-all duration-300"
            style={{
              borderColor: `${activeGlow}66`,
              animationDuration: isFailing ? '1.5s' : '6s'
            }}
          />

          {/* 역회전하는 인너 링 */}
          <div
            className="absolute inset-2 rounded-full border border-dotted animate-spin transition-all duration-300"
            style={{
              borderColor: `${activeGlow}44`,
              animationDirection: 'reverse',
              animationDuration: isFailing ? '1s' : '3s'
            }}
          />

          {/* 빛의 펄스 후광 */}
          <div
            className="absolute inset-4 rounded-full animate-ping opacity-25 transition-all duration-300"
            style={{ backgroundColor: activeGlow }}
          />

          {/* 중앙 핵심 아이콘 & 타격 애니메이션 */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <GameIcon
              name={cfg.iconKey}
              icon={cfg.animIcon}
              size={42}
              className={`filter drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] ${isFailing ? 'animate-pulse' : 'animate-bounce'}`}
            />
          </div>

          {/* 스파크 파티클 텍스트 */}
          <div className="absolute -top-1 -right-1 text-xs animate-pulse">{isFailing ? '💥' : '✨'}</div>
          <div className="absolute -bottom-1 -left-1 text-xs animate-pulse">{isFailing ? '⚠️' : '⚡'}</div>
        </div>

        {/* 현재 진행 단계 텍스트 */}
        <div
          className="text-xs font-bold mb-3 h-6 flex items-center justify-center tracking-tight transition-all duration-300 text-center px-2"
          style={{ color: activeGlow }}
        >
          {phaseText}
        </div>

        {/* ── 프로그레스 바 ── */}
        <div className="w-full bg-[#0a0f18] rounded-full h-3.5 p-0.5 border border-[#2b3a55] shadow-inner mb-2 relative overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75 ease-out relative"
            style={{
              width: `${progress}%`,
              backgroundColor: activeGlow,
              boxShadow: `0 0 12px ${activeGlow}`
            }}
          >
            {/* 빛의 줄무늬 흐름 연출 */}
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* 퍼센트 & 잔여 초 */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#8b9bb4] px-1">
          <span>{isFailing ? '붕괴 진행 중...' : '진행 중...'}</span>
          <span className="font-bold text-white text-xs">{progress}%</span>
          <span>{Math.max(0, ((durationRef.current * (100 - progress)) / 100000)).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};
