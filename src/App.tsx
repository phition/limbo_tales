import React, { useState, useEffect } from 'react';
import { PhaserGame } from './PhaserGame';
import { useGameManager } from './hooks/useGameManager';
import { ResourceBar } from './components/ResourceBar';
import { SystemMenuDrawer } from './components/SystemMenuDrawer';
import { EncyclopediaModal, EncyclopediaCategory } from './components/EncyclopediaModal';
import { GuestbookModal } from './components/GuestbookModal';
import { AuthScreen } from './screens/AuthScreen';
import { CommanderAuthOverlay } from './components/CommanderAuthOverlay';
import { FirebaseService, UserProfile } from './services/FirebaseService';
import { User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { isFullscreen } from './utils/fullscreen';
import { SoundManager } from './managers/SoundManager';
import { initNativeBridge, registerBackButtonHandler, checkPendingBackgroundTimeout } from './utils/nativeBridge';
import { CitadelScreen } from './screens/CitadelScreen';
import { ExplorationScreen } from './screens/ExplorationScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ArenaScreen } from './screens/ArenaScreen';
import { GameDialogModal } from './components/GameDialogModal';
import { GoogleAdModal } from './components/GoogleAdModal';
import { I18nService } from './i18n/I18nService';

const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
  citadel: CitadelScreen,
  exploration: ExplorationScreen,
  battle: BattleScreen,
  arena: ArenaScreen,
};


