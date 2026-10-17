import React, { useState, useEffect } from 'react';
import { CustomAssetService, SpriteSheetConfig } from '../services/CustomAssetService';

export type VFXType =
  // ── 1. 단일 공격 계열 (Single Target) ──
  | 'slash'
  | 'heavy_slash'
  | 'crit_slash'
  | 'bullet'
  | 'bullet_trail'
  | 'claw'
  | 'blood_bleed'
  | 'sonic'
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'dark_curse'
  | 'divine_smite'
  // ── 2. 광역 공격 계열 (AOE / Multi-Target) ──
  | 'slash_aoe'
  | 'heavy_slash_aoe'
  | 'bullet_aoe'
  | 'fire_aoe'
  | 'ice_aoe'
  | 'lightning_aoe'
  | 'dark_curse_aoe'
  | 'divine_smite_aoe'
  | 'claw_aoe'
  | 'toxic_eruption_aoe'
  | 'blood_bleed_aoe'
  | 'meteor_strike'
  | 'blizzard_storm'
  | 'phantom_slash'
  | 'arcane_nova'
  // ── 3. 회복 & 방어 지원 (Support & Defense) ──
  | 'holy_heal'
  | 'holy_heal_aoe'
  | 'shield'
  // ── 4. 몬스터 / 심연 마물 전용 계열 ──
  | 'abyssal_claw'
  | 'toxic_eruption'
  | 'shadow_strike'
  | 'necrotic_drain'
  // ── 5. 보스 화면 장악 대규모 결전기 계열 ──
  | 'boss_apocalypse'
  | 'boss_abyss_vortex'
  | 'boss_dragon_breath'
  | 'boss_cataclysm'
  // ── 6. 상태이상 전용 디테일 시각 큐 ──
  | 'status_bleed'
  | 'status_poison'
  | 'status_burn'
  | 'status_freeze'
  | 'status_stun'
  | 'status_shield'
  | 'status_curse'
  // ── 7. 차징 & 제작/단조 연출 계열 (Charge & Crafting) ──
  | 'charge'
  | 'forge_spark'
  | 'craft_magic'
  // ── 8. 회피/빗나감 전용 (텍스트 전용) ──
  | 'evade';

export interface VFXEvent {
  id: string;
  type: VFXType;
  x?: number; // 0 ~ 100%
  y?: number; // 0 ~ 100%
  damage?: number;
  isCrit?: boolean;
  isHeal?: boolean;
  isShield?: boolean;
  isBlock?: boolean;
  text?: string;
  duration?: number;
  // 🌟 고도화 속성들
  tier?: 0 | 1 | 2 | 3; // 0: 기본, 1: 1차 승격, 2: 2차 각성/특수기, 3: 보스 결전기
  sourceType?: 'hero' | 'monster' | 'boss';
  statusEffect?: string;
  fullScreen?: boolean;
  scale?: number;
}

interface Props {
  vfxList: VFXEvent[];
  onFinish?: (id: string) => void;
  isShaking?: boolean;
  overrideMap?: Record<string, string>;
  vfxConfigs?: Record<string, SpriteSheetConfig>;
  className?: string;
}

export const BattleVFXOverlay: React.FC<Props> = ({ vfxList, onFinish, isShaking, overrideMap, vfxConfigs, className = '' }) => {
  // 보스 결전기나 전체 화면 효과가 활성화되어 있는지 확인
  const hasBossFullScreen = vfxList.some(v => v.fullScreen || v.sourceType === 'boss' || v.tier === 3 || v.type.startsWith('boss_'));

  return (
    <div className={`absolute inset-0 pointer-events-none z-50 overflow-hidden ${className} ${isShaking ? (hasBossFullScreen ? 'animate-screen-shake-heavy' : 'animate-screen-shake') : ''}`}>
      {/* ── 🌌 보스 스킬 시 화면 전체 어두움 비네트 펄스 ── */}
      {hasBossFullScreen && (
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#20051566] to-[#0a000eee] animate-boss-dim z-10" />
      )}

      {vfxList.map(vfx => (
        <VFXInstance
          key={vfx.id}
          vfx={vfx}
          overrideMap={overrideMap}
          vfxConfigs={vfxConfigs}
          onFinish={() => onFinish?.(vfx.id)}
        />
      ))}
    </div>
  );
};

