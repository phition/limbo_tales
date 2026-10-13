import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { GameManager } from '../managers/GameManager';
import { SoundManager } from '../managers/SoundManager';
import { getActiveRewardedAdUnitId, isRealAdsEnabled, setRealAdsEnabled, AD_CONFIG } from '../config/adConfig';

export interface AdRequestOptions {
  placement: 'bonfire' | 'wagon' | 'catalyst' | 'cemetery' | 'loot_double' | 'general' | 'tavern';
  title: string;
  description: string;
  rewardText: string;
}

export interface AdPlaybackState {
  isOpen: boolean;
  placement: string;
  title: string;
  description: string;
  rewardText: string;
  secondsRemaining: number;
  totalDuration: number;
  canClose: boolean;
  rewardGranted: boolean;
}

type AdStateListener = (state: AdPlaybackState) => void;

export class GoogleAdService {
  private static instance: GoogleAdService;

  // 🏷️ 공식 Google AdMob 테스트 광고 단위 ID (Rewarded Video)
  public static readonly ADMOB_TEST_REWARDED_ID = AD_CONFIG.TEST_REWARDED_UNIT_ID;
  // 🏷️ 사용자 등록 실제 Google AdMob 보상형 광고 단위 ID
  public static readonly ADMOB_PROD_REWARDED_ID = AD_CONFIG.PROD_REWARDED_UNIT_ID;

  private listeners: Set<AdStateListener> = new Set();
  private currentState: AdPlaybackState = {
    isOpen: false,
    placement: '',
    title: '',
    description: '',
    rewardText: '',
    secondsRemaining: 5,
    totalDuration: 5,
    canClose: false,
    rewardGranted: false,
  };

  private timerId: ReturnType<typeof setInterval> | null = null;
  private resolveCurrentAd: ((result: { success: boolean; rewarded: boolean }) => void) | null = null;
  private isNativeAdMobInitialized = false;

  private constructor() {
    this.initAdMobServices();
  }

  public static getInstance(): GoogleAdService {
    if (!GoogleAdService.instance) {
      GoogleAdService.instance = new GoogleAdService();
    }
    return GoogleAdService.instance;
  }

