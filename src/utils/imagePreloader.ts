/**
 * 🖼️ 대형 배너 이미지 사전 로드 & 디코드 캐시
 *
 * 문제 배경:
 *  - 성채 시설 휠(CitadelFacilityWheelNavigator)의 배너들은 1376x768 대형 webp이며,
 *    preserve-3d + translate3d/rotateX 변환이 걸린 GPU 합성 레이어 안에서 렌더링된다.
 *  - 모바일 WebView(Chrome/Android)에서는 드로어 진입 애니메이션 도중 이미지가 아직 디코드되지 않은 상태로
 *    3D 레이어가 먼저 래스터화되면, 이미지 로드 완료 후에도 해당 레이어가 다시 그려지지 않아
 *    배너가 일부만 보이거나(타일 누락) 빈 칸으로 남는 현상이 발생한다.
 *
 * 해결:
 *  - 배너를 화면에 띄우기 전에 `HTMLImageElement.decode()`로 미리 디코드해 메모리 캐시에 보관한다.
 *  - 디코드된 Image 객체의 참조를 모듈 레벨에 유지하여 GC/캐시 축출로 인한 재디코드를 방지한다.
 */

/** 성채 시설 휠 & 워크스테이션 헤더에서 공통으로 사용하는 메뉴 배너 */
export const CITADEL_MENU_BANNER_URLS: string[] = [
  'assets/menu_quests.webp',
  'assets/menu_explore.webp',
  'assets/menu_barracks.webp',
  'assets/menu_codex.webp',
  'assets/menu_forge.webp',
  'assets/menu_tavern.webp',
  'assets/menu_infirmary.webp',
  'assets/menu_storage.webp',
  'assets/menu_alchemy.webp',
  'assets/menu_market.webp',
  'assets/menu_cemetery.webp',
  'assets/menu_arena.webp',
];

const decodePromises = new Map<string, Promise<void>>();
const decodedUrls = new Set<string>();
/** 디코드된 이미지 참조 유지 (GC로 인한 디코드 비트맵 축출 방지) */
const retainedImages = new Map<string, HTMLImageElement>();

/** 단일 이미지 사전 로드 + 디코드 (실패해도 reject 하지 않음) */
export function preloadImage(url: string): Promise<void> {
  if (!url || typeof window === 'undefined') return Promise.resolve();
  const cached = decodePromises.get(url);
  if (cached) return cached;

  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      decodedUrls.add(url);
      retainedImages.set(url, img);
      resolve();
    };

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = () => {
      // 실패한 URL은 캐시에서 제거하여 다음 기회에 재시도
      decodePromises.delete(url);
      settled = true;
      resolve();
    };
    img.src = url;
  });

  decodePromises.set(url, p);
  return p;
}

/** 여러 이미지 병렬 사전 로드 + 디코드 */
export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(urls.filter(Boolean).map(preloadImage)).then(() => undefined);
}

/** 모든 URL이 이미 디코드 완료되었는지 동기 확인 */
export function areImagesDecoded(urls: string[]): boolean {
  return urls.filter(Boolean).every((u) => decodedUrls.has(u));
}

/** 브라우저 유휴 시점에 배너 사전 디코드 예약 (앱 진입 직후 메인 스레드 경합 방지) */
export function scheduleIdlePreload(urls: string[], timeoutMs = 1500): void {
  if (typeof window === 'undefined') return;
  const run = () => {
    void preloadImages(urls);
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric(run, { timeout: timeoutMs });
  } else {
    setTimeout(run, 300);
  }
}

/** 두 프레임 뒤 콜백 실행 (이전 레이어 해제 및 레이아웃 확정 이후 실행 보장) */
export function afterNextPaint(cb: () => void): void {
  if (typeof window === 'undefined') {
    cb();
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(cb));
}