// ── 🧠 지능형 다양한 스프라이트 시트 규격 자동 감지 헬퍼 ──
export function detectSpriteSheetDimensions(
  nw: number,
  nh: number
): { isSheet: boolean; cols: number; rows: number; totalFrames: number } {
  if (nw <= 0 || nh <= 0) {
    return { isSheet: false, cols: 1, rows: 1, totalFrames: 1 };
  }

  const rx = nw / nh;
  const ry = nh / nw;

  // 1. 단일 정사각형 아이콘/이미지 (1x1)
  if (nw === nh && nw <= 128) {
    return { isSheet: false, cols: 1, rows: 1, totalFrames: 1 };
  }

  // 2. 가로 스트립 (1 x N): 가로가 세로의 1.3배 이상
  if (rx >= 1.35 && nh <= 256) {
    const cols = Math.max(2, Math.round(rx));
    return { isSheet: true, cols, rows: 1, totalFrames: cols };
  }

  // 3. 세로 스트립 (N x 1): 세로가 가로의 1.3배 이상
  if (ry >= 1.35 && nw <= 256) {
    const rows = Math.max(2, Math.round(ry));
    return { isSheet: true, cols: 1, rows, totalFrames: rows };
  }

  // 4. RPG Maker 표준 애니메이션 시트 (가로 5열 고정: 5x3, 5x4, 5x5, 5x6, 5x8 등)
  // RPG Maker 규격: 960x768 (5x4, 192px), 960x960 (5x5), 960x1152 (5x6), 960x1536 (5x8), 600x480 (5x4, 120px) 등
  if (nw % 5 === 0) {
    const cellW = nw / 5;
    const rows = Math.round(nh / cellW);
    if (rows >= 2 && rows <= 16 && Math.abs(nh - rows * cellW) <= 16) {
      return { isSheet: true, cols: 5, rows, totalFrames: 5 * rows };
    }
  }

  // 5. 일반적인 셀 크기(192, 128, 96, 64, 48, 32, 24, 16, 80, 120, 160, 256) 기반 그리드 분할 탐색
  const commonCellSizes = [192, 128, 96, 64, 48, 32, 24, 16, 80, 120, 160, 256];
  for (const cs of commonCellSizes) {
    if (nw % cs === 0 && nh % cs === 0) {
      const cols = nw / cs;
      const rows = nh / cs;
      if ((cols >= 2 || rows >= 2) && cols <= 16 && rows <= 16) {
        return { isSheet: true, cols, rows, totalFrames: cols * rows };
      }
    }
  }

  // 6. 직사각형 2D 그리드 비율 감지 (4:2, 4:3, 5:3, 5:4, 6:2, 6:3, 6:4, 8:2, 8:4, 8:5, 10:2 등)
  const aspectRatios: [number, number][] = [
    [4, 4], [3, 3], [5, 5], [6, 6], [8, 8],
    [4, 2], [4, 3], [5, 3], [5, 4], [6, 2], [6, 3], [6, 4], [6, 5],
    [8, 2], [8, 3], [8, 4], [8, 5], [8, 6],
    [10, 2], [10, 3], [10, 4], [10, 5],
    [12, 2], [12, 4], [16, 2], [16, 4],
  ];

  for (const [c, r] of aspectRatios) {
    const expectedRatio = c / r;
    if (Math.abs(rx - expectedRatio) < 0.08) {
      const cellW = nw / c;
      const cellH = nh / r;
      if (Math.abs(cellW - cellH) / Math.max(cellW, cellH) < 0.15) {
        return { isSheet: true, cols: c, rows: r, totalFrames: c * r };
      }
    }
  }

  // 7. 대형 정사각형 그리드 (192, 256, 512, 1024 등)
  if (Math.abs(rx - 1) < 0.08 && nw >= 128) {
    if (nw % 4 === 0) return { isSheet: true, cols: 4, rows: 4, totalFrames: 16 };
    if (nw % 5 === 0) return { isSheet: true, cols: 5, rows: 5, totalFrames: 25 };
    if (nw % 3 === 0) return { isSheet: true, cols: 3, rows: 3, totalFrames: 9 };
    if (nw % 8 === 0) return { isSheet: true, cols: 8, rows: 8, totalFrames: 64 };
  }

  return { isSheet: false, cols: 1, rows: 1, totalFrames: 1 };
}

