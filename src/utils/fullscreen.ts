/**
 * 브라우저 전체화면 지원 유틸리티
 */

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export async function enterFullscreen(element: Element = document.documentElement): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
      return true;
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
      return true;
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.debug('Browser fullscreen request failed or was ignored:', err);
  }
  return false;
}

export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
      return true;
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
      return true;
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
      return true;
    }
  } catch (err) {
    console.debug('Browser exit fullscreen failed:', err);
  }
  return false;
}

export async function toggleFullscreen(): Promise<boolean> {
  if (isFullscreen()) {
    return !(await exitFullscreen());
  } else {
    return await enterFullscreen();
  }
}
