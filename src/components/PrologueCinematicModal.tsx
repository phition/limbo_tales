import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SoundManager } from '../managers/SoundManager';
import { I18nService } from '../i18n/I18nService';
import { triggerHaptic } from '../utils/haptics';
import { PROLOGUE_UI_LOCALES, PROLOGUE_SCENES_LOCALES } from '../i18n/prologueLocales';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenQuests?: () => void;
}

interface SceneData {
  actNumber: string;
  actTitle: string;
  subTitle: string;
  paragraphs: string[];
  mediaType: 'image' | 'video';
  mediaSrc: string;
  mediaFallback?: string;
  ambientSound: string;
  bgmTrack?: 'citadel' | 'dungeon' | 'battle' | 'boss' | 'none';
  accentColor: string;
  badgeIcon: string;
}

export const PrologueCinematicModal: React.FC<Props> = ({ open, onClose }) => {
  const [, setLangTick] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showLogView, setShowLogView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 다국어 구독
  useEffect(() => {
    return I18nService.getInstance().subscribe(() => {
      setLangTick((t) => t + 1);
    });
  }, []);

  const currentLang = I18nService.getInstance().getLanguage();
  const ui = PROLOGUE_UI_LOCALES[currentLang] || PROLOGUE_UI_LOCALES.ko;
  const sceneLocales = PROLOGUE_SCENES_LOCALES[currentLang] || PROLOGUE_SCENES_LOCALES.ko;

  // 4막 시네마틱 씬 데이터 (메모이제이션으로 불필요한 재생성 방지)
  const scenes: SceneData[] = useMemo(() => [
    {
      actNumber: sceneLocales[0].actNumber,
      actTitle: sceneLocales[0].actTitle,
      subTitle: sceneLocales[0].subTitle,
      paragraphs: sceneLocales[0].paragraphs,
      mediaType: 'image',
      mediaSrc: 'assets/monster_abyssal_harbinger.jpg',
      ambientSound: 'dark_magic',
      bgmTrack: 'dungeon',
      accentColor: '#b388ff',
      badgeIcon: '🌌'
    },
    {
      actNumber: sceneLocales[1].actNumber,
      actTitle: sceneLocales[1].actTitle,
      subTitle: sceneLocales[1].subTitle,
      paragraphs: sceneLocales[1].paragraphs,
      mediaType: 'image',
      mediaSrc: 'assets/dungeon_1.jpg',
      ambientSound: 'defeat',
      bgmTrack: 'dungeon',
      accentColor: '#ef5350',
      badgeIcon: '💀'
    },
    {
      actNumber: sceneLocales[2].actNumber,
      actTitle: sceneLocales[2].actTitle,
      subTitle: sceneLocales[2].subTitle,
      paragraphs: sceneLocales[2].paragraphs,
      mediaType: 'video',
      mediaSrc: 'assets/citadel_bonfire.mp4',
      mediaFallback: 'assets/citadel_bonfire.jpg',
      ambientSound: 'camp_fire',
      bgmTrack: 'citadel',
      accentColor: '#ffd54f',
      badgeIcon: '🔥'
    },
    {
      actNumber: sceneLocales[3].actNumber,
      actTitle: sceneLocales[3].actTitle,
      subTitle: sceneLocales[3].subTitle,
      paragraphs: sceneLocales[3].paragraphs,
      mediaType: 'image',
      mediaSrc: 'assets/citadel_bonfire.jpg',
      ambientSound: 'fever_burst',
      bgmTrack: 'citadel',
      accentColor: '#c8aa6e',
      badgeIcon: '⚔️'
    }
  ], [sceneLocales]);

  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const isLastScene = currentSceneIndex === scenes.length - 1;

  // 모달 오픈 시 1회 초기화
  useEffect(() => {
    if (open) {
      setCurrentSceneIndex(0);
      setSceneProgress(0);
      setIsAutoPlaying(true);
      setIsTransitioning(false);
    }
  }, [open]);

  // 씬이 변경되거나 모달이 열릴 때만 오디오 1회 재생
  useEffect(() => {
    if (!open || isMuted) return;
    const scene = scenes[currentSceneIndex];
    if (!scene) return;

    try {
      if (scene.ambientSound) {
        SoundManager.getInstance().play(scene.ambientSound as any);
      }
      if (scene.bgmTrack) {
        SoundManager.getInstance().playBgm(scene.bgmTrack);
      }
    } catch (_) {}
  }, [open, currentSceneIndex, isMuted, scenes]);

  // 비디오 재생 관리
  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [open, currentSceneIndex]);

  // 안정적인 자동 진행 타이머 (씬당 7.5초)
  useEffect(() => {
    if (!open || !isAutoPlaying) return;

    setSceneProgress(0);
    const startTime = Date.now();
    const durationMs = 7500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setSceneProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        if (currentSceneIndex < scenes.length - 1) {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentSceneIndex((prev) => prev + 1);
            setSceneProgress(0);
            setIsTransitioning(false);
          }, 250);
        } else {
          setIsAutoPlaying(false);
        }
      }
    }, 60);

    return () => clearInterval(interval);
  }, [open, isAutoPlaying, currentSceneIndex, scenes.length]);

  const handleNextScene = useCallback(() => {
    if (currentSceneIndex < scenes.length - 1) {
      setIsTransitioning(true);
      triggerHaptic('light');
      setTimeout(() => {
        setCurrentSceneIndex((prev) => prev + 1);
        setSceneProgress(0);
        setIsTransitioning(false);
      }, 250);
    }
  }, [currentSceneIndex, scenes.length]);

  const handlePrevScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      setIsTransitioning(true);
      triggerHaptic('light');
      setTimeout(() => {
        setCurrentSceneIndex((prev) => prev - 1);
        setSceneProgress(0);
        setIsTransitioning(false);
      }, 250);
    }
  }, [currentSceneIndex]);

  const handleJumpToScene = (index: number) => {
    if (index === currentSceneIndex) return;
    setIsTransitioning(true);
    triggerHaptic('light');
    setTimeout(() => {
      setCurrentSceneIndex(index);
      setSceneProgress(0);
      setIsTransitioning(false);
    }, 200);
  };

  const handleComplete = () => {
    SoundManager.getInstance().play('click');
    triggerHaptic('click');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-black overflow-hidden font-sans">
      {/* ── 1. 시네마틱 레터박스 배경 뷰포트 (16:9 비율 유지 & 반응형) ── */}
      <div className="relative w-full h-full max-w-[1400px] max-h-[850px] aspect-video flex flex-col justify-between overflow-hidden shadow-2xl bg-black">

        {/* ── 2. 배경 비주얼 레이어 (영상 or 이미지 Ken-Burns 애니메이션) ── */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {currentScene.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentScene.mediaSrc}
              poster={currentScene.mediaFallback}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover filter brightness-[0.75] contrast-110 transition-all duration-700 ${
                isTransitioning ? 'opacity-40 scale-105' : 'opacity-100 scale-100'
              }`}
            />
          ) : (
            <img
              src={currentScene.mediaSrc}
              alt={currentScene.actTitle}
              className={`w-full h-full object-cover filter brightness-[0.70] contrast-115 transition-all duration-700 transform ${
                isTransitioning ? 'opacity-40 scale-105 blur-sm' : 'opacity-100 scale-100'
              }`}
            />
          )}

          {/* 4막 전용: 원정대 3대 영웅 오버레이 실루엣/포트레이트 */}
          {currentSceneIndex === 3 && (
            <div className="absolute inset-0 flex items-center justify-end pr-8 sm:pr-16 pointer-events-none opacity-40 mix-blend-screen transition-opacity duration-1000">
              <div className="flex -space-x-12 filter drop-shadow-[0_0_25px_rgba(200, 170, 110,0.4)]">
                <img
                  src="assets/portraits/portrait_rogue.png"
                  alt="Rogue"
                  className="w-40 sm:w-56 h-40 sm:h-56 object-contain transform -translate-y-4 filter contrast-125"
                />
                <img
                  src="assets/portraits/portrait_paladin.png"
                  alt="Paladin"
                  className="w-48 sm:w-64 h-48 sm:h-64 object-contain z-10 filter contrast-125 brightness-110"
                />
                <img
                  src="assets/portraits/portrait_mage.png"
                  alt="Mage"
                  className="w-40 sm:w-56 h-40 sm:h-56 object-contain transform translate-y-4 filter contrast-125"
                />
              </div>
            </div>
          )}

          {/* 시네마틱 앰비언트 비네팅 & 컬러 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/70 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
          
          {/* 극적인 먼지/불꽃 앰비언트 효과 (스파크 입자) */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
        </div>

        {/* ── 3. 상단 헤더 HUD: 씬 프로그레스 바 & 컨트롤 ── */}
        <header className="relative z-20 flex flex-col w-full p-4 sm:p-6 pb-0 gap-3">
          {/* 프로그레스 인디케이터 (인스타그램/릴스 스타일 4구간 바) */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {scenes.map((_, idx) => {
              const isPassed = idx < currentSceneIndex;
              const isCurrent = idx === currentSceneIndex;
              const width = isPassed ? 100 : isCurrent ? sceneProgress : 0;
              return (
                <div
                  key={idx}
                  onClick={() => handleJumpToScene(idx)}
                  className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:bg-white/40 transition-colors"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#ffd54f] to-[#c8aa6e] rounded-full transition-all duration-75"
                    style={{ width: `${width}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* 상단 액션 바: 게임 로고, 컨트롤 버튼들 */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-white/80">
            <div className="flex items-center gap-2 font-mono tracking-widest text-[#ffd54f]">
              <span className="animate-spin text-base">⚙️</span>
              <span className="font-bold">{ui.modalTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* 자동 재생 / 일시 정지 토글 */}
              <button
                onClick={() => {
                  setIsAutoPlaying(!isAutoPlaying);
                  triggerHaptic('light');
                }}
                className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-white/10 border border-white/20 text-white/90 flex items-center gap-1.5 transition-all text-xs"
                title={isAutoPlaying ? ui.pause : ui.play}
              >
                <span>{isAutoPlaying ? '⏸️' : '▶️'}</span>
                <span className="hidden sm:inline">{isAutoPlaying ? ui.pause : ui.autoPlay}</span>
              </button>

              {/* 음소거 토글 */}
              <button
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (nextMuted) {
                    SoundManager.getInstance().stopBgm();
                  } else {
                    const scene = scenes[currentSceneIndex];
                    if (scene?.bgmTrack) SoundManager.getInstance().playBgm(scene.bgmTrack);
                  }
                  triggerHaptic('light');
                }}
                className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-white/10 border border-white/20 text-white/90 flex items-center gap-1.5 transition-all text-xs"
                title={isMuted ? ui.soundOff : ui.soundOn}
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
              </button>

              {/* 전체 텍스트 토글 */}
              <button
                onClick={() => setShowLogView(!showLogView)}
                className={`px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
                  showLogView
                    ? 'bg-[#c8aa6e]/20 border-[#c8aa6e] text-[#c8aa6e]'
                    : 'bg-black/50 border-white/20 text-white/90 hover:bg-white/10'
                }`}
              >
                <span>📜</span>
                <span className="hidden sm:inline">{ui.fullNarrative}</span>
              </button>

              {/* 스킵 버튼 */}
              <button
                onClick={handleComplete}
                className="px-3 py-1 rounded-lg bg-[#ef5350]/20 hover:bg-[#ef5350]/40 border border-[#ef5350]/60 text-[#ff8a80] hover:text-white font-bold transition-all text-xs flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>⏭️</span>
                <span>{ui.skip}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── 4. 서사 본문 영역 (시네마틱 자막 & 타이포그래피) ── */}
        <main className="relative z-20 flex-1 flex flex-col justify-end p-6 sm:p-12 pb-8 max-w-4xl mx-auto w-full">
          {/* 전체 줄거리 모아보기 팝업 (토글 시 표시) */}
          {showLogView ? (
            <div className="p-5 rounded-2xl bg-black/90 border border-white/20 backdrop-blur-md max-h-[50vh] overflow-y-auto mb-4 text-xs leading-relaxed space-y-4 animate-fade-in shadow-2xl">
              <h3 className="text-sm font-bold text-[#ffd54f] border-b border-white/10 pb-2">
                📜 {ui.logHeader}
              </h3>
              {scenes.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="font-bold text-[#c8aa6e] flex items-center gap-1.5">
                    <span>{s.badgeIcon}</span>
                    <span>{s.actNumber}: {s.actTitle}</span>
                  </div>
                  {s.paragraphs.map((p, pi) => (
                    <p key={pi} className="text-white/80 pl-5">{p}</p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`flex flex-col gap-3 sm:gap-4 transition-all duration-300 transform ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* 막 번호 및 서브타이틀 배지 */}
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl filter drop-shadow">{currentScene.badgeIcon}</span>
                <div className="flex flex-col">
                  <span
                    className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase drop-shadow"
                    style={{ color: currentScene.accentColor }}
                  >
                    {currentScene.actNumber} • {currentScene.subTitle}
                  </span>
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]">
                    {currentScene.actTitle}
                  </h1>
                </div>
              </div>

              {/* 내러티브 텍스트 박스 */}
              <div className="p-4 sm:p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col gap-2.5">
                {currentScene.paragraphs.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-sm sm:text-base leading-relaxed text-slate-200 font-normal tracking-wide drop-shadow"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── 5. 하단 액션 컨트롤 바: 이전/다음/완료 버튼 ── */}
        <footer className="relative z-20 flex items-center justify-between p-4 sm:p-6 pt-0 gap-4">
          {/* 이전 씬 버튼 */}
          <button
            onClick={handlePrevScene}
            disabled={currentSceneIndex === 0}
            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentSceneIndex === 0
                ? 'opacity-30 border-white/10 text-white/40 cursor-not-allowed'
                : 'bg-black/50 hover:bg-white/10 border-white/20 text-white active:scale-95 cursor-pointer'
            }`}
          >
            <span>◀</span>
            <span className="hidden sm:inline">{ui.prevAct}</span>
          </button>

          {/* 중앙: 씬 네비게이션 도트 */}
          <div className="flex items-center gap-2">
            {scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleJumpToScene(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSceneIndex
                    ? 'w-7 bg-[#c8aa6e] shadow-[0_0_8px_#c8aa6e]'
                    : 'bg-white/30 hover:bg-white/60'
                }`}
                title={`${scenes[idx]?.actNumber || idx + 1}`}
              />
            ))}
          </div>

          {/* 다음 씬 or 성채 진입 버튼 */}
          {isLastScene ? (
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#c8aa6e] via-[#0077b6] to-[#023e8a] hover:from-[#48cae4] hover:to-[#0096c7] text-white font-black text-xs sm:text-sm tracking-wider flex items-center gap-2 border border-[#90e0ef] shadow-[0_0_20px_rgba(0,180,216,0.5)] transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer animate-pulse"
            >
              <span>👁️</span>
              <span>{ui.enterCitadel}</span>
              <span>➔</span>
            </button>
          ) : (
            <button
              onClick={handleNextScene}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 border border-white/30 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>{ui.nextAct}</span>
              <span>▶</span>
            </button>
          )}
        </footer>

      </div>
    </div>
  );
};