/** 🌟 앱 시작 시 잔여 세션 존재 여부 판별 (명시적 로그아웃 상태가 아니고 기존 세션/세이브 흔적이 남아있는 경우) */
const checkHasRemainingSession = (): boolean => {
  try {
    if (localStorage.getItem('auth_explicitly_logged_out') === 'true') {
      return false;
    }
    if (localStorage.getItem('limbo_has_session') === 'true') {
      return true;
    }
    if (localStorage.getItem('limbo_saved_email')) {
      return true;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('limbo_save_v1_') && !key.endsWith('_guest')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

/** 🌟 세이브 데이터의 실질적인 진행도 가치(Score) 계산 함수 */
const evaluateSaveProgress = (data: Record<string, unknown> | null): number => {
  if (!data) return 0;
  let score = 0;

  // 1. 던전 해금 층수 (가장 중요: 층당 10,000점)
  const floor = Number(data.unlockedDungeonFloor || data.dungeonFloor || 1);
  score += floor * 10000;

  // 2. 보유 용병단 최고 레벨 및 총 레벨 (레벨당 1,000점)
  const barracks = (data.barracks as Array<{ level?: number }>) || [];
  const party = (data.party as Array<{ level?: number }>) || [];
  const allHeroes = [...barracks, ...party];
  let maxHeroLevel = 1;
  let totalHeroLevels = 0;
  allHeroes.forEach(h => {
    if (h && typeof h.level === 'number') {
      maxHeroLevel = Math.max(maxHeroLevel, h.level);
      totalHeroLevels += h.level;
    }
  });
  score += maxHeroLevel * 1000 + totalHeroLevels * 100;

  // 3. 건물 총 레벨 (레벨당 500점)
  const buildings = (data.buildings as Record<string, { level?: number; unlocked?: boolean }>) || {};
  Object.values(buildings).forEach(b => {
    if (b) {
      if (b.unlocked) score += 200;
      if (typeof b.level === 'number') score += b.level * 500;
    }
  });

  // 4. 보유 골드 및 에테르 (자원 척도)
  const resources = (data.resources as Record<string, number>) || {};
  const gold = Number(resources.gold || 0);
  const ether = Number(resources.ether || 0);
  score += Math.min(gold / 10, 5000) + Math.min(ether, 5000);

  return score;
};

export const App: React.FC = () => {
  const { state, gm } = useGameManager();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideInitialTab, setGuideInitialTab] = useState<EncyclopediaCategory>('all');
  const [guideInitialQuery, setGuideInitialQuery] = useState('');
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 🌐 전역 다국어 DOM 번역 엔진 초기화
  useEffect(() => {
    I18nService.getInstance().initDomTranslator();
  }, []);

  // 📖 전역 백과사전 다이렉트 검색 이벤트 구독
  useEffect(() => {
    const handleOpenEnc = (data: any) => {
      // 튜토리얼 진행 중에는 백과사전 모달 팝업 방지
      try {
        const tutState = localStorage.getItem('ark_tutorial_state');
        if (tutState) {
          const parsed = JSON.parse(tutState);
          if (parsed?.isActive) return;
        }
      } catch (_) {}

      if (data?.tab) setGuideInitialTab(data.tab);
      if (data?.query !== undefined) setGuideInitialQuery(data.query);
      setGuideOpen(true);
    };
    gm.on('openEncyclopedia', handleOpenEnc);
    return () => {
      gm.off('openEncyclopedia', handleOpenEnc);
    };
  }, [gm]);

  // 📋 전역 방명록 (게시판) 모달 오픈 이벤트 구독
  useEffect(() => {
    const handleOpenGuestbook = () => {
      setGuestbookOpen(true);
    };
    gm.on('openGuestbook', handleOpenGuestbook);
    return () => {
      gm.off('openGuestbook', handleOpenGuestbook);
    };
  }, [gm]);

  // 🌟 [지휘관 확인 중....] 오버레이 연출 상태
  const [isVerifyingCommander, setIsVerifyingCommander] = useState(() => checkHasRemainingSession());
  const [commanderAuthCompleted, setCommanderAuthCompleted] = useState(false);
  const [syncStatusDetail, setSyncStatusDetail] = useState('방주 원정대 세션 및 성채 기록 동기화 중...');

  useEffect(() => {
    const fb = FirebaseService.getInstance();

    // 🛡️ iframe / 차단 환경 안전 타이머 (최대 3초 내에 auth 응답 없을 시 게스트로 강제 진입)
    const safetyTimer = setTimeout(() => {
      setAuthChecked((prev) => {
        if (!prev) {
          console.warn('⚠️ [App] Auth 대기 시간 초과(3초) - 로컬 게스트 모드로 자동 시작합니다.');
          setIsVerifyingCommander(false);
          gm.setCurrentUser('guest');
          const hasLocal = gm.loadGame();
          if (!hasLocal) {
            gm.initDefaultData();
          }
          gm.emit('resourcesChanged');
          return true;
        }
        return prev;
      });
    }, 3000);

    const unsubscribe = fb.onAuthChange(async (user, profile) => {
      clearTimeout(safetyTimer);
      if (user) {
        setIsVerifyingCommander(true);
        localStorage.setItem('limbo_has_session', 'true');
        setCurrentUser(user);
        setUserProfile(profile);

        gm.setCurrentUser(user.uid);

        // 1. 로컬 저장소 세이브 확인
        const localSaveKey = gm.getSaveKey();
        const localRaw = localStorage.getItem(localSaveKey);
        let localData: Record<string, unknown> | null = null;
        if (localRaw) {
          try {
            localData = JSON.parse(localRaw) as Record<string, unknown>;
          } catch (_) {}
        }

        // 2. 클라우드 세이브 확인
        setSyncStatusDetail('방주 클라우드 데이터 확인 및 최신 세이브 동기화 중...');
        let cloudData: Record<string, unknown> | null = null;
        let cloudLoadFailed = false;
        try {
          cloudData = await fb.loadProgress();
        } catch (e) {
          console.warn('⚠️ [세이브 동기화] 클라우드 데이터 로드 통신 실패 (네트워크 장애 등):', e);
          cloudLoadFailed = true;
        }

        // 3. 이전 게스트 플레이 세이브 확인 (신규 가입/첫 로그인 시 데이터 승계용)
        const guestRaw = localStorage.getItem('limbo_save_v1_guest');
        let guestData: Record<string, unknown> | null = null;
        if (guestRaw) {
          try {
            guestData = JSON.parse(guestRaw) as Record<string, unknown>;
          } catch (_) {}
        }

        const localScore = evaluateSaveProgress(localData);
        const cloudScore = evaluateSaveProgress(cloudData);
        const guestScore = evaluateSaveProgress(guestData);

        const localTime = Number(localData?.lastSavedAt || localData?.lastTickTimestamp || 0);
        const cloudTime = Number((cloudData?.lastSavedAt as number) || (cloudData?.lastTickTimestamp as number) || 0);

        console.log(`📊 [세이브 정밀 비교] 계정: ${user.email || user.uid}`);
        console.log(`  - 로컬 진행도: ${localScore}점 (시간: ${localTime ? new Date(localTime).toLocaleTimeString() : '없음'})`);
        console.log(`  - 클라우드 진행도: ${cloudScore}점 (시간: ${cloudTime ? new Date(cloudTime).toLocaleTimeString() : '없음'})`);
        console.log(`  - 게스트 진행도: ${guestScore}점`);

        if (cloudLoadFailed) {
          if (localData) {
            console.log('💾 [세이브 동기화] 네트워크 장애 발생 -> 로컬 캐시 데이터 적용 (클라우드 덮어쓰기 방지)');
            gm.loadGame();
          } else {
            console.warn('⚠️ [세이브 동기화] 네트워크 장애 발생 및 로컬 데이터 없음 -> 대기');
          }
        } else if (cloudData && localData) {
          // 양쪽 모두 데이터가 존재할 때: 진행도 가치 우선 비교
          if (cloudScore > localScore + 5000) {
            console.log('☁️ [세이브 동기화] 클라우드 진행도가 로컬보다 월등히 높으므로 클라우드 상태를 로컬에 복원합니다.');
            gm.applyCloudProgress(cloudData);
            gm.saveGame();
          } else if (localScore > cloudScore + 5000) {
            console.log('💾 [세이브 동기화] 로컬 진행도가 클라우드보다 월등히 높으므로 로컬 상태를 클라우드에 업로드합니다.');
            gm.loadGame();
            gm.saveToCloud();
          } else if (cloudTime >= localTime) {
            console.log('☁️ [세이브 동기화] 진행도가 대등하여 최신 타임스탬프인 클라우드 데이터를 적용합니다.');
            gm.applyCloudProgress(cloudData);
            gm.saveGame();
          } else {
            console.log('💾 [세이브 동기화] 진행도가 대등하여 최신 타임스탬프인 로컬 데이터를 적용합니다.');
            gm.loadGame();
            gm.saveToCloud();
          }
        } else if (cloudData) {
          console.log('☁️ [세이브 동기화] 새 기기/환경 접속 -> 클라우드 진행 데이터 복원');
          gm.applyCloudProgress(cloudData);
          gm.saveGame();
        } else if (localData) {
          console.log('💾 [세이브 동기화] 로컬 데이터 복원 및 클라우드 업로드');
          gm.loadGame();
          gm.saveToCloud();
        } else if (guestData && guestScore > 14000) {
          // 🚀 신규 계정 첫 로그인인데 이전 게스트 세이브가 존재하는 경우 -> 자동 승계(Migration)
          console.log(`🚀 [게스트 데이터 마이그레이션] 이전 게스트 진행 데이터(점수: ${guestScore})를 새 지휘관 계정(${user.uid})으로 승계합니다.`);
          gm.applyCloudProgress(guestData);
          gm.saveGame(); // limbo_save_v1_${user.uid}에 저장
          gm.saveToCloud(); // users/${user.uid}/progress에 백업
          gm.addLog('[원정대 인계 완료] 이전 게스트로 탐험하던 방주 기록이 지휘관 계정에 안전하게 귀속되었습니다!', 'reward');
        } else {
          // 진짜 신규 사용자
          console.log('🌱 [세이브 동기화] 저장 데이터 없음 -> 신규 방주 원정 시작');
          const hasLocal = gm.loadGame();
          if (!hasLocal) {
            gm.initDefaultData();
            gm.saveGame();
            gm.saveToCloud();
          }
        }
        if (!Capacitor.isNativePlatform()) {
          // 전역 콘솔 수동 복구 및 업그레이드 함수 바인딩 (PC 개발/테스트 전용)
          (window as any).__setupFloor3 = () => {
            console.log('✨ [수동 복원 트리거] 3층 상태로 전환합니다.');
            gm.setupFloor3Progress();
          };
          (window as any).__applyCommanderMaxUpgrade = () => {
            console.log('👑 [수동 복원 트리거] 지휘관 최고 전력 상태로 전환합니다.');
            gm.applyCommanderMaxUpgrade();
          };
        }

        checkPendingBackgroundTimeout(gm);

        // 지휘관 확인 및 동기화 완료 연출 -> 성채로 부드럽게 진입
        setSyncStatusDetail('생체 인증 동기화 완료. 방주 성채로 진입합니다.');
        setCommanderAuthCompleted(true);
        setTimeout(() => {
          setIsVerifyingCommander(false);
          setAuthChecked(true);
        }, 500);
      } else {
        localStorage.removeItem('limbo_has_session');
        setCurrentUser(null);
        setUserProfile(null);
        setIsVerifyingCommander(false);
        setAuthChecked(true);

        gm.setCurrentUser('guest');
        const hasLocal = gm.loadGame();
        if (!hasLocal) {
          gm.initDefaultData();
        }
        checkPendingBackgroundTimeout(gm);
        if (!Capacitor.isNativePlatform()) {
          (window as any).__applyCommanderMaxUpgrade = () => {
            console.log('👑 [수동 복원 트리거] 지휘관 최고 전력 상태로 전환합니다.');
            gm.applyCommanderMaxUpgrade();
          };
        }
        gm.emit('resourcesChanged');
        gm.emit('buildingUpdated');
        gm.emit('partyUpdated', gm.party);
        gm.emit('questUpdated');
        gm.emit('inventoryUpdated', gm.equipmentInventory);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [gm]);

  // 🌟 [전체화면/창모드 전환 토스트]: 모드 전환 시 하단에 안내 메시지 노출 후 정확히 1초 뒤 자동 소멸
  const [fullscreenToast, setFullscreenToast] = useState<{ icon: string; text: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleFullscreenChange = () => {
      const isFs = isFullscreen();
      const msg = isFs
        ? '전체 화면 모드로 전환되었습니다'
        : '창 모드로 전환되었습니다 (ESC)';

      setFullscreenToast({
        icon: isFs ? '🖥️' : '🗗',
        text: msg,
      });

      // ⏱️ 1초(1000ms) 후 자동으로 토스트 메시지 제거
      timer = setTimeout(() => {
        setFullscreenToast(null);
      }, 1000);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 📱 모바일 네이티브 브릿지 (상태바, 세로 고정, 뒤로가기 버튼) 초기화 및 백그라운드 초과 복구
  useEffect(() => {
    initNativeBridge();
    checkPendingBackgroundTimeout(gm);
  }, [gm]);

  useEffect(() => {
    const unregister = registerBackButtonHandler(() => {
      if (guideOpen) {
        setGuideOpen(false);
        return true;
      }
      if (guestbookOpen) {
        setGuestbookOpen(false);
        return true;
      }
      if (menuOpen) {
        setMenuOpen(false);
        return true;
      }
      if (state.currentScreen !== 'citadel' && state.currentScreen !== 'battle') {
        gm.navigateTo('citadel');
        return true;
      }
      return false;
    });
    return () => unregister();
  }, [guideOpen, menuOpen, state.currentScreen, gm]);

  // 🎵 상황별 배경 음악(BGM) 중앙 자동 전환 관리
  useEffect(() => {
    if (!authChecked) return;

    if (!currentUser) {
      SoundManager.getInstance().playBgm('citadel');
      return;
    }

    if (state.currentScreen === 'citadel') {
      SoundManager.getInstance().playBgm('citadel');
    } else if (state.currentScreen === 'exploration') {
      SoundManager.getInstance().playBgm('dungeon');
    } else if (state.currentScreen === 'battle') {
      const isBoss = (gm.currentMonsters || []).some(m => m.type === 'boss');
      SoundManager.getInstance().playBgm(isBoss ? 'boss' : 'battle');
    } else if (state.currentScreen === 'arena') {
      SoundManager.getInstance().playBgm('battle');
    }
  }, [authChecked, currentUser, state.currentScreen, gm.currentMonsters]);

  // 🌟 브라우저 탭 활성화/복귀 시 오프라인 시간 경과 자동 정산 및 백그라운드 초과 복구
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        checkPendingBackgroundTimeout(gm);
        const report = gm.processOfflineProgress();
        if (report) {
          gm.emit('resourcesChanged');
          gm.emit('buildingUpdated');
          gm.emit('partyUpdated', gm.party);
          gm.emit('update');
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [gm]);

  // 🌟 1. 잔여 세션이 존재하여 '지휘관 확인 중....' 오버레이 연출 중인 경우
  if (isVerifyingCommander) {
    return (
      <CommanderAuthOverlay
        subMessage={syncStatusDetail}
        isCompleted={commanderAuthCompleted}
      />
    );
  }

  // 🌟 2. Firebase Auth 초기 상태 확인 중 (세션 없는 첫 방문 또는 대기 중)
  if (!authChecked) {
    return (
      <div className="w-full h-full min-h-screen bg-[#08090d] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-[#c8aa6e] border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-mono text-[#c8aa6e] tracking-wider">CONNECTING TO LIMBO ARK...</div>
      </div>
    );
  }

  // 미인증 상태 -> 로그인/회원가입 화면 노출
  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onLoginSuccess={(profile) => {
            setUserProfile(profile);
          }}
        />
        {/* 🌟 창 및 전체 화면 모드 전환 시 하단 토스트 알림 (1초 후 자동 소멸) */}
        {fullscreenToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-fade-in transition-all">
            <div className="px-4 py-2 rounded-full bg-[#0d0f14ee] border border-[#c8aa6e88] text-white text-xs font-bold shadow-[0_4px_25px_rgba(200, 170, 110,0.4)] backdrop-blur-md flex items-center gap-2 tracking-wide">
              <span className="text-sm">{fullscreenToast.icon}</span>
              <span className="text-[#e2e8f0]">{fullscreenToast.text}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  const ActiveScreen = SCREEN_COMPONENTS[state.currentScreen] ?? CitadelScreen;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0b0d13' }}>
      {/* Phaser 배경 레이어 (z-index: 0) */}
      <PhaserGame activeScene={state.currentScreen} />

      {/* React UI 레이어 (z-index: 10) */}
      <div
        id="ui-layer"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          boxSizing: 'border-box',
        }}
      >
        <div className="game-column flex flex-col h-full overflow-hidden">
          {/* 전역 최상단 자원 바: 모닥불 표시 + 햄버거 메뉴 버튼 */}
          <ResourceBar
            resources={state.resources}
            bonfireStacks={state.bonfireStacks}
            bonfireWarmthTime={state.bonfireWarmthTime}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
            <ActiveScreen key={state.currentScreen} />
          </div>
        </div>
      </div>

      {/* 우측 슬라이드 인 시스템 메뉴 드로어 */}
      <SystemMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenGuestbook={() => setGuestbookOpen(true)}
      />

      {/* 📖 방주 백과사전 & 종합 도감 (Searchable Encyclopedia & Guide) */}
      <EncyclopediaModal
        open={guideOpen}
        initialTab={guideInitialTab}
        initialSearchQuery={guideInitialQuery}
        onClose={() => setGuideOpen(false)}
      />

      {/* 📋 방주 지휘관 방명록 (게시판) 모달 */}
      <GuestbookModal
        open={guestbookOpen}
        onClose={() => setGuestbookOpen(false)}
        currentUserProfile={userProfile}
      />

      {/* 🌟 창 및 전체 화면 모드 전환 시 하단 토스트 알림 (1초 후 자동 소멸) */}
      {fullscreenToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-fade-in transition-all">
          <div className="px-4 py-2 rounded-full bg-[#0d0f14ee] border border-[#c8aa6e88] text-white text-xs font-bold shadow-[0_4px_25px_rgba(200, 170, 110,0.4)] backdrop-blur-md flex items-center gap-2 tracking-wide">
            <span className="text-sm">{fullscreenToast.icon}</span>
            <span className="text-[#e2e8f0]">{fullscreenToast.text}</span>
          </div>
        </div>
      )}

      {/* 🌟 인게임 커스텀 알림/확인 모달 다이얼로그 */}
      <GameDialogModal />

      {/* 🎬 전역 Google AdMob / 보상형 광고 재생 모달 */}
      <GoogleAdModal />
    </div>
  );
};
