/**
 * 🎮 Google Play Games Services (PGS) 공식 ID 매핑 상수
 * 출처: android/app/src/main/res/values/games-ids.xml
 */

export const PLAY_GAMES_APP_ID = '994199040524';
export const PLAY_GAMES_PACKAGE_NAME = 'com.limbo.tales';

export const PGS_ACHIEVEMENTS = {
  /** 심연과의 조우: 첫 정찰에서 안전 귀환 시 */
  ABYSS_ENCOUNTER: 'CgkIjOSF1_ccEAIQAg',
  /** 심연의 정화: 1~10층 광폭화 보스 처치 및 정화 에픽 퀘스트 완수 시 (총 6단계) */
  ABYSS_PURIFICATION: 'CgkIjOSF1_ccEAIQAw',
  /** 무저갱의 출구: 11층(무간도) 1,000단위 진입 계층(1~10계층) 개방 시 (총 10단계) */
  AVICI_EXIT: 'CgkIjOSF1_ccEAIQBA',
  /** 차원 아레나의 데뷔: 아레나 첫 참가 및 최초 1승 달성 */
  ARENA_DEBUT: 'CgkIjOSF1_ccEAIQBQ',
  /** 차원 아레나의 돌풍: 아레나 실버(Silver) 등급 달성 (1,000P 이상) */
  ARENA_GUST: 'CgkIjOSF1_ccEAIQBg',
  /** 차원 아레나의 승리자: 아레나 골드(Gold) 등급 달성 (1,300P 이상) */
  ARENA_VICTOR: 'CgkIjOSF1_ccEAIQBw',
  /** 차원 아레나의 정복자: 아레나 플래티넘(Platinum) 등급 달성 (1,600P 이상) */
  ARENA_CONQUEROR: 'CgkIjOSF1_ccEAIQCA',
  /** 차원 아레나의 지배자: 아레나 다이아몬드(Diamond) 등급 달성 (1,900P 이상) */
  ARENA_RULER: 'CgkIjOSF1_ccEAIQCQ',
} as const;

export type PgsAchievementKey = keyof typeof PGS_ACHIEVEMENTS;

export const PGS_LEADERBOARDS = {
  /** 심연의 정화자 (심연의 정복자): 1~10층 보스 격파 및 격파 시간 점수 합산 */
  ABYSS_PURIFIER: 'CgkIjOSF1_ccEAIQCg',
  /** 무저갱의 방랑자: 11층 위험도 및 최종/광폭화 보스 격파 점수 */
  AVICI_WANDERER: 'CgkIjOSF1_ccEAIQCw',
  /** 차원의 무법자: 아레나 승리 점수 */
  DIMENSIONAL_OUTLAW: 'CgkIjOSF1_ccEAIQDA',
} as const;

export type PgsLeaderboardKey = keyof typeof PGS_LEADERBOARDS;

export type ArenaTierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

/** 레이팅 점수 기반 아레나 티어 계산 */
export function getTierFromRating(rating: number): ArenaTierName {
  if (rating >= 2500) return 'grandmaster';
  if (rating >= 2200) return 'master';
  if (rating >= 1900) return 'diamond';
  if (rating >= 1600) return 'platinum';
  if (rating >= 1300) return 'gold';
  if (rating >= 1000) return 'silver';
  return 'bronze';
}

