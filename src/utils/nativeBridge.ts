import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App as CapApp } from '@capacitor/app';
import { SoundManager } from '../managers/SoundManager';
import { GameManager } from '../managers/GameManager';

type BackButtonCallback = () => boolean | Promise<boolean>;

const backButtonHandlers: BackButtonCallback[] = [];

export const registerBackButtonHandler = (handler: BackButtonCallback): (() => void) => {
  backButtonHandlers.push(handler);
  return () => {
    const index = backButtonHandlers.indexOf(handler);
    if (index !== -1) {
      backButtonHandlers.splice(index, 1);
    }
  };
};

export const BACKGROUND_TIMESTAMP_KEY = 'limbo_bg_timestamp';
export const BACKGROUND_IN_DUNGEON_KEY = 'limbo_bg_in_dungeon';
export const BACKGROUND_TIMEOUT_MS = 3 * 60 * 1000; // 3분 (180,000ms)

let bgTimerId: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

/**
 * ⏱️ 백그라운드 3분 초과 시 앱 종료 및 던전 전멸 처리 핸들러
 */
export const handleBackgroundTimeout = (gm: GameManager): void => {
  console.log('[NativeBridge] 백그라운드 3분 초과: 앱 자동 종료 및 던전 전멸 처리 실행');
  const dungeonSession = gm.getDungeonSession();
  const wasInDungeon =
    localStorage.getItem(BACKGROUND_IN_DUNGEON_KEY) === 'true' ||
    !!dungeonSession ||
    gm.currentScreen === 'exploration' ||
    gm.currentScreen === 'battle';

  if (wasInDungeon) {
    gm.resolvePartyWipeout('심연 백그라운드 장기 이탈 (3분 초과 전멸)');
  }

  gm.clearDungeonSession();
  localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
  localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);

  if (Capacitor.isNativePlatform()) {
    CapApp.exitApp();
  }
};

/**
 * 🌟 앱 구동 또는 포그라운드 복귀 시 이전 백그라운드 3분 초과 방치 세션 감지 및 하이브리드 복원/전멸 처리
 * @returns true if restored to dungeon/battle, false otherwise
 */
export const checkPendingBackgroundTimeout = (gm: GameManager): boolean => {
  try {
    const bgTimeStr = localStorage.getItem(BACKGROUND_TIMESTAMP_KEY);
    const bgInDungeonStr = localStorage.getItem(BACKGROUND_IN_DUNGEON_KEY);
    const dungeonSession = gm.getDungeonSession();
    const wasInDungeon =
      bgInDungeonStr === 'true' ||
      (bgInDungeonStr === null && (gm.currentScreen === 'exploration' || gm.currentScreen === 'battle'));

    if (!wasInDungeon || !dungeonSession) {
      return false;
    }

    const bgTime = bgTimeStr ? Number(bgTimeStr) : (dungeonSession ? dungeonSession.savedAt : 0);
    const now = Date.now();

    if (bgTime > 0) {
      const elapsed = now - bgTime;
      if (elapsed >= BACKGROUND_TIMEOUT_MS) {
        console.log(`[NativeBridge] 이전 백그라운드 3분 초과 방치 감지 (${Math.round(elapsed / 1000)}초 경과) -> 전멸 처리`);
        gm.resolvePartyWipeout('심연 백그라운드 장기 이탈 (3분 초과 전멸)');
        gm.clearDungeonSession();
        localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
        localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);
        return false;
      } else {
        // 3분 이내 복귀: 던전/전투 세션 스냅샷 복원!
        console.log(`[NativeBridge] 3분 이내 복귀 감지 (${Math.round(elapsed / 1000)}초 경과) -> 던전/전투 하이브리드 세션 복원`);
        localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
        localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);

        if (dungeonSession) {
          gm.dungeonFloor = dungeonSession.dungeonFloor || gm.dungeonFloor || 1;
          gm.dungeonDangerLevel = dungeonSession.dungeonDangerLevel || 0;
          gm.isOvercharged = !!dungeonSession.isOvercharged;
          if (Array.isArray(dungeonSession.dungeonInventory)) {
            gm.dungeonInventory = dungeonSession.dungeonInventory;
          }
          if (Array.isArray(dungeonSession.pendingLoot)) {
            gm.pendingLoot = dungeonSession.pendingLoot;
          }
          if (dungeonSession.campCooldown !== undefined) {
            gm.campCooldown = dungeonSession.campCooldown;
          }

          const targetScreen = dungeonSession.screen === 'battle' ? 'battle' : 'exploration';
          gm.navigateTo(targetScreen);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[NativeBridge] checkPendingBackgroundTimeout 오류:', err);
  } finally {
    localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
    localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);
  }
  return false;
};

/**
 * 백그라운드 진입 공통 처리 (모바일 appStateChange & 웹 visibilitychange)
 */
