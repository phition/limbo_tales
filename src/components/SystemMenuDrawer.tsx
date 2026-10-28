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
import { PATCH_NOTES_DATA } from '../data/patchNotesData';

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
                <span className="font-bold text-xs text-[#c8aa6e] notranslate" translate="no" data-no-translate="true">{profile?.nickname || '지휘관'}</span>
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
                호출부호: <strong className="text-[#c8aa6e] notranslate" translate="no" data-no-translate="true">[{profile?.nickname || '지휘관'}]</strong>
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
        title={tr("📜 버전 정보 & 패치노트")}
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
              <span>{tr("최신 버전 확인")}</span>
            </button>
            <ActionButton label={tr("닫기")} variant="primary" size="sm" onClick={() => setPatchModal(false)} />
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-xs text-[#cfd8dc] leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {((PATCH_NOTES_DATA[lang] || PATCH_NOTES_DATA['ko'])).map((release) => (
            <div
              key={release.version}
              className={`p-3 rounded-xl shadow-md ${
                release.isLatest
                  ? 'bg-[#0f172a] border border-[#c8aa6e]'
                  : 'bg-[#0b101d] border border-[#1f2b42] opacity-90'
              }`}
            >
              <div
                className={`font-bold ${
                  release.isLatest ? 'text-sm text-[#c8aa6e] border-[#c8aa6e44]' : 'text-xs text-[#8b9bb4] border-[#1f2b42]'
                } mb-2 flex items-center justify-between border-b pb-1.5`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{release.isLatest ? '🔥' : '📜'}</span>
                  <span>{release.title}</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    release.isLatest
                      ? 'text-[#c8aa6e] bg-[#c8aa6e22] border-[#c8aa6e55]'
                      : 'text-[#8b9bb4] bg-[#15171d] border-[#2a364f]'
                  }`}
                >
                  {release.badge}
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#cfd8e8]">
                {release.categories.map((cat, catIdx) => (
                  <li key={catIdx} className="flex flex-col gap-0.5">
                    <span className="font-bold flex items-center gap-1" style={{ color: cat.color }}>
                      <span>{cat.icon}</span>
                      <span>{cat.title}</span>
                    </span>
                    <span className="text-[11px] text-[#90a4ae] pl-4">
                      {cat.bullets.map((b, bIdx) => (
                        <React.Fragment key={bIdx}>
                          {bIdx > 0 && <br />}
                          • {b.title && <strong>{b.title}: </strong>}
                          {b.desc}
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
