/**
 * ═════════════════════════════════════════════════════════════════════════
 * 📱 AppVersionService: 모바일 앱 버전 체크 및 구글 플레이 스토어 바로가기 서비스
 * ═════════════════════════════════════════════════════════════════════════
 * - Firebase Realtime Database (/app_version 또는 /system_config/app_version) 및
 *   정적 원격 엔드포인트(assets/version.json)를 통한 실시간 버전 정보 확인
 * - Capacitor App 플러그인을 통한 현재 네이티브 앱 버전(version, build) 조회
 * - 시맨틱 버전(SemVer) 및 versionCode 비교를 통한 업데이트 필요 여부 감지
 * - 강제 업데이트(Hard Update) vs 권장 업데이트(Soft Update) 분기 처리
 * - market://details?id=com.limbo.tales 딥링크를 통한 플레이 스토어 앱 즉시 실행
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ref, get } from 'firebase/database';
import { db } from './firebaseConfig';

export interface RemoteVersionInfo {
  latestVersion: string;         // e.g. "1.1.3"
  latestVersionCode: number;     // e.g. 25
  minVersion: string;            // e.g. "1.1.0" (이 미만은 강제 업데이트)
  minVersionCode: number;        // e.g. 23
  releaseDate?: string;          // e.g. "2026-10-26"
  title?: string;                // e.g. "Project: Limbo Tales 정식 업데이트"
  releaseNotes?: string;         // 패치 내역
  forceUpdate?: boolean;         // 관리자 플래그에 의한 전역 강제 업데이트
  marketUrl?: string;            // 커스텀 마켓 딥링크 URL
  webUrl?: string;               // 구글 플레이 스토어 웹 URL
}

export interface VersionCheckResult {
  hasUpdate: boolean;            // 업데이트 존재 여부
  isForceUpdate: boolean;        // 필수/강제 업데이트 여부
  currentVersion: string;        // 현재 앱 버전
  currentVersionCode: number;    // 현재 앱 빌드 번호
  remoteInfo: RemoteVersionInfo | null;
}

const PACKAGE_NAME = 'com.limbo.tales';
const DEFAULT_MARKET_URL = `market://details?id=${PACKAGE_NAME}`;
const DEFAULT_WEB_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
const LOCAL_FALLBACK_VERSION = '1.1.3';
const LOCAL_FALLBACK_VERSION_CODE = 25;
const DISMISS_STORAGE_KEY = 'limbo_app_update_dismissed_until';

export class AppVersionService {
  private static instance: AppVersionService | null = null;
  private cachedCurrentVersion: string | null = null;
  private cachedCurrentVersionCode: number | null = null;
  private lastCheckResult: VersionCheckResult | null = null;

  private constructor() {}

  public static getInstance(): AppVersionService {
    if (!AppVersionService.instance) {
      AppVersionService.instance = new AppVersionService();
    }
    return AppVersionService.instance;
  }

  /**
   * 🌟 현재 실행 중인 앱의 버전 및 버전 코드 가져오기
   */
  public async getCurrentAppInfo(): Promise<{ version: string; versionCode: number }> {
    if (this.cachedCurrentVersion && this.cachedCurrentVersionCode !== null) {
      return {
        version: this.cachedCurrentVersion,
        versionCode: this.cachedCurrentVersionCode,
      };
    }

    let version = LOCAL_FALLBACK_VERSION;
    let versionCode = LOCAL_FALLBACK_VERSION_CODE;

    try {
      if (Capacitor.isNativePlatform()) {
        const info = await CapApp.getInfo();
        if (info.version) version = info.version;
        if (info.build) {
          const parsedCode = parseInt(info.build, 10);
          if (!isNaN(parsedCode)) versionCode = parsedCode;
        }
      }
    } catch (err) {
      console.warn('[AppVersionService] Could not read native app info, using fallback:', err);
    }

    this.cachedCurrentVersion = version;
    this.cachedCurrentVersionCode = versionCode;
    return { version, versionCode };
  }

  /**
   * 🌟 원격 서버(Firebase 또는 static JSON)에서 최신 버전 정보 조회
   */
  public async fetchRemoteVersion(): Promise<RemoteVersionInfo | null> {
    // 1. Firebase Realtime Database 우선 조회 (/app_version 또는 /system_config/app_version)
    if (db) {
      try {
        const snapshot1 = await get(ref(db, 'app_version'));
        if (snapshot1.exists()) {
          const val = snapshot1.val();
          return this.normalizeRemoteInfo(val);
        }
        const snapshot2 = await get(ref(db, 'system_config/app_version'));
        if (snapshot2.exists()) {
          const val = snapshot2.val();
          return this.normalizeRemoteInfo(val);
        }
      } catch (err: any) {
        if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('permission_denied') || err?.message?.includes('Permission denied')) {
          console.info('[AppVersionService] ℹ️ Firebase app_version 미연결 또는 권한 제한 -> 정적 version.json fallback 사용');
        } else {
          console.warn('[AppVersionService] Firebase version check skipped or failed:', err);
        }
      }
    }

    // 2. Fallback: 정적 엔드포인트(assets/version.json) 조회
    try {
      const basePath = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
        ? import.meta.env.BASE_URL.replace(/\/$/, '') + '/'
        : './';
      const res = await fetch(`${basePath}assets/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return this.normalizeRemoteInfo(json);
      }
    } catch (err) {
      console.warn('[AppVersionService] Static version.json fetch failed:', err);
    }

    return null;
  }

  /**
   * 🌟 버전 정보 정규화
   */
  private normalizeRemoteInfo(raw: any): RemoteVersionInfo {
    return {
      latestVersion: String(raw.latestVersion || raw.version || LOCAL_FALLBACK_VERSION),
      latestVersionCode: Number(raw.latestVersionCode || raw.versionCode || LOCAL_FALLBACK_VERSION_CODE),
      minVersion: String(raw.minVersion || '1.0.0'),
      minVersionCode: Number(raw.minVersionCode || 1),
      releaseDate: raw.releaseDate ? String(raw.releaseDate) : undefined,
      title: raw.title ? String(raw.title) : undefined,
      releaseNotes: raw.releaseNotes ? String(raw.releaseNotes) : undefined,
      forceUpdate: Boolean(raw.forceUpdate),
      marketUrl: raw.marketUrl ? String(raw.marketUrl) : DEFAULT_MARKET_URL,
      webUrl: raw.webUrl ? String(raw.webUrl) : DEFAULT_WEB_URL,
    };
  }

  /**
   * 🌟 시맨틱 버전 문자열 비교 (v1 > v2: 1, v1 === v2: 0, v1 < v2: -1)
   */
  public compareVersions(v1: string, v2: string): number {
    const clean1 = v1.replace(/^[vV]/, '').trim();
    const clean2 = v2.replace(/^[vV]/, '').trim();
    const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
    const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * 🌟 전체 업데이트 필요 여부 점검 (hasUpdate, isForceUpdate 판정)
   */
  public async checkUpdate(): Promise<VersionCheckResult> {
    const current = await this.getCurrentAppInfo();
    const remote = await this.fetchRemoteVersion();

    if (!remote) {
      const fallbackResult: VersionCheckResult = {
        hasUpdate: false,
        isForceUpdate: false,
        currentVersion: current.version,
        currentVersionCode: current.versionCode,
        remoteInfo: null,
      };
      this.lastCheckResult = fallbackResult;
      return fallbackResult;
    }

    // 1. 최신 버전과 비교 (versionCode 우선, 혹은 semver 비교)
    let hasUpdate = false;
    if (remote.latestVersionCode > 0 && current.versionCode > 0) {
      hasUpdate = remote.latestVersionCode > current.versionCode;
    } else {
      hasUpdate = this.compareVersions(remote.latestVersion, current.version) > 0;
    }

    // 2. 강제 업데이트 조건 판별
    // - 원격의 forceUpdate 플래그가 켜져 있거나,
    // - 현재 버전이 minVersion 미만이거나,
    // - 현재 빌드코드가 minVersionCode 미만인 경우
    let isForceUpdate = false;
    if (hasUpdate) {
      if (remote.forceUpdate) {
        isForceUpdate = true;
      } else if (remote.minVersionCode > 0 && current.versionCode > 0 && current.versionCode < remote.minVersionCode) {
        isForceUpdate = true;
      } else if (this.compareVersions(current.version, remote.minVersion) < 0) {
        isForceUpdate = true;
      }
    }

    const result: VersionCheckResult = {
      hasUpdate,
      isForceUpdate,
      currentVersion: current.version,
      currentVersionCode: current.versionCode,
      remoteInfo: remote,
    };

    this.lastCheckResult = result;
    return result;
  }

  public getLastCheckResult(): VersionCheckResult | null {
    return this.lastCheckResult;
  }

  /**
   * 🌟 오늘 하루 건너뛰기 여부 확인 (강제 업데이트는 건너뛰기 불가)
   */
  public isDismissedForToday(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (!raw) return false;
      const until = parseInt(raw, 10);
      return !isNaN(until) && Date.now() < until;
    } catch {
      return false;
    }
  }

  /**
   * 🌟 오늘 하루(24시간) 업데이트 팝업 건너뛰기 설정
   */
  public dismissForToday(): void {
    try {
      const until = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_STORAGE_KEY, String(until));
    } catch {}
  }

  /**
   * 🌟 건너뛰기 상태 초기화 (수동 확인 시 등)
   */
  public resetDismiss(): void {
    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {}
  }

  /**
   * 🚀 구글 플레이 스토어로 바로가기 (Android 플레이 스토어 딥링크 / 웹 브라우저 Fallback)
   */
  public openPlayStore(customMarketUrl?: string, customWebUrl?: string): void {
    const market = customMarketUrl || DEFAULT_MARKET_URL;
    const web = customWebUrl || DEFAULT_WEB_URL;

    if (Capacitor.isNativePlatform()) {
      // 1. Android 모바일 환경: Play Store 앱 직접 실행 (Intent / market://)
      try {
        window.location.href = market;
      } catch (_) {}

      // 2. Play Store 앱이 열리지 않는 비정상 상황 대비 웹 브라우저 fallback 타이머
      setTimeout(() => {
        try {
          window.open(web, '_system');
        } catch (_) {
          window.open(web, '_blank');
        }
      }, 800);
    } else {
      // 3. PC/웹 환경: 웹 플레이 스토어 페이지 열기
      window.open(web, '_blank', 'noopener,noreferrer');
    }
  }
}
