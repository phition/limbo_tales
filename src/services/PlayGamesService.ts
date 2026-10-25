import { Capacitor, registerPlugin } from '@capacitor/core';
import { PGS_ACHIEVEMENTS, PGS_LEADERBOARDS, getTierFromRating } from '../constants/playGamesIds';

export interface PlayGamesPlayer {
  playerId: string;
  displayName: string;
  title?: string;
  level?: number;
  iconImageUri?: string;
  hiResImageUri?: string;
}

export interface PlayGamesAuthResult {
  isAuthenticated: boolean;
  playerId?: string;
  displayName?: string;
  title?: string;
  level?: number;
  iconImageUri?: string;
  hiResImageUri?: string;
}

export interface PlayGamesPluginInterface {
  isAuthenticated(): Promise<PlayGamesAuthResult>;
  signIn(): Promise<PlayGamesAuthResult>;
  getCurrentPlayer(): Promise<PlayGamesAuthResult>;
  requestServerSideAccess(options: { serverClientId: string; forceRefreshToken?: boolean }): Promise<{ authCode: string }>;
  unlockAchievement(options: { achievementId: string }): Promise<{ success: boolean }>;
  incrementAchievement(options: { achievementId: string; steps?: number }): Promise<{ success: boolean }>;
  showAchievements(): Promise<{ success: boolean }>;
  submitScore(options: { leaderboardId: string; score: number }): Promise<{ success: boolean }>;
  showLeaderboard(options?: { leaderboardId?: string }): Promise<{ success: boolean }>;
}

const PlayGamesNative = registerPlugin<PlayGamesPluginInterface>('PlayGames');

/**
 * 🎮 Google Play Games Services v2 프론트엔드 연동 서비스
 * - Android 네이티브 환경에서 PlayGamesPlugin (Capacitor 브릿지)과 통신
 * - 자동 인증 확인(isAuthenticated), 수동 로그인(signIn), 플레이어 프로필(getCurrentPlayer)
 * - 서버 인증 코드 요청(requestServerSideAccess), 업적(Achievements) 및 리더보드(Leaderboards) API 지원
 */
export class PlayGamesService {
  private static instance: PlayGamesService;
  private authenticated = false;
  private player: PlayGamesPlayer | null = null;
  private initialized = false;
  private listeners: Array<(isAuthenticated: boolean, player: PlayGamesPlayer | null) => void> = [];

  private constructor() {}

  public static getInstance(): PlayGamesService {
    if (!PlayGamesService.instance) {
      PlayGamesService.instance = new PlayGamesService();
    }
    return PlayGamesService.instance;
  }

