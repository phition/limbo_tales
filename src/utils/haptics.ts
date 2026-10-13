import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticFeedbackType =
  | 'critical'   // 치명타 강타 (강한 임팩트)
  | 'heroDeath'  // 아군 영웅 사망 (경고/에러 진동)
  | 'defeat'     // 파티 전멸 (긴 진동)
  | 'heavyHit'   // 묵직한 강타 (중간 임팩트)
  | 'heavy'      // 강한 타격 (헤비 임팩트)
  | 'medium'     // 중간 임팩트 별칭
  | 'light'      // 가벼운 임팩트 별칭
  | 'click';     // UI 터치/클릭 (가벼운 탭)

let lastHapticTime = 0;

/**
 * 📳 통합 햅틱 피드백 트리거 함수
 * - Capacitor 모바일 네이티브 환경: @capacitor/haptics 하드웨어 진동 모터 직접 제어
 * - 웹 브라우저 환경: navigator.vibrate() 폴백 지원
 * - 단시간(60ms) 내 과도한 중복 호출 방지 디바운스 내장
 */
export const triggerHaptic = async (type: HapticFeedbackType): Promise<void> => {
  const now = Date.now();
  // 60ms 이내 중복 트리거 방지 (치명적 사망/전멸 이벤트는 즉시 실행)
  if (now - lastHapticTime < 60 && type !== 'heroDeath' && type !== 'defeat') {
    return;
  }
  lastHapticTime = now;

  try {
    if (Capacitor.isNativePlatform()) {
      switch (type) {
        case 'critical':
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'heroDeath':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'defeat':
          await Haptics.vibrate({ duration: 400 });
          break;
        case 'heavyHit':
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'click':
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'critical':
        case 'heavy':
          navigator.vibrate(80);
          break;
        case 'heroDeath':
          navigator.vibrate([100, 50, 150]);
          break;
        case 'defeat':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'heavyHit':
        case 'medium':
          navigator.vibrate(40);
          break;
        case 'click':
        case 'light':
          navigator.vibrate(15);
          break;
      }
    }
  } catch (err) {
    // 햅틱 미지원 기기 또는 권한 차단 환경에서는 무음 처리
    console.debug('[Haptics] 피드백 실행 생략:', err);
  }
};