  /**
   * 🎬 플랫폼별 광고 서비스 비동기 초기화
   */
  private async initAdMobServices(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.initialize({
          initializeForTesting: !isRealAdsEnabled(),
        });
        this.isNativeAdMobInitialized = true;
        console.log(`[GoogleAdService] Native AdMob 초기화 완료 (Real Mode: ${isRealAdsEnabled()})`);
      } catch (err) {
        console.warn('[GoogleAdService] Native AdMob 초기화 실패 (웹/내장 플레이어 폴백):', err);
      }
    } else {
      this.initGoogleAdSenseWeb();
    }
  }

  /**
   * 🌐 웹 브라우저 환경에서 Google AdSense / H5 Ads 스크립트 비동기 준비
   */
  private initGoogleAdSenseWeb(): void {
    if (typeof document === 'undefined') return;
    try {
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-test';
        script.onerror = () => {
          console.log('[GoogleAdService] AdSense 스크립트 오프라인/차단 감지 -> 내장 리워드 플레이어로 전환');
        };
        document.head.appendChild(script);
      }
    } catch (err) {
      console.warn('[GoogleAdService] AdSense Web 초기화 실패 (내장 플레이어 사용):', err);
    }
  }

  /** 현재 실제 광고 모드 여부 */
  public isProductionMode(): boolean {
    return isRealAdsEnabled();
  }

  /** 실제 광고 모드 토글 (런타임 제어) */
  public setProductionMode(enabled: boolean): void {
    setRealAdsEnabled(enabled);
  }

  /** 현재 적용되는 광고 단위 ID */
  public getActiveAdUnitId(): string {
    return getActiveRewardedAdUnitId();
  }

  /** 상태 구독 */
  public subscribe(listener: AdStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn({ ...this.currentState }));
  }

  public getCurrentState(): AdPlaybackState {
    return { ...this.currentState };
  }

  /**
   * 🎬 Google 보상형 동영상 광고 재생 요청
   * - Capacitor 네이티브 모바일 앱: 실제/테스트 AdMob Rewarded Video 표시
   * - 웹 브라우저 / 네이티브 오류 시: 반응형 내장 인터랙티브 모달로 자동 폴백
   * @param options 광고 배치 및 설명 정보
   * @returns 보상 지급 여부
   */
  public async showRewardedAd(options: AdRequestOptions): Promise<{ success: boolean; rewarded: boolean }> {
    if (this.currentState.isOpen) {
      console.warn('[GoogleAdService] 이미 다른 광고가 재생 중입니다.');
      return { success: false, rewarded: false };
    }

    const adUnitId = this.getActiveAdUnitId();
    console.log(`[GoogleAdService] 보상형 광고 요청 [${options.placement}]: 단위ID=${adUnitId} (Real Mode: ${this.isProductionMode()})`);

    // 1) Capacitor 네이티브 모바일 환경인 경우 Native AdMob 직접 시도
    if (Capacitor.isNativePlatform()) {
      try {
        if (!this.isNativeAdMobInitialized) {
          await this.initAdMobServices();
        }

        // 보상형 광고 로드 준비
        await AdMob.prepareRewardVideoAd({ adId: adUnitId });

        // 보상형 광고 재생
        const rewardItem = await AdMob.showRewardVideoAd();
        console.log('[GoogleAdService] Native AdMob 보상 수령 완료:', rewardItem);

        // 보상 효과음 및 촉매 슬롯 자동 개방 번들 혜택 (전리품 2배 광고는 촉매 개방 제외)
        try {
          SoundManager.getInstance().play('reward');
        } catch (_) {}

        if (options.placement !== 'loot_double') {
          try {
            GameManager.getInstance().grantCatalystCharge();
          } catch (err) {
            console.error('[GoogleAdService] 촉매 슬롯 개방 오류:', err);
          }
        }

        return { success: true, rewarded: true };
      } catch (nativeErr) {
        console.warn('[GoogleAdService] Native AdMob 로드/표시 실패 (인벤토리 없음 or 시뮬레이터) -> 내장 반응형 플레이어로 안전 폴백:', nativeErr);
        // 네이티브 실패 시 아래 내장 웹 인터랙티브 모달로 원활히 폴백 진행
      }
    }

    // 2) 웹 환경 또는 네이티브 폴백 인터랙티브 플레이어
    return new Promise((resolve) => {
      this.resolveCurrentAd = resolve;

      const duration = 5; // 5초 인터랙티브 보상 시청 (모바일/웹 반응형 최적화)

      this.currentState = {
        isOpen: true,
        placement: options.placement,
        title: options.title,
        description: options.description,
        rewardText: options.rewardText,
        secondsRemaining: duration,
        totalDuration: duration,
        canClose: false,
        rewardGranted: false,
      };
      this.notifyListeners();

      // 카운트다운 타이머 시작
      if (this.timerId) clearInterval(this.timerId);
      this.timerId = setInterval(() => {
        if (this.currentState.secondsRemaining > 1) {
          this.currentState.secondsRemaining -= 1;
          this.notifyListeners();
        } else {
          // 보상 시청 완료!
          if (this.timerId) clearInterval(this.timerId);
          this.timerId = null;

          this.currentState.secondsRemaining = 0;
          this.currentState.canClose = true;
          this.currentState.rewardGranted = true;
          this.notifyListeners();

          // 보상 효과음
          try {
            SoundManager.getInstance().play('reward');
          } catch (_) {}

          // 💡 전역 1타 2피 원칙: 시청 완료 시 심연 촉매 슬롯 개방권 자동 충전! (전리품 2배 광고 제외)
          if (this.currentState.placement !== 'loot_double') {
            try {
              GameManager.getInstance().grantCatalystCharge();
            } catch (err) {
              console.error('[GoogleAdService] 촉매 충전 오류:', err);
            }
          }
        }
      }, 1000);
    });
  }

  /**
   * ✕ 광고 모달 닫기
   * @param forceSkip 조기 이탈 여부
   */
  public closeAd(forceSkip: boolean = false): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    const wasRewarded = !forceSkip && this.currentState.rewardGranted;

    this.currentState = {
      isOpen: false,
      placement: '',
      title: '',
      description: '',
      rewardText: '',
      secondsRemaining: 0,
      totalDuration: 5,
      canClose: false,
      rewardGranted: false,
    };
    this.notifyListeners();

    if (this.resolveCurrentAd) {
      this.resolveCurrentAd({
        success: true,
        rewarded: wasRewarded,
      });
      this.resolveCurrentAd = null;
    }
  }
}
