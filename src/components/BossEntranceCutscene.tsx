import React, { useState, useEffect, useRef } from 'react';
import { MonsterData } from '../types/game';
import { SoundManager } from '../managers/SoundManager';
import { CustomAssetService } from '../services/CustomAssetService';

interface Props {
  boss: MonsterData;
  isOvercharged?: boolean;
  onComplete: () => void;
}

export const BossEntranceCutscene: React.FC<Props> = ({ boss, isOvercharged = false, onComplete }) => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  // 🎵 BGM 음소거 및 볼륨 실시간 동기화 (배경음악 끄면 보스 출현 영상 사운드도 자동 음소거)
  const sm = SoundManager.getInstance();
  const [isBgmMuted, setIsBgmMuted] = useState(() => sm.isBgmMuted() || sm.getBgmVolume() <= 0);
  const [bgmVolume, setBgmVolume] = useState(() => sm.getBgmVolume());

  useEffect(() => {
    const unsub = sm.addBgmChangeListener((muted, vol) => {
      const effectivelyMuted = muted || vol <= 0;
      setIsBgmMuted(effectivelyMuted);
      setBgmVolume(vol);
      if (videoRef.current) {
        videoRef.current.muted = effectivelyMuted;
        videoRef.current.volume = effectivelyMuted ? 0 : Math.max(0, Math.min(1, vol));
      }
    });
    return unsub;
  }, [sm]);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    SoundManager.getInstance().play('crit');
    onComplete();
  };

  // 🎥 보스 영상 후보 경로 목록 자동 생성 (커스텀 에셋 스튜디오 오버라이드 최우선, 층수명칭 boss_floor_X.mp4, ID, 이미지 경로, webm 다중 폴백)
  const candidateSources = React.useMemo(() => {
    const list: string[] = [];

    // 1. 층수 추출 (id: boss_floor_6 -> 6, name: '핏빛 대공 (6F 보스)' -> 6 등)
    let floorNum: number | null = null;
    const floorMatch = (boss.id || '').match(/floor_(\d+)/i) || (boss.name || '').match(/(\d+)F|\b(\d+)층/i);
    if (floorMatch) {
      floorNum = parseInt(floorMatch[1] || floorMatch[2], 10);
    }

    // 0. 커스텀 에셋 스튜디오 비디오 오버라이드 최우선 삽입
    const customService = CustomAssetService.getInstance();
    const customVideo = customService.getMonsterVideoOverride(boss.id)
      || (boss.promptKey ? customService.getMonsterVideoOverride(boss.promptKey) : undefined)
      || (floorNum !== null ? customService.getMonsterVideoOverride(`boss_floor_${floorNum}`) : undefined);
    if (customVideo) {
      list.push(customVideo);
    }

    if (floorNum !== null) {
      list.push(`assets/boss_floor_${floorNum}.mp4`);
      list.push(`assets/boss_${floorNum}.mp4`);
      list.push(`assets/floor_${floorNum}.mp4`);
    }

    if (boss.id) {
      list.push(`assets/${boss.id}.mp4`);
    }

    if (boss.imagePath) {
      // _v2, _v3 등 버전 태그 제거 버전 우선 탐색
      const stripped = boss.imagePath.replace(/_v\d+\.[^/.]+$/, '.mp4');
      if (!list.includes(stripped)) list.push(stripped);
      // 원본 확장자 대체 버전
      const exact = boss.imagePath.replace(/\.[^/.]+$/, '.mp4');
      if (!list.includes(exact)) list.push(exact);
    }

    if (boss.promptKey) {
      const pk = `assets/${boss.promptKey}.mp4`;
      if (!list.includes(pk)) list.push(pk);
    }

    // webm 포맷도 후순위 후보로 자동 추가
    const webmList = list.map(src => src.replace(/\.mp4$/i, '.webm'));
    return Array.from(new Set([...list, ...webmList]));
  }, [boss.id, boss.name, boss.imagePath, boss.promptKey]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const currentVideoSrc = candidateSources[sourceIndex] || '';

  const handleVideoError = () => {
    if (sourceIndex + 1 < candidateSources.length) {
      setSourceIndex(prev => prev + 1);
    } else {
      setVideoError(true);
    }
  };

  const customImg = CustomAssetService.getInstance().getMonsterOverride(boss.id)
    || (boss.promptKey ? CustomAssetService.getInstance().getMonsterOverride(boss.promptKey) : undefined);
  const rawFallback = customImg || boss.imagePath || `assets/${boss.promptKey || boss.id}.jpg`;
  const fallbackImageSrc = rawFallback.includes('?') || rawFallback.startsWith('data:') ? rawFallback : `${rawFallback}?v=2`;

  useEffect(() => {
    // 보스 조우 웅장한 사운드 & BGM
    SoundManager.getInstance().playBgm('boss');

    // 8초 후 자동 전투 돌입 (비디오 재생 완료 또는 8초 타임아웃)
    const timer = setTimeout(() => {
      handleFinish();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 비디오 자동 재생 시도 & BGM 볼륨/음소거 동기화
    if (videoRef.current) {
      videoRef.current.muted = isBgmMuted;
      videoRef.current.volume = isBgmMuted ? 0 : Math.max(0, Math.min(1, bgmVolume));
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => handleVideoError());
        }
      });
    }
  }, [currentVideoSrc, isBgmMuted, bgmVolume]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none cursor-pointer animate-fade-in"
      onClick={handleFinish}
      style={{
        boxShadow: isOvercharged
          ? 'inset 0 0 120px rgba(180, 0, 255, 0.6)'
          : 'inset 0 0 120px rgba(255, 20, 20, 0.5)'
      }}
    >
      {/* ── 배경 미디어 (비디오 또는 폴백 일러스트) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {!videoError && currentVideoSrc ? (
          <video
            ref={videoRef}
            key={currentVideoSrc}
            src={currentVideoSrc}
            autoPlay
            playsInline
            muted={isBgmMuted}
            onEnded={handleFinish}
            onError={handleVideoError}
            className="w-full h-full object-cover transform scale-105 animate-scale-up"
            style={{ filter: 'brightness(0.85) contrast(1.15) saturate(1.2)' }}
          />
        ) : (
          <img
            src={fallbackImageSrc}
            alt={boss.name}
            className="w-full h-full object-cover transform scale-105 animate-pulse"
            style={{ filter: 'brightness(0.75) contrast(1.2) saturate(1.2)' }}
          />
        )}

        {/* 심연 비네트 & 그라데이션 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(5,8,18,0.7) 65%, rgba(0,0,0,0.95) 100%)'
          }}
        />

        {/* 붉은 경고 펄스 라이트 */}
        <div className="absolute inset-0 pointer-events-none bg-red-950/20 mix-blend-color-dodge animate-pulse" />
      </div>

      {/* ── 상단 시네마틱 레터박스 & 경고 HUD ── */}
      <div className="relative z-10 w-full pt-6 pb-4 px-6 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex flex-col items-center gap-1.5 border-b border-red-500/30">
        <div className="flex items-center justify-between w-full max-w-2xl px-1">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-xs font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 animate-pulse flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,0,0,0.6)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              ⚠️ WARNING : BOSS ENCOUNTER
            </span>
            {isOvercharged && (
              <span className="text-purple-300 text-xs font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/60 shadow-[0_0_12px_rgba(180,0,255,0.7)] animate-bounce">
                ⚡ OVERCHARGED
              </span>
            )}
          </div>

          {/* 🎵 BGM / 사운드 즉시 토글 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sm.toggleBgmMute();
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              isBgmMuted
                ? 'bg-red-950/80 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(255,0,0,0.3)]'
                : 'bg-black/60 border-[#c8aa6e]/40 text-[#c8aa6e] hover:border-[#c8aa6e]'
            }`}
            title="배경음악 음소거 토글"
          >
            <span>{isBgmMuted ? '🔇' : '🎵'}</span>
            <span className="text-[10px]">{isBgmMuted ? 'BGM 꺼짐' : 'BGM 켜짐'}</span>
          </button>
        </div>
        <div className="text-[11px] text-[#cfd8e8] font-mono tracking-wider opacity-80">
          [ 심연의 지배자가 모습을 드러냈습니다 ]
        </div>
      </div>

      {/* ── 중앙 살기 방출 이펙트 ── */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
        <div className="text-5xl sm:text-6xl mb-2 drop-shadow-[0_0_25px_rgba(255,0,0,0.9)] animate-bounce">
          {isOvercharged ? '💀⚡' : '👑'}
        </div>
      </div>

      {/* ── 하단 시네마틱 레터박스 & 보스 정보 배너 ── */}
      <div className="relative z-10 w-full pb-6 pt-5 px-6 bg-gradient-to-t from-black/95 via-black/85 to-transparent border-t border-red-500/30 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-red-950 text-red-400 border border-red-500/40">
                Lv.{boss.level} BOSS
              </span>
              <span className="text-xs text-[#ffd54f] font-mono">
                {isOvercharged ? '심연 광폭화 군주' : '심연 층별 수호 군주'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-red-500 drop-shadow-[0_4px_16px_rgba(255,50,50,0.9)] tracking-tight">
              {boss.name}
            </h1>
          </div>

          {/* 스킵 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            className="btn btn-danger self-end sm:self-center text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,0,0,0.6)] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all border border-red-400"
          >
            <span>⚔️ 결전 시작</span>
            <span className="text-[10px] opacity-75 font-mono">(SKIP ➔)</span>
          </button>
        </div>

        {/* 보스 스펙 및 플레이버 텍스트 */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-5 gap-1.5 max-w-lg text-center font-mono text-[10px] sm:text-xs">
            <div className="bg-[#120814]/80 p-1.5 rounded border border-red-900/60 text-[#38ef7d]">
              <span className="text-[9px] text-[#8b9bb4] block">체력 HP</span>
              <strong>{boss.maxHp}</strong>
            </div>
            <div className="bg-[#120814]/80 p-1.5 rounded border border-red-900/60 text-[#ef5350]">
              <span className="text-[9px] text-[#8b9bb4] block">공격력 ATK</span>
              <strong>{boss.atk}</strong>
            </div>
            <div className="bg-[#120814]/80 p-1.5 rounded border border-red-900/60 text-[#42a5f5]">
              <span className="text-[9px] text-[#8b9bb4] block">방어력 DEF</span>
              <strong>{boss.def}</strong>
            </div>
            <div className="bg-[#120814]/80 p-1.5 rounded border border-red-900/60 text-[#ffd54f]">
              <span className="text-[9px] text-[#8b9bb4] block">속도 SPD</span>
              <strong>{boss.spd}</strong>
            </div>
            <div className="bg-[#120814]/80 p-1.5 rounded border border-red-900/60 text-[#ce93d8]">
              <span className="text-[9px] text-[#8b9bb4] block">행운 LUCK</span>
              <strong>🍀{boss.luck || 10}</strong>
            </div>
          </div>

          {boss.description && (
            <p className="text-[11px] text-[#cfd8e8]/80 leading-relaxed max-w-xl italic line-clamp-2">
              "{boss.description}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