  public isAvailable(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  public getIsAuthenticated(): boolean {
    return this.authenticated;
  }

  public getPlayer(): PlayGamesPlayer | null {
    return this.player;
  }

  public onAuthStateChange(
    listener: (isAuthenticated: boolean, player: PlayGamesPlayer | null) => void
  ): () => void {
    this.listeners.push(listener);
    listener(this.authenticated, this.player);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.authenticated, this.player));
  }

  private applyAuthResult(res: PlayGamesAuthResult): PlayGamesAuthResult {
    this.authenticated = !!res?.isAuthenticated;
    if (this.authenticated && res.playerId && res.displayName) {
      this.player = {
        playerId: res.playerId,
        displayName: res.displayName,
        title: res.title,
        level: res.level,
        iconImageUri: res.iconImageUri,
        hiResImageUri: res.hiResImageUri,
      };
    } else if (!this.authenticated) {
      this.player = null;
    }
    this.notifyListeners();
    return res;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return new Promise<T>((resolve) => {
      const timer = setTimeout(() => {
        console.warn(`[PlayGamesService] 네이티브 응답 타임아웃 (${ms}ms) - 안전 폴백 처리`);
        resolve(fallback);
      }, ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          console.warn('[PlayGamesService] 네이티브 호출 예외:', err);
          resolve(fallback);
        });
    });
  }

  /**
   * 🚀 앱 구동 시 Play 게임즈 서비스 자동 인증 상태 확인
   */
  public async initialize(): Promise<PlayGamesAuthResult> {
    if (!this.isAvailable()) {
      return { isAuthenticated: false };
    }
    if (this.initialized) {
      return {
        isAuthenticated: this.authenticated,
        ...(this.player || {}),
      };
    }
    this.initialized = true;
    return this.checkIsAuthenticated();
  }

  /**
   * 🔍 현재 Play 게임즈 서비스 인증 여부 및 플레이어 정보 조회
   */
  public async checkIsAuthenticated(): Promise<PlayGamesAuthResult> {
    if (!this.isAvailable()) {
      return { isAuthenticated: false };
    }
    try {
      const res = await this.withTimeout(
        PlayGamesNative.isAuthenticated(),
        4000,
        { isAuthenticated: false }
      );
      return this.applyAuthResult(res);
    } catch (err) {
      console.warn('[PlayGamesService] isAuthenticated 확인 실패:', err);
      return { isAuthenticated: false };
    }
  }

  /**
   * 🔑 Play 게임즈 서비스 수동 로그인 요청 (자동 로그인이 되지 않은 경우 호출)
   */
  public async signIn(): Promise<PlayGamesAuthResult> {
    if (!this.isAvailable()) {
      return { isAuthenticated: false };
    }
    try {
      const res = await this.withTimeout(
        PlayGamesNative.signIn(),
        12000,
        { isAuthenticated: false }
      );
      return this.applyAuthResult(res);
    } catch (err) {
      console.warn('[PlayGamesService] signIn 실패:', err);
      return { isAuthenticated: false };
    }
  }

  /**
   * 👤 현재 로그인된 Play 게임즈 플레이어 프로필 조회
   */
  public async getCurrentPlayer(): Promise<PlayGamesPlayer | null> {
    if (!this.isAvailable()) return null;
    try {
      const res = await this.withTimeout(
        PlayGamesNative.getCurrentPlayer(),
        4000,
        { isAuthenticated: false }
      );
      this.applyAuthResult(res);
      return this.player;
    } catch (err) {
      console.warn('[PlayGamesService] getCurrentPlayer 실패:', err);
      return null;
    }
  }

  /**
   * 🔐 백엔드/Firebase 인증 연동용 OAuth 2.0 Server Auth Code 발급 요청
   * @param serverClientId Google Cloud Console의 웹 애플리케이션(OAuth 2.0) 클라이언트 ID
   */
  public async requestServerSideAccess(serverClientId: string, forceRefreshToken = false): Promise<string | null> {
    if (!this.isAvailable() || !serverClientId) return null;
    try {
      const res = await PlayGamesNative.requestServerSideAccess({
        serverClientId,
        forceRefreshToken,
      });
      return res?.authCode || null;
    } catch (err) {
      console.warn('[PlayGamesService] requestServerSideAccess 실패:', err);
      return null;
    }
  }

  /**
   * 🏆 업적 달성(Unlock)
   */
  public async unlockAchievement(achievementId: string): Promise<boolean> {
    if (!this.isAvailable() || !achievementId) return false;
    try {
      const res = await PlayGamesNative.unlockAchievement({ achievementId });
      return !!res?.success;
    } catch (err) {
      console.warn('[PlayGamesService] unlockAchievement 실패:', err);
      return false;
    }
  }

  /**
   * 📈 단계별 업적 진행도 증가(Increment)
   */
  public async incrementAchievement(achievementId: string, steps = 1): Promise<boolean> {
    if (!this.isAvailable() || !achievementId) return false;
    try {
      const res = await PlayGamesNative.incrementAchievement({ achievementId, steps });
      return !!res?.success;
    } catch (err) {
      console.warn('[PlayGamesService] incrementAchievement 실패:', err);
      return false;
    }
  }

  /**
   * 🎖️ Google Play 게임즈 기본 업적(Achievements) UI 열기
   */
  public async showAchievements(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (!this.authenticated) {
        const signInRes = await this.signIn();
        if (!signInRes.isAuthenticated) return false;
      }
      const res = await PlayGamesNative.showAchievements();
      return !!res?.success;
    } catch (err) {
      console.warn('[PlayGamesService] showAchievements 실패:', err);
      return false;
    }
  }

  /**
   * 📊 리더보드 점수 제출(Submit Score)
   */
  public async submitScore(leaderboardId: string, score: number): Promise<boolean> {
    if (!this.isAvailable() || !leaderboardId) return false;
    try {
      const res = await PlayGamesNative.submitScore({
        leaderboardId,
        score: Math.floor(score),
      });
      return !!res?.success;
    } catch (err) {
      console.warn('[PlayGamesService] submitScore 실패:', err);
      return false;
    }
  }

  /**
   * 🏅 Google Play 게임즈 기본 리더보드(Leaderboard) UI 열기
   * @param leaderboardId 특정 리더보드 ID (생략 시 전체 리더보드 목록 표시)
   */
  public async showLeaderboard(leaderboardId?: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (!this.authenticated) {
        const signInRes = await this.signIn();
        if (!signInRes.isAuthenticated) return false;
      }
      const res = await PlayGamesNative.showLeaderboard(leaderboardId ? { leaderboardId } : {});
      return !!res?.success;
    } catch (err) {
      console.warn('[PlayGamesService] showLeaderboard 실패:', err);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 🎮 Google Play 게임즈 업적 & 리더보드 특화 연동 메서드 (기획서 반영)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * ① 심연과의 조우: 첫 정찰에서 안전 귀환 달성 시
   */
  public async trackAbyssEncounter(): Promise<boolean> {
    return this.unlockAchievement(PGS_ACHIEVEMENTS.ABYSS_ENCOUNTER);
  }

  /**
   * ② 심연의 정화: 1~10층 광폭화 보스 전리품 회수 및 에픽 퀘스트 완수 시 (총 6단계)
   * 대상 퀘스트: Q_EPIC_LORE_01, Q_EPIC_LORE_02, Q_EPIC_LORE_03, Q_EPIC_LORE_04, Q_EPIC_LORE_05, Q_SLAY_BOSS_10 (또는 Q_EPIC_AVICI_ENDING)
   */
  public async trackPurificationQuest(questId: string): Promise<boolean> {
    const validQuests = ['Q_EPIC_LORE_01', 'Q_EPIC_LORE_02', 'Q_EPIC_LORE_03', 'Q_EPIC_LORE_04', 'Q_EPIC_LORE_05', 'Q_SLAY_BOSS_10', 'Q_EPIC_AVICI_ENDING'];
    if (!validQuests.includes(questId)) return false;
    return this.incrementAchievement(PGS_ACHIEVEMENTS.ABYSS_PURIFICATION, 1);
  }

  /**
   * ③ 무저갱의 출구: 11층(무간도) 진입로 1,000 단위 계층(1~10계층) 개방 시 (총 10단계)
   */
  public async trackAviciTierUnlock(steps: number = 1): Promise<boolean> {
    if (steps <= 0) return false;
    return this.incrementAchievement(PGS_ACHIEVEMENTS.AVICI_EXIT, steps);
  }

  /**
   * ④ 차원 아레나 5단계 업적 및 ⑦ 차원의 무법자 리더보드 연동
   * - 최초 1승: 차원 아레나의 데뷔
   * - 실버 등급: 차원 아레나의 돌풍
   * - 골드 등급: 차원 아레나의 승리자
   * - 플래티넘 등급: 차원 아레나의 정복자
   * - 다이아몬드 등급: 차원 아레나의 지배자
   * - 차원의 무법자 리더보드: max(0, 승리*3 - 패배*1) 점수 제출
   */
  public async trackArenaMatchResult(
    isWin: boolean,
    currentRating: number,
    totalWins: number,
    totalLosses: number
  ): Promise<void> {
    // 1) 차원의 무법자 리더보드 점수 산출 및 제출 (승리 +3점, 패배 -1점, 최소 0)
    const outlawScore = Math.max(0, totalWins * 3 - totalLosses * 1);
    await this.submitScore(PGS_LEADERBOARDS.DIMENSIONAL_OUTLAW, outlawScore);

    // 2) 아레나 업적 판정
    if (isWin && totalWins >= 1) {
      await this.unlockAchievement(PGS_ACHIEVEMENTS.ARENA_DEBUT);
    }

    const tier = getTierFromRating(currentRating);
    const tierRanking = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'];
    const curTierIdx = tierRanking.indexOf(tier);

    if (curTierIdx >= 1) {
      await this.unlockAchievement(PGS_ACHIEVEMENTS.ARENA_GUST); // 실버 이상
    }
    if (curTierIdx >= 2) {
      await this.unlockAchievement(PGS_ACHIEVEMENTS.ARENA_VICTOR); // 골드 이상
    }
    if (curTierIdx >= 3) {
      await this.unlockAchievement(PGS_ACHIEVEMENTS.ARENA_CONQUEROR); // 플래티넘 이상
    }
    if (curTierIdx >= 4) {
      await this.unlockAchievement(PGS_ACHIEVEMENTS.ARENA_RULER); // 다이아몬드 이상
    }
  }

  /**
   * ⑤ 리더보드 1: 심연의 정화자 (정복자)
   * - 총점 = 1~10층 보스 격파 기본점(층당 floor * 1,000점) + 1F~10F 클리어 최단 시간 타임어택 보너스
   * - 타임어택 점수 = max(0, floor((7,200 - T_clear) * 10))
   */
  public async submitAbyssPurifierScore(
    defeatedFloors: number[],
    best10FClearTimeSeconds?: number
  ): Promise<boolean> {
    // 1~10층 보스 격파 기본점
    let bossBaseScore = 0;
    for (let f = 1; f <= 10; f++) {
      if (defeatedFloors.includes(f)) {
        bossBaseScore += f * 1000;
      }
    }

    // 1F~10F 완주 타임어택 보너스
    let timeAttackBonus = 0;
    if (defeatedFloors.includes(10) && best10FClearTimeSeconds && best10FClearTimeSeconds > 0) {
      timeAttackBonus = Math.max(0, Math.floor((7200 - best10FClearTimeSeconds) * 10));
    }

    const totalScore = bossBaseScore + timeAttackBonus;
    return this.submitScore(PGS_LEADERBOARDS.ABYSS_PURIFIER, totalScore);
  }

  /**
   * ⑥ 리더보드 2: 무저갱의 방랑자
   * - 총점 = (도달한 최대 위험도 * 10) + 진 최종보스 격파점(20,000점) + 광폭화 보스 격파점(50,000점) + 타임어택 보너스
   * - 타임어택 보너스 = max(0, floor((1,800 - ΔT) * 20))
   */
  public async submitAviciWandererScore(
    maxDanger: number,
    killedArcheos: boolean,
    killedEnragedArcheos: boolean,
    timeAttackBonus: number = 0
  ): Promise<boolean> {
    const dangerScore = Math.min(10000, Math.max(0, Math.floor(maxDanger))) * 10;
    const archeosBonus = killedArcheos ? 20000 : 0;
    const enragedBonus = killedEnragedArcheos ? 50000 : 0;
    const totalScore = dangerScore + archeosBonus + enragedBonus + Math.max(0, Math.floor(timeAttackBonus));

    return this.submitScore(PGS_LEADERBOARDS.AVICI_WANDERER, totalScore);
  }
}
