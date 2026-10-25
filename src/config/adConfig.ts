/**
 * 🎬 Google AdMob 및 인게임 광고 전역 설정
 * 
 * - 사용자가 발급받은 실제 광고 단위 키가 안전하게 보관되어 있습니다.
 * - 필요할 때 플래그(isRealAdsEnabled) 또는 .env의 VITE_ENABLE_REAL_ADS 값만 true로 바꾸면
 *   코드 수정 없이 즉시 실제 광고가 송출됩니다.
 */

export const AD_CONFIG = {
  // 🏷️ 사용자가 발급받은 실제 AdMob App ID
  PROD_APP_ID: 'ca-app-pub-6764468741905727~8384969973',

  // 🏷️ 사용자가 발급받은 실제 보상형(Rewarded) 광고 단위 키
  PROD_REWARDED_UNIT_ID: 'ca-app-pub-6764468741905727/1175554637',

  // 🏷️ 실제 게시자(Publisher) ID
  PROD_PUBLISHER_ID: 'ca-pub-6764468741905727',

  // 🧪 구글 공식 보상형 동영상 테스트 광고 단위 키 (Android)
  TEST_REWARDED_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',

  // 🧪 구글 공식 샘플 AdMob App ID
  TEST_APP_ID: 'ca-app-pub-3940256099942544~3347511713',
} as const;

// 런타임 오버라이드 플래그 (기본값: true - 실제 라이브 광고 송출 모드)
let runtimeRealAdsOverride: boolean | null = true;

/**
 * 실제 광고 송출 모드가 활성화되어 있는지 여부를 확인합니다.
 * - 기본값: true (실제 발급받은 라이브 AdMob 광고 단위 키 사용)
 */
export function isRealAdsEnabled(): boolean {
  if (runtimeRealAdsOverride !== null) {
    return runtimeRealAdsOverride;
  }
  const envVal = import.meta.env?.VITE_ENABLE_REAL_ADS;
  if (envVal !== undefined) {
    return envVal === 'true' || envVal === true;
  }
  return true;
}


/**
 * 런타임에 실제 광고 모드를 즉시 활성화하거나 비활성화합니다.
 * @param enabled true: 실제 광고 키 사용, false: 안전 테스트 키 사용
 */
export function setRealAdsEnabled(enabled: boolean): void {
  runtimeRealAdsOverride = enabled;
  console.log(`[adConfig] 광고 송출 모드 변경: ${enabled ? '🚨 실제 광고 모드 (PROD)' : '🧪 안전 테스트 모드 (TEST)'}`);
}

/**
 * 현재 활성화된 보상형 광고 단위 ID를 반환합니다.
 */
export function getActiveRewardedAdUnitId(): string {
  // .env에 별도로 지정된 키가 있다면 우선 적용, 없으면 기본 PROD_REWARDED_UNIT_ID 사용
  const configuredProdId = import.meta.env?.VITE_ADMOB_REWARDED_UNIT_ID || AD_CONFIG.PROD_REWARDED_UNIT_ID;

  if (isRealAdsEnabled()) {
    return configuredProdId;
  }
  return AD_CONFIG.TEST_REWARDED_UNIT_ID;
}
