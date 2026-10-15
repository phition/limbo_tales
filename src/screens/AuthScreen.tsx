import React, { useState, useEffect } from 'react';
import { FirebaseService, UserProfile } from '../services/FirebaseService';
import { useGameManager } from '../hooks/useGameManager';
import { useI18n } from '../hooks/useI18n';
import { SupportedLanguage } from '../i18n/types';
import { Modal } from '../components/Modal';

interface Props {
  onLoginSuccess: (profile: UserProfile | null) => void;
}

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const { gm } = useGameManager();
  const { lang, setLanguage, tr } = useI18n();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('지휘관');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const fb = FirebaseService.getInstance();

  // 저장된 이메일 및 환경설정 복원
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('limbo_saved_email');
      const savedRemember = localStorage.getItem('limbo_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedRemember !== null) {
        setRememberEmail(savedRemember === 'true');
      }
    } catch {
      // localStorage 접근 불가 환경 대비
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    // 이메일 기억하기 저장 처리
    try {
      if (rememberEmail) {
        localStorage.setItem('limbo_saved_email', cleanEmail);
        localStorage.setItem('limbo_remember_email', 'true');
      } else {
        localStorage.removeItem('limbo_saved_email');
        localStorage.setItem('limbo_remember_email', 'false');
      }
    } catch {
      // ignore storage errors
    }

    setLoading(true);
    setStatusMessage(mode === 'login' ? '방주 인증 서버와 교신 중...' : '신규 지휘관 서약 등록 중...');

    try {
      if (mode === 'login') {
        const res = await fb.signInWithEmail(cleanEmail, cleanPass);
        if (res.success) {
          setStatusMessage('인증 완료! 방주 성채로 진입합니다...');
          setTimeout(() => {
            setLoading(false);
            onLoginSuccess(fb.getCachedProfile());
          }, 400);
        } else {
          setErrorMessage(fb.getFriendlyErrorMessage(res.error || '로그인에 실패했습니다.'));
          setLoading(false);
          setStatusMessage(null);
        }
      } else {
        const res = await fb.signUpWithEmail(cleanEmail, cleanPass, nickname.trim() || '지휘관');
        if (res.success) {
          setStatusMessage('서약 완료! 방주 성채로 진입합니다...');
          setTimeout(() => {
            setLoading(false);
            onLoginSuccess(fb.getCachedProfile());
          }, 400);
        } else {
          setErrorMessage(fb.getFriendlyErrorMessage(res.error || '회원가입에 실패했습니다.'));
          setLoading(false);
          setStatusMessage(null);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '인증 중 오류가 발생했습니다.');
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setLoading(true);
    setStatusMessage('Google 계정 인증 교신 중...');

    try {
      const targetNickname = mode === 'signup' ? nickname.trim() : undefined;
      const res = await fb.signInWithGoogle(targetNickname);

      if (res.success) {
        setStatusMessage(res.isNewUser ? '지휘관 서약 완료! 방주 성채로 진입합니다...' : '인증 완료! 방주 성채로 진입합니다...');
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess(fb.getCachedProfile());
        }, 400);
      } else {
        setErrorMessage(res.error || 'Google 로그인에 실패했습니다.');
        setLoading(false);
        setStatusMessage(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google 인증 중 오류가 발생했습니다.');
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    setStatusMessage('익명 탐험 세션 생성 중...');

    const res = await fb.signInGuest();
    if (res.success) {
      setStatusMessage('방주 성채로 진입합니다...');
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(fb.getCachedProfile());
      }, 400);
    } else {
      setErrorMessage(fb.getFriendlyErrorMessage(res.error || '게스트 로그인에 실패했습니다.'));
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-screen bg-[#07080d] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
        boxSizing: 'border-box'
      }}
    >
      {/* ── 1. 시네마틱 성화 비디오 & 배경 일러스트 ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="assets/citadel_bonfire.jpg"
          className="w-full h-full object-cover scale-105 opacity-35 filter brightness-75 contrast-125 transition-transform duration-1000"
        >
          <source src="assets/citadel_bonfire.mp4" type="video/mp4" />
        </video>
        {/* 심연의 다크 비네트 & 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/85 to-[#07080d]/70" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(14, 18, 28, 0.2) 0%, rgba(7, 8, 13, 0.92) 80%, #07080d 100%)'
          }}
        />
      </div>

      {/* ── 2. 다크 판타지 성화 불씨(Embers) 파티클 효과 ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: '12%', size: 4, dur: '5.2s', delay: '0.3s', drift: '28px', color: '#ff9800' },
          { left: '25%', size: 3, dur: '4.1s', delay: '1.5s', drift: '-20px', color: '#ffd54f' },
          { left: '38%', size: 5, dur: '6.0s', delay: '0.8s', drift: '35px', color: '#ff5722' },
          { left: '50%', size: 3, dur: '4.8s', delay: '2.2s', drift: '-15px', color: '#ffb74d' },
          { left: '62%', size: 4, dur: '5.5s', delay: '1.1s', drift: '30px', color: '#ff7043' },
          { left: '74%', size: 3, dur: '4.3s', delay: '2.8s', drift: '-25px', color: '#ffd54f' },
          { left: '88%', size: 5, dur: '5.8s', delay: '0.5s', drift: '22px', color: '#ff9800' },
          { left: '18%', size: 2, dur: '3.8s', delay: '3.2s', drift: '-10px', color: '#ffab40' },
          { left: '82%', size: 3, dur: '4.6s', delay: '1.9s', drift: '18px', color: '#ff6e40' },
        ].map((ember, idx) => (
          <div
            key={idx}
            className="absolute bottom-0 rounded-full animate-ember"
            style={{
              left: ember.left,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              backgroundColor: ember.color,
              boxShadow: `0 0 ${ember.size * 3}px ${ember.color}`,
              // CSS Custom Properties for animation
              ['--ember-dur' as any]: ember.dur,
              ['--ember-delay' as any]: ember.delay,
              ['--ember-drift' as any]: ember.drift,
            }}
          />
        ))}
      </div>

      {/* ── 3. 중앙 메인 고딕 아케인 카드 ── */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#0b0e17]/92 border border-[#263246] rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.92)] backdrop-blur-xl flex flex-col gap-4 animate-fade-in">
        {/* 고딕 코너 아르누보 장식 프레임 */}
        <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#ffd54f55] rounded-tl-sm pointer-events-none" />
        <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#ffd54f55] rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#ffd54f55] rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#ffd54f55] rounded-br-sm pointer-events-none" />

        {/* 🌐 우상단 언어 빠른 전환 버튼군 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
          {(
            [
              { code: 'ko', label: 'KO' },
              { code: 'en', label: 'EN' },
              { code: 'ja', label: 'JA' },
            ] as { code: SupportedLanguage; label: string }[]
          ).map(item => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                lang === item.code
                  ? 'bg-[#00d2ff] text-black border-[#00d2ff] shadow-sm shadow-[#00d2ff55]'
                  : 'bg-[#121927]/80 text-[#8b9bb4] border-[#22334f] hover:text-[#cfd8e8] hover:border-[#00d2ff66]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 상단 엠블럼 & 타이틀 헤더 */}
        <div className="text-center flex flex-col items-center pt-1">
          {/* 성화 엠블럼 심볼 */}
          <div className="relative mb-2.5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#2a1b0c] to-[#121622] border-2 border-[#ffd54f66] flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(255,170,0,0.45)]">
              🔥
            </div>
            <div className="absolute -inset-1 rounded-full border border-[#ffd54f22] animate-pulse pointer-events-none" />
          </div>

          {/* 메인 타이틀 (Cinzel 폰트 + 골드 텍스처) */}
          <h1 className="text-xl sm:text-2xl font-black font-cinzel tracking-[0.18em] text-gold-shimmer filter drop-shadow-[0_2px_12px_rgba(255,213,79,0.35)]">
            LIMBO TALES
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#ffd54f66]" />
            <span className="text-[11px] font-bold text-[#e2e8f0] tracking-widest font-cinzel">
              방주 성채 (Ark Citadel)
            </span>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#ffd54f66]" />
          </div>

          <p className="text-[11px] text-[#8b9bb4] mt-1.5 leading-relaxed font-sans">
            심연의 어둠 속에서 성화를 밝히고 인류의 마지막 방주를 수호하라
          </p>
        </div>

        {/* 탭 전환 (로그인 vs 회원가입) */}
        <div className="flex p-1 bg-[#10141f] border border-[#1f293b] rounded-xl shadow-inner">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#ffd54f26] to-[#ff980026] text-[#ffd54f] border border-[#ffd54f66] shadow-[0_2px_12px_rgba(255,213,79,0.2)]'
                : 'text-[#8292ab] hover:text-[#d1dceb] border border-transparent'
            }`}
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
          >
            <span>⚔️</span>
            <span>지휘관 로그인</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#10b98126] to-[#05966926] text-[#34d399] border border-[#10b98166] shadow-[0_2px_12px_rgba(16,185,129,0.2)]'
                : 'text-[#8292ab] hover:text-[#d1dceb] border border-transparent'
            }`}
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
          >
            <span>📜</span>
            <span>신규 지휘관 서약</span>
          </button>
        </div>

        {/* 에러 메시지 알림 (다크 레드 룬 경고문) */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#2a0e10]/90 border border-[#ef535077] text-xs text-[#ff9e9e] flex items-start gap-2.5 animate-shake shadow-[0_4px_16px_rgba(239,83,80,0.25)] leading-relaxed">
            <span className="text-base shrink-0">⚠️</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* 인증 입력 폼 */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="animate-fade-in flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[#94a3b8] font-semibold flex items-center gap-1">
                  <span>🏷️</span>
                  <span>지휘관 성명 (호출부호)</span>
                </label>
                <span className="text-[10px] text-[#34d399] font-mono">
                  (기본명 유지 시 UID 순번 자동 부여)
                </span>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="지휘관"
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1422] border border-[#232f44] text-[#f1f5f9] text-xs focus:outline-none focus:border-[#34d399] focus:ring-1 focus:ring-[#34d39988] transition-all placeholder-[#475569]"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#94a3b8] font-semibold flex items-center gap-1">
              <span>✉️</span>
              <span>지휘관 계정 이메일</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="commander@limbo.ark"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1422] border border-[#232f44] text-[#f1f5f9] text-xs focus:outline-none focus:border-[#ffd54f] focus:ring-1 focus:ring-[#ffd54f88] transition-all placeholder-[#475569]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#94a3b8] font-semibold flex items-center gap-1">
                <span>🗝️</span>
                <span>보안 암호문 (6자리 이상)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#0f1422] border border-[#232f44] text-[#f1f5f9] text-xs focus:outline-none focus:border-[#ffd54f] focus:ring-1 focus:ring-[#ffd54f88] transition-all placeholder-[#475569]"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs text-[#64748b] hover:text-[#cbd5e1] transition-colors"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 계정 기억하기 체크박스 */}
          <div className="flex items-center justify-between text-[11px] text-[#8b9bb4] pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#0f1422] border-[#232f44] text-[#ffd54f] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#ffd54f]"
              />
              <span>계정 이메일 기억하기</span>
            </label>
            <span className="text-[10px] text-[#64748b] font-mono">Cloud Sync</span>
          </div>

          {/* 메인 실행 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-1.5 py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#ffd54f] text-[#0c0d12] hover:brightness-110 shadow-[0_4px_24px_rgba(217,119,6,0.4)] border border-[#ffd54f88]'
                : 'bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399] text-[#07130e] hover:brightness-110 shadow-[0_4px_24px_rgba(16,185,129,0.4)] border border-[#34d39988]'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">{statusMessage || '방주와 교신 중...'}</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span className="text-sm">🔥</span>
                <span className="font-bold tracking-wide">방주 성채 입장하기</span>
              </>
            ) : (
              <>
                <span className="text-sm">✨</span>
                <span className="font-bold tracking-wide">새 지휘관 서약 및 거점 생성</span>
              </>
            )}
          </button>
        </form>

        {/* 다크 판타지 룬 구분선 */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#263246] to-transparent" />
          <span className="text-[10px] text-[#556780] font-cinzel tracking-widest">
            ◆ 간편 계정 연동 ◆
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#263246] to-transparent" />
        </div>

        {/* 🌐 Google 계정 가입 / 로그인 버튼 */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#141b2a] hover:bg-[#1c263b] border border-[#2d3d57] hover:border-[#4285f4] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50 group active:scale-[0.98]"
        >
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{mode === 'signup' ? 'Google 계정으로 가입' : 'Google 계정으로 로그인'}</span>
        </button>

        {/* 방랑자(게스트) 즉시 시작 버튼 */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#cbd5e1] hover:text-white bg-[#111726]/80 hover:bg-[#161f33] border border-[#28354c] hover:border-[#ffd54f44] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 group"
        >
          <span className="group-hover:scale-110 transition-transform">👤</span>
          <span>방랑자(익명)로 즉시 탐험 시작</span>
          <span className="text-[10px] text-[#64748b] ml-1">(로컬 세션)</span>
        </button>

        {/* 📜 개인정보처리방침 보기 링크 */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748b] pt-0.5">
          <span>계속 진행 시</span>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-[#94a3b8] hover:text-[#00d2ff] underline underline-offset-2 transition-colors cursor-pointer font-medium"
          >
            개인정보처리방침
          </button>
          <span>에 동의하게 됩니다.</span>
        </div>

        {/* 하단 시스템 상태 & 명언 */}
        <div className="pt-1 flex flex-col items-center gap-1 border-t border-[#182133] text-center">
          <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-mono">ARK CLOUD STATUS: ONLINE</span>
            <span>•</span>
            <span className="font-mono">v0.9.9-rc10</span>
          </div>
          <div className="text-[10px] text-[#475569] italic font-serif">
            &ldquo;어둠이 깊을수록, 성화의 불꽃은 더욱 찬란히 타오른다.&rdquo;
          </div>
        </div>
      </div>

      {/* 📜 개인정보처리방침 팝업 모달 */}
      <Modal
        title="📜 개인정보처리방침 (Privacy Policy)"
        open={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => window.open('https://limbo-cbcc4.web.app/privacy.html', '_blank')}
              className="text-[11px] text-[#00d2ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>🌐 웹 브라우저로 열기</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="px-3 py-1.5 rounded-lg bg-[#24304c] hover:bg-[#334155] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        }
      >
        <div className="text-xs text-[#cbd5e1] leading-relaxed space-y-3 font-sans">
          <div className="p-2.5 rounded-lg bg-[#0f1422] border border-[#232f44] text-[11px] text-[#94a3b8]">
            <div><strong>시행일자:</strong> 2026년 10월 2일</div>
            <div><strong>대상 서비스:</strong> Project: Limbo Tales (<code>com.limbo.tales</code>)</div>
            <div><strong>문의 이메일:</strong> phitionv4@gmail.com</div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">1. 수집하는 개인정보 항목</h4>
            <p className="text-[#94a3b8]">
              • <strong>인증 정보:</strong> 이메일 가입 시 이메일 주소, 일방향 암호화된 비밀번호, 회원 고유 식별자(UID) / 게스트 로그인 시 임의 식별자(UID)<br/>
              • <strong>게임 진행 데이터:</strong> 성채 레벨, 보유 자원, 용병 파티, 장비/스킬 데이터, 던전 진행도, 퀘스트 달성 정보<br/>
              • <strong>아레나 랭킹:</strong> 지휘관 닉네임, 아레나 랭킹 레이팅(Rating), 방어 덱 편성 정보<br/>
              • <strong>기술 정보:</strong> 접속 일시, 단말기 OS 종류, 서비스 크래시/오류 로그
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">2. 수집 및 이용 목적</h4>
            <p className="text-[#94a3b8]">
              회원 식별, 기기 간 클라우드 세이브(Cloud Save) 동기화, 비동기 아레나 랭킹 대전 매칭, 서비스 무결성 및 안정성 유지
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">3. 개인정보 처리 위탁</h4>
            <p className="text-[#94a3b8]">
              안정적인 클라우드 인프라 제공을 위해 <strong>Google LLC (Firebase)</strong>에 사용자 인증(Auth), 실시간 데이터베이스(Realtime DB), 호스팅 업무를 위탁하고 있습니다.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">4. 보유 기간 및 파기 절차</h4>
            <p className="text-[#94a3b8]">
              • 이용 목적 달성 시 즉시 파기합니다.<br/>
              • 게임 내 <strong>[설정] &gt; [데이터 완전 초기화]</strong> 기능 실행 시 로컬 및 클라우드 세이브 데이터가 즉시 영구 삭제됩니다.<br/>
              • 고객센터 문의(phitionv4@gmail.com)를 통한 계정 삭제 요청 시 즉시 복구 불가능하게 파기됩니다.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">5. 기술적·관리적 보호 조치</h4>
            <p className="text-[#94a3b8]">
              비밀번호 일방향 암호화, HTTPS/SSL 전송 구간 암호화, Firebase Security Rules 접근 권한 분리를 적용하여 철저히 보호합니다.
            </p>
          </div>

          <div className="pt-2 border-t border-[#232f44]">
            <h4 className="text-xs font-bold text-[#64748b] mb-1">Privacy Policy Summary (English)</h4>
            <p className="text-[11px] text-[#64748b]">
              Project: Limbo Tales collects minimal information (email/encrypted password or anonymous UID, game progress, arena rating) to provide cloud saves and rankings via Google Firebase. Data can be permanently wiped anytime via the in-game Settings menu or by contacting phitionv4@gmail.com.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
