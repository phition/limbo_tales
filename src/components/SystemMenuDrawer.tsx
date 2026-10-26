import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useGameManager } from '../hooks/useGameManager';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { FirebaseService } from '../services/FirebaseService';
import { PlayGamesService, PlayGamesPlayer } from '../services/PlayGamesService';
import { SoundManager } from '../managers/SoundManager';
import { GameDataService } from '../services/GameDataService';
import { CustomAssetStudioModal } from './CustomAssetStudioModal';
import { CustomDataStudioModal } from './CustomDataStudioModal';
import { CallsignChangeModal } from './CallsignChangeModal';
import { useI18n } from '../hooks/useI18n';
import { SupportedLanguage } from '../i18n/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
  onOpenGuestbook?: () => void;
}

export const SystemMenuDrawer: React.FC<Props> = ({ open, onClose, onOpenGuide, onOpenGuestbook }) => {
  const isMobilePlatform = Capacitor.isNativePlatform();
  const { gm } = useGameManager();
  const { lang, setLanguage, dict } = useI18n();
  const [resetModal, setResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [patchModal, setPatchModal] = useState(false);
  const [assetStudioModal, setAssetStudioModal] = useState(false);
  const [dataStudioModal, setDataStudioModal] = useState(false);
  const [callsignModal, setCallsignModal] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const pgs = PlayGamesService.getInstance();
  const [pgAuthenticated, setPgAuthenticated] = useState<boolean>(pgs.getIsAuthenticated());
  const [pgPlayer, setPgPlayer] = useState<PlayGamesPlayer | null>(pgs.getPlayer());

  useEffect(() => {
    if (!open || !pgs.isAvailable()) return;
    const unsub = pgs.onAuthStateChange((isAuth, player) => {
      setPgAuthenticated(isAuth);
      setPgPlayer(player);
    });
    pgs.checkIsAuthenticated().catch(() => {});
    return unsub;
  }, [open, pgs]);

  const sm = SoundManager.getInstance();
  const [bgmVol, setBgmVol] = useState(sm.getBgmVolume());
  const [sfxVol, setSfxVol] = useState(sm.getSfxVolume());
  const [bgmMuted, setBgmMuted] = useState(sm.isBgmMuted());
  const [sfxMuted, setSfxMuted] = useState(sm.isSfxMuted());

  const fb = FirebaseService.getInstance();
  const user = fb.getCurrentUser();
  const profile = fb.getCachedProfile();

  if (!open) return null;

  const handleCloudSave = async () => {
    setIsSyncing(true);
    setCloudStatus('클라우드 저장 중...');
    const ok = await gm.saveToCloud();
    setIsSyncing(false);
    if (ok) {
      setCloudStatus('✅ Firebase 저장 완료!');
      gm.addLog('[클라우드 저장] 현재 진행 상황이 Firebase Realtime DB에 안전하게 백업되었습니다.', 'reward');
    } else {
      setCloudStatus('❌ 저장 실패 (네트워크 확인)');
    }
    setTimeout(() => setCloudStatus(null), 3000);
  };

  const handleCloudLoad = async () => {
    setIsSyncing(true);
    setCloudStatus('클라우드 데이터 조회 중...');
    const ok = await gm.loadFromCloud();
    setIsSyncing(false);
    if (ok) {
      setCloudStatus('✅ 데이터 불러오기 완료!');
      gm.addLog('[클라우드 불러오기] Firebase Realtime DB에서 방주 진행 데이터를 성공적으로 덮어썼습니다.', 'reward');
    } else {
      setCloudStatus('❌ 불러오기 실패 (저장된 데이터 없음)');
    }
    setTimeout(() => setCloudStatus(null), 3000);
  };

  const handleLogout = async () => {
    setIsSyncing(true);
    try {
      // 1. 현재 계정의 진행 상태를 클라우드에 최종 안전 동기화
      await gm.saveToCloud().catch(() => {});
      // 2. Firebase 로그아웃 수행 (로컬 세이브는 절대 삭제하지 않고 보존)
      await fb.logout();
    } finally {
      setIsSyncing(false);
      onClose();
    }
    // 3. 현재 지휘관 세션을 게스트로 안전하게 전환 (이전 유저 세이브 보존)
    gm.setCurrentUser('guest');
    const hasGuestSave = gm.loadGame();
    if (!hasGuestSave) {
      gm.initDefaultData();
    }
    gm.addLog('[지휘관 로그아웃] 안전하게 로그아웃되었습니다. 로컬 및 클라우드 세이브가 안전하게 보존되었습니다.', 'system');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* 어두운 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      {/* 오른쪽에서 왼쪽으로 슬라이드 인 되는 드로어 */}
      <div
        className="relative w-full max-w-[320px] h-full bg-[#0c101a] border-l border-[#1f2738] shadow-2xl flex flex-col z-10 animate-slide-left"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드로어 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#08090d] border-b border-[#1f2738] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">⚙️</span>
            <span className="text-sm font-bold text-white">시스템 설정</span>
          </div>
          <button className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg" style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }} onClick={onClose}>
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
          </button>
        </div>

        {/* 지휘관 프로필 카드 (로그인된 계정 정보) */}
        <div className="p-3 bg-[#0e1016] border-b border-[#1f2738]">
          <div className="p-2.5 rounded-xl bg-[#141d30] border border-[#23324d] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🎖️</span>
                <span className="font-bold text-xs text-[#c8aa6e]">{profile?.nickname || '지휘관 정보'}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${!isMobilePlatform && fb.isMasterUser() ? 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]' : 'bg-[#38ef7d22] text-[#38ef7d]'}`}>
                {!isMobilePlatform && fb.isMasterUser() ? '👑 마스터 계정' : user?.isAnonymous ? '게스트 계정' : '인증된 지휘관'}
              </span>
            </div>
            <div className="text-[11px] text-[#8b9bb4] font-mono truncate">
              {user?.email || `UID: ${user?.uid.slice(0, 10)}...`}
            </div>

            {/* 🎖️ 지휘관 콜사인 1회 수정 버튼 & 상태 */}
            <div className="flex items-center justify-between pt-1 border-t border-[#1f2738]/60 mt-0.5">
              <span className="text-[10px] text-[#8b9bb4]">
                호출부호: <strong className="text-[#c8aa6e]">[{profile?.nickname || '지휘관'}]</strong>
              </span>
              {!profile?.callsignChanged ? (
                <button
                  type="button"
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55] hover:bg-[#c8aa6e33] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  onClick={() => setCallsignModal(true)}
                  title="콜사인은 계정당 1회만 변경 가능합니다."
                >
                  <span>✏️</span>
                  <span>콜사인 변경 (1회)</span>
                </button>
              ) : (
                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#15171e] text-[#8b9bb4] font-medium flex items-center gap-1">
                  <span>🔒</span>
                  <span>1회 변경 완료</span>
                </span>
              )}
            </div>

            {cloudStatus && (
              <div className="text-[10px] text-[#ffd54f] font-medium bg-[#ffd54f15] px-2 py-0.5 rounded text-center animate-pulse">
                {cloudStatus}
              </div>
            )}

            {/* 🎮 Google Play 게임즈 서비스 연동 패널 (Android 전용) */}
            {pgs.isAvailable() && (
              <div className="pt-1.5 mt-0.5 border-t border-[#1f2738]/70 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#66bb6a] flex items-center gap-1">
                    <span>🎮</span>
                    <span>Google Play 게임즈</span>
                  </span>
                  {pgAuthenticated ? (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#66bb6a22] text-[#66bb6a] border border-[#66bb6a44] font-bold">
                      {pgPlayer?.displayName ? `${pgPlayer.displayName}${pgPlayer.level ? ` (Lv.${pgPlayer.level})` : ''}` : '연동됨'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#66bb6a22] text-[#66bb6a] border border-[#66bb6a55] hover:bg-[#66bb6a33] cursor-pointer"
                      onClick={async () => {
                        setCloudStatus('🎮 Google Play 게임즈 로그인 중...');
                        const res = await fb.signInWithPlayGames();
                        if (res.success) {
                          gm.syncAllPgsProgress();
                        }
                        setCloudStatus(res.success ? '✅ Play 게임즈 계정 연동 완료!' : (res.error || '❌ Play 게임즈 로그인 실패'));
                        setTimeout(() => setCloudStatus(null), 3000);
                      }}
                    >
                      Play 게임즈 로그인
                    </button>
                  )}
                </div>

                {pgAuthenticated && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      className="flex-1 py-1 px-1.5 rounded bg-[#1f2738] hover:bg-[#28354d] active:scale-95 text-white text-[10px] font-bold flex items-center justify-center gap-1 border border-[#2d3a52] transition-all cursor-pointer"
                      onClick={() => pgs.showAchievements()}
                      title="Google Play 게임즈 업적 화면 열기"
                    >
                      <span>🏆</span>
                      <span>업적</span>
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-1 px-1.5 rounded bg-[#1f2738] hover:bg-[#28354d] active:scale-95 text-white text-[10px] font-bold flex items-center justify-center gap-1 border border-[#2d3a52] transition-all cursor-pointer"
                      onClick={() => pgs.showLeaderboard()}
                      title="Google Play 게임즈 순위표 화면 열기"
                    >
                      <span>📊</span>
                      <span>순위표</span>
                    </button>
                    <button
                      type="button"
                      className="py-1 px-2 rounded bg-[#66bb6a1a] hover:bg-[#66bb6a33] active:scale-95 text-[#66bb6a] text-[10px] font-bold flex items-center justify-center gap-0.5 border border-[#66bb6a44] transition-all cursor-pointer"
                      onClick={() => {
                        gm.syncAllPgsProgress();
                        setCloudStatus('✅ PGS 업적 및 리더보드 동기화 완료');
                        setTimeout(() => setCloudStatus(null), 2500);
                      }}
                      title="진행 상황 구글 플레이 게임즈에 동기화"
                    >
                      <span>🔄</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🔊 사운드 & 음향 설정 패널 */}
        <div className="p-3 bg-[#0a0f1d] border-b border-[#1f2738] flex flex-col gap-2">
          <div className="text-xs font-bold text-[#c8aa6e] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🔊</span>
              <span>음향 효과 설정</span>
            </span>
          </div>

          {/* BGM 볼륨 */}
          <div className="flex items-center justify-between gap-2">
            <button
              className={`text-[10.5px] px-2 py-1 rounded font-bold transition-all shrink-0 ${bgmMuted ? 'bg-[#ef535022] text-[#ef5350] border border-[#ef535044]' : 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]'}`}
              onClick={() => {
                const muted = sm.toggleBgmMute();
                setBgmMuted(muted);
              }}
            >
              {bgmMuted ? '🔇 BGM 배경음' : '🎵 BGM 배경음'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmMuted ? 0 : bgmVol}
              disabled={bgmMuted}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setBgmVol(v);
                sm.setBgmVolume(v);
              }}
              className="flex-1 accent-[#c8aa6e] cursor-pointer h-1.5 bg-[#1f2738] rounded-lg"
            />
            <span className="text-[10px] font-mono text-[#8b9bb4] w-7 text-right shrink-0">
              {bgmMuted ? '0%' : `${Math.round(bgmVol * 100)}%`}
            </span>
          </div>

          {/* SFX 볼륨 */}
          <div className="flex items-center justify-between gap-2">
            <button
              className={`text-[10px] px-2 py-1 rounded font-bold transition-all shrink-0 ${sfxMuted ? 'bg-[#ef535022] text-[#ef5350] border border-[#ef535044]' : 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]'}`}
              onClick={() => {
                const muted = sm.toggleSfxMute();
                setSfxMuted(muted);
              }}
            >
              {sfxMuted ? '🔇 SFX 효과음' : '⚔️ SFX 효과음'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxMuted ? 0 : sfxVol}
              disabled={sfxMuted}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSfxVol(v);
                sm.setSfxVolume(v);
              }}
              className="flex-1 accent-[#38ef7d] cursor-pointer h-1.5 bg-[#1f2738] rounded-lg"
            />
            <span className="text-[10px] font-mono text-[#8b9bb4] w-7 text-right shrink-0">
              {sfxMuted ? '0%' : `${Math.round(sfxVol * 100)}%`}
            </span>
          </div>

          {/* 🌐 다국어 언어 설정 (i18n 엔진: 한국어 / English / 日本語 - 전체 계정 이용 가능) */}
          <div className="pt-2 border-t border-[#1f2738]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base text-[#c8aa6e]">🌐</span>
                <span className="font-bold text-xs text-white">
                  {dict.menu.language_setting || '언어 설정 (Language)'}
                </span>
              </div>
              <div className="text-[10px] text-[#8b9bb4]">
                {lang === 'ko' ? 'UI & 텍스트 언어' : lang === 'en' ? 'UI & Text Language' : 'UI & テキスト言語'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { code: 'ko', label: '🇰🇷 한국어' },
                  { code: 'en', label: '🇺🇸 English' },
                  { code: 'ja', label: '🇯🇵 日本語' },
                ] as { code: SupportedLanguage; label: string }[]
              ).map(item => (
                <button
                  key={item.code}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border truncate min-w-0 ${
                    lang === item.code
                      ? 'bg-[#c8aa6e] text-black border-[#c8aa6e] shadow-md shadow-[#c8aa6e44]'
                      : 'bg-[#15171e] text-[#cfd8e8] border-[#253550] hover:border-[#c8aa6e88]'
                  }`}
                  onClick={() => {
                    setLanguage(item.code);
                    sm.play('equip');
                    setCloudStatus(
                      item.code === 'ko'
                        ? '🌐 언어가 한국어로 설정되었습니다.'
                        : item.code === 'en'
                        ? '🌐 Language changed to English.'
                        : '🌐 言語が日本語に変更されました。'
                    );
                    setTimeout(() => setCloudStatus(null), 3000);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {/* 📡 [차원 메세지] */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#14161c] border border-[#23324d] hover:border-[#c8aa6e] text-left flex items-center justify-between transition-all group cursor-pointer shadow-sm"
            onClick={() => {
              onClose();
              if (onOpenGuestbook) {
                onOpenGuestbook();
              } else {
                gm.emit('openGuestbook');
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#c8aa6e22] text-[#c8aa6e] shrink-0">📡</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white group-hover:text-[#c8aa6e] transition-colors break-words">
                  [차원 메세지]
                </div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">
                  전 서버 지휘관 100자 실시간 차원 교신 &amp; 자유 소통
                </div>
              </div>
            </div>
            <span className="text-xs text-[#c8aa6e] shrink-0 ml-1.5">▶</span>
          </button>

          {/* 3. 도움말 (방주 백과사전 & 종합 도감) */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#14161c] border border-[#23324d] hover:border-[#c8aa6e] text-left flex items-center justify-between transition-all group cursor-pointer"
            onClick={() => {
              onClose();
              onOpenGuide();
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#c8aa6e22] text-[#c8aa6e] shrink-0">📖</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white group-hover:text-[#c8aa6e] transition-colors break-words">
                  방주 백과사전 & 도감
                </div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">전투 팁, 클래스, 장비, 몬스터 정보</div>
              </div>
            </div>
            <span className="text-xs text-[#c8aa6e] shrink-0 ml-1.5">▶</span>
          </button>

          {/* 📜 방주 프롤로그 서사 다시 보기 */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#14161c] border border-[#23324d] hover:border-[#ffd54f] text-left flex items-center justify-between transition-all group cursor-pointer"
            onClick={() => {
              onClose();
              if (gm.currentScreen !== 'citadel') {
                gm.navigateTo('citadel');
                setTimeout(() => {
                  gm.emit('openIntroStory');
                }, 200);
              } else {
                gm.emit('openIntroStory');
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#ffd54f22] text-[#ffd54f] shrink-0">🎬</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white group-hover:text-[#ffd54f] transition-colors break-words">
                  방주 프롤로그 시네마틱 영상 다시 보기
                </div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">4막 구성의 세계관 시네마틱 컷씬 감상</div>
              </div>
            </div>
            <span className="text-xs text-[#ffd54f] shrink-0 ml-1.5">▶</span>
          </button>

          {/* 4. 🎨 커스텀 에셋 & 미디어 스튜디오 (마스터 계정 전용, 모바일 빌드 제외) */}
          {!isMobilePlatform && fb.isMasterUser() && (
            <button
              className="w-full p-2.5 rounded-xl bg-[#131d2b] border border-[#c8aa6e44] hover:border-[#c8aa6e] text-left flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              onClick={() => setAssetStudioModal(true)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl p-1 rounded-lg bg-[#c8aa6e22] text-[#c8aa6e] shrink-0">🎨</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-[#c8aa6e] transition-colors flex items-center gap-1.5 flex-wrap">
                    <span className="break-words">에셋 & 사운드 스튜디오</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e] font-bold shrink-0">MASTER</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">아이콘·이모지 전환, BGM & SFX 커스텀</div>
                </div>
              </div>
              <span className="text-xs text-[#c8aa6e] shrink-0 ml-1.5">▶</span>
            </button>
          )}

          {/* 4-2. 📊 게임 밸런스 & 데이터 스튜디오 (마스터 계정 전용, 모바일 빌드 제외) */}
          {!isMobilePlatform && fb.isMasterUser() && (
            <button
              className="w-full p-2.5 rounded-xl bg-[#1d1b13] border border-[#ffd54f44] hover:border-[#ffd54f] text-left flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              onClick={() => setDataStudioModal(true)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl p-1 rounded-lg bg-[#ffd54f22] text-[#ffd54f] shrink-0">📊</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-[#ffd54f] transition-colors flex items-center gap-1.5 flex-wrap">
                    <span className="break-words">마스터 데이터 스튜디오</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold shrink-0">MASTER</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">건물·단조 자원, 마물·초기 용병, 스킬 위력 편집 & 배포</div>
                </div>
              </div>
              <span className="text-xs text-[#ffd54f] shrink-0 ml-1.5">▶</span>
            </button>
          )}

          {/* 5. 버전 정보 & 패치노트 */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#131926] border border-[#222d42] hover:border-[#66bb6a66] text-left flex items-center justify-between transition-all cursor-pointer"
            onClick={() => setPatchModal(true)}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#182030] text-[#66bb6a] shrink-0">📜</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white break-words">버전 정보 & 패치노트</div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">최신 업데이트 및 변경 사항</div>
              </div>
            </div>
            <span className="text-xs text-[#8b9bb4] shrink-0 ml-1.5">▶</span>
          </button>

          {/* 👑 지휘관 최고 전력 활성화 (마스터 계정 전용, 모바일 빌드 제외) */}
          {!isMobilePlatform && fb.isMasterUser() && (
            <button
              className="w-full p-2.5 rounded-xl bg-[#1c1810] border border-[#ffd54f55] hover:border-[#ffd54f] text-left flex items-center justify-between transition-all cursor-pointer shadow-md group"
              onClick={() => {
                gm.applyCommanderMaxUpgrade();
                setCloudStatus('👑 지휘관 최고 전력 적용 완료! (11층 및 무간도 전 구역 해금, 7인 10티어 5강 세트 장착)');
                setTimeout(() => setCloudStatus(null), 3000);
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl p-1 rounded-lg bg-[#ffd54f22] text-[#ffd54f] shrink-0">👑</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[#ffd54f] group-hover:text-yellow-300 transition-colors flex items-center gap-1.5 flex-wrap">
                    <span className="break-words">지휘관 최고 전력 활성화</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold shrink-0">MASTER BOOST</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">전 건물 Lv.10 · 최대 자원 · 3차 전직 대비 Lv.60 3인+Lv.50 4인(10티어 5강) · 11층/무간도 전 구역 해금</div>
                </div>
              </div>
              <span className="text-xs text-[#ffd54f] font-bold shrink-0 ml-1.5">적용</span>
            </button>
          )}

          {/* 👑 차원 게이트 & 멀티 컨텐츠 개방 토글 (마스터 계정 전용, 모바일 빌드 제외) */}
          {!isMobilePlatform && fb.isMasterUser() && (
            <div className="p-2.5 rounded-xl bg-[#171124] border border-[#a855f755] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl p-1 rounded-lg bg-[#a855f722] text-[#c084fc] shrink-0">🌀</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[#c084fc] flex items-center gap-1.5 flex-wrap">
                    <span className="break-words">차원 게이트 & 멀티 컨텐츠</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#a855f722] text-[#c084fc] font-bold shrink-0">MASTER GATE</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">차원 아레나(PvP) · 네메시스 월드 레이드 · 5v5 영지 침공 (약탈은 휴무 유지)</div>
                </div>
              </div>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ml-1.5 ${
                  gm.isMasterAccount
                    ? 'bg-[#a855f7] text-white shadow-md shadow-[#a855f744]'
                    : 'bg-[#211636] text-[#a855f7] border border-[#a855f744]'
                }`}
                onClick={() => {
                  const nextState = gm.toggleMasterAccount();
                  setCloudStatus(nextState ? '👑 차원 게이트 및 멀티 컨텐츠 개방 완료!' : '🔒 차원 게이트 비활성화됨');
                  setTimeout(() => setCloudStatus(null), 3000);
                }}
              >
                {gm.isMasterAccount ? '개방됨' : '비활성'}
              </button>
            </div>
          )}

          {/* 5. 마스터 데이터 Firebase 시딩 (bumpcat.net 마스터 권한 전용, 모바일 빌드 제외) */}
          {!isMobilePlatform && fb.isMasterUser() && (
            <button
              className="w-full p-2.5 rounded-xl bg-[#101b2b] border border-[#c8aa6e55] hover:border-[#c8aa6e] text-left flex items-center justify-between transition-all cursor-pointer shadow-md"
              onClick={async () => {
                setIsSyncing(true);
                setCloudStatus('파이어베이스 마스터 데이터 시딩 중...');
                const res = await GameDataService.getInstance().seedMasterDataToFirebase();
                setIsSyncing(false);
                setCloudStatus(res.message);
                if (res.success) {
                  gm.addLog('👑 [마스터 시딩] 몬스터·장비·밸런스 마스터 데이터가 Firebase DB에 성공적으로 동기화되었습니다.', 'reward');
                } else {
                  gm.addLog(`⚠️ [마스터 시딩 실패] ${res.message}`, 'danger');
                }
                setTimeout(() => setCloudStatus(null), 5000);
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl p-1 rounded-lg bg-[#c8aa6e22] text-[#c8aa6e] shrink-0">👑</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[#c8aa6e] flex items-center gap-1.5 flex-wrap">
                    <span className="break-words">마스터 데이터 Firebase 시딩</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e] font-bold shrink-0">MASTER</span>
                  </div>
                  <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">bumpcat.net 마스터 권한 전용 클라우드 동기화</div>
                </div>
              </div>
              <span className="text-xs text-[#c8aa6e] shrink-0 ml-1.5">▶</span>
            </button>
          )}

          {/* 6. 로그아웃 / 계정 전환 */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#1c1824] border border-[#ab47bc44] hover:border-[#ab47bc] text-left flex items-center justify-between transition-all mt-auto cursor-pointer"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#ab47bc22] text-[#ce93d8] shrink-0">🚪</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-[#ce93d8] break-words">로그아웃 (계정 전환)</div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">다른 지휘관 계정으로 로그인</div>
              </div>
            </div>
            <span className="text-xs text-[#ce93d8] shrink-0 ml-1.5">▶</span>
          </button>

          {/* 6. 게임 데이터 초기화 */}
          <button
            className="w-full p-2.5 rounded-xl bg-[#1a1215] border border-[#ef535044] hover:border-[#ef5350] text-left flex items-center justify-between transition-all cursor-pointer"
            onClick={() => setResetModal(true)}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xl p-1 rounded-lg bg-[#ef535022] text-[#ef5350] shrink-0">⚠️</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-[#ef5350] break-words">데이터 전체 초기화</div>
                <div className="text-[10px] text-[#8b9bb4] line-clamp-2 break-words">로컬 및 클라우드 세이브 완전 초기화</div>
              </div>
            </div>
            <span className="text-xs text-[#ef5350] shrink-0 ml-1.5">▶</span>
          </button>
        </div>

        {/* 푸터 */}
        <div className="p-3 bg-[#08090d] border-t border-[#1f293d] text-center text-[10px] text-[#607d8b] flex flex-col items-center gap-0.5">
          <div className="font-medium text-[#8b9bb4]">Limbo: Ark of the Abyss</div>
          <div className="text-[10px] text-[#8b9bb4]">published by BumPCaT.net</div>
          <div className="font-mono text-[11px] text-[#c8aa6e] font-bold">V.1.1.2</div>
          <div className="text-[9px] text-[#4a5568]">Firebase Connected</div>
        </div>
      </div>

      {/* 패치노트 모달 */}
      <Modal
        title="📜 버전 정보 & 패치노트"
        open={patchModal}
        onClose={() => setPatchModal(false)}
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            <button
              onClick={() => {
                setPatchModal(false);
                gm.emit('checkAppVersion');
              }}
              className="py-1.5 px-3 rounded-lg bg-[#14233c] hover:bg-[#1a3154] border border-[#2b4c7e] text-[#64b5f6] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>🔄</span>
              <span>최신 버전 확인</span>
            </button>
            <ActionButton label="닫기" variant="primary" size="sm" onClick={() => setPatchModal(false)} />
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-xs text-[#cfd8dc] leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {/* V.1.1.2 최신 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0f172a] border border-[#c8aa6e] shadow-lg">
            <div className="font-bold text-sm text-[#c8aa6e] mb-2 flex items-center justify-between border-b border-[#c8aa6e44] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🔥</span>
                <span>V.1.1.2 정식 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#c8aa6e] bg-[#c8aa6e22] px-2 py-0.5 rounded font-bold border border-[#c8aa6e55]">
                v1.1.2
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🧭</span> 탐험 &amp; 이벤트 시스템 대폭 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>층별 고유 이벤트 '가속' 실제 전투 연동</strong>: 9층 도플갱어(프리즘 방직사 일러스트 및 플레이어 원정대 복제본 결투), 6층 참회실 흡혈 귀족, 8층 고문실 간수 등 7종의 가속 선택지가 실제 전투로 연결되며, 승리 시 확정 보상을 획득합니다.
                  <br />• <strong>비상 탈출(닻 부재) 추격전 메커니즘</strong>: 균열의 닻 없이 시도하는 비상 탈출 실패 시 마물 추격대와의 사투가 벌어지며, 승리 또는 도주 성공 시 성채로 안전하게 귀환합니다.
                  <br />• <strong>이전 지휘관 조우 이벤트 (PvP / 교류)</strong>: 최근 1시간 내 던전을 방문한 타 지휘관의 잔영과 조우하여 정보 교류(행운 가호) 또는 기습 습격(경험치 2배 비동기 PvP 대결)을 펼칠 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ff7043] flex items-center gap-1">
                  <span>⚔️</span> 전투 메커니즘 &amp; 밸런스 정밀 조정
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>치명타 피해 계산식 개편</strong>: 행운(Luck) 스탯의 치명타 피해 배율 보정을 제외하여 행운은 발생 확률과 회피에 집중되고, 피해 배율은 고유 장비 및 스킬에 온전히 비례하도록 조정되었습니다.
                  <br />• <strong>적 차징(집중 공격) 스마트 알고리즘</strong>: 마물이 3마리 이상 생존해 있을 때만 차징을 시도하며, 차징 공격 발동 시 100% 확정 치명타로 적중합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#80deea] flex items-center gap-1">
                  <span>🏆</span> 차원 아레나 &amp; 멀티플레이 기능 강화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>7단계 등급별 랭크 아이콘 &amp; 에셋 스튜디오 연동</strong>: 브론즈부터 그랜드마스터까지 7단계 고유 아이콘이 실시간 반영되며, 커스텀 에셋 스튜디오에서 자유롭게 커스텀할 수 있습니다.
                  <br />• <strong>데이터 스튜디오 '차원 칙령' 실시간 배포</strong>: 차원 칙령 규칙이 Firebase 클라우드를 통해 웹과 모바일에 즉시 동기화됩니다.
                  <br />• <strong>명예 암시장 투사 무구 도감 등록</strong>: 암시장 결투 장비 시리즈를 심연의 백과 컬렉션에 세트로 등록할 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#69f0ae] flex items-center gap-1">
                  <span>✨</span> UI / UX 테마 &amp; 시스템 안정화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>다크 판타지 골드 &amp; 차콜 테마 리뉴얼</strong>: 고채도 청록 톤을 배제하고 깊이 있는 저채도 골드와 차콜 블랙 테마로 전면 개편되었습니다.
                  <br />• <strong>차원 메세지 티커 [D.M] 간소화 표기</strong>: 영지 하단 내비게이션 상단 티커 뱃지를 모든 언어에서 컴팩트하게 [D.M]으로 통일했습니다.
                  <br />• <strong>의무실 영웅 초상화 렌더링</strong>: 입원실 침상 및 모달에 이모지 대신 영웅의 실제 포트레이트가 표시됩니다.
                  <br />• <strong>다국어 및 레이아웃 안정화</strong>: 런타임 캐시 참조 에러 해결, 텍스트 자동 축소/줄바꿈으로 UI 깨짐 현상을 완벽 방지했습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.1.0.1 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101d] border border-[#1f2b42] shadow-sm opacity-90">
            <div className="font-bold text-xs text-[#8b9bb4] mb-2 flex items-center justify-between border-b border-[#1f2b42] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>📜</span>
                <span>V.1.0.1 업데이트 내역</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b9bb4] bg-[#15171d] px-2 py-0.5 rounded font-bold border border-[#2a364f]">
                v1.0.1
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span> 차원 아레나 (Dimensional Arena) 룰 및 결투 메커니즘 정밀 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>3v3+1 차원 결투단 정규화</strong>: 선발 3인(전열·중열·후열)과 전술 오퍼레이터 리더 1인 체제로 정식 개편되어, 리더의 상시 [영령의 가호] 및 피버 초월 궁극기 투사가 결투의 핵심 승부처가 됩니다.
                  <br />• <strong>홀덤 블러핑 시스템 (2인 공개 + 1인 히든 실루엣)</strong>: 상대의 3번 슬롯 히든 영웅과 노림수 족보를 예측하고 카운터 덱을 맞추는 고도의 심리전이 도입되었습니다.
                  <br />• <strong>주간 차원율 가위바위보 상성 순환 (돌파 &gt; 변칙 &gt; 수호 &gt; 돌파)</strong>: 주간 차원율 상성 우위 시 +1단계 판정 계급 보너스를 획득하며, 5종 배지 [스트레이트] 조커는 상성을 초월해 절대 승리합니다.
                  <br />• <strong>노페어 배지 가중치 총점제 &amp; 피버 3선승 압승 룰</strong>: 전술 파동 격돌 시 8대 배지 개별 가중치 총점(연계 35, 반격 30, 치명 25, 파쇄 20 등)으로 승패를 가르며, 피버 쇼다운 3승 선착 시 상대 잔여 체력과 무관하게 즉시 압승합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ff416c] flex items-center gap-1">
                  <span>👾</span> 시공의 침식자 네메시스 &amp; 차원 영지 침공전 수정 및 밸런스 고도화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>네메시스 3부위 독립 타겟팅 공략</strong>: 총 1,250만 HP 월드 보스의 3개 부위(머리: 발할라 워로드 400만, 몸통: 크로노 아콘 500만, 꼬리: 오메가 데드아이 350만) 고유 패턴 및 절멸기 저지 시스템이 정밀 동기화되었습니다.
                  <br />• <strong>6시간 주기 요격 목표치 &amp; 수요일 자정(00:00) 정기 완전 초기화</strong>: 6시간당 1/24 요격 컷을 통한 영지 자원 약탈 방어선 및 주간 정기 초기화 사이클이 백과사전과 인게임에 완벽히 정립되었습니다.
                  <br />• <strong>차원 영지 침공전 7라운드 거점 공방전</strong>: 성벽(기본 2,500 HP)과 좌/우 방어 포탑(기본 400 HP), 4대 핵심 자원 최대 30% 약탈 &amp; 8시간 보호막, 영웅 성향 연동 12대 수성 전술 메커니즘이 확립되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#80deea] flex items-center gap-1">
                  <span>🌐</span> 방주 백과사전 전면 검증 &amp; 다국어(EN/JA) 번역 품질 개선
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>실제 게임 데이터와 100% 동기화</strong>: 심연 생체 정제소 건설 비용(목재 10, 석재 5), 전열 피격 가중치 및 스킬 보호막 진형 보너스, 무기 6종 고유 특성(베기, 방어 파쇄, 급소 사격, 연사, 암습, 마력 공명), 몬스터 구조체 팩션(⚙️), 전직 직업명 등이 실제 구현에 맞게 완벽히 수정되었습니다.
                  <br />• <strong>다국어 번역 전수 보강</strong>: 백과사전 공략, 무기 특성, 3v3+1 아레나 룰, 12대 피버 족보, 네메시스 레이드, 영지 침공 및 12대 수성 전술 등 175건의 핵심 전문 용어가 영어와 일본어로 정교하게 번역되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#69f0ae] flex items-center gap-1">
                  <span>✨</span> 편의성(UX) &amp; 시인성 혁신 업데이트
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>원정대 편성 [스마트 일괄 장착]</strong>: 각 클래스별 역할(탱커/딜러/힐러 등) 핵심 스탯에 가중치를 두고 보유한 미장착 최상급 무기·방어구·장신구를 한 번의 탭으로 자동 장착하는 기능이 도입되었습니다.
                  <br />• <strong>직관적인 거점 알림 뱃지 시스템</strong>: 의뢰소 수령 가능한 보상 수량 레드 뱃지, 병영 내 전직 가능 용병 발견 시 골드(✨ 전직 가능) 뱃지, 병기창 외부 미정화 저주 장비 수량 레드 뱃지가 실시간 연동됩니다.
                  <br />• <strong>전투 시인성 강화</strong>: 내 턴 진입 시 표시되는 [▶ 내 턴] 뱃지와 카드 테두리를 시인성 높은 형광 녹색 네온 글로우 및 펄스 이펙트로 시각화하여 턴 식별성을 극대화했습니다.
                  <br />• <strong>HERO 등급 시안 컬러 지정 &amp; 3차 전직 아이콘 에셋 스튜디오 완비</strong>: 영웅(HERO) 등급 'H' 마크에 고유 시안(Cyan) 색상을 적용하고, 3차 초월 전직 6종의 고유 스킬 12종 및 초월 궁극기 6종의 아이콘을 에셋 스튜디오에 정식 등록했습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.9-rc10 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101d] border border-[#1f2b42] shadow-sm opacity-90">
            <div className="font-bold text-xs text-[#8b9bb4] mb-2 flex items-center justify-between border-b border-[#1f2b42] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>📜</span>
                <span>V.0.9.9-rc10 업데이트 내역</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b9bb4] bg-[#15171d] px-2 py-0.5 rounded font-bold border border-[#2a364f]">
                v0.9.9-rc10
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>⚔️</span> 차원 아레나 (Dimensional Arena) 전면 개편 &amp; 정규 시즌 고도화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  방주의 5인 정예 결투 부대(선발 3인 + 전술 오퍼레이터 + 원호 서포터)가 출격하는 차원 아레나가 한층 더 박진감 넘치고 공정하게 진화했습니다.
                  <br />• <strong>실시간 SPD 턴 큐 &amp; 피버콜(Fever Call) 족보 대결</strong>: 참가자 전원의 행동 속도에 맞춰 자동 연계 전투가 전개되며, 모멘텀 배지 5개 선제 완성 시 발동하는 12대 전술 족보 및 주간 차원율(돌파 &gt; 수호 &gt; 변칙 &gt; 돌파) 상성 배틀이 펼쳐집니다.
                  <br />• <strong>사경(Death&apos;s Door) 3턴 유예 &amp; 서포터 전술 원호</strong>: 치명상을 입은 영웅은 3턴간 사경 유예 상태에 머물며 아군 힐러의 구원이나 서포터(40% 확률)의 원호 치유로 극적인 전선 복귀가 가능합니다.
                  <br />• <strong>명예 암시장 &amp; 투사의 인장 교환</strong>: 승리 및 연승 보너스로 획득한 투사의 인장을 통해 최고 등급 무구 보급함과 특화 장비로 교환할 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ff416c] flex items-center gap-1">
                  <span>👾</span> 주간 월드 레이드 『차원 네메시스』 전면 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  차원 앵커 게이트(Lv.3+)와 연동되는 시공의 침식자 『네메시스』의 토벌전이 정통 레이드 감성으로 전면 재구축되었습니다.
                  <br />• <strong>3개 독립 부위 공략 &amp; 30,000 차징 브레이크</strong>: 머리·몸통·꼬리의 고유 패턴에 맞서 절멸기 차징 시 요구치(약 30,000)를 신속히 집중 타격해 파쇄하면 1턴간 그로기 상태로 무력화할 수 있습니다.
                  <br />• <strong>용병 고유 스킬셋 &amp; 궁극기 커맨드 패널</strong>: PVE 탐험에서 육성한 영웅들의 고유 스킬과 화려한 VFX, 상태이상 연계 콤보 폭발을 네메시스 전장에서도 그대로 전술 지휘할 수 있습니다.
                  <br />• <strong>요격 목표치(24주기 목표 체력) 로비 표시</strong>: 6시간 주기 자원 약탈(20%)을 방어하기 위한 부위별·전체 요격 목표치가 로비 전광판에 명확하게 안내됩니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#b388ff] flex items-center gap-1">
                  <span>🌌</span> 심연 11층 무간도(Avici) 레벨 스케일링 전면 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  최심층 무간도 던전의 난이도 곡선이 개선되어 11층 시작 몬스터가 Lv.50부터 시작하며, 최심부 최종 진 보스가 Lv.600까지 매끄럽게 레벨 스케일링되도록 밸런스를 조정했습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🛠️</span> 마스터 데이터 에셋 스튜디오 &amp; 시설 티어 관리
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  영지 시설의 건설/증축 소모 자재량, 생산량, 유지비를 각 티어 레벨별로 정밀하게 튜닝할 수 있는 데이터 시트가 추가되었으며, Firebase Realtime Database 클라우드 실시간 배포 및 세이브 동기화 안정성이 극대화되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#69f0ae] flex items-center gap-1">
                  <span>✨</span> 편의성(UX) 및 인터랙션 개선
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  • <strong>초반 퀘스트 바로가기 동선 수정</strong>: 묘지 헌화 바로가기가 묘지로, 장비 단조 연계 퀘스트 바로가기가 병기창으로 올바르게 연결됩니다.
                  <br />• <strong>완료된 퀘스트 상위 정렬</strong>: 완료되어 보상을 즉시 수령할 수 있는 퀘스트가 퀘스트 목록의 최상단에 우선 표시됩니다.
                  <br />• <strong>탐험 진입 스크롤 자동 복구</strong>: 채비 완료 후 구역(층) 선택 단계로 진입 시 스크롤 위치가 자동으로 최상단으로 끌어올려집니다.
                  <br />• <strong>다국어(EN/JA) 전투/레이드 로그 현지화 전면 보강</strong>: 네메시스 토벌전, 차원 아레나, 사경 및 스킬 연계 로그의 다국어 번역이 빈틈없이 완성되었습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.9-rc1 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101d] border border-[#1f2b42] shadow-sm opacity-90">
            <div className="font-bold text-xs text-[#8b9bb4] mb-2 flex items-center justify-between border-b border-[#1f2b42] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>📜</span>
                <span>V.0.9.9-rc1 업데이트 내역</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b9bb4] bg-[#15171d] px-2 py-0.5 rounded font-bold border border-[#2a364f]">
                v0.9.9-rc1
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span> 전투 사망자 턴 스킵 & 승리 화면 전체 상세 로그 열람 기능 추가
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전투 흐름을 한층 더 쾌적하게 다듬고 결과 분석 편의성을 강화했습니다.
                  <br />• <strong>사망자 턴 스킵 & 로그 정제</strong>: 전투 중 이미 쓰러진 마물이나 용병의 턴은 불필요한 로그 기록 없이 즉시 다음 생존자의 턴으로 이어집니다.
                  <br />• <strong>라운드 전환 보존</strong>: 사망자 건너뜀 상황에서도 라운드 종료 처리와 신규 라운드 뱃지(N라운드)가 1회 정확하게 출력됩니다.
                  <br />• <strong>승리 모달 전체 상세 로그 확인</strong>: 전투 승리 팝업에서 `[📜 전투 상세 기록 확인 (전체 로그)]` 버튼을 통해 최대 150건의 전체 턴 기록을 손쉽게 복기할 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#e040fb] flex items-center gap-1">
                  <span>🎨</span> 에셋 스튜디오 전투 승리 이모지/엠블럼 커스텀 지원
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  에셋 스튜디오의 뱃지 카테고리에 &apos;전투 승리 엠블럼/이모지&apos;가 추가되었습니다.
                  <br />• <strong>자유로운 유니코드 이모지 설정</strong>: `✏️ 이모지` 버튼을 통해 👑, 🏆, 🎉, ⚔️ 등 원하는 이모지로 즉시 교체하거나 커스텀 이미지로 변경할 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span> 전투 팩션 상세 표기 & 라운드·턴 반응형 전투 로그 전면 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전투 진행 상황과 상성 메커니즘을 보다 명확하고 직관적으로 파악할 수 있도록 전투 UI와 로그를 대폭 개선했습니다.
                  <br />• <strong>마물 팩션 상세화</strong>: 마물 정보 패널에 단순 &apos;마물&apos; 대신 실제 소속 팩션(타락자/이계체/언데드/기계체 등)을 정확히 표기합니다.
                  <br />• <strong>팩션 상성 추가 피해 기록</strong>: 상성 우위 및 특효에 따른 추가 피해량이 전투 로그에 실시간으로 기록됩니다.
                  <br />• <strong>라운드 전환 뱃지 & 라인 연출</strong>: 매 라운드 시작 시 라운드 뱃지와 시각적 라인 이미지가 출력되어 라운드 전환이 명확해졌습니다.
                  <br />• <strong>반응형 턴 구분선 & 턴 주인 표기</strong>: 로그 창 너비에 맞춰 턴 실선이 줄바꿈 없이 반응형으로 조절되며, 행동 주체 이름과 함께 `(N턴)`으로 표기됩니다.
                  <br />• <strong>행동 불가 턴 스킵 사유 명시</strong>: 기절(Stun), 빙결(Freeze) 등 상태이상으로 턴이 넘어갈 때 그 사유가 로그에 정확히 남습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>☕</span> 방랑자의 라운지 광고 쿨타임 초기화 & 모험가 영입 편의성 강화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  새로운 동료를 탐색하고 영입하는 과정의 편의성이 대폭 향상되었습니다.
                  <br />• <strong>광고 시청 후 쿨타임 초기화</strong>: 다음 모험가 도착 쿨타임 대기 시 광고 시청 버튼을 통해 즉시 대기 시간을 초기화할 수 있습니다.
                  <br />• <strong>골드 갱신 비용 점증 시스템</strong>: 모험가 즉시 갱신 비용이 1,000G 이후 1,000G씩 점증하도록 밸런스를 합리화했습니다.
                  <br />• <strong>영입 안내 문구 직관화</strong>: 잔여 시간 및 모험가 후보 도착 안내 문구를 더 명확하게 정비했습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>🛡️</span> 차원 부대 5인 편성 서포터 가이드 최신화 & 열별 테마 컬러 차별화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  침공 및 전장 편성을 직관적으로 설정할 수 있도록 부대 관리 UI를 강화했습니다.
                  <br />• <strong>서포터 시스템 가이드 갱신</strong>: 변경된 서포터 패시브 지원 및 배치 룰에 맞추어 도움말과 안내를 최신 시스템으로 개편했습니다.
                  <br />• <strong>전열·중열·후열 선택 컬러 차별화</strong>: 배치 열에 따라 전열/중열/후열 선택 시 고유 컬러를 적용하여 진형 배치를 한눈에 구분할 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ce93d8] flex items-center gap-1">
                  <span>📖</span> 마도서 서고 리스트 가독성 최적화 & 상세 모달 스크롤 반응형 적용
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  방주 서고의 마도서 열람 및 연독 경험을 쾌적하게 개선했습니다.
                  <br />• <strong>권수 및 습득률 나란히 표기</strong>: 보유 권수(`xN권`)와 연구 습득률(`습득률 N%`)을 같은 행에 나란히 배치하여 정보 파악이 쉬워졌습니다.
                  <br />• <strong>리스트 시인성 개선</strong>: 마도서 리스트 항목에서 드랍 마물 이름 배지를 제외하여 깔끔한 목록 뷰를 제공합니다.
                  <br />• <strong>상세 모달 상단 자원바 보호 & 스크롤 지원</strong>: 모달이 상단 자원 표시줄을 침범하지 않도록 안전 여백을 확보하고, 헤더/푸터 고정 및 본문 스크롤을 적용했습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.8-rc1 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101b] border border-[#1f293d]">
            <div className="font-bold text-sm text-[#c8aa6e] mb-2 flex items-center justify-between border-b border-[#c8aa6e44] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🔥</span>
                <span>V.0.9.8-rc1 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#c8aa6e] bg-[#c8aa6e22] px-2 py-0.5 rounded font-bold border border-[#c8aa6e55]">
                v0.9.8-rc1
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>👾</span> 전투 마물 공격 시 전신 일러스트 탈출 & 그리드 슬롯 돌진 연출
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  던전 전투 중 마물이 공격 및 스킬을 시전할 때 시각적 박진감이 대폭 강화되었습니다.
                  <br />• <strong>전신 일러스트 전환</strong>: 공격 시 프레임 잘림 없이 마물의 온전한 전체 일러스트(`object-contain`)가 중심에 노출됩니다.
                  <br />• <strong>프레임 돌파 급습 연출</strong>: 상단 이미지창의 테두리를 뚫고 나와 적 마물 그리드 슬롯까지 1.55배 크기로 역동적으로 돌진·확대된 후 부드럽게 복귀합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>🌐</span> 다국어(i18n) 설정 전체 계정 전면 개방 & 로그인 화면 지원
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  글로벌 환경 지원을 위해 언어 설정 접근성을 전면 개편했습니다.
                  <br />• <strong>전체 계정 이용 가능</strong>: 게스트를 포함한 모든 계정에서 한국어/영어/일본어를 자유롭게 선택할 수 있습니다.
                  <br />• <strong>로그인 화면 상단 토글</strong>: 게임 진입 전 타이틀 화면 우상단에서도 즉시 언어(`KO / EN / JA`)를 빠르게 변경할 수 있습니다.
                  <br />• <strong>시스템 메뉴 UI 최적화</strong>: 사운드 설정 바로 아래로 언어 메뉴를 재배치하고 불필요한 테스트 뱃지를 정리했습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>📖</span> 백과사전 13종 영지 시설 상세 번역 & 연계기 전투 로그 번역 완료
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  방주 백과사전 내 13개 영지 시설(성화, 병기창, 제단, 연금 등)의 설명문 및 전투 연계기(약점 추격 원호, 시전 요격, 전열 엄호 등 19개 패턴)의 영어/일본어 번역을 완벽하게 적용했습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.7-rc1 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101b] border border-[#1f293d]">
            <div className="font-bold text-sm text-[#c8aa6e] mb-2 flex items-center justify-between border-b border-[#c8aa6e44] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🔥</span>
                <span>V.0.9.7-rc1 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#c8aa6e] bg-[#c8aa6e22] px-2 py-0.5 rounded font-bold border border-[#c8aa6e55]">
                v0.9.7-rc1
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span> 차원 영지 침공 & 5인 부대 30% 복합 약탈 시스템 도입
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  성채 차원 게이트를 통해 다른 방주 지휘관의 영지를 침공하는 약탈전이 공식 오픈되었습니다.
                  <br />• <strong>5인 정예 원정대 편성</strong>: 선발 3인 + 리더(전술 스탯 1.15배) + 서포터(패시브 지원)의 5인 풀스쿼드로 참전합니다.
                  <br />• <strong>30% 복합 자원 약탈</strong>: 침공 승리 시 고정 목표 2종(골드/식량)과 무작위 3종(기초 영지/심연 정제/파밍 전리품/소모품 군) 등 총 5종 자원을 상대 보유량의 30%까지 약탈합니다.
                  <br />• <strong>일일 침공 3회 & 8시간 자동 보호막</strong>: 무분별한 약탈을 방지하기 위해 일일 3회 침공 제한과 피침공 시 8시간 보호막이 부여되며, 침공 전 사전 [정찰(Scout)]을 지원합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>🗼</span> 영지 방어 전술 타워(Tactical Towers) 3대 테크 & 라운드 개시 연출
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  영지 수호를 위한 전술 타워 연구 시스템이 추가되었습니다.
                  <br />• <strong>3대 분과 연구</strong>: 공격형(포격 지원 및 턴 시작 광역 피해), 방어형(성역 재생 및 아군 전체 턴 시작 지속 회복), 유틸형(방어 파쇄 및 상대 보호막/피해 경감 디버프).
                  <br />• <strong>라운드 개시 프로토콜</strong>: 침공 전투 시 매 라운드 시작 단계에서 방어 타워가 독립적인 턴으로 작동하며 실시간 포격/재생 시각 효과가 연출됩니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>👑</span> 침공 전장 UI 리더 전술 체계 & 실시간 버프·디버프 뱃지 & 2.5배속 고속 전투
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  침공 전장의 정보 표현력과 편의성이 대폭 향상되었습니다.
                  <br />• <strong>리더 중심 인터페이스</strong>: 상단(적 리더) 및 하단(아군 리더) 전용 메인 포트레이트 및 스탯 패널 구성.
                  <br />• <strong>실시간 상태이상/버프 뱃지</strong>: 모든 출전 대원 패널에 화상, 출혈, 기절, 스탯 증감 뱃지가 실시간으로 시각화됩니다.
                  <br />• <strong>기본 2.0배속 & 2.5배속 고속 스위치</strong>: 침공 전투 기본 속도가 2.0배속으로 상향되었으며, `[⚡ 2.5x 고속]` 스위치로 박진감 넘치는 쾌속 전투를 즐기실 수 있습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ce93d8] flex items-center gap-1">
                  <span>🧭</span> 차원 게이트 하단 내비 위치 재배치 & 일반 계정 공식 전면 개방
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  하단 휠 네비게이션 동선을 [성채 ➔ 심연 탐사 ➔ 차원 게이트 ➔ ...] 순서로 자연스럽게 정렬하였으며, 마스터 계정 제한을 해제하여 모든 일반 지휘관에게 게이트 건설과 3v3 아레나, 네메시스 레이드, 영지 침공을 정식 개방했습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#f48fb1] flex items-center gap-1">
                  <span>📜</span> 차원 게이트 & 전장 8단계 연계 퀘스트 라인 구축
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  게이트 완공부터 첫 아레나 결투, 승리, 네메시스 레이드 참전 및 토벌, 영지 정찰, 영지 침공 약탈, 전술 타워 테크 연구로 이어지는 8단계 연계 퀘스트 체인이 신설되어 풍성한 자원 보상과 함께 단계별 가이드를 제공합니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.6-rc8 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101b] border border-[#1f293d]">
            <div className="font-bold text-sm text-[#c8aa6e] mb-2 flex items-center justify-between border-b border-[#c8aa6e44] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🔥</span>
                <span>V.0.9.6-rc8 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#c8aa6e] bg-[#c8aa6e22] px-2 py-0.5 rounded font-bold border border-[#c8aa6e55]">
                v0.9.6-rc8
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🏷️</span> 무기 6종 고유 특성 뱃지(Weapon Traits) & 전투 차별화 도입
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  무기 계열별 고유 전투 메커니즘과 특성 뱃지가 공식 적용되었습니다.
                  <br />• <strong>[🗡️ 베기] 검</strong>: 기본 공격 시 출혈(Bleed) 상태인 적에게 [상처 절개]가 발동하여 20%의 추가 물리 피해를 입힙니다.
                  <br />• <strong>[🔱 방어 파쇄] 창</strong>: 단단한 적의 보호막(Shield)에 50%의 추가 피해를 주어 방어선을 분쇄합니다.
                  <br />• <strong>[🏹 급소 사격] 활</strong>: 기본 공격 시 치명타율 +5% 및 치명타 피해량이 +5% 증폭되어 정밀 저격이 가능합니다.
                  <br />• <strong>[🔫 연사] 마총</strong>: 기본 공격 시 기본 15% 확률에 행운(🍀) 보정치를 더해 공격력 45% 위력의 [추가 점사 탄환]을 격발합니다.
                  <br />• <strong>[⚡ 암습] 단검</strong>: 대상 마물보다 속도가 빠를수록 피해량이 최대 20%까지 상향 증폭됩니다.
                  <br />• <strong>[🪄 공명] 지팡이</strong>: 마나 순환을 안정화하여 모든 스킬의 마나(MP) 소모량을 5% 상시 절감합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>🏛️</span> 병기창 & 생체 복원 병동 동시 해금 및 이중 퀘스트 테크트리 라인 구축
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  침묵의 회랑 첫 척후 임무 완료 시 병기창과 생체 복원 병동이 병렬로 동시 해금됩니다.
                  <br />• <strong>라인 1 (장비/마도 테크)</strong>: 병기창 단조 ➔ 장비 제작 ➔ 연금 공방 ➔ 마도서 제본 ➔ 블랙 마켓
                  <br />• <strong>라인 2 (의료/영혼 승격 테크)</strong>: 생체 복원 병동 완공 ➔ 영혼의 제단 해금 ➔ 1차 상위 전직 및 보스전
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>⚡</span> 자동 전투 1.5배 가속 및 스킬 콤보 / 막타 스마트 AI 알고리즘 적용
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  자동 전투 진행 시 턴 연출 및 전투 속도가 1.5배 가속되며, 아군 간 상태이상 콤보 폭발을 최우선으로 시전하고 일반 공격으로 처치 가능한 체력일 경우 마나를 아끼는 스마트 전투 알고리즘이 적용되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ce93d8] flex items-center gap-1">
                  <span>📜</span> 도감 회고록 '성채 묘비명' 최초 영웅 전사 시 등록 조건 개선
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  원정대원이 처음으로 전사하여 묘지에 묘비명이 새겨지는 순간 백과사전 회고록 컬렉션에 즉시 등록되도록 트리거가 정비되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#f48fb1] flex items-center gap-1">
                  <span>💎</span> 전투 보상 전리품 모달 오파츠 명칭 정규화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전투 승리 모달에서 오파츠 전리품이 파일명이 아닌 정식 한글 명칭과 고유 아이콘으로 정확하게 표기됩니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.6-rc7 이전 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101b] border border-[#1f293d]">
            <div className="font-bold text-sm text-[#c8aa6e] mb-2 flex items-center justify-between border-b border-[#c8aa6e44] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🔥</span>
                <span>V.0.9.6-rc7 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#c8aa6e] bg-[#c8aa6e22] px-2 py-0.5 rounded font-bold border border-[#c8aa6e55]">
                v0.9.6-rc7
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🪦</span> 성채 묘지 시스템 개편 & 24종 영령의 가호(Ancestral Blessing) 신설
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전사한 영웅들의 넋을 기리는 성채 묘지가 강력한 계승 시스템으로 전면 개편되었습니다.
                  <br />• <strong>성채 묘지 헌화 (전체 추모)</strong>: 안장된 영웅이 있을 때 헌화할 수 있으며, 안장 영웅 1명당 목재 20개(최대 100개)를 소모하여 5분간 1명당 전투 획득 경험치 +5%(최대 +25%) 가호를 얻습니다 (연속 헌화 시 시간 누적 연장).
                  <br />• <strong>24종 전 클래스 영령의 가호</strong>: 기본 6종 및 1·2차 전직 클래스 전수에 고유 시너지가 부여됩니다.
                  <br />• <strong>등급별 시너지 강화</strong>: 전사 영웅의 등급에 따라 가호 효과가 N(1.0배), V(1.25배), H(1.5배), E(1.8배), L(2.2배)로 최대 2.2배까지 대폭 증폭됩니다.
                  <br />• <strong>다음 원정 1회 적용 & 덮어쓰기</strong>: 영웅 등급별 에테르(30~100개 차등: N 30, V 45, H 60, E 80, L 100)를 공물로 바쳐 다음 심연 원정 1회 동안 가호를 누리며, 새로운 영령에게 공물을 바치면 이전 가호가 자동으로 교체됩니다. 공물을 바친 영웅은 1시간의 안식 쿨다운이 적용됩니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>📦</span> 전사 영웅 장착 장비 유품 보관함 100% 안전 회수
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  결사대원이 사경 카운트다운 소진 또는 전멸 등으로 전사하여 묘지에 안장될 때, 착용 중이던 무기·방어구·장신구가 영구 소멸되지 않고 성채 인벤토리(보관함)로 전리품처럼 안전하게 회수됩니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                  <span>⭐</span> 용병 등급별 레벨업 스탯 성장치 차등화
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  레벨업 시 상승하는 스탯 폭을 차등화하여, N(+0), V(+1), H(+2), E(+3), L(+5)의 정수 스탯 상승 보너스와 행운 10% 단위 증폭이 적용되어 고등급 영웅의 장기 육성 가치가 강화되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ce93d8] flex items-center gap-1">
                  <span>📜</span> 심연의 백과(도감) 등록 알림 뱃지 & 실시간 카테고리 카운트
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  등록 가능한 컬렉션 항목이 생겼을 때 상단 메인 일러스트창 및 메뉴에 붉은색 알림 뱃지가 표시되며, 백과 모달 내 카테고리 탭마다 등록 가능 건수가 실시간으로 표기됩니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#f48fb1] flex items-center gap-1">
                  <span>🗡️</span> 전투 적 체력 패널 정리 & 특수 스탯(관통·흡혈) 상세창 분리
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전투 중 적 카드 체력바 아래에는 현재 활성화된 버프/디버프만 간결히 표시되며, 방어 관통·흡혈 등 고유 특수 스탯은 적 상세 정보 모달에서 명확히 확인할 수 있도록 정돈되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ef5350] flex items-center gap-1">
                  <span>🛑</span> 차원 앵커 폐쇄 상태 시 네메시스 침공 및 약탈 전면 중단
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  차원 앵커가 닫혀 있는 동안에는 네메시스의 영지 침공과 자원 약탈이 전면 중단되어 영지 자원이 100% 안전하게 보호됩니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.6-rc4 패치노트 */}
          <div className="p-3 rounded-xl bg-[#0b101b] border border-[#1f293d]">
            <div className="font-bold text-sm text-[#90a4ae] mb-2 flex items-center justify-between border-b border-[#1f293d] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>📦</span>
                <span>V.0.9.6-rc4 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#90a4ae] bg-[#1f293d55] px-2 py-0.5 rounded font-bold border border-[#1f293d]">
                v0.9.6-rc4
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>🌟</span> 원정대 시너지 상한(최대 4개) 및 돌격 배수진 1턴 보호막 한정
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  직업군(role) 시너지가 무분별하게 중복 발동되던 현상을 정비하여 우선순위에 따라 최대 2개만 선별 적용되도록 개선했습니다. 진형 1개, 전직/숙련도 1개와 함께 원정대 전체 시너지가 총 최대 4개로 제한되어 더욱 전략적인 파티 편성을 제공합니다. 아울러 '돌격 배수진' 시너지의 15% 보호막이 전투 첫 턴(1라운드 전체) 동안 유지된 후 2라운드 시작 시점에 안전하게 만료되도록 개선되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚒️</span> 장비 단조 상세 모달 (스탯 ±30% 랜덤 편차) & 직업군 제작 재료 테마 연계
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  단조 목록에서 장비의 기본 제원을 확인한 후, 상세 모달을 통해 기준 스탯 대비 ±30% 편차의 고유 수치를 가진 장비를 제작할 수 있습니다. 또한 로브 계열은 실크, 검·판금은 철광석, 스태프는 목재·석탄을 소모하며 고등급 장비는 에테르, 마법 수정, 공허 파편 등 심연 고급 자원을 적극 소모하도록 재료 연관성이 강화되었습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ce93d8] flex items-center gap-1">
                  <span>☠️</span> 심연 6층+ [저주받은 장비] 드랍 & 병기창 정화 시설
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  심연 6층 이상의 고대 석관 및 보물 상자에서 [저주받은][장비명]이 일정 확률로 드랍됩니다. 저주받은 장비는 착용할 수 없으며 병기창 정화 시설에서 50% 성공률로 정화할 수 있습니다(실패 시 파괴). 정화 성공 시 일반부터 전설까지 모든 등급 풀에서 결정되며, 해당 등급의 '최상급 극옵 스탯'을 지닌 명품 장비로 부활합니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ef5350] flex items-center gap-1">
                  <span>👑</span> 심연의 절대 재앙 '네메시스' 체력 30,000,000 대규모 상향
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전 방주 지휘관 연합이 도전하는 심연의 절대자 네메시스의 전체 체력을 30,000,000으로 대폭 확장하여 더욱 웅장하고 긴장감 넘치는 월드 레이드 토벌전 밸런스를 구축했습니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.6-rc2 패치노트 */}
          <div className="p-3 rounded-xl bg-[#13151b] border border-[#c8aa6e44] shadow-md opacity-90">
            <div className="font-bold text-sm text-[#8b9bb4] mb-2 flex items-center justify-between border-b border-[#1f293d] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>✨</span>
                <span>V.0.9.6-rc2 업데이트 패치노트</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b9bb4] bg-[#1e293b] px-2 py-0.5 rounded font-bold border border-[#2c3e55]">
                v0.9.6-rc2
              </span>
            </div>
            <ul className="space-y-2 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                  <span>⚔️</span> 차원의 아레나 전투 경험치 획득 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  차원의 아레나 결투장(PvP)에서 벌어지는 모든 전투에서 용병 경험치(EXP) 획득을 제거하여, 결투 본연의 레이팅 점수 및 투사의 인장 획득, 연승 경쟁 시스템에 집중되도록 개선하였습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>📈</span> 전직 및 각성 순수 기본 스탯(Base Stat) 비교 개편
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  전직 및 각성 미리보기 시 착용 장비 스탯이 합산되어 상승분이 왜곡되어 보이던 현상을 바로잡고, 전직 전후의 순수 기본 스탯만을 직관적이고 투명하게 비교 표시하도록 수정하였습니다.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#64b5f6] flex items-center gap-1">
                  <span>✨</span> 앱 시작 시 지휘관 인증 오버레이 연출 도입
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  기존 로그인 세션이 유지된 상태로 앱 실행 시 '지휘관 확인 중....' 오버레이 화면 연출을 제공하여 안정적이고 매끄러운 자동 로그인 진입 경험을 제공합니다.
                </span>
              </li>
            </ul>
          </div>

          {/* V.0.9.6-rc1 핵심 시스템 하이라이트 */}
          <div className="p-3 rounded-xl bg-[#13151b] border border-[#c8aa6e33] shadow-md opacity-90">
            <div className="font-bold text-sm text-[#8b9bb4] mb-2 flex items-center justify-between border-b border-[#1f293d] pb-1.5">
              <span className="flex items-center gap-1.5">
                <span>🚀</span>
                <span>V.0.9.6 주요 게임 구성 & 핵심 시스템</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b9bb4] bg-[#1e293b] px-2 py-0.5 rounded font-bold border border-[#2c3e55]">
                v0.9.6-rc1
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🏰</span> 방주 성채 (Ark Citadel) 영지 경제 & 건립 관리
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  중앙 성채 및 7대 특화 시설(생존자 안식처, 방주 중앙 병참고, 원정 연무장, 병기창, 블랙 마켓 등) 건설·승급, 자원(금화, 식량, 목재, 석재, 철광, 에테르) 생산 및 적재 용량 확장
                </span>
              </li>

              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🌌</span> 11층 심연 던전 & 무간도 (Avici) 강하 탐험
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  1층부터 11층 무간도(무한 난이도 도약 계층)까지 이어지는 턴제 던전 탐험, 심연 위험도 오버차지, 귀환 포탈 발견, 야영 및 모닥불 온기 버프
                </span>
              </li>

              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>⚔️</span> 병기창 장비 단조 & 2중 인챈트 부여
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  희귀~전설 등급 장비 단조, 순수 접두/접미 인챈트석을 활용한 2중 스탯 강화, 클래스 맞춤형 유니크 보스 드랍 장비
                </span>
              </li>

              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🔮</span> 인연 & 영혼 공명 (Bond Synergy) & 클래스 특성
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  용병 조합 시너지, MP 영혼 공명 회복(개별 30%, 파티 50%), 암살자 패시브 "치명적 본능" 치명타 시 30%(+행운 보정) 추가 공격 개편
                </span>
              </li>

              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>🏆</span> 3v3 영광의 결투장 (Dimension Arena)
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  지휘관 원정대 간 3v3 PvP 레이팅 기반 명예 결투 및 전적 / 등급 관리
                </span>
              </li>

              <li className="flex flex-col gap-0.5">
                <span className="font-bold text-[#ffd54f] flex items-center gap-1">
                  <span>📖</span> 보스 마도서 & 궁극 스킬 해금
                </span>
                <span className="text-[11px] text-[#90a4ae] pl-4">
                  심연 보스 토벌 시 획득하는 마도서/스킬북 습득을 통한 파티원 고유 전술 스킬 해금
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ⚠️ 게임 데이터 전체 초기화 모달 */}
      <Modal
        title="⚠️ 게임 데이터 전체 초기화"
        open={resetModal}
        onClose={() => !isResetting && setResetModal(false)}
        footer={
          <div className="flex items-center justify-end w-full gap-2 pt-1">
            <ActionButton
              label="취소"
              variant="ghost"
              size="sm"
              disabled={isResetting}
              onClick={() => setResetModal(false)}
            />
            <ActionButton
              label={isResetting ? '초기화 진행 중...' : '🚨 전체 데이터 초기화'}
              variant="danger"
              size="sm"
              disabled={isResetting}
              onClick={async () => {
                if (!window.confirm('⚠️ [경고: 복구 불가]\n\n정말 모든 게임 데이터를 완전 초기화하시겠습니까?\n\n• 로컬 저장 데이터 영구 삭제\n• Firebase 클라우드 동기화 세이브 영구 삭제\n• 용병단, 장비, 거점 건물, 자원, 던전 진행도 전체 초기화\n\n이 작업은 되돌릴 수 없습니다. 계속 진행하시겠습니까?')) {
                  return;
                }
                setIsResetting(true);
                try {
                  await gm.resetGame();
                  setResetModal(false);
                  onClose();
                } finally {
                  setIsResetting(false);
                }
              }}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-xs text-[#cfd8dc]">
          <div className="p-3 rounded-lg bg-[#2b1414] border border-[#ef535088] flex items-start gap-2.5">
            <span className="text-2xl shrink-0">🚨</span>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-[#ef5350]">전체 초기화 주의사항</span>
              <p className="text-[11px] text-[#cfd8dc] leading-relaxed">
                현재 지휘관 계정의 모든 게임 진행 데이터가 <strong>완전히 삭제</strong>되며 게임을 처음부터 다시 시작합니다.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#14161c] border border-[#23324d] flex flex-col gap-1.5 text-[11px]">
            <span className="font-bold text-[#ffd54f] mb-0.5">삭제 대상 목록:</span>
            <div className="flex items-center gap-1.5 text-[#cfd8dc]">
              <span>🏰</span> <span>거점 건물 레벨 및 시설 해금 전체 초기화</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cfd8dc]">
              <span>🪙</span> <span>보유 자원(금화, 식량, 목재, 광석, 에테르 등) 기본 지급치로 재설정</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cfd8dc]">
              <span>⚔️</span> <span>고용된 용병단, 보유 장비 및 습득 스킬북 초기화 (기본 영웅 2인 재설정)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cfd8dc]">
              <span>🌌</span> <span>심연 던전 진행도, 탐험 퀘스트 및 아레나 점수(1000점) 초기화</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#ef5350]">
              <span>☁️</span> <span>Firebase 클라우드에 백업된 사용자 동기화 세이브 영구 삭제</span>
            </div>
          </div>

          <p className="text-[11px] text-[#ef5350] font-bold text-center">
            ※ 초기화 후에는 삭제된 데이터를 복구할 수 없습니다.
          </p>
        </div>
      </Modal>

      {/* 커스텀 에셋 & 미디어 스튜디오 모달 (모바일 빌드 제외) */}
      {!isMobilePlatform && (
        <CustomAssetStudioModal
          open={assetStudioModal}
          onClose={() => setAssetStudioModal(false)}
        />
      )}

      {/* 마스터 데이터 & 밸런스 스튜디오 모달 (모바일 빌드 제외) */}
      {!isMobilePlatform && (
        <CustomDataStudioModal
          open={dataStudioModal}
          onClose={() => setDataStudioModal(false)}
        />
      )}

      {/* 🎖️ 지휘관 콜사인(호출부호) 1회 변경 모달 */}
      <CallsignChangeModal
        open={callsignModal}
        onClose={() => setCallsignModal(false)}
        currentProfile={profile}
      />
    </div>
  );
};
