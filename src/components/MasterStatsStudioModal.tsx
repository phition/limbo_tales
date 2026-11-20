import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from './Modal';
import { FirebaseService, MasterUserStatistics, UserStatsSummary, isReconnectedWithin3Days } from '../services/FirebaseService';
import { getRankBadge } from '../screens/ArenaScreen';

interface Props {
  open: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'top10' | 'arena' | 'all';

function formatRelativeTime(ts: number): string {
  if (!ts || ts <= 0) return '기록 없음';
  const now = Date.now();
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const month = Math.floor(day / 30);
  return `${month}달 전`;
}

function formatFullDate(ts: number): string {
  if (!ts || ts <= 0) return '-';
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 🌀 유저의 최고 도달 층수 안전 계산 (unlockedDungeonFloor 기준 정밀 집계) */
export function getUserReachedFloor(u: UserStatsSummary | { unlockedDungeonFloor?: number; dungeonFloor?: number }): number {
  if (!u) return 1;
  const unlocked = Number(u.unlockedDungeonFloor || 0);
  const current = Number(u.dungeonFloor || 0);
  return Math.max(1, unlocked, current);
}

/** 🏷️ 층수 표시 뱃지 포맷터 */
export function formatFloorBadge(floor: number, aviciTier: number = 0): { label: string; isHigh: boolean } {
  if (floor >= 11) {
    return { label: aviciTier > 1 ? `무간도 ${aviciTier}T(11F)` : '무간도(11F)', isHigh: true };
  }
  if (floor === 10) {
    return { label: '10층', isHigh: true };
  }
  return { label: `${floor}층`, isHigh: false };
}

const RECOMMENDED_RULES_PREVIEW = `{
  "rules": {
    "users": {
      ".read": true,
      "$uid": {
        "profile": { ".read": true, ".write": true },
        "progress": { ".read": true, ".write": true },
        "ping": { ".read": true, ".write": true }
      }
    },
    "system_stats": {
      ".read": true,
      ".write": true
    },
    "recent_active_users": {
      ".read": true,
      ".write": true,
      ".indexOn": ["lastActiveAt"]
    },
    "callsigns": { ".read": true, ".write": true },
    "arena_leaderboard": { ".read": true, ".write": true, ".indexOn": ["rating"] }
  }
}`;

export type CardFilterKey =
  | 'all'
  | 'authenticated'
  | 'anonymous'
  | 'bot'
  | 'active3d'
  | 'inactive3d'
  | 'active24h'
  | 'active7d'
  | 'floor10_cleared'
  | 'floor10_reached'
  | 'floor10_below'
  | 'floor_1'
  | 'floor_2'
  | 'floor_3'
  | 'floor_4'
  | 'floor_5'
  | 'floor_6'
  | 'floor_7'
  | 'floor_8'
  | 'floor_9'
  | 'floor_10'
  | 'floor_11'
  | 'arena_all'
  | 'arena_high'
  | 'grandmaster'
  | 'master'
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'unranked';

interface CardModalState {
  open: boolean;
  filterKey: CardFilterKey;
  label: string;
  icon: string;
  color: string;
  searchTerm: string;
  page: number;
}

/** 🔍 카드별 유저 전수 필터링 헬퍼 (최근 접속일 최신순 정렬) */
function filterUsersByCardKey(users: UserStatsSummary[], filterKey: CardFilterKey, term: string): UserStatsSummary[] {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;
  const cleanTerm = term.trim().toLowerCase();

  return (users || []).filter(u => {
    if (cleanTerm) {
      const matchNick = u.nickname?.toLowerCase().includes(cleanTerm);
      const matchUid = u.uid?.toLowerCase().includes(cleanTerm);
      const matchEmail = u.email?.toLowerCase().includes(cleanTerm);
      if (!matchNick && !matchUid && !matchEmail) return false;
    }

    // 🏕️ building 내 cabin level 1 이하 계정 제외
    if (u.cabinLevel !== undefined && u.cabinLevel <= 1) return false;

    const reachedFloor = getUserReachedFloor(u);
    const rating = u.arenaRating || 0;
    const hasArena = u.arenaGateLevel >= 1 || rating > 0;
    const isBot = u.accountType === 'bot' || Boolean(u.isSuspectedBot);
    const isAnon = u.accountType === 'anonymous' || (u.isAnonymous && !isBot);
    const isAuth = u.accountType === 'authenticated' || (!u.isAnonymous && !isBot);

    switch (filterKey) {
      case 'all':
        return true;
      case 'authenticated':
        return isAuth;
      case 'anonymous':
        return isAnon;
      case 'bot':
        return isBot;
      case 'active3d':
        return isReconnectedWithin3Days(u);
      case 'inactive3d':
        return !isReconnectedWithin3Days(u);
      case 'active24h':
        return u.lastActiveAt > 0 && (now - u.lastActiveAt <= ONE_DAY);
      case 'active7d':
        return u.lastActiveAt > 0 && (now - u.lastActiveAt <= SEVEN_DAYS);
      case 'floor10_cleared':
        return reachedFloor >= 11;
      case 'floor10_reached':
        return reachedFloor >= 10;
      case 'floor10_below':
        return reachedFloor < 10;
      case 'floor_1':
        return reachedFloor === 1;
      case 'floor_2':
        return reachedFloor === 2;
      case 'floor_3':
        return reachedFloor === 3;
      case 'floor_4':
        return reachedFloor === 4;
      case 'floor_5':
        return reachedFloor === 5;
      case 'floor_6':
        return reachedFloor === 6;
      case 'floor_7':
        return reachedFloor === 7;
      case 'floor_8':
        return reachedFloor === 8;
      case 'floor_9':
        return reachedFloor === 9;
      case 'floor_10':
        return reachedFloor === 10;
      case 'floor_11':
        return reachedFloor >= 11;
      case 'arena_all':
        return hasArena;
      case 'arena_high':
        return rating >= 1900;
      case 'grandmaster':
        return rating >= 2500;
      case 'master':
        return rating >= 2200 && rating < 2500;
      case 'diamond':
        return rating >= 1900 && rating < 2200;
      case 'platinum':
        return rating >= 1600 && rating < 1900;
      case 'gold':
        return rating >= 1300 && rating < 1600;
      case 'silver':
        return rating >= 1000 && rating < 1300;
      case 'bronze':
        return rating > 0 && rating < 1000;
      case 'unranked':
        return rating === 0;
      default:
        return true;
    }
  }).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

export const MasterStatsStudioModal: React.FC<Props> = ({ open, onClose }) => {
  const [stats, setStats] = useState<MasterUserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // 전체 지휘관 명부 검색 및 필터 상태 (10명 단위 페이징)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'authenticated' | 'anonymous' | 'bot' | 'active3d' | 'inactive3d' | 'floor11' | 'floor10' | 'floor7_9' | 'floor4_6' | 'floor1_3' | 'arena'
  >('all');
  const [sortField, setSortField] = useState<'lastActive' | 'dungeonFloor' | 'arenaRating' | 'createdAt'>('lastActive');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // 🌟 10명씩 전수 리스트 보기

  // 🔥 최근 접속 지휘관 탭 전수 10명 단위 페이징 상태
  const [recentPage, setRecentPage] = useState(1);

  // 🗂️ 카드 클릭 시 열리는 상세 전수 리스트 팝업 상태 (10명 단위 페이징)
  const [cardModal, setCardModal] = useState<CardModalState>({
    open: false,
    filterKey: 'all',
    label: '',
    icon: '',
    color: '#c8aa6e',
    searchTerm: '',
    page: 1
  });

  // 🔄 스튜디오 실행(모달 오픈) 시점에만 서버에서 On-Demand로 데이터 로드 (자원 절약형 카운터 모드 기본 적용)
  const loadData = useCallback(async (forceFullScan: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const fb = FirebaseService.getInstance();
      const result = await fb.fetchMasterUserStatistics(forceFullScan);
      setStats(result);
    } catch (err: any) {
      console.error('❌ [MasterStatsStudio] 통계 데이터 로드 실패:', err);
      setError(err?.message || 'Firebase 데이터베이스 통계 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달이 열릴 때만 데이터를 로드 (백그라운드 polling 방지)
  useEffect(() => {
    if (open) {
      loadData(false);
    }
  }, [open, loadData]);

  // 비율 계산 헬퍼
  const getPct = (count: number, total: number) => {
    if (!total || total <= 0) return '0.0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  };

  // 👆 카드 클릭 시 10명 단위 전수 리스트 팝업 열기 핸들러
  const handleOpenCardList = (filterKey: CardFilterKey, label: string, icon: string, color: string = '#c8aa6e') => {
    setCardModal({
      open: true,
      filterKey,
      label,
      icon,
      color,
      searchTerm: '',
      page: 1
    });
  };

  // 카드 상세 모달 전수 필터링 결과
  const cardFilteredUsers = useMemo(() => {
    if (!stats?.allUsers) return [];
    return filterUsersByCardKey(stats.allUsers, cardModal.filterKey, cardModal.searchTerm);
  }, [stats?.allUsers, cardModal.filterKey, cardModal.searchTerm]);

  const CARD_PAGE_SIZE = 10; // 🌟 10명씩 전수 리스트
  const cardTotalPages = Math.max(1, Math.ceil(cardFilteredUsers.length / CARD_PAGE_SIZE));
  const cardPaginatedUsers = useMemo(() => {
    const start = (cardModal.page - 1) * CARD_PAGE_SIZE;
    return cardFilteredUsers.slice(start, start + CARD_PAGE_SIZE);
  }, [cardFilteredUsers, cardModal.page]);

  // 계정 유형 뱃지 렌더러 (정식 서약 🛡️ / 익명 게스트 👤 / 구글봇 의심 🤖)
  const renderAccountTypeBadge = (u: UserStatsSummary) => {
    const isBot = u.accountType === 'bot' || Boolean(u.isSuspectedBot);
    if (isBot) {
      return (
        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-bold border inline-flex items-center gap-1 bg-[#f472b618] text-[#f472b6] border-[#f472b644]">
          <span>🤖</span>
          <span>구글봇(의심)</span>
        </span>
      );
    }
    const isAnon = u.accountType === 'anonymous' || u.isAnonymous;
    if (isAnon) {
      return (
        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-bold border inline-flex items-center gap-1 bg-[#ffb74d18] text-[#ffb74d] border-[#ffb74d44]">
          <span>👤</span>
          <span>익명 게스트</span>
        </span>
      );
    }
    return (
      <span className="text-[9.5px] px-1.5 py-0.5 rounded font-bold border inline-flex items-center gap-1 bg-[#38ef7d18] text-[#38ef7d] border-[#38ef7d44]">
        <span>🛡️</span>
        <span>정식 계정</span>
      </span>
    );
  };

  // 전체 유저 필터링 & 검색 (탭 4용)
  const filteredUsers = useMemo(() => {
    if (!stats?.allUsers) return [];
    const term = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    return stats.allUsers.filter(u => {
      // 1. 텍스트 검색 (닉네임 또는 UID 또는 이메일)
      if (term) {
        const matchNick = u.nickname?.toLowerCase().includes(term);
        const matchUid = u.uid?.toLowerCase().includes(term);
        const matchEmail = u.email?.toLowerCase().includes(term);
        if (!matchNick && !matchUid && !matchEmail) return false;
      }

      const isBot = u.accountType === 'bot' || Boolean(u.isSuspectedBot);
      const isAnon = u.accountType === 'anonymous' || (u.isAnonymous && !isBot);
      const isAuth = u.accountType === 'authenticated' || (!u.isAnonymous && !isBot);

      // 2. 카테고리 필터
      if (filterType === 'authenticated') {
        return isAuth;
      }
      if (filterType === 'anonymous') {
        return isAnon;
      }
      if (filterType === 'bot') {
        return isBot;
      }
      if (filterType === 'active3d') {
        return isReconnectedWithin3Days(u);
      }
      if (filterType === 'inactive3d') {
        return !isReconnectedWithin3Days(u);
      }
      // 🏕️ building 내 cabin level 1 이하 계정 제외
      if (u.cabinLevel !== undefined && u.cabinLevel <= 1) return false;

      const floor = getUserReachedFloor(u);
      if (filterType === 'floor11') {
        return floor >= 11;
      }
      if (filterType === 'floor10') {
        return floor === 10;
      }
      if (filterType === 'floor7_9') {
        return floor >= 7 && floor <= 9;
      }
      if (filterType === 'floor4_6') {
        return floor >= 4 && floor <= 6;
      }
      if (filterType === 'floor1_3') {
        return floor >= 1 && floor <= 3;
      }
      if (filterType === 'arena') {
        return u.arenaGateLevel >= 1 || u.arenaRating > 0;
      }
      return true;
    }).sort((a, b) => {
      if (sortField === 'lastActive') return b.lastActiveAt - a.lastActiveAt;
      if (sortField === 'dungeonFloor') return getUserReachedFloor(b) - getUserReachedFloor(a);
      if (sortField === 'arenaRating') return b.arenaRating - a.arenaRating;
      if (sortField === 'createdAt') return b.createdAt - a.createdAt;
      return 0;
    });
  }, [stats?.allUsers, searchTerm, filterType, sortField]);

  // 페이지네이션 (전체 지휘관 탭)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  // 🔥 최근 접속 지휘관 전체 목록 (최근 접속 내림차순, 10명 단위 페이징)
  const recentSortedUsers = useMemo(() => {
    if (!stats?.allUsers) return [];
    return stats.allUsers
      .filter(u => u.cabinLevel === undefined || u.cabinLevel > 1)
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }, [stats?.allUsers]);

  const recentTotalPages = Math.max(1, Math.ceil(recentSortedUsers.length / PAGE_SIZE));
  const recentPaginatedUsers = useMemo(() => {
    const start = (recentPage - 1) * PAGE_SIZE;
    return recentSortedUsers.slice(start, start + PAGE_SIZE);
  }, [recentSortedUsers, recentPage]);

  // 🌀 층별 분포 집계 (1F ~ 11F)
  const floorDist = useMemo(() => {
    if (stats?.floorDistribution) return stats.floorDistribution;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 };
    if (stats?.allUsers) {
      stats.allUsers.forEach(u => {
        if (u.cabinLevel !== undefined && u.cabinLevel <= 1) return;
        const floor = Math.min(11, getUserReachedFloor(u));
        dist[floor] = (dist[floor] || 0) + 1;
      });
    }
    return dist;
  }, [stats]);

  // 아레나 티어 메타 데이터
  const arenaTierMeta = useMemo(() => {
    if (!stats) return [];
    const tiers = stats.arenaTiers;
    const total = Math.max(1, stats.totalArenaParticipants);
    return [
      { key: 'grandmaster', label: 'Grand Master (2500P+)', count: tiers.grandmaster, color: '#ff1744', icon: '👑', pct: getPct(tiers.grandmaster, total) },
      { key: 'master', label: 'Master (2200P ~ 2499P)', count: tiers.master, color: '#e040fb', icon: '💎', pct: getPct(tiers.master, total) },
      { key: 'diamond', label: 'Diamond (1900P ~ 2199P)', count: tiers.diamond, color: '#c8aa6e', icon: '💠', pct: getPct(tiers.diamond, total) },
      { key: 'platinum', label: 'Platinum (1600P ~ 1899P)', count: tiers.platinum, color: '#00e676', icon: '⚔️', pct: getPct(tiers.platinum, total) },
      { key: 'gold', label: 'Gold (1300P ~ 1599P)', count: tiers.gold, color: '#ffd54f', icon: '🏆', pct: getPct(tiers.gold, total) },
      { key: 'silver', label: 'Silver (1000P ~ 1299P)', count: tiers.silver, color: '#b0bec5', icon: '🛡️', pct: getPct(tiers.silver, total) },
      { key: 'bronze', label: 'Bronze (< 1000P)', count: tiers.bronze, color: '#cd7f32', icon: '🥉', pct: getPct(tiers.bronze, total) },
      { key: 'unranked', label: '미참여 / 언랭크', count: tiers.unranked, color: '#546e7a', icon: '🔒', pct: getPct(tiers.unranked, stats.totalUsers || 1) },
    ];
  }, [stats]);

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-4xl w-[96vw]"
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-6 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-white">마스터 통계 스튜디오</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c8aa6e22] text-[#c8aa6e] font-bold border border-[#c8aa6e44]">
                  STUDIO v1.1
                </span>
                {stats?.dataSource === 'server_counter' ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold border border-[#38ef7d44] flex items-center gap-1">
                    <span>⚡</span>
                    <span>서버 카운터 모드 (&lt; 2KB)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold border border-[#ffd54f44] flex items-center gap-1">
                    <span>🔄</span>
                    <span>전수 스캔 동기화됨</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8b9bb4]">
                Firebase Realtime Database 서버단 원자적(Transaction) 통계 노드 &amp; 대시보드 (오두막 Lv.2+ 실활동 지휘관 기준)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {stats && (
              <span className="text-[10px] text-[#8b9bb4] hidden md:inline-block font-mono">
                조회: {formatFullDate(stats.fetchedAt)}
              </span>
            )}
            <button
              onClick={() => loadData(false)}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1a263d] hover:bg-[#233454] active:scale-95 text-[#38ef7d] border border-[#38ef7d55] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="서버단 카운터 노드에서 초고속(<2KB)으로 통계를 조회합니다."
            >
              <span className={loading ? 'animate-spin inline-block' : ''}>⚡</span>
              <span>{loading ? '집계 중...' : '초고속 새로고침'}</span>
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#2b2214] hover:bg-[#3d301b] active:scale-95 text-[#c8aa6e] border border-[#c8aa6e55] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="전체 users 노드를 전수 스캔하여 서버단 카운터(system_stats)를 정확하게 재동기화(Seeding)합니다."
            >
              <span>🔄</span>
              <span>전수 재동기화</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-gray-200 min-h-[460px]">
        {/* 로딩 상태 화면 */}
        {loading && !stats && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#c8aa6e22] border-t-[#c8aa6e] rounded-full animate-spin" />
            <div className="text-sm font-bold text-[#c8aa6e]">Firebase 실시간 데이터 노드 검색 중...</div>
            <div className="text-xs text-[#8b9bb4] text-center max-w-sm">
              전체 사용자 프로필, 세이브 프로그레스, 아레나 랭킹 노드를 스캔하여 사용자 통계를 산출하고 있습니다.
            </div>
          </div>
        )}

        {/* 오류 화면 */}
        {error && (
          <div className="p-4 rounded-xl bg-[#c5606018] border border-[#c5606044] text-[#ef5350] flex flex-col gap-2">
            <div className="font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>통계 집계 오류</span>
            </div>
            <div className="text-xs">{error}</div>
            <div className="pt-2">
              <button
                onClick={loadData}
                className="px-3 py-1 bg-[#c56060] text-white rounded text-xs font-bold hover:bg-[#e57373]"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 통계 메인 컨텐츠 */}
        {stats && (
          <>
            {/* ⚠️ Firebase 콘솔 보안 규칙 미반영 경고 배너 (루트 /users 권한 제한 시) */}
            {stats.isUsersNodeRestricted && (
              <div className="p-3.5 rounded-xl bg-[#ff980018] border border-[#ff980055] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="font-bold text-xs text-[#ffd54f]">
                      Firebase 콘솔 보안 규칙 배포 필요 (현재 아레나/콜사인 등록 유저만 집계됨)
                    </div>
                    <div className="text-[11px] text-[#ffcc80]/90 mt-0.5 leading-relaxed">
                      Firebase Realtime Database의 <code>/users</code> 루트 노드 읽기 권한이 아직 게시되지 않아, 아레나나 콜사인을 등록하지 않은 신규·게스트 계정들이 집계에서 제외되었습니다. Firebase 콘솔의 <strong>Realtime Database &gt; 규칙(Rules)</strong>에 <code>"users": &#123; ".read": true &#125;</code>를 배포하신 후 [전수 재동기화]를 누르시면 숨겨진 모든 계정(전체 유저 수)이 100% 정상 반영됩니다.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(RECOMMENDED_RULES_PREVIEW);
                    alert('📋 Firebase database.rules.json 필수 권장 규칙이 클립보드에 복사되었습니다!\n\n1. Firebase 콘솔 접속\n2. Realtime Database > [규칙(Rules)] 탭\n3. 규칙을 붙여넣고 [게시(Publish)]\n4. 본 스튜디오에서 [전수 재동기화] 실행');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ff980033] hover:bg-[#ff980055] active:scale-95 text-[#ffd54f] border border-[#ff980066] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all"
                >
                  📋 규칙 복사하기
                </button>
              </div>
            )}

            {/* 1. 상단 핵심 KPI 요약 카드 그리드 (8개 섹션 카드 - 클릭 시 10명 단위 전수 리스트 오픈) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {/* 카드 1: 전체 사용자 수 (인증 + 익명 + 봇 합산) */}
              <div
                onClick={() => handleOpenCardList('all', '전체 계정 (총합)', '👥', '#c8aa6e')}
                className="p-2.5 rounded-xl bg-[#121926] border border-[#23324d] hover:border-[#c8aa6e] hover:bg-[#162133] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 최근 접속순 10명씩 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#8b9bb4]">
                  <span className="group-hover:text-[#c8aa6e] transition-colors">전체 계정</span>
                  <span className="text-xs">👥</span>
                </div>
                <div className="text-lg font-bold font-mono text-white leading-tight">
                  {stats.totalUsers.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#8b9bb4] ml-0.5">명</span>
                </div>
                {/* 3색 프로그레스 바 (인증 vs 익명 vs 봇) */}
                <div className="w-full h-1.5 rounded-full bg-[#1b263b] overflow-hidden flex mt-0.5">
                  <div
                    className="h-full bg-[#38ef7d]"
                    style={{ width: getPct(stats.authenticatedUsers, stats.totalUsers) }}
                    title={`인증 계정: ${stats.authenticatedUsers}명`}
                  />
                  <div
                    className="h-full bg-[#ffb74d]"
                    style={{ width: getPct(stats.anonymousUsers, stats.totalUsers) }}
                    title={`익명 게스트: ${stats.anonymousUsers}명`}
                  />
                  <div
                    className="h-full bg-[#f06292]"
                    style={{ width: getPct(stats.botUsers || 0, stats.totalUsers) }}
                    title={`구글봇 의심: ${stats.botUsers || 0}명`}
                  />
                </div>
                <div className="text-[9px] text-[#8b9bb4] flex justify-between mt-0.5 font-mono">
                  <span className="text-[#38ef7d]">인증 {stats.authenticatedUsers}</span>
                  <span className="text-[#ffb74d]">익명 {stats.anonymousUsers}</span>
                </div>
              </div>

              {/* 카드 2: 실제 정식 계정 */}
              <div
                onClick={() => handleOpenCardList('authenticated', '실제 정식 계정', '🛡️', '#38ef7d')}
                className="p-2.5 rounded-xl bg-[#10241b] border border-[#1b4d35] hover:border-[#38ef7d] hover:bg-[#142e22] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 실제 정식 계정 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#81c784]">
                  <span className="group-hover:text-white transition-colors">실제 계정</span>
                  <span className="text-xs">🛡️</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#38ef7d] leading-tight">
                  {stats.authenticatedUsers.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#81c784] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#81c784] mt-auto font-mono flex items-center justify-between">
                  <span>{getPct(stats.authenticatedUsers, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 3: 익명 게스트 계정 */}
              <div
                onClick={() => handleOpenCardList('anonymous', '익명 게스트 계정', '👤', '#ffb74d')}
                className="p-2.5 rounded-xl bg-[#241c10] border border-[#523e1b] hover:border-[#ffb74d] hover:bg-[#2e2314] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 익명 게스트 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#ffcc80]">
                  <span className="group-hover:text-white transition-colors">익명 게스트</span>
                  <span className="text-xs">👤</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#ffb74d] leading-tight">
                  {stats.anonymousUsers.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#ffcc80] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#ffcc80] mt-auto font-mono flex items-center justify-between">
                  <span>{getPct(stats.anonymousUsers, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 4: 🤖 구글 검수봇 (의심) 계정 */}
              <div
                onClick={() => handleOpenCardList('bot', '구글봇 (의심) 계정', '🤖', '#f06292')}
                className="p-2.5 rounded-xl bg-[#241221] border border-[#54214a] hover:border-[#f06292] hover:bg-[#30162c] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="Google Play Console 사전 출시 보고서 및 검수 크롤러봇으로 의심되는 계정 목록을 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#f48fb1]">
                  <span className="group-hover:text-white transition-colors">구글봇(의심)</span>
                  <span className="text-xs">🤖</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#f06292] leading-tight">
                  {(stats.botUsers || 0).toLocaleString()}
                  <span className="text-[10px] font-normal text-[#f48fb1] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#f48fb1] mt-auto font-mono flex items-center justify-between">
                  <span>{getPct(stats.botUsers || 0, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 5: 3일 이내 재접속한 계정 */}
              <div
                onClick={() => handleOpenCardList('active3d', '3일 이내 재접속 계정', '⚡', '#38ef7d')}
                className="p-2.5 rounded-xl bg-[#10221e] border border-[#1b4d3e] hover:border-[#38ef7d] hover:bg-[#142e29] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 3일 이내 재접속(리텐션 복귀) 지휘관 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#81c784]">
                  <span className="group-hover:text-white transition-colors">3일내 재접속</span>
                  <span className="text-xs">⚡</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#38ef7d] leading-tight">
                  {stats.activeWithin3Days.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#81c784] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#81c784] mt-auto flex justify-between font-mono">
                  <span>{getPct(stats.activeWithin3Days, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 6: 3일 이상 미재접속 계정 */}
              <div
                onClick={() => handleOpenCardList('inactive3d', '3일 이상 미재접속 계정', '💤', '#ef5350')}
                className="p-2.5 rounded-xl bg-[#221715] border border-[#522b28] hover:border-[#ef5350] hover:bg-[#2e1e1b] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 3일 이상 미재접속(단발/휴면) 계정 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#e57373]">
                  <span className="group-hover:text-white transition-colors">3일이상 미재접속</span>
                  <span className="text-xs">💤</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#ef5350] leading-tight">
                  {stats.inactiveOver3Days.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#e57373] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#e57373] mt-auto flex justify-between font-mono">
                  <span>{getPct(stats.inactiveOver3Days, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 7: 10층 돌파 계정 수 */}
              <div
                onClick={() => handleOpenCardList('floor10_cleared', '10층 돌파 지휘관', '🚩', '#ffd54f')}
                className="p-2.5 rounded-xl bg-[#211b10] border border-[#4d3c1a] hover:border-[#ffd54f] hover:bg-[#2c2415] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 10층 보스 토벌 및 무간도 해금 지휘관 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#ffd54f]">
                  <span className="group-hover:text-white transition-colors">10층 돌파</span>
                  <span className="text-xs">🚩</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#ffd54f] leading-tight">
                  {stats.clearedFloor10.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#ffd54f] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#c8aa6e] mt-auto flex justify-between font-mono">
                  <span>{getPct(stats.clearedFloor10, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>

              {/* 카드 8: 차원 아레나 참여 계정 */}
              <div
                onClick={() => handleOpenCardList('arena_all', '차원 아레나 참여 계정', '⚔️', '#ce93d8')}
                className="p-2.5 rounded-xl bg-[#171329] border border-[#3b2b64] hover:border-[#ce93d8] hover:bg-[#201938] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-1 shadow-sm cursor-pointer group"
                title="클릭하여 차원 아레나 참여 지휘관 전수 명부를 확인합니다."
              >
                <div className="flex items-center justify-between text-[10px] text-[#b39ddb]">
                  <span className="group-hover:text-white transition-colors">아레나 참여</span>
                  <span className="text-xs">⚔️</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#ce93d8] leading-tight">
                  {stats.totalArenaParticipants.toLocaleString()}
                  <span className="text-[10px] font-normal text-[#b39ddb] ml-0.5">명</span>
                </div>
                <div className="text-[9px] text-[#b39ddb] mt-auto flex justify-between font-mono">
                  <span>{getPct(stats.totalArenaParticipants, stats.totalUsers)}</span>
                  <span className="text-[8px] text-[#8b9bb4] group-hover:text-white">10명씩 보기 ›</span>
                </div>
              </div>
            </div>

            {/* 2. 탭 네비게이션 */}
            <div className="flex items-center gap-1.5 border-b border-[#23324d] pb-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]'
                    : 'text-[#8b9bb4] hover:text-white hover:bg-[#1a2333]'
                }`}
              >
                <span>📊</span>
                <span>통계 대시보드 요약</span>
              </button>
              <button
                onClick={() => setActiveTab('top10')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'top10'
                    ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]'
                    : 'text-[#8b9bb4] hover:text-white hover:bg-[#1a2333]'
                }`}
              >
                <span>🔥</span>
                <span>최근 접속 순위 (10명씩 보기)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#c8aa6e33] text-[#c8aa6e] font-mono">
                  {recentSortedUsers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('arena')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'arena'
                    ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]'
                    : 'text-[#8b9bb4] hover:text-white hover:bg-[#1a2333]'
                }`}
              >
                <span>🛡️</span>
                <span>아레나 등급별 분포</span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]'
                    : 'text-[#8b9bb4] hover:text-white hover:bg-[#1a2333]'
                }`}
              >
                <span>📋</span>
                <span>전체 지휘관 명부</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1f2d47] text-[#8b9bb4] font-mono">
                  {stats.allUsers.length}
                </span>
              </button>
            </div>

            {/* 3-A. 📊 통계 대시보드 요약 탭 */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1) 접속 활동성 지표 섹션 */}
                <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⏱️</span>
                      <span className="font-bold text-sm text-white">지휘관 접속 활동성 (Activity)</span>
                    </div>
                    <span className="text-[11px] text-[#8b9bb4]">전체 {stats.totalUsers}명 기준</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* 3일 이내 재접속 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#38ef7d] font-bold flex items-center gap-1">
                          <span>🟢</span> 3일 이내 재접속 (리텐션 계정)
                        </span>
                        <span className="font-mono text-white">
                          <strong>{stats.activeWithin3Days}명</strong> ({getPct(stats.activeWithin3Days, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#20bf6b] to-[#38ef7d]"
                          style={{ width: getPct(stats.activeWithin3Days, stats.totalUsers) }}
                        />
                      </div>
                    </div>

                    {/* 3일 이상 미재접속 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#ef5350] font-bold flex items-center gap-1">
                          <span>💤</span> 3일 이상 미재접속 (단발/휴면)
                        </span>
                        <span className="font-mono text-white">
                          <strong>{stats.inactiveOver3Days}명</strong> ({getPct(stats.inactiveOver3Days, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#eb3b5a] to-[#ef5350]"
                          style={{ width: getPct(stats.inactiveOver3Days, stats.totalUsers) }}
                        />
                      </div>
                    </div>

                    {/* 보조 지표: 24시간 이내 / 7일 이내 */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1f2738]/60 mt-1">
                      <div className="p-2 rounded-lg bg-[#141b2a] border border-[#23324d] text-center">
                        <div className="text-[11px] text-[#8b9bb4]">24시간 이내 접속</div>
                        <div className="text-base font-bold text-[#38ef7d] font-mono mt-0.5">
                          {stats.activeWithin24Hours}명
                        </div>
                        <div className="text-[10px] text-[#8b9bb4]">{getPct(stats.activeWithin24Hours, stats.totalUsers)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141b2a] border border-[#23324d] text-center">
                        <div className="text-[11px] text-[#8b9bb4]">7일 이내 접속</div>
                        <div className="text-base font-bold text-[#81c784] font-mono mt-0.5">
                          {stats.activeWithin7Days}명
                        </div>
                        <div className="text-[10px] text-[#8b9bb4]">{getPct(stats.activeWithin7Days, stats.totalUsers)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2) 던전 층수 돌파 통계 섹션 */}
                <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌀</span>
                      <span className="font-bold text-sm text-white">심연의 던전 층수 돌파율</span>
                    </div>
                    <span className="text-[11px] text-[#ffd54f] font-bold">10F 핵심 허들</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* 10층 돌파 (11F 무간도 해금) */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#ffd54f] font-bold flex items-center gap-1">
                          <span>👑</span> 10층 보스 완파 (11F 무간도 개방)
                        </span>
                        <span className="font-mono text-white">
                          <strong>{stats.clearedFloor10}명</strong> ({getPct(stats.clearedFloor10, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f79f1f] to-[#ffd54f]"
                          style={{ width: getPct(stats.clearedFloor10, stats.totalUsers) }}
                        />
                      </div>
                    </div>

                    {/* 10층 이상 도달 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#c8aa6e] font-bold flex items-center gap-1">
                          <span>🚪</span> 10층 진입/도달 계정
                        </span>
                        <span className="font-mono text-white">
                          <strong>{stats.reachedFloor10}명</strong> ({getPct(stats.reachedFloor10, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#c8aa6e] to-[#f5cd79]"
                          style={{ width: getPct(stats.reachedFloor10, stats.totalUsers) }}
                        />
                      </div>
                    </div>

                    {/* 10층 미만 계정 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8b9bb4] flex items-center gap-1">
                          <span>🌱</span> 1~9층 탐험 중
                        </span>
                        <span className="font-mono text-[#8b9bb4]">
                          <strong>{Math.max(0, stats.totalUsers - stats.reachedFloor10)}명</strong> ({getPct(Math.max(0, stats.totalUsers - stats.reachedFloor10), stats.totalUsers)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full bg-[#4a5568]"
                          style={{ width: getPct(Math.max(0, stats.totalUsers - stats.reachedFloor10), stats.totalUsers) }}
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#141b2a] border border-[#23324d] text-[11px] text-[#8b9bb4]">
                      💡 10층 보스를 토벌하면 unlockedDungeonFloor이 11(무간도)로 상승하며 최고 층수로 정밀 집계됩니다.
                    </div>

                    {/* 층별 세부 도달 분포 (1F ~ 11F 무간도) */}
                    <div className="pt-2 border-t border-[#1f2738]/60 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#8b9bb4]">
                        <span className="font-bold text-gray-300">층별 도달 현황 (클릭 시 10명씩 전수 명부)</span>
                        <span className="text-[10px] text-[#c8aa6e]">정밀 집계</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const).map(f => {
                          const count = floorDist[f] || 0;
                          const isMax = f === 11;
                          const is10 = f === 10;
                          const label = isMax ? '11F (무간도)' : `${f}층`;
                          const color = isMax ? '#ffd54f' : is10 ? '#ffb74d' : f >= 7 ? '#64b5f6' : f >= 4 ? '#81c784' : '#90a4ae';
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => handleOpenCardList(`floor_${f}` as CardFilterKey, `심연 ${label} 도달 지휘관`, isMax ? '👑' : '🌀', color)}
                              className="p-1.5 rounded-lg bg-[#141b2a] border hover:bg-[#1a2438] active:scale-95 transition-all text-left flex items-center justify-between cursor-pointer group"
                              style={{ borderColor: `${color}33` }}
                            >
                              <div className="flex items-center gap-1 text-[11px]">
                                <span style={{ color }}>{isMax ? '👑' : `${f}F`}</span>
                                <span className="text-gray-300 group-hover:text-white font-medium text-[10px]">{isMax ? '무간도' : `${f}층`}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-bold font-mono text-white mr-1">{count}명</span>
                                <span className="text-[9px] text-[#8b9bb4] font-mono">({getPct(count, stats.totalUsers)})</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3) 🔐 실제 계정 vs 익명(방랑자) vs 구글봇(의심) 3분류 심층 분석 */}
                <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-3 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔐</span>
                      <span className="font-bold text-sm text-white">계정 분류 분석 (정식 서약 vs 익명 방랑자 vs 구글봇 의심)</span>
                    </div>
                    <span className="text-[11px] text-[#8b9bb4]">전체 {stats.totalUsers}명 전수 집계</span>
                  </div>

                  {/* 3색 프로그레스 바 차트 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-mono flex-wrap gap-2">
                      <span className="text-[#38ef7d] font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#38ef7d] inline-block" />
                        정식 계정: {stats.authenticatedUsers}명 ({getPct(stats.authenticatedUsers, stats.totalUsers)})
                      </span>
                      <span className="text-[#ffb74d] font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb74d] inline-block" />
                        익명 게스트: {stats.anonymousUsers}명 ({getPct(stats.anonymousUsers, stats.totalUsers)})
                      </span>
                      <span className="text-[#f472b6] font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6] inline-block" />
                        구글봇(의심): {stats.botUsers || 0}명 ({getPct(stats.botUsers || 0, stats.totalUsers)})
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#1b263b] overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#20bf6b] to-[#38ef7d] transition-all duration-500"
                        style={{ width: getPct(stats.authenticatedUsers, stats.totalUsers) }}
                        title={`정식 계정: ${stats.authenticatedUsers}명`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-[#ffa726] to-[#ffb74d] transition-all duration-500"
                        style={{ width: getPct(stats.anonymousUsers, stats.totalUsers) }}
                        title={`익명 게스트: ${stats.anonymousUsers}명`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-[#ec4899] to-[#f472b6] transition-all duration-500"
                        style={{ width: getPct(stats.botUsers || 0, stats.totalUsers) }}
                        title={`구글봇 의심: ${stats.botUsers || 0}명`}
                      />
                    </div>
                  </div>

                  {/* 세부 3열 카드 (각 카드 클릭 시 최근 접속순 10명씩 전수 명부 오픈) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* 카드 1: 정식 계정 */}
                    <div
                      onClick={() => handleOpenCardList('authenticated', '정식 서약 지휘관 (Account)', '🛡️', '#38ef7d')}
                      className="p-3 rounded-lg bg-[#141d22] border border-[#1b3d30] hover:border-[#38ef7d] hover:bg-[#19262e] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-1 group"
                      title="클릭하여 정식 서약 지휘관 최근 접속순 10명씩 전수 명부를 확인합니다."
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#38ef7d] flex items-center gap-1 group-hover:text-white transition-colors">
                          <span>🛡️</span> 정식 계정 (Account)
                        </span>
                        <span className="font-mono text-xs font-bold text-white">
                          {stats.authenticatedUsers}명 ({getPct(stats.authenticatedUsers, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#81c784]/80 mt-1 leading-relaxed">
                        Google 계정, Play 게임즈 연동, 이메일/비밀번호로 등록된 정규 지휘관 계정입니다.
                      </div>
                      <div className="text-[9px] text-[#8b9bb4] mt-auto pt-1 flex justify-end group-hover:text-[#38ef7d]">
                        10명씩 전수 보기 ›
                      </div>
                    </div>

                    {/* 카드 2: 익명 게스트 */}
                    <div
                      onClick={() => handleOpenCardList('anonymous', '익명 방랑자 (Guest)', '👤', '#ffb74d')}
                      className="p-3 rounded-lg bg-[#221c14] border border-[#4d361b] hover:border-[#ffb74d] hover:bg-[#2b2216] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-1 group"
                      title="클릭하여 익명 방랑자 최근 접속순 10명씩 전수 명부를 확인합니다."
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#ffb74d] flex items-center gap-1 group-hover:text-white transition-colors">
                          <span>👤</span> 익명 게스트 (Guest)
                        </span>
                        <span className="font-mono text-xs font-bold text-white">
                          {stats.anonymousUsers}명 ({getPct(stats.anonymousUsers, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#ffcc80]/80 mt-1 leading-relaxed">
                        정식 연동 없이 플레이 중인 실제 방문자 계정으로, 진행도가 정상 저장되고 있습니다.
                      </div>
                      <div className="text-[9px] text-[#8b9bb4] mt-auto pt-1 flex justify-end group-hover:text-[#ffb74d]">
                        10명씩 전수 보기 ›
                      </div>
                    </div>

                    {/* 카드 3: 구글봇(의심) */}
                    <div
                      onClick={() => handleOpenCardList('bot', '구글 검수봇(의심) 계정 (Bot)', '🤖', '#f472b6')}
                      className="p-3 rounded-lg bg-[#24131e] border border-[#54213d] hover:border-[#f472b6] hover:bg-[#311728] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-1 group"
                      title="클릭하여 구글 검수봇 의심 계정 최근 접속순 10명씩 전수 명부를 확인합니다."
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#f472b6] flex items-center gap-1 group-hover:text-white transition-colors">
                          <span>🤖</span> 구글봇(의심) 계정
                        </span>
                        <span className="font-mono text-xs font-bold text-white">
                          {stats.botUsers || 0}명 ({getPct(stats.botUsers || 0, stats.totalUsers)})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#f48fb1]/80 mt-1 leading-relaxed">
                        Google Play 사전 출시 보고서(크롤러) 및 Firebase Test Lab 가상 기기 테스트 흔적 계정입니다.
                      </div>
                      <div className="text-[9px] text-[#8b9bb4] mt-auto pt-1 flex justify-end group-hover:text-[#f472b6]">
                        10명씩 전수 보기 ›
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4) 최근 상위 3인 미니 프리뷰 */}
                <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-2.5 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔥</span>
                      <span className="font-bold text-sm text-white">최근 접속자 신속 현황 (TOP 3)</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('top10')}
                      className="text-xs text-[#c8aa6e] hover:underline cursor-pointer"
                    >
                      최근 접속 순위 전체 보기 ›
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {recentSortedUsers.slice(0, 3).map((u, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                      const badge = getRankBadge(u.arenaRating);
                      const floorBadge = formatFloorBadge(getUserReachedFloor(u), u.unlockedAviciTier);
                      return (
                        <div key={u.uid} className="p-2.5 rounded-lg bg-[#141b2a] border border-[#23324d] flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-base">{medal}</span>
                            <span className="text-[10px] text-[#38ef7d] font-bold font-mono">
                              {formatRelativeTime(u.lastActiveAt)}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-white truncate notranslate" translate="no">
                            {u.nickname}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4] flex items-center justify-between mt-1">
                            <span>심연 {floorBadge.label}</span>
                            <span style={{ color: badge.color }} className="font-bold font-mono">
                              {badge.icon} {u.arenaRating > 0 ? `${u.arenaRating}P` : '미참여'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3-B. 🔥 최근 접속 지휘관 순위 탭 (10명 단위 페이징 정렬) */}
            {activeTab === 'top10' && (
              <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <span className="font-bold text-sm text-white">최근 접속 지휘관 순위 (10명씩 정렬)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#c8aa6e22] text-[#c8aa6e] font-mono font-bold border border-[#c8aa6e44]">
                      총 {recentSortedUsers.length}명
                    </span>
                  </div>
                  <span className="text-xs text-[#8b9bb4]">
                    최근 로그인 및 세이브 활동 시점 기준 내림차순 정렬 (페이지당 10명)
                  </span>
                </div>

                <div className="text-[11px] text-[#8b9bb4] flex justify-between items-center">
                  <span>전체 <strong className="text-white">{recentSortedUsers.length}</strong>명 중 <strong>{(recentPage - 1) * PAGE_SIZE + 1} ~ {Math.min(recentPage * PAGE_SIZE, recentSortedUsers.length)}</strong>위 표시</span>
                  <span className="font-mono">페이지 {recentPage} / {recentTotalPages}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#23324d] text-[#8b9bb4] text-[11px]">
                        <th className="py-2 px-2 text-center w-14">순위</th>
                        <th className="py-2 px-3">지휘관 호출부호 (닉네임)</th>
                        <th className="py-2 px-2 text-center">계정 유형</th>
                        <th className="py-2 px-3">최근 활동 일시</th>
                        <th className="py-2 px-2 text-center">심연 층수</th>
                        <th className="py-2 px-3 text-right">아레나 레이팅</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2333]">
                      {recentPaginatedUsers.map((u, idx) => {
                        const globalRank = (recentPage - 1) * PAGE_SIZE + idx + 1;
                        const rankLabel = globalRank === 1 ? '🥇 1위' : globalRank === 2 ? '🥈 2위' : globalRank === 3 ? '🥉 3위' : `#${globalRank}`;
                        const badge = getRankBadge(u.arenaRating);
                        const reachedFloor = getUserReachedFloor(u);
                        const floorBadge = formatFloorBadge(reachedFloor, u.unlockedAviciTier);
                        return (
                          <tr key={u.uid} className="hover:bg-[#141b2a] transition-colors">
                            <td className="py-2.5 px-2 text-center font-bold text-white font-mono">
                              {rankLabel}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white text-xs truncate max-w-[180px] notranslate flex items-center gap-1.5" translate="no">
                                <span className="truncate">{u.nickname}</span>
                                {u.cabinLevel && u.cabinLevel >= 2 && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e33] shrink-0 font-normal" title="생존자 안식처(오두막) 레벨">
                                    🛖Lv.{u.cabinLevel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] font-mono truncate max-w-[180px]">
                                {u.email || `UID: ${u.uid.slice(0, 10)}...`}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {renderAccountTypeBadge(u)}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#38ef7d] font-mono">
                                {formatRelativeTime(u.lastActiveAt)}
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] font-mono">
                                {formatFullDate(u.lastActiveAt)}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                                floorBadge.isHigh
                                  ? 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]'
                                  : 'bg-[#1b263b] text-gray-300'
                              }`}>
                                {floorBadge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {u.arenaRating > 0 ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="font-bold font-mono text-white text-xs">
                                    {u.arenaRating} P
                                  </span>
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-1"
                                    style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.border, borderWidth: '1px' }}
                                  >
                                    <span>{badge.icon}</span>
                                    <span>{badge.label}</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#8b9bb4]">미참여</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {recentPaginatedUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#8b9bb4]">
                            기록된 최근 접속자 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 버튼 */}
                {recentTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-[#1f2738]/60">
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs cursor-pointer"
                      disabled={recentPage <= 1}
                      onClick={() => setRecentPage(1)}
                    >
                      «
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs cursor-pointer"
                      disabled={recentPage <= 1}
                      onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                    >
                      ‹ 이전
                    </button>
                    <span className="px-2 text-xs font-mono text-white">
                      {recentPage} / {recentTotalPages}
                    </span>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs cursor-pointer"
                      disabled={recentPage >= recentTotalPages}
                      onClick={() => setRecentPage(p => Math.min(recentTotalPages, p + 1))}
                    >
                      다음 ›
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs cursor-pointer"
                      disabled={recentPage >= recentTotalPages}
                      onClick={() => setRecentPage(recentTotalPages)}
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3-C. 🛡️ 아레나 등급별 계정 수 탭 */}
            {activeTab === 'arena' && (
              <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#1f2738] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <span className="font-bold text-sm text-white">차원 아레나 등급별 계정 수 분포</span>
                  </div>
                  <span className="text-xs text-[#ce93d8] font-bold">
                    총 참여자: {stats.totalArenaParticipants}명 ({getPct(stats.totalArenaParticipants, stats.totalUsers)})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {arenaTierMeta.map(t => (
                    <div
                      key={t.key}
                      onClick={() => handleOpenCardList(t.key as CardFilterKey, `${t.label}`, t.icon, t.color)}
                      className="p-3 rounded-xl bg-[#141b2a] border flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-sm"
                      style={{ borderColor: `${t.color}44` }}
                      title={`클릭하여 ${t.label} 지휘관 최근 접속순 10명씩 전수 명부를 확인합니다.`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{t.icon}</span>
                          <span className="font-bold text-xs group-hover:text-white transition-colors" style={{ color: t.color }}>
                            {t.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-sm text-white">{t.count}명</span>
                          <span className="text-[10px] text-[#8b9bb4] ml-1.5 font-mono">({t.pct})</span>
                        </div>
                      </div>

                      {/* 티어 게이지 바 */}
                      <div className="w-full h-2 rounded-full bg-[#1b263b] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: t.pct,
                            backgroundColor: t.color
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-[#8b9bb4] mt-auto flex justify-end group-hover:text-white transition-colors">
                        10명씩 전수 보기 ›
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-[#141b2a] border border-[#23324d] text-xs text-[#8b9bb4] flex flex-col gap-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>ℹ️</span>
                    <span>아레나 등급 산출 기준</span>
                  </div>
                  <div>
                    차원 앵커 게이트를 1단계 이상 건설하고 레이팅이 부여된 지휘관을 대상으로 산출합니다.
                    (Grand Master: 2500P+ / Master: 2200P+ / Diamond: 1900P+ / Platinum: 1600P+ / Gold: 1300P+ / Silver: 1000P+ / Bronze: 1000P 미만)
                  </div>
                </div>
              </div>
            )}

            {/* 3-D. 📋 전체 지휘관 명부 탭 (검색 & 상세 필터) */}
            {activeTab === 'all' && (
              <div className="p-4 rounded-xl bg-[#0f1420] border border-[#23324d] flex flex-col gap-3">
                {/* 상단 검색 & 필터 바 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      className="w-full sm:w-64 bg-[#141b2a] border border-[#2b3a54] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#5d718f] focus:outline-hidden focus:border-[#c8aa6e]"
                      placeholder="닉네임, 콜사인, UID 검색..."
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <select
                      className="bg-[#141b2a] border border-[#2b3a54] text-xs rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-hidden"
                      value={filterType}
                      onChange={e => {
                        setFilterType(e.target.value as any);
                        setPage(1);
                      }}
                    >
                      <option value="all">전체 계정 (총합: {stats.totalUsers})</option>
                      <option value="authenticated">🛡️ 정식 서약 계정만 ({stats.authenticatedUsers})</option>
                      <option value="anonymous">👤 익명 방랑자만 ({stats.anonymousUsers})</option>
                      <option value="bot">🤖 구글봇(의심)만 ({stats.botUsers || 0})</option>
                      <option value="active3d">🟢 3일 이내 재접속 ({stats.activeWithin3Days})</option>
                      <option value="inactive3d">💤 3일 이상 미재접속 ({stats.inactiveOver3Days})</option>
                      <option value="floor11">👑 11층/무간도 돌파 ({floorDist[11] || 0})</option>
                      <option value="floor10">🚩 10층 도달 ({stats.reachedFloor10})</option>
                      <option value="floor7_9">🌀 7~9층 탐험 ({(floorDist[7] || 0) + (floorDist[8] || 0) + (floorDist[9] || 0)})</option>
                      <option value="floor4_6">🌲 4~6층 탐험 ({(floorDist[4] || 0) + (floorDist[5] || 0) + (floorDist[6] || 0)})</option>
                      <option value="floor1_3">🌱 1~3층 초반 ({(floorDist[1] || 0) + (floorDist[2] || 0) + (floorDist[3] || 0)})</option>
                      <option value="arena">⚔️ 아레나 등록 ({stats.totalArenaParticipants})</option>
                    </select>

                    <select
                      className="bg-[#141b2a] border border-[#2b3a54] text-xs rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-hidden"
                      value={sortField}
                      onChange={e => setSortField(e.target.value as any)}
                    >
                      <option value="lastActive">최근 접속순</option>
                      <option value="dungeonFloor">심연 층수순</option>
                      <option value="arenaRating">아레나 레이팅순</option>
                      <option value="createdAt">계정 생성일순</option>
                    </select>
                  </div>
                </div>

                {/* 결과 카운트 */}
                <div className="text-[11px] text-[#8b9bb4] flex justify-between items-center">
                  <span>검색 결과: <strong className="text-white">{filteredUsers.length}</strong>명</span>
                  <span>페이지 {page} / {totalPages}</span>
                </div>

                {/* 유저 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#23324d] text-[#8b9bb4] text-[11px]">
                        <th className="py-2 px-3">콜사인 (닉네임)</th>
                        <th className="py-2 px-2 text-center">계정</th>
                        <th className="py-2 px-3">최근 활동</th>
                        <th className="py-2 px-2 text-center">심연 층수</th>
                        <th className="py-2 px-3 text-right">아레나</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2333]">
                      {paginatedUsers.map(u => {
                        const badge = getRankBadge(u.arenaRating);
                        const reachedFloor = getUserReachedFloor(u);
                        const floorBadge = formatFloorBadge(reachedFloor, u.unlockedAviciTier);
                        return (
                          <tr key={u.uid} className="hover:bg-[#141b2a] transition-colors">
                            <td className="py-2 px-3">
                              <div className="font-bold text-white text-xs truncate max-w-[180px] notranslate flex items-center gap-1.5" translate="no">
                                <span className="truncate">{u.nickname}</span>
                                {u.cabinLevel && u.cabinLevel >= 2 && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e33] shrink-0 font-normal" title="생존자 안식처(오두막) 레벨">
                                    🛖Lv.{u.cabinLevel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] font-mono truncate max-w-[180px]">
                                {u.email || `UID: ${u.uid.slice(0, 10)}...`}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              {renderAccountTypeBadge(u)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-mono text-xs text-white">
                                {formatRelativeTime(u.lastActiveAt)}
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] font-mono">
                                {formatFullDate(u.lastActiveAt)}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                                floorBadge.isHigh ? 'bg-[#ffd54f22] text-[#ffd54f]' : 'text-gray-300'
                              }`}>
                                {floorBadge.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {u.arenaRating > 0 ? (
                                <span className="font-mono font-bold" style={{ color: badge.color }}>
                                  {badge.icon} {u.arenaRating}P
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#546e7a]">미참여</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#8b9bb4]">
                            검색 조건에 일치하는 지휘관이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 버튼 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-[#1f2738]/60">
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                    >
                      «
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      ‹ 이전
                    </button>
                    <span className="px-2 text-xs font-mono text-white">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      다음 ›
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs"
                      disabled={page >= totalPages}
                      onClick={() => setPage(totalPages)}
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>

    {/* 🌟 통계 섹션 카드 클릭 시 열리는 최근 접속순 10명 단위 전수 명부 팝업 */}
    <Modal
      open={cardModal.open}
      onClose={() => setCardModal(prev => ({ ...prev, open: false }))}
      zIndex="z-[120]"
      maxWidth="max-w-3xl w-[96vw]"
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl">{cardModal.icon}</span>
          <span className="font-bold text-base text-white">
            [{cardModal.label}] 전수 명부
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono font-bold"
            style={{ backgroundColor: `${cardModal.color}22`, color: cardModal.color, border: `1px solid ${cardModal.color}55` }}
          >
            총 {cardFilteredUsers.length}명
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-gray-200 min-h-[420px]">
        {/* 상단 안내 & 실시간 검색창 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-[#23324d]">
          <div className="text-xs text-[#8b9bb4]">
            최근 접속 일시(<span className="text-[#38ef7d] font-mono font-bold">lastActiveAt</span>) 최신순 내림차순 정렬 (페이지당 10명)
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="닉네임, 콜사인, UID 검색..."
              value={cardModal.searchTerm}
              onChange={e => setCardModal(prev => ({ ...prev, searchTerm: e.target.value, page: 1 }))}
              className="w-full sm:w-56 bg-[#141b2a] border border-[#2b3a54] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#5d718f] focus:outline-hidden focus:border-[#c8aa6e]"
            />
            {cardModal.searchTerm && (
              <button
                onClick={() => setCardModal(prev => ({ ...prev, searchTerm: '', page: 1 }))}
                className="px-2 py-1 text-xs bg-[#23324d] hover:bg-[#34486d] text-gray-300 rounded cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* ⚡ 서버 카운터 캐시 모드일 때 전체 전수 데이터 재동기화 안내 및 버튼 */}
        {stats?.dataSource === 'server_counter' && stats.allUsers.length < stats.totalUsers && (
          <div className="p-2.5 rounded-lg bg-[#ff980018] border border-[#ff980044] text-xs text-[#ffcc80] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>
                현재 <strong>초고속 카운터 모드</strong>로 상위 {stats.allUsers.length}명만 캐시되어 있습니다.
              </span>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ff980033] hover:bg-[#ff980055] text-[#ffd54f] border border-[#ff980066] shrink-0 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? '집계 로딩 중...' : '🔄 전체 전수 데이터 로드'}
            </button>
          </div>
        )}

        {/* 결과 카운트 및 페이징 정보 */}
        <div className="text-[11px] text-[#8b9bb4] flex justify-between items-center">
          <span>
            필터 매칭: <strong className="text-white">{cardFilteredUsers.length}</strong>명
            {cardModal.searchTerm && <span className="text-[#c8aa6e] ml-1">(검색 필터 적용)</span>}
          </span>
          <span className="font-mono">
            페이지 <strong className="text-white">{cardModal.page}</strong> / {cardTotalPages} (10명 단위)
          </span>
        </div>

        {/* 10명 단위 전수 명부 테이블 */}
        <div className="overflow-x-auto rounded-lg border border-[#23324d] bg-[#0c1017]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#23324d] bg-[#141b2a] text-[#8b9bb4] text-[11px]">
                <th className="py-2 px-2 text-center w-12">순번</th>
                <th className="py-2 px-3">지휘관 콜사인 / 계정 식별자</th>
                <th className="py-2 px-2 text-center">계정 유형</th>
                <th className="py-2 px-3">최근 활동 일시 (최신순)</th>
                <th className="py-2 px-2 text-center">심연 층수</th>
                <th className="py-2 px-3 text-right">차원 아레나</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2333]">
              {cardPaginatedUsers.map((u, idx) => {
                const globalIndex = (cardModal.page - 1) * CARD_PAGE_SIZE + idx + 1;
                const badge = getRankBadge(u.arenaRating);
                const reachedFloor = getUserReachedFloor(u);
                const floorBadge = formatFloorBadge(reachedFloor, u.unlockedAviciTier);
                return (
                  <tr key={u.uid} className="hover:bg-[#141b2a] transition-colors">
                    <td className="py-2 px-2 text-center font-mono text-[11px] text-[#8b9bb4]">
                      #{globalIndex}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-white text-xs truncate max-w-[190px] notranslate flex items-center gap-1.5" translate="no">
                        <span className="truncate">{u.nickname}</span>
                        {u.cabinLevel && u.cabinLevel >= 2 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e33] shrink-0 font-normal" title="생존자 안식처(오두막) 레벨">
                            🛖Lv.{u.cabinLevel}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] font-mono truncate max-w-[190px]">
                        {u.email || `UID: ${u.uid.slice(0, 12)}...`}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      {renderAccountTypeBadge(u)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-[#38ef7d] font-mono text-xs">
                        {formatRelativeTime(u.lastActiveAt)}
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] font-mono">
                        {formatFullDate(u.lastActiveAt)}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        floorBadge.isHigh ? 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]' : 'bg-[#1b263b] text-gray-300'
                      }`}>
                        {floorBadge.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {u.arenaRating > 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold font-mono text-white text-xs">
                            {u.arenaRating} P
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-1"
                            style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.border, borderWidth: '1px' }}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#8b9bb4]">미참여</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cardPaginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8b9bb4]">
                    해당 조건에 일치하는 지휘관 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 10명 단위 페이징 바 컨트롤 */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1f2738]/60 flex-wrap gap-2">
          <div className="text-[11px] text-[#8b9bb4]">
            {cardFilteredUsers.length}명 중 {cardFilteredUsers.length > 0 ? (cardModal.page - 1) * CARD_PAGE_SIZE + 1 : 0} ~ {Math.min(cardModal.page * CARD_PAGE_SIZE, cardFilteredUsers.length)}명 표시
          </div>
          {cardTotalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                className="px-2.5 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs text-white cursor-pointer"
                disabled={cardModal.page <= 1}
                onClick={() => setCardModal(prev => ({ ...prev, page: 1 }))}
                title="첫 10명으로 이동"
              >
                « 처음
              </button>
              <button
                className="px-2.5 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs text-white cursor-pointer"
                disabled={cardModal.page <= 1}
                onClick={() => setCardModal(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              >
                ‹ 이전 10명
              </button>
              <span className="px-2 text-xs font-mono text-[#c8aa6e] font-bold">
                {cardModal.page} / {cardTotalPages}
              </span>
              <button
                className="px-2.5 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs text-white cursor-pointer"
                disabled={cardModal.page >= cardTotalPages}
                onClick={() => setCardModal(prev => ({ ...prev, page: Math.min(cardTotalPages, prev.page + 1) }))}
              >
                다음 10명 ›
              </button>
              <button
                className="px-2.5 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 text-xs text-white cursor-pointer"
                disabled={cardModal.page >= cardTotalPages}
                onClick={() => setCardModal(prev => ({ ...prev, page: cardTotalPages }))}
                title="마지막 10명으로 이동"
              >
                끝 »
              </button>
            </div>
          )}
          <button
            onClick={() => setCardModal(prev => ({ ...prev, open: false }))}
            className="px-3.5 py-1 bg-[#23324d] hover:bg-[#34486d] text-white text-xs font-bold rounded-lg cursor-pointer transition-all ml-auto"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
};