const onAppEnterBackground = () => {
  SoundManager.getInstance().pauseBgm();

  const gm = GameManager.getInstance();
  const now = Date.now();
  const inDungeon = gm.currentScreen === 'exploration' || gm.currentScreen === 'battle';

  localStorage.setItem(BACKGROUND_TIMESTAMP_KEY, String(now));
  localStorage.setItem(BACKGROUND_IN_DUNGEON_KEY, String(inDungeon));

  if (inDungeon) {
    gm.saveDungeonSession(gm.currentScreen as 'battle' | 'exploration');
  } else {
    gm.clearDungeonSession();
  }

  try {
    gm.saveGame();
  } catch (_) {}

  if (bgTimerId) {
    clearTimeout(bgTimerId);
  }

  bgTimerId = setTimeout(() => {
    handleBackgroundTimeout(gm);
  }, BACKGROUND_TIMEOUT_MS);
};

/**
 * 포그라운드 복귀 공통 처리
 */
const onAppResumeForeground = () => {
  const gm = GameManager.getInstance();

  if (bgTimerId) {
    clearTimeout(bgTimerId);
    bgTimerId = null;
  }

  const bgTimeStr = localStorage.getItem(BACKGROUND_TIMESTAMP_KEY);
  const dungeonSession = gm.getDungeonSession();
  const wasInDungeon =
    localStorage.getItem(BACKGROUND_IN_DUNGEON_KEY) === 'true' ||
    !!dungeonSession ||
    gm.currentScreen === 'exploration' ||
    gm.currentScreen === 'battle';

  if (bgTimeStr) {
    const bgTime = Number(bgTimeStr);
    const elapsed = Date.now() - bgTime;
    if (elapsed >= BACKGROUND_TIMEOUT_MS) {
      console.log(`[NativeBridge] 백그라운드 복귀 감지: ${Math.round(elapsed / 1000)}초 경과 (3분 초과) -> 전멸 처리 및 종료`);
      if (wasInDungeon) {
        gm.resolvePartyWipeout('심연 백그라운드 장기 이탈 (3분 초과 전멸)');
      }
      gm.clearDungeonSession();
      localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
      localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);

      if (Capacitor.isNativePlatform()) {
        CapApp.exitApp();
        return;
      }
    } else {
      console.log(`[NativeBridge] 3분 이내 복귀 (${Math.round(elapsed / 1000)}초) -> 세션 유지`);
      localStorage.removeItem(BACKGROUND_TIMESTAMP_KEY);
      localStorage.removeItem(BACKGROUND_IN_DUNGEON_KEY);
    }
  }

  SoundManager.getInstance().resumeBgm();
};

/**
 * 모바일 네이티브 환경(Capacitor) 초기화:
 * 1. 상단 상태표시줄(StatusBar) 다크 테마 일체화
 * 2. 화면 세로 모드(Portrait) 고정
 * 3. 하드웨어 뒤로가기 버튼 리스너 등록
 * 4. 백그라운드 3분 타이머 감지 및 BGM 정지, 3분 경과 시 앱 종료 & 던전 전멸 판정
 */
export const initNativeBridge = async (onDefaultExit?: () => void): Promise<void> => {
  if (isInitialized) return;
  isInitialized = true;

  // 웹 브라우저 환경에서도 백그라운드 타이머 및 visibilitychange 대응
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        onAppEnterBackground();
      } else if (document.visibilityState === 'visible') {
        onAppResumeForeground();
      }
    });
  }

  if (!Capacitor.isNativePlatform()) {
    console.log('[NativeBridge] 웹 브라우저 환경에서 실행 중입니다.');
    return;
  }

  console.log('[NativeBridge] 안드로이드/모바일 네이티브 환경 초기화 시작...');

  // 1. 상태바 스타일 적용
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0b0d13' });
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.show();
  } catch (err) {
    console.warn('[NativeBridge] StatusBar 설정 실패:', err);
  }

  // 2. 화면 방향 세로 고정
  try {
    await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch (err) {
    console.warn('[NativeBridge] ScreenOrientation 고정 실패:', err);
  }

  // 3. 하드웨어 뒤로가기 버튼 처리
  try {
    CapApp.addListener('backButton', async () => {
      for (let i = backButtonHandlers.length - 1; i >= 0; i--) {
        const handler = backButtonHandlers[i];
        const consumed = await handler();
        if (consumed) {
          return;
        }
      }

      if (onDefaultExit) {
        onDefaultExit();
      } else {
        const exitConfirmed = window.confirm('게임을 종료하시겠습니까?');
        if (exitConfirmed) {
          CapApp.exitApp();
        }
      }
    });
  } catch (err) {
    console.warn('[NativeBridge] BackButton 리스너 등록 실패:', err);
  }

  // 4. 모바일 백그라운드/포그라운드 상태 전환 감지
  try {
    CapApp.addListener('appStateChange', ({ isActive }) => {
      console.log(`[NativeBridge] 모바일 앱 상태 전환 감지: isActive = ${isActive}`);
      if (!isActive) {
        onAppEnterBackground();
      } else {
        onAppResumeForeground();
      }
    });
  } catch (err) {
    console.warn('[NativeBridge] appStateChange 리스너 등록 실패:', err);
  }
};