// ── 커스텀 스프라이트 시트(Spritesheet) 및 이미지/GIF 이펙트 렌더러 ──
export const CustomSpriteVFX: React.FC<{
  src: string;
  type: string;
  duration?: number;
  customConfig?: SpriteSheetConfig;
}> = ({ src, type, duration = 650, customConfig }) => {
  const activeConfig = customConfig || CustomAssetService.getInstance().getVfxConfig(type);

  const [spriteInfo, setSpriteInfo] = useState<{
    isSheet: boolean;
    cols: number;
    rows: number;
    totalFrames: number;
  } | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // GIF, WebP 애니메이션 등 브라우저 자체 애니메이션 포맷 판정
  const isAnimatedFormat = src.startsWith('data:image/gif') 
    || src.endsWith('.gif') 
    || src.startsWith('data:image/webp') 
    || src.endsWith('.webp')
    || src.includes('image/apng');

  useEffect(() => {
    let isMounted = true;
    if (isAnimatedFormat) {
      setSpriteInfo({ isSheet: false, cols: 1, rows: 1, totalFrames: 1 });
      return;
    }

    // 명시적 커스텀 규격이 등록되어 있는 경우 최우선 적용
    if (activeConfig && activeConfig.cols > 0 && activeConfig.rows > 0) {
      const totalFrames = activeConfig.totalFrames || (activeConfig.cols * activeConfig.rows);
      setSpriteInfo({
        isSheet: totalFrames > 1,
        cols: activeConfig.cols,
        rows: activeConfig.rows,
        totalFrames,
      });
      return;
    }

    const img = new Image();
    const applyDimensions = () => {
      if (!isMounted) return;
      const detected = detectSpriteSheetDimensions(img.naturalWidth, img.naturalHeight);
      setSpriteInfo(detected);
    };

    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      applyDimensions();
    } else {
      img.onload = applyDimensions;
      img.onerror = () => {
        if (isMounted) {
          setSpriteInfo({ isSheet: false, cols: 1, rows: 1, totalFrames: 1 });
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [src, isAnimatedFormat, activeConfig]);

  const effectiveDuration = activeConfig?.duration || duration;

  // 프레임 순환 애니메이션 및 루프 방지 (스프라이트 끝에 도달 시 반복 정지)
  useEffect(() => {
    if (!spriteInfo || !spriteInfo.isSheet || spriteInfo.totalFrames <= 1) return;
    setFrameIndex(0);
    setIsFinished(false);

    const intervalMs = Math.max(20, Math.floor(effectiveDuration / spriteInfo.totalFrames));
    const interval = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= spriteInfo.totalFrames - 1) {
          clearInterval(interval);
          setIsFinished(true);
          return spriteInfo.totalFrames - 1; // 마지막 프레임 고정 (루프 방지)
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [spriteInfo, effectiveDuration]);

  // 측정 대기 중이거나 단일 이미지/GIF인 경우 직접 렌더링 (지연 없이 즉시 표시)
  if (!spriteInfo || !spriteInfo.isSheet) {
    return (
      <div className="relative w-48 h-48 flex items-center justify-center animate-scale-up select-none">
        <img
          src={src}
          alt={type}
          className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(200, 170, 110,0.85)]"
        />
      </div>
    );
  }

  // 스프라이트 시트 그리드 계산 (가로 col, 세로 row)
  const col = frameIndex % spriteInfo.cols;
  const row = Math.floor(frameIndex / spriteInfo.cols);
  const posX = spriteInfo.cols > 1 ? (col / (spriteInfo.cols - 1)) * 100 : 0;
  const posY = spriteInfo.rows > 1 ? (row / (spriteInfo.rows - 1)) * 100 : 0;

  return (
    <div className={`relative w-48 h-48 flex items-center justify-center overflow-hidden animate-scale-up select-none filter drop-shadow-[0_0_30px_rgba(200, 170, 110,0.95)] transition-opacity duration-150 ${isFinished ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${spriteInfo.cols * 100}% ${spriteInfo.rows * 100}%`,
          backgroundPosition: `${posX}% ${posY}%`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

const VFXInstance: React.FC<{
  vfx: VFXEvent;
  overrideMap?: Record<string, string>;
  vfxConfigs?: Record<string, SpriteSheetConfig>;
  onFinish: () => void;
}> = ({ vfx, overrideMap, vfxConfigs, onFinish }) => {
  const isBossVfx = vfx.sourceType === 'boss' || vfx.tier === 3 || vfx.type.startsWith('boss_');
  const explicitConfig = (vfxConfigs && vfxConfigs[vfx.type])
    || CustomAssetService.getInstance().getVfxConfig(vfx.type);
  const duration = explicitConfig?.duration || vfx.duration || (isBossVfx ? 950 : vfx.tier === 2 ? 800 : 650);

  useEffect(() => {
    const timer = setTimeout(onFinish, duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const x = vfx.fullScreen ? 50 : (vfx.x ?? 50);
  const y = vfx.fullScreen ? 45 : (vfx.y ?? 50);

  const customVfxSrc = (overrideMap && overrideMap[vfx.type])
    || CustomAssetService.getInstance().getVfxOverride(vfx.type);

  // 스케일 계산: 명시적 scale > 티어별 기본 scale
  const baseScale = vfx.scale ?? (isBossVfx ? 2.4 : vfx.tier === 2 ? 1.55 : vfx.tier === 1 ? 1.25 : 1.0);

  return (
    <div
      className={`absolute flex flex-col items-center justify-center ${vfx.fullScreen ? 'w-full h-full inset-0 m-auto' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${baseScale})`,
        transformOrigin: 'center center',
        zIndex: isBossVfx ? 40 : 30,
      }}
    >
      {/* ── 0. 커스텀 스프라이트/GIF 이펙트 오버라이드 (스프라이트 시트 완벽 지원) ── */}
      {customVfxSrc ? (
        <CustomSpriteVFX src={customVfxSrc} type={vfx.type} duration={duration} customConfig={explicitConfig} />
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              1. 👑 보스 화면 장악 대규모 결전기 (Screen-Filling Spectacle)
             ══════════════════════════════════════════════════════════ */}
          {vfx.type === 'boss_apocalypse' && (
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center animate-boss-nova">
              {/* 심연 옥좌 마법진 */}
              <svg className="absolute w-full h-full animate-spin" style={{ animationDuration: '4s' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#ff1744" strokeWidth="2.5" strokeDasharray="8 6" filter="drop-shadow(0 0 15px #ff1744)" />
                <circle cx="100" cy="100" r="75" fill="none" stroke="#d500f9" strokeWidth="2" strokeDasharray="14 8" />
                <polygon points="100,10 180,150 20,150" fill="none" stroke="#ff1744" strokeWidth="2.5" filter="drop-shadow(0 0 12px #d500f9)" />
                <polygon points="100,190 180,50 20,50" fill="none" stroke="#ffd54f" strokeWidth="2" />
              </svg>
              {/* 폭발 중심 핵 */}
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-[#ff1744] via-[#d500f9] to-[#ffffff] animate-ping opacity-90 blur-xs" />
              <div className="absolute text-6xl animate-bounce" style={{ filter: 'drop-shadow(0 0 25px #ff1744)' }}>👑</div>
              <div className="absolute inset-0 rounded-full border-4 border-[#ff1744] animate-vfx-shockwave opacity-80" style={{ boxShadow: '0 0 50px #ff1744, inset 0 0 40px #d50000' }} />
            </div>
          )}

          {vfx.type === 'boss_abyss_vortex' && (
            <div className="relative w-80 h-80 sm:w-104 sm:h-104 flex items-center justify-center animate-boss-vortex">
              {/* 블랙홀 흡입 왜곡 링 */}
              <div className="absolute inset-0 rounded-full border-4 border-[#aa00ff] animate-spin opacity-90" style={{ animationDuration: '2s', boxShadow: '0 0 40px #aa00ff, inset 0 0 40px #4a148c' }} />
              <div className="absolute w-44 h-44 rounded-full border-4 border-[#c8aa6e] animate-spin opacity-80" style={{ animationDirection: 'reverse', animationDuration: '1.5s', boxShadow: '0 0 30px #c8aa6e' }} />
              <div className="absolute w-28 h-28 rounded-full bg-black border-2 border-[#d500f9] shadow-[0_0_50px_#d500f9] flex items-center justify-center">
                <span className="text-4xl animate-pulse">👁️</span>
              </div>
            </div>
          )}

          {vfx.type === 'boss_dragon_breath' && (
            <div className="relative w-80 h-64 sm:w-112 sm:h-80 flex items-center justify-center animate-boss-breath">
              {/* 드래곤 화염 숨결 원뿔 */}
              <svg className="w-full h-full" viewBox="0 0 200 120">
                <defs>
                  <linearGradient id="dragonFire" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="30%" stopColor="#ffd54f" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#ff3d00" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#b71c1c" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <polygon points="10,60 190,10 190,110" fill="url(#dragonFire)" filter="drop-shadow(0 0 25px #ff3d00)" />
              </svg>
              <div className="absolute left-6 text-5xl animate-bounce">🐲</div>
            </div>
          )}

          {vfx.type === 'boss_cataclysm' && (
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center animate-boss-nova">
              {/* 대지 분쇄 파괴 파동 */}
              <div className="absolute inset-0 rounded-full border-4 border-[#ff6d00] animate-ping opacity-75" style={{ boxShadow: '0 0 45px #ff3d00' }} />
              <div className="text-6xl animate-pulse">🌋</div>
              <div className="absolute bottom-4 w-60 h-4 bg-[#ff3d00] rounded-full blur-xs animate-pulse" />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              2. ✨ 아군 고티어 & 각성 스킬 (Divine & Elemental Masteries)
             ══════════════════════════════════════════════════════════ */}
          {(vfx.type === 'divine_smite' || vfx.type === 'divine_smite_aoe') && (
            <div className="relative w-48 h-64 flex flex-col items-center justify-center animate-vfx-divine">
              {/* 성스러운 황금 빛기둥 */}
              <div className="absolute w-20 h-full bg-gradient-to-b from-[#ffffff] via-[#ffd54f] to-[#ffb300] rounded-full blur-xs opacity-90" style={{ boxShadow: '0 0 35px #ffd54f, 0 0 70px #ffffff' }} />
              <svg className="w-full h-full animate-pulse" viewBox="0 0 100 120">
                {/* 십자 성광 광선 */}
                <line x1="50" y1="5" x2="50" y2="115" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 12px #ffd54f)" />
                <line x1="15" y1="40" x2="85" y2="40" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                <circle cx="50" cy="40" r="22" fill="none" stroke="#ffd54f" strokeWidth="3" strokeDasharray="6 4" />
              </svg>
              <div className="absolute text-4xl top-4 animate-bounce">⚔️</div>
            </div>
          )}

          {vfx.type === 'meteor_strike' && (
            <div className="relative w-52 h-52 flex items-center justify-center animate-vfx-meteor">
              {/* 불타는 유성 낙하 */}
              <div className="absolute inset-0 rounded-full border-4 border-[#ff3d00] animate-vfx-shockwave opacity-90" style={{ boxShadow: '0 0 35px #ff3d00, inset 0 0 35px #ff9100' }} />
              <div className="text-5xl animate-bounce" style={{ filter: 'drop-shadow(0 0 20px #ff3d00)' }}>☄️</div>
              <div className="absolute w-20 h-20 bg-[#ff6d00] rounded-full blur-md opacity-80 animate-ping" />
            </div>
          )}

          {vfx.type === 'blizzard_storm' && (
            <div className="relative w-52 h-52 flex items-center justify-center animate-vfx-blizzard">
              {/* 혹한의 눈보라 폭풍 */}
              <svg className="w-full h-full animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#c8aa6e" strokeWidth="3" strokeDasharray="12 6" filter="drop-shadow(0 0 12px #c8aa6e)" />
                <polygon points="60,10 70,50 110,60 70,70 60,110 50,70 10,60 50,50" fill="none" stroke="#80d8ff" strokeWidth="2.5" />
              </svg>
              <div className="text-4xl animate-pulse" style={{ filter: 'drop-shadow(0 0 15px #c8aa6e)' }}>❄️</div>
            </div>
          )}

          {vfx.type === 'phantom_slash' && (
            <div className="relative w-52 h-52 flex items-center justify-center animate-vfx-phantom">
              {/* 다단 그림자 초고속 참격 */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="10" y1="20" x2="90" y2="80" stroke="#d500f9" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 10px #ff1744)" />
                <line x1="85" y1="15" x2="15" y2="85" stroke="#ff1744" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 10px #d500f9)" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <line x1="50" y1="10" x2="50" y2="90" stroke="#ffd54f" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute w-12 h-12 bg-white rounded-full animate-ping opacity-90" />
            </div>
          )}

          {vfx.type === 'arcane_nova' && (
            <div className="relative w-52 h-52 flex items-center justify-center animate-vfx-arcane">
              {/* 비전 마법진 폭발 */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d500f9" strokeWidth="3" strokeDasharray="8 6" filter="drop-shadow(0 0 15px #d500f9)" />
                <polygon points="50,15 85,75 15,75" fill="none" stroke="#651fff" strokeWidth="2.5" />
                <polygon points="50,85 85,25 15,25" fill="none" stroke="#c8aa6e" strokeWidth="2" />
              </svg>
              <div className="text-4xl animate-pulse">🔮</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              3. 👾 몬스터 / 심연 마물 전용 (Abyssal & Feral Sinister)
             ══════════════════════════════════════════════════════════ */}
          {vfx.type === 'abyssal_claw' && (
            <div className="relative w-48 h-48 flex items-center justify-center animate-vfx-abyssal-claw">
              {/* 심연 마수의 진홍 발톱 자국 */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="15" y1="15" x2="70" y2="90" stroke="#d50000" strokeWidth="8" strokeLinecap="round" filter="drop-shadow(0 0 12px #ff1744)" />
                <line x1="35" y1="10" x2="90" y2="85" stroke="#ff1744" strokeWidth="8" strokeLinecap="round" filter="drop-shadow(0 0 12px #b71c1c)" />
                <line x1="5" y1="30" x2="55" y2="98" stroke="#b71c1c" strokeWidth="6" strokeLinecap="round" />
              </svg>
              <div className="absolute text-3xl animate-bounce">🩸</div>
            </div>
          )}

          {(vfx.type === 'toxic_eruption' || vfx.type === 'toxic_eruption_aoe') && (
            <div className="relative w-48 h-48 flex flex-col items-center justify-center animate-vfx-toxic">
              {/* 부식 맹독 분출 */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-t from-[#00e676] to-[#76ff03] opacity-80 blur-xs animate-ping" />
              <div className="text-4xl mb-1 animate-bounce" style={{ filter: 'drop-shadow(0 0 15px #00e676)' }}>☠️</div>
              <div className="text-2xl animate-pulse">🧪</div>
            </div>
          )}

          {vfx.type === 'necrotic_drain' && (
            <div className="relative w-48 h-48 flex items-center justify-center animate-vfx-drain">
              {/* 사령 생명력 흡수 촉수 */}
              <div className="absolute inset-0 rounded-full border-2 border-[#aa00ff] animate-spin" style={{ boxShadow: '0 0 30px #aa00ff, inset 0 0 25px #d50000' }} />
              <div className="text-4xl animate-pulse">🩸</div>
            </div>
          )}

          {vfx.type === 'shadow_strike' && (
            <div className="relative w-44 h-44 flex items-center justify-center animate-vfx-dark">
              <div className="absolute inset-0 bg-[#000000cc] rounded-full blur-xs animate-ping" />
              <div className="text-4xl">🌑</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              4. ⚡ 기본 & 표준 공격 (Standard Melee / Ranged / Elemental)
             ══════════════════════════════════════════════════════════ */}
          {(vfx.type === 'slash' || vfx.type === 'slash_aoe') && (
            <div className="relative w-40 h-40 flex items-center justify-center animate-vfx-slash">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="15" y1="85" x2="85" y2="15" stroke="#c8aa6e" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 8px #c8aa6e)" />
                <line x1="25" y1="80" x2="80" y2="25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute w-8 h-8 rounded-full bg-white animate-vfx-flash" />
            </div>
          )}

          {vfx.type === 'crit_slash' && (
            <div className="relative w-48 h-48 flex items-center justify-center animate-vfx-crit">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="10" y1="10" x2="90" y2="90" stroke="#ffd54f" strokeWidth="8" strokeLinecap="round" filter="drop-shadow(0 0 12px #ff416c)" />
                <line x1="90" y1="10" x2="10" y2="90" stroke="#ff416c" strokeWidth="8" strokeLinecap="round" filter="drop-shadow(0 0 12px #ffd54f)" />
                <line x1="15" y1="15" x2="85" y2="85" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="85" y1="15" x2="15" y2="85" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute w-14 h-14 rounded-full bg-[#ffd54f] animate-vfx-flash" />
            </div>
          )}

          {(vfx.type === 'heavy_slash' || vfx.type === 'heavy_slash_aoe') && (
            <div className="relative w-44 h-44 flex items-center justify-center animate-vfx-heavy">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="50" y1="5" x2="50" y2="95" stroke="#ff7043" strokeWidth="10" strokeLinecap="round" filter="drop-shadow(0 0 12px #d84315)" />
                <line x1="50" y1="15" x2="50" y2="85" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="absolute w-20 h-2 bg-[#ff7043] rounded-full bottom-2 shadow-lg shadow-[#ff7043] animate-pulse" />
            </div>
          )}

          {(vfx.type === 'fire' || vfx.type === 'fire_aoe') && (
            <div className="relative w-44 h-44 flex items-center justify-center animate-vfx-fire">
              <div className="absolute inset-0 rounded-full border-4 border-[#ff3d00] animate-vfx-shockwave opacity-80" style={{ boxShadow: '0 0 25px #ff3d00, inset 0 0 25px #ff9100' }} />
              <div className="text-4xl animate-bounce">🔥</div>
              <div className="absolute w-12 h-12 bg-gradient-to-tr from-[#ff3d00] to-[#ffab00] rounded-full blur-xs opacity-90 animate-ping" />
            </div>
          )}

          {(vfx.type === 'ice' || vfx.type === 'ice_aoe') && (
            <div className="relative w-40 h-40 flex items-center justify-center animate-vfx-ice">
              <div className="text-4xl animate-spin" style={{ filter: 'drop-shadow(0 0 12px #c8aa6e)' }}>❄️</div>
              <svg className="absolute w-full h-full animate-pulse" viewBox="0 0 100 100">
                <polygon points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40" fill="none" stroke="#80d8ff" strokeWidth="3" filter="drop-shadow(0 0 8px #c8aa6e)" />
              </svg>
            </div>
          )}

          {(vfx.type === 'lightning' || vfx.type === 'lightning_aoe') && (
            <div className="relative w-40 h-48 flex items-center justify-center animate-vfx-lightning">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <polyline points="50,0 35,40 65,45 40,100" fill="none" stroke="#ffd54f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 12px #c8aa6e)" />
                <polyline points="50,0 35,40 65,45 40,100" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-[#ffd54f15] animate-vfx-flash" />
            </div>
          )}

          {(vfx.type === 'holy_heal' || vfx.type === 'holy_heal_aoe') && (
            <div className="relative w-36 h-48 flex flex-col items-center justify-center animate-vfx-heal">
              <div className="absolute w-16 h-full bg-gradient-to-t from-[#69f0ae33] via-[#69f0ae66] to-transparent rounded-full blur-xs" />
              <div className="text-3xl mb-1 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px #69f0ae)' }}>✨</div>
              <div className="text-2xl animate-pulse text-[#b9f6ca]">💚</div>
            </div>
          )}

          {vfx.type === 'shield' && (
            <div className="relative w-40 h-40 flex items-center justify-center animate-vfx-shield">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="#c8aa6e22" stroke="#c8aa6e" strokeWidth="4" strokeLinejoin="round" filter="drop-shadow(0 0 12px #c8aa6e)" />
              </svg>
              <span className="text-2xl">🛡️</span>
            </div>
          )}

          {(vfx.type === 'dark_curse' || vfx.type === 'dark_curse_aoe') && (
            <div className="relative w-44 h-44 flex items-center justify-center animate-vfx-dark">
              <div className="absolute inset-0 rounded-full border-2 border-[#d500f9] animate-spin" style={{ boxShadow: '0 0 25px #aa00ff, inset 0 0 20px #4a148c' }} />
              <div className="text-3xl animate-pulse">🔮</div>
            </div>
          )}

          {(vfx.type === 'bullet' || vfx.type === 'bullet_trail' || vfx.type === 'bullet_aoe') && (
            <div className="relative w-44 h-44 flex items-center justify-center animate-vfx-bullet">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#c8aa6e" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 8px #c8aa6e)" />
                <line x1="30" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <circle cx="80" cy="50" r="12" fill="none" stroke="#c8aa6e" strokeWidth="3" />
              </svg>
            </div>
          )}

          {(vfx.type === 'claw' || vfx.type === 'claw_aoe') && (
            <div className="relative w-40 h-40 flex items-center justify-center animate-vfx-claw">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line x1="20" y1="20" x2="65" y2="85" stroke="#ff1744" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 8px #ff1744)" />
                <line x1="40" y1="15" x2="85" y2="80" stroke="#ff1744" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 8px #ff1744)" />
                <line x1="10" y1="35" x2="50" y2="95" stroke="#ff1744" strokeWidth="5" strokeLinecap="round" filter="drop-shadow(0 0 8px #ff1744)" />
              </svg>
            </div>
          )}

          {(vfx.type === 'blood_bleed' || vfx.type === 'blood_bleed_aoe') && (
            <div className="relative w-36 h-36 flex items-center justify-center animate-vfx-bleed">
              <div className="text-3xl animate-bounce">🩸</div>
              <div className="absolute w-8 h-8 bg-[#d50000] rounded-full blur-xs opacity-75 animate-ping" />
            </div>
          )}

          {vfx.type === 'sonic' && (
            <div className="relative w-40 h-40 flex items-center justify-center animate-vfx-sonic">
              <div className="absolute w-20 h-20 rounded-full border-2 border-[#c8aa6e] animate-ping opacity-80" />
              <div className="absolute w-32 h-32 rounded-full border border-[#80d8ff] animate-ping opacity-50" />
              <div className="text-2xl">🔊</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              5. 🩸 상태이상 전용 디테일 시각 효과 (Status Effect Detail Cues)
             ══════════════════════════════════════════════════════════ */}
          {vfx.type === 'status_bleed' && (
            <div className="relative w-32 h-32 flex flex-col items-center justify-center animate-status-bleed">
              <div className="text-3xl animate-bounce">🩸</div>
              <div className="w-1.5 h-6 bg-[#d50000] rounded-full shadow-[0_0_8px_#ff1744] mt-1" />
            </div>
          )}

          {vfx.type === 'status_poison' && (
            <div className="relative w-32 h-32 flex flex-col items-center justify-center animate-status-poison">
              <div className="text-3xl animate-pulse">☠️</div>
              <div className="w-3 h-3 bg-[#00e676] rounded-full blur-xs animate-ping mt-1" />
            </div>
          )}

          {vfx.type === 'status_burn' && (
            <div className="relative w-32 h-32 flex flex-col items-center justify-center animate-status-burn">
              <div className="text-3xl animate-bounce">🔥</div>
              <div className="w-2 h-2 bg-[#ff6d00] rounded-full shadow-[0_0_8px_#ff3d00]" />
            </div>
          )}

          {vfx.type === 'status_freeze' && (
            <div className="relative w-32 h-32 flex items-center justify-center animate-status-freeze">
              <div className="text-3xl animate-spin" style={{ animationDuration: '3s' }}>❄️</div>
            </div>
          )}

          {vfx.type === 'status_stun' && (
            <div className="relative w-28 h-28 flex items-center justify-center animate-status-stun">
              <span className="text-2xl">💫</span>
              <span className="absolute text-xl top-0 text-[#ffd54f]">⭐</span>
              <span className="absolute text-xl bottom-0 text-[#ffd54f]">⭐</span>
            </div>
          )}

          {vfx.type === 'status_shield' && (
            <div className="relative w-36 h-36 flex items-center justify-center animate-vfx-shield">
              <div className="text-3xl">🛡️</div>
            </div>
          )}

          {vfx.type === 'status_curse' && (
            <div className="relative w-32 h-32 flex items-center justify-center animate-vfx-dark">
              <div className="text-3xl">🔮</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              7. ⚡ 차징 & 제작/단조 연출 계열 (Charge, Forge, Craft)
             ══════════════════════════════════════════════════════════ */}
          {vfx.type === 'charge' && (
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-4 border-dashed border-[#c8aa6e] animate-spin opacity-85"
                style={{ animationDuration: '1.2s', boxShadow: '0 0 35px #c8aa6e, inset 0 0 25px #00b0ff' }}
              />
              <div
                className="absolute w-40 h-40 rounded-full border-2 border-dotted border-[#ffd54f] animate-spin opacity-75"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s', boxShadow: '0 0 20px #ffd54f' }}
              />
              <div className="absolute inset-8 rounded-full bg-[#c8aa6e22] animate-ping opacity-60" />
              <div className="text-5xl animate-bounce filter drop-shadow-[0_0_20px_#c8aa6e]">⚡</div>
              <div className="absolute -top-2 text-xl animate-pulse">✨</div>
              <div className="absolute -bottom-2 text-xl animate-pulse">✨</div>
            </div>
          )}

          {vfx.type === 'forge_spark' && (
            <div className="relative w-52 h-52 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-4 border-[#ff6d00] animate-vfx-shockwave opacity-90"
                style={{ boxShadow: '0 0 40px #ff3d00, inset 0 0 30px #ff9100' }}
              />
              <div className="text-6xl animate-bounce filter drop-shadow-[0_0_25px_#ff6d00]">🔨</div>
              <div className="absolute w-24 h-24 bg-[#ff9100] rounded-full blur-md opacity-70 animate-ping" />
              <div className="absolute text-2xl -top-3 -right-3 animate-ping">💥</div>
              <div className="absolute text-xl -bottom-2 -left-2 animate-ping">✨</div>
            </div>
          )}

          {vfx.type === 'craft_magic' && (
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-3 border-dashed border-[#26a69a] animate-spin opacity-85"
                style={{ animationDuration: '2.5s', boxShadow: '0 0 35px #26a69a, inset 0 0 25px #00897b' }}
              />
              <div
                className="absolute w-40 h-40 rounded-full border-2 border-[#80cbc4] animate-spin opacity-70"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              />
              <div className="text-5xl animate-pulse filter drop-shadow-[0_0_20px_#80cbc4]">🧪</div>
              <div className="absolute w-16 h-16 bg-[#26a69a] rounded-full blur-md opacity-50 animate-ping" />
              <div className="absolute -top-1 -right-1 text-base animate-pulse">✨</div>
              <div className="absolute -bottom-1 -left-1 text-base animate-pulse">📖</div>
            </div>
          )}
        </>
      )}

      {/* ── 2. 플로팅 전투 데미지 텍스트 (Floating Combat Text) ── */}
      {(vfx.damage !== undefined || vfx.text) && (
        <div
          className={`absolute font-black font-mono tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap animate-vfx-damage ${
            vfx.isCrit
              ? 'text-xl sm:text-2xl text-[#ffd54f] scale-110'
              : vfx.isHeal
              ? 'text-lg text-[#69f0ae]'
              : vfx.isShield
              ? 'text-base text-[#c8aa6e]'
              : (vfx.isBlock || vfx.text === 'Block!')
              ? 'text-xl sm:text-2xl text-[#64b5f6] scale-110'
              : (vfx.text?.includes('MISS') || vfx.text?.includes('EVADE') || vfx.type === 'evade')
              ? 'text-lg sm:text-xl text-[#80d8ff] font-bold tracking-widest scale-105'
              : 'text-lg text-[#ffffff]'
          }`}
          style={{
            textShadow: vfx.isCrit
              ? '0 0 10px #ff3d00, 0 0 20px #ffd54f'
              : (vfx.isBlock || vfx.text === 'Block!')
              ? '0 0 10px #1e88e5, 0 0 20px #90caf9'
              : (vfx.text?.includes('MISS') || vfx.text?.includes('EVADE') || vfx.type === 'evade')
              ? '0 0 10px #c8aa6e, 0 0 20px rgba(200, 170, 110,0.7), 0 2px 4px #000000'
              : '0 0 8px rgba(0,0,0,0.8)'
          }}
        >
          {vfx.isCrit && <span className="block text-[10px] text-[#ff3d00] font-bold text-center -mb-1 animate-pulse">CRITICAL!</span>}
          {(vfx.isBlock || vfx.text === 'Block!') && <span className="block text-[10px] text-[#90caf9] font-bold text-center -mb-1">🛡️ BLOCK!</span>}
          {(() => {
            if (vfx.text) return vfx.text;
            if (vfx.isBlock) return 'Block!';
            if (vfx.damage !== undefined) {
              if (vfx.isHeal) return `+${vfx.damage} HP`;
              if (vfx.isShield) return `+${vfx.damage} SHIELD`;
              if (vfx.damage > 0) return `-${vfx.damage}`;
              return 'Block!';
            }
            return '';
          })()}
        </div>
      )}
    </div>
  );
};
