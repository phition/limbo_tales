import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { ref, set, get, child, update, query, limitToLast, orderByChild, onValue, runTransaction, Unsubscribe } from 'firebase/database';
import { auth, db } from './firebaseConfig';
import { ArenaOpponent, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { NEMESIS_BOSS_CONFIG, NEMESIS_CYCLE_CONSTANTS } from '../data/nemesis';
import { Capacitor } from '@capacitor/core';

/**
 * 🎖️ 지휘관 닉네임 결정 헬퍼 함수
 * 유저가 이름을 그대로 두고('지휘관') 가입하거나 비워둔 경우 '지휘관' 뒤에 UID 순번 숫자를 붙여줍니다.
 */
export function resolveCommanderNickname(rawNickname: string | undefined | null, uid: string): string {
  const trimmed = (rawNickname || '').trim();
  if (!trimmed || trimmed === '지휘관') {
    // UID에서 숫자 추출
    const digits = uid.replace(/\D/g, '');
    let seq = digits.slice(-4);
    if (seq.length < 4) {
      // UID 내 숫자가 부족할 경우 문자열 해시코드로 4자리 숫자(1000~9999) 생성
      let hash = 0;
      for (let i = 0; i < uid.length; i++) {
        hash = ((hash << 5) - hash) + uid.charCodeAt(i);
        hash |= 0;
      }
      seq = String(Math.abs(hash) % 9000 + 1000);
    }
    return `지휘관${seq}`;
  }
  return trimmed;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  rating: number;
  level: number;
  leaderTitle: string;
  gateLevel?: number; // 🏰 차원 앵커 게이트 레벨
  isPlayer?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  nickname: string;
  isAnonymous: boolean;
  createdAt: number;
  lastLoginAt: number;
  lastSavedAt?: number;
}

export class FirebaseService {
  private static instance: FirebaseService;
  private currentUser: User | null = null;
  private cachedProfile: UserProfile | null = null;
  private authListeners: Array<(user: User | null, profile: UserProfile | null) => void> = [];

  private mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, nickname: '아스트라', rating: 2150, level: 45, leaderTitle: '발키리' },
    { rank: 2, nickname: '그림자군주', rating: 2040, level: 42, leaderTitle: '그림자 망령' },
    { rank: 3, nickname: '카이저', rating: 1980, level: 40, leaderTitle: '아크 메이지' },
    { rank: 4, nickname: '발할라', rating: 1920, level: 38, leaderTitle: '성기사' },
    { rank: 5, nickname: '스칼렛', rating: 1870, level: 37, leaderTitle: '암살자' },
    { rank: 6, nickname: '셀레스트', rating: 1810, level: 36, leaderTitle: '성령의 구원자' },
    { rank: 7, nickname: '블랙로터스', rating: 1750, level: 35, leaderTitle: '대마도사' },
    { rank: 8, nickname: '오리온', rating: 1690, level: 33, leaderTitle: '중장 보병' },
    { rank: 9, nickname: '네오시안', rating: 1640, level: 32, leaderTitle: '저격수' },
    { rank: 10, nickname: '루나', rating: 1590, level: 30, leaderTitle: '원소 학도' },
  ];

  private authInitialChecked: boolean = false;

  private constructor() {
    // 🛡️ iframe/서드파티 환경 대비: 2.5초 내에 onAuthStateChanged 응답이 없으면 안전하게 fallback
    const safetyTimer = setTimeout(() => {
      if (!this.authInitialChecked) {
        console.warn('⚠️ [FirebaseService] Auth 초기화 안전 타임아웃(2.5s) 경과 - 게스트 모드로 안전 진입합니다.');
        this.authInitialChecked = true;
        this.notifyAuthListeners();
      }
    }, 2500);

    try {
      onAuthStateChanged(auth, async (user) => {
        clearTimeout(safetyTimer);
        try {
          let explicitlyLoggedOut = false;
          try {
            explicitlyLoggedOut = localStorage.getItem('auth_explicitly_logged_out') === 'true';
          } catch (_) {}

          if (explicitlyLoggedOut) {
            this.currentUser = null;
            this.cachedProfile = null;
            if (user) {
              await signOut(auth).catch(() => {});
            }
            this.authInitialChecked = true;
            this.notifyAuthListeners();
            return;
          }

          this.currentUser = user;
          if (user) {
            try {
              localStorage.setItem('limbo_has_session', 'true');
              localStorage.removeItem('auth_explicitly_logged_out');
            } catch (_) {}
            
            // 프로필 로딩에 3초 타임아웃 적용 (네트워크 지연 시 블로킹 방지)
            try {
              const profilePromise = this.fetchUserProfile(user.uid, user.email, user.displayName);
              const timeoutPromise = new Promise<UserProfile | null>((res) => setTimeout(() => res(null), 3000));
              this.cachedProfile = await Promise.race([profilePromise, timeoutPromise]);
            } catch (err) {
              console.warn('⚠️ [FirebaseService] 사용자 프로필 로딩 예외:', err);
              this.cachedProfile = null;
            }
          } else {
            this.cachedProfile = null;
          }
        } catch (innerErr) {
          console.error('⚠️ [FirebaseService] onAuthStateChanged 내부 오류:', innerErr);
        } finally {
          this.authInitialChecked = true;
          this.notifyAuthListeners();
        }
      });
    } catch (e) {
      console.error('⚠️ [FirebaseService] onAuthStateChanged 등록 실패 (샌드박스 제한):', e);
      clearTimeout(safetyTimer);
      this.authInitialChecked = true;
      this.notifyAuthListeners();
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public onAuthChange(callback: (user: User | null, profile: UserProfile | null) => void): () => void {
    this.authListeners.push(callback);
    if (this.authInitialChecked) {
      callback(this.currentUser, this.cachedProfile);
    }
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  private notifyAuthListeners(): void {
    this.authListeners.forEach(cb => cb(this.currentUser, this.cachedProfile));
  }

  /**
   * 🌟 로그인 상태 확인 (현재 인증된 사용자 반환)
   */
  public async ensureUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    if (auth.currentUser) {
      this.currentUser = auth.currentUser;
      return this.currentUser;
    }
    if (typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady();
        if (auth.currentUser) {
          this.currentUser = auth.currentUser;
          return this.currentUser;
        }
      } catch (_) {}
    }
    return this.currentUser || auth.currentUser || null;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getCachedProfile(): UserProfile | null {
    return this.cachedProfile;
  }

  /** 👑 마스터(관리자) 권한 판별 (모바일 네이티브 빌드에서는 보안 및 스토어 심사 준수를 위해 완전 비활성화) */
  public isMasterUser(): boolean {
    if (Capacitor.isNativePlatform()) {
      return false;
    }
    const user = this.currentUser || auth.currentUser;
    if (user?.uid === 'oiTgwYUgTBSNsuLo0rNt5jg7d423') return true;
    const email = user?.email;
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return cleanEmail.endsWith('@bumpcat.net') || cleanEmail.includes('bumpcat.net');
  }

  /** Firebase Auth 에러 코드를 친절한 한국어 안내문으로 변환 */
  public getFriendlyErrorMessage(err: any): string {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (code === 'auth/operation-not-allowed') {
      return "⚠️ Firebase 콘솔에서 [이메일/비밀번호] 인증이 비활성화되어 있습니다.\nFirebase Console > Authentication > Sign-in method에서 '이메일/비밀번호'를 [사용 설정]해 주세요.";
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/invalid-login-credentials') {
      return "이메일 또는 비밀번호가 올바르지 않습니다. 처음 접속하신다면 [신규 가입] 탭에서 계정을 등록해 주세요.";
    }
    if (code === 'auth/user-not-found') {
      return "등록되지 않은 지휘관 계정입니다. [신규 가입] 탭에서 계정을 생성해 주세요.";
    }
    if (code === 'auth/email-already-in-use') {
      return "이미 등록된 이메일 계정입니다. [로그인] 탭에서 로그인해 주세요.";
    }
    if (code === 'auth/weak-password') {
      return "비밀번호는 보안을 위해 최소 6자 이상이어야 합니다.";
    }
    if (code === 'auth/invalid-email') {
      return "유효하지 않은 이메일 형식입니다. (예: user@example.com)";
    }
    if (code === 'auth/too-many-requests') {
      return "접속 시도가 너무 많아 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (code === 'auth/network-request-failed') {
      return "인터넷 연결이 불안정합니다. 네트워크 상태를 확인해 주세요.";
    }
    return msg || '인증 처리 중 오류가 발생했습니다.';
  }


  /**
   * 🔑 이메일/비밀번호 직접 로그인
   */
  public async signInWithEmail(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();
    if (!cleanEmail || !cleanPass) {
      return { success: false, error: '이메일과 비밀번호를 모두 입력해 주세요.' };
    }

    localStorage.removeItem('auth_explicitly_logged_out');
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      this.currentUser = cred.user;
      this.cachedProfile = await this.fetchUserProfile(cred.user.uid, cred.user.email, cred.user.displayName || '지휘관');
      this.notifyAuthListeners();
      return { success: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Sign in failed:', err);
      return { success: false, error: this.getFriendlyErrorMessage(err) };
    }
  }

  /**
   * 📝 신규 지휘관 등록 (회원가입)
   */
  public async signUpWithEmail(email: string, pass: string, nickname: string = '지휘관'): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: '이메일과 비밀번호를 모두 입력해 주세요.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }

    localStorage.removeItem('auth_explicitly_logged_out');
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      this.currentUser = cred.user;

      // 🎖️ 유저가 '지휘관'을 그대로 두거나 비워둔 경우 UID 순번 숫자 부여 (예: 지휘관1042)
      const cleanNick = resolveCommanderNickname(nickname, cred.user.uid);

      await updateProfile(cred.user, { displayName: cleanNick }).catch(() => {});

      const profileData: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        nickname: cleanNick,
        isAnonymous: false,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      try {
        await set(ref(db, `users/${cred.user.uid}/profile`), profileData);
      } catch (dbErr) {
        console.warn('[Firebase DB] Profile init warning:', dbErr);
      }

      this.cachedProfile = profileData;
      this.notifyAuthListeners();
      return { success: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Sign up failed:', err);
      return { success: false, error: this.getFriendlyErrorMessage(err) };
    }
  }

  /**
   * 🌐 구글 계정으로 로그인 또는 회원가입
   * @param customNickname 가입 시 사용자가 지정한 닉네임 (미지정 또는 '지휘관'일 경우 UID 순번 번호 자동 생성)
   */
  public async signInWithGoogle(customNickname?: string): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    localStorage.removeItem('auth_explicitly_logged_out');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      this.currentUser = cred.user;

      // Realtime Database에서 기존 프로필 확인
      let isNewUser = false;
      const snapshot = await get(child(ref(db), `users/${cred.user.uid}/profile`));

      if (snapshot.exists()) {
        const existingProfile = snapshot.val() as UserProfile;
        let nick = existingProfile.nickname;
        // 만약 기존 프로필이 '지휘관' 기본명으로 되어 있었다면 순번 숫자로 보정
        if (!nick || nick === '지휘관') {
          nick = resolveCommanderNickname('지휘관', cred.user.uid);
          await update(ref(db, `users/${cred.user.uid}/profile`), { nickname: nick }).catch(() => {});
        }
        await update(ref(db, `users/${cred.user.uid}/profile`), { lastLoginAt: Date.now() }).catch(() => {});
        this.cachedProfile = { ...existingProfile, nickname: nick, lastLoginAt: Date.now() };
      } else {
        isNewUser = true;
        // 신규 유저 생성: 전달받은 닉네임이 있으면 사용, 없으면 Google displayName, 없으면 '지휘관'
        const candidate = (customNickname && customNickname.trim())
          || cred.user.displayName?.trim()
          || '지휘관';
        const finalNickname = resolveCommanderNickname(candidate, cred.user.uid);

        await updateProfile(cred.user, { displayName: finalNickname }).catch(() => {});

        const profileData: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email,
          nickname: finalNickname,
          isAnonymous: false,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };

        try {
          await set(ref(db, `users/${cred.user.uid}/profile`), profileData);
        } catch (dbErr) {
          console.warn('[Firebase DB] Google profile creation warning:', dbErr);
        }

        this.cachedProfile = profileData;
      }

      this.notifyAuthListeners();
      return { success: true, isNewUser };
    } catch (err: any) {
      console.error('[Firebase Auth] Google sign-in failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, isNewUser: false, error: '구글 인증 창이 닫혔습니다.' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, isNewUser: false, error: '브라우저 팝업이 차단되었습니다. 팝업을 허용해 주세요.' };
      }
      if (err?.code === 'auth/cancelled-popup-request') {
        return { success: false, isNewUser: false, error: '인증 요청이 취소되었습니다.' };
      }
      return { success: false, isNewUser: false, error: this.getFriendlyErrorMessage(err) };
    }
  }

  /**
   * 🌟 스마트 로그인 / 자동 회원가입
   * - 먼저 기존 계정 로그인을 시도합니다.
   * - 계정이 없거나(auth/user-not-found / auth/invalid-credential) 신규 이메일이면 자동으로 회원가입을 진행합니다.
   */
  public async smartAuth(
    email: string,
    pass: string,
    nickname: string = '지휘관'
  ): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, isNewUser: false, error: '이메일과 비밀번호를 모두 입력해 주세요.' };
    }

    try {
      // 1. 로그인 우선 시도
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      this.currentUser = cred.user;
      this.cachedProfile = await this.fetchUserProfile(cred.user.uid, cred.user.email, nickname);
      return { success: true, isNewUser: false };
    } catch (loginErr: any) {
      const code = loginErr.code || '';
      console.log('[Firebase Auth] Login attempt code:', code);

      // 계정 미존재 또는 미가입 자격 증명인 경우 -> 자동 회원가입 시도
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          this.currentUser = createCred.user;

          // 🎖️ 유저가 '지휘관'을 그대로 두거나 비워둔 경우 UID 순번 숫자 부여
          const finalNick = resolveCommanderNickname(nickname, createCred.user.uid);

          await updateProfile(createCred.user, { displayName: finalNick }).catch(() => {});

          // Realtime Database에 초기 프로필 생성
          const profileData: UserProfile = {
            uid: createCred.user.uid,
            email: createCred.user.email,
            nickname: finalNick,
            isAnonymous: false,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          };

          try {
            await set(ref(db, `users/${createCred.user.uid}/profile`), profileData);
          } catch (dbErr) {
            console.warn('[Firebase DB] Profile init warning:', dbErr);
          }

          this.cachedProfile = profileData;
          this.notifyAuthListeners();
          return { success: true, isNewUser: true };
        } catch (signupErr: any) {
          if (signupErr.code === 'auth/email-already-in-use') {
            return { success: false, isNewUser: false, error: '비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인하세요.' };
          }
          if (signupErr.code === 'auth/weak-password') {
            return { success: false, isNewUser: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
          }
          return { success: false, isNewUser: false, error: signupErr.message || '회원가입 중 오류가 발생했습니다.' };
        }
      }

      if (code === 'auth/wrong-password') {
        return { success: false, isNewUser: false, error: '비밀번호가 올바르지 않습니다.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, isNewUser: false, error: '유효한 이메일 형식이 아닙니다.' };
      }

      return { success: false, isNewUser: false, error: loginErr.message || '인증에 실패했습니다.' };
    }
  }

  /**
   * 익명(게스트) 로그인
   */
  public async signInGuest(): Promise<{ success: boolean; error?: string }> {
    localStorage.removeItem('auth_explicitly_logged_out');
    try {
      const cred = await signInAnonymously(auth);
      this.currentUser = cred.user;
      this.cachedProfile = {
        uid: cred.user.uid,
        email: null,
        nickname: `방랑 지휘관_${cred.user.uid.slice(0, 5)}`,
        isAnonymous: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };
      this.notifyAuthListeners();
      return { success: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Guest sign-in failed:', err);
      return { success: false, error: err.message || '게스트 접속에 실패했습니다.' };
    }
  }

  /**
   * 로그아웃
   */
  public async logout(): Promise<void> {
    localStorage.setItem('auth_explicitly_logged_out', 'true');
    localStorage.removeItem('limbo_has_session');
    this.currentUser = null;
    this.cachedProfile = null;
    await signOut(auth).catch(() => {});
    this.notifyAuthListeners();
  }

  /**
   * Realtime Database에서 사용자 프로필 불러오기/생성
   */
  private async fetchUserProfile(uid: string, email: string | null, fallbackNickname?: string | null): Promise<UserProfile> {
    try {
      const snapshot = await get(child(ref(db), `users/${uid}/profile`));
      if (snapshot.exists()) {
        const val = snapshot.val() as UserProfile;
        // 마지막 로그인 갱신
        update(ref(db, `users/${uid}/profile`), { lastLoginAt: Date.now() }).catch(() => {});
        return val;
      }
    } catch (err) {
      console.warn('[Firebase DB] fetchUserProfile error:', err);
    }

    const candidate = fallbackNickname || (email ? email.split('@')[0] : '지휘관');
    const finalNick = resolveCommanderNickname(candidate, uid);

    const defaultProfile: UserProfile = {
      uid,
      email,
      nickname: finalNick,
      isAnonymous: !email,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };

    try {
      await set(ref(db, `users/${uid}/profile`), defaultProfile);
    } catch (_) {}

    return defaultProfile;
  }

  /**
   * ☁️ Realtime Database에 게임 진행 데이터 저장 (Cloud Save) + 시도/성공 이중 로깅 & 핑(Ping) 측정
   */
  public async saveProgress(progressData: Record<string, unknown>): Promise<boolean> {
    const user = await this.ensureUser();
    if (!user) {
      console.warn('⚠️ [Firebase RTDB] 클라우드 저장 건너뜀: 로그인되지 않은 게스트 상태입니다.');
      return false;
    }
    const uid = user.uid;
    const startTime = performance.now();

    try {
      const userProgressRef = ref(db, `users/${uid}/progress`);
      // Firebase RTDB는 undefined 속성을 엄격히 금지하므로 JSON 직렬화를 통해 모든 undefined를 안전하게 제거
      const payload = JSON.parse(JSON.stringify({
        ...progressData,
        lastSavedAt: Date.now()
      }));

      // 데이터 크기(KB) 계산
      const payloadSizeKb = (new Blob([JSON.stringify(payload)]).size / 1024).toFixed(2);

      // 1️⃣ [저장 시도 단계 콘솔 출력 - 이중 체크 1단계]
      console.log(
        `%c🚀 [1/2 클라우드 저장 시도 시작] 크기: ${payloadSizeKb} KB | 시간: ${new Date().toLocaleTimeString()}`,
        'color: #00d2ff; font-weight: bold; background: #0c1824; padding: 2px 6px; border-radius: 4px; border: 1px solid #00d2ff44;'
      );

      await set(userProgressRef, payload);

      // 프로필 저장 타임스탬프 갱신
      await update(ref(db, `users/${uid}/profile`), {
        lastSavedAt: Date.now()
      }).catch(() => {});

      const pingMs = Math.round(performance.now() - startTime);

      // 2️⃣ [저장 성공 완료 단계 콘솔 출력 - 이중 체크 2단계]
      console.log(
        `%c☁️ [2/2 클라우드 저장 완료!] 핑(응답속도): ${pingMs}ms | 크기: ${payloadSizeKb} KB`,
        'color: #38ef7d; font-weight: bold; background: #0c1a14; padding: 2px 6px; border-radius: 4px; border: 1px solid #38ef7d44;'
      );
      return true;
    } catch (err: any) {
      const pingMs = Math.round(performance.now() - startTime);
      console.error(
        `%c❌ [클라우드 저장 실패!] 응답 소요: ${pingMs}ms | 에러 코드: ${err?.code || 'UNKNOWN'} | 메시지: ${err?.message || err}`,
        'color: #ff5252; font-weight: bold; background: #1a0c0c; padding: 2px 6px; border-radius: 4px; border: 1px solid #ff525244;',
        err
      );
      return false;
    }
  }

  /**
   * 📡 파이어베이스 실시간 핑(Ping) 왕복 레이턴시 단독 측정 함수
   */
  public async measurePing(): Promise<number> {
    const user = await this.ensureUser();
    if (!user) return -1;
    const t0 = performance.now();
    try {
      await set(ref(db, `users/${user.uid}/ping`), Date.now());
      const ping = Math.round(performance.now() - t0);
      console.log(`%c📡 [Firebase 핑 측정] 왕복 레이턴시: ${ping}ms`, 'color: #00d2ff; font-mono;');
      return ping;
    } catch (e) {
      console.warn('⚠️ [Firebase 핑 측정 실패]', e);
      return -1;
    }
  }

  /**
   * 📥 Realtime Database에서 게임 진행 데이터 불러오기 (Cloud Load)
   */
  public async loadProgress(): Promise<Record<string, unknown> | null> {
    const user = await this.ensureUser();
    if (!user) return null;
    const uid = user.uid;
    try {
      const snapshot = await get(child(ref(db), `users/${uid}/progress`));
      if (snapshot.exists()) {
        console.log('[Firebase RTDB] Cloud load successful');
        return snapshot.val() as Record<string, unknown>;
      }
      console.log('[Firebase RTDB] No cloud data found');
      return null;
    } catch (err) {
      console.error('[Firebase RTDB] Cloud load failed:', err);
      throw err;
    }
  }

  /**
   * 🗑️ Realtime Database에서 사용자 진행 데이터 완전 초기화 (Cloud Wipe)
   */
  public async deleteProgress(): Promise<boolean> {
    const user = await this.ensureUser();
    if (!user) return false;
    const uid = user.uid;
    try {
      await set(ref(db, `users/${uid}/progress`), null);
      await set(ref(db, `arena_leaderboard/${uid}`), null);
      console.log('[Firebase RTDB] Cloud progress wiped');
      return true;
    } catch (err) {
      console.error('[Firebase RTDB] Cloud progress delete failed:', err);
      return false;
    }
  }

  /**
   * 🏆 아레나 방어 덱 및 랭킹 데이터 동기화
   * - gateLevel < 1 (앵커 게이트 미건설)인 경우 리더보드/매칭풀에서 즉시 제거
   */
  public async syncArenaLeaderboard(rating: number, rank: number, gateLevel: number = 0, defenseDeck: unknown[] = []): Promise<void> {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    
    // 차원 앵커 게이트가 없으면 아레나 리더보드/매칭풀에 등록되지 않음 (기존 데이터 삭제)
    if (gateLevel < 1) {
      try {
        await set(ref(db, `arena_leaderboard/${uid}`), null);
      } catch (_) {}
      return;
    }

    const nickname = this.cachedProfile?.nickname || '지휘관';
    try {
      // 순환 참조 방지 및 가벼운 덱 정보만 직렬화
      const safeDeck = Array.isArray(defenseDeck) ? defenseDeck.map((h: any) => ({
        id: h?.id || 'hero',
        name: h?.name || '대원',
        classId: h?.classId || 'squire',
        level: h?.level || 1,
        grade: h?.grade || 'rookie',
        stats: h?.stats ? { atk: h.stats.atk || 10, def: h.stats.def || 5, spd: h.stats.spd || 10, crit: h.stats.crit || 5 } : { atk: 10, def: 5, spd: 10, crit: 5 }
      })) : [];

      await set(ref(db, `arena_leaderboard/${uid}`), {
        uid,
        nickname,
        rating: Math.round(rating),
        rank: Math.max(1, Math.round(rank)),
        gateLevel,
        defenseDeck: safeDeck,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn('[Firebase RTDB] Arena leaderboard sync warning:', err);
    }
  }

  /**
   * 🏆 리더보드 조회 (실시간 DB 데이터 + 목업 폴백)
   * - 차원 앵커 게이트를 건설한 유저(gateLevel >= 1)만 표시
   */
  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const lbRef = query(ref(db, 'arena_leaderboard'), orderByChild('rating'), limitToLast(30));
      const snapshot = await get(lbRef);
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, { uid: string; nickname: string; rating: number; rank?: number; gateLevel?: number; defenseDeck?: any[] }>;
        const entries: LeaderboardEntry[] = Object.values(data)
          .filter(entry => entry && (entry.gateLevel ?? 0) >= 1)
          .map((entry, idx) => ({
            rank: idx + 1,
            nickname: entry.nickname,
            rating: entry.rating,
            level: 20 + Math.floor(entry.rating / 100),
            leaderTitle: '심연의 탐색자',
            gateLevel: entry.gateLevel ?? 1,
            isPlayer: this.currentUser ? entry.uid === this.currentUser.uid : false
          }));

        if (entries.length > 0) {
          entries.sort((a, b) => b.rating - a.rating);
          entries.forEach((e, i) => { e.rank = i + 1; });
          return entries;
        }
      }
    } catch (err) {
      console.warn('[Firebase RTDB] getLeaderboard fallback to mock:', err);
    }

    return this.mockLeaderboard;
  }

  /**
   * ⚔️ 아레나 상대 목록 조회 (차원 앵커 게이트 건설 유저만 매칭 + 내 게이트 레벨 기준 정렬 + 부족 시 봇 생성 및 뱃지 부여)
   */
  public async getArenaOpponents(myRating: number = 1200, myRank: number = 20, myGateLevel: number = 1, limit: number = 5): Promise<ArenaOpponent[]> {
    const opponents: ArenaOpponent[] = [];
    const myUid = this.currentUser?.uid;

    try {
      // 1. Firebase arena_leaderboard에서 실제 유저 목록 쿼리 (최대 30명)
      const lbRef = query(ref(db, 'arena_leaderboard'), orderByChild('rating'), limitToLast(30));
      const snapshot = await get(lbRef);

      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, {
          uid: string;
          nickname: string;
          rating: number;
          rank?: number;
          gateLevel?: number;
          defenseDeck?: any[];
          updatedAt?: number;
        }>;

        // 앵커 게이트 미건설 유저(gateLevel < 1) 제외 및 본인 제외
        const realUsers = Object.values(data).filter(u => u && u.uid && u.uid !== myUid && (u.gateLevel ?? 0) >= 1);

        // 내 차원 앵커 게이트 레벨과 가깝고 레이팅이 유사한 순서로 우선 정렬
        realUsers.sort((a, b) => {
          const gateDiffA = Math.abs((a.gateLevel || 1) - myGateLevel);
          const gateDiffB = Math.abs((b.gateLevel || 1) - myGateLevel);
          if (gateDiffA !== gateDiffB) {
            return gateDiffA - gateDiffB;
          }
          return Math.abs(a.rating - myRating) - Math.abs(b.rating - myRating);
        });

        for (const user of realUsers.slice(0, limit)) {
          let deck: Mercenary[] = [];
          if (Array.isArray(user.defenseDeck) && user.defenseDeck.length > 0) {
            deck = user.defenseDeck.map((h: any, idx: number) => {
              const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
              const pos = idx < 2 ? 'front' : idx === 2 ? 'mid' : 'back';
              const lv = h.level || Math.max(1, Math.floor((user.rating || 1000) / 80));
              return {
                id: h.id || `opp_h_${idx}`,
                name: h.name || `${user.nickname}의 ${cls.name}`,
                title: cls.name,
                classId: h.classId || 'squire',
                grade: h.grade || 'veteran',
                level: lv,
                exp: 0,
                expToNext: 100,
                currentHp: (h.stats?.hp || cls.baseStats.hp) * 2,
                maxHp: (h.stats?.hp || cls.baseStats.hp) * 2,
                currentMp: cls.baseStats.mp,
                maxMp: cls.baseStats.mp,
                position: pos,
                stats: {
                  atk: h.stats?.atk || cls.baseStats.atk,
                  def: h.stats?.def || cls.baseStats.def,
                  spd: h.stats?.spd || cls.baseStats.spd,
                  luck: h.stats?.luck || cls.baseStats.luck,
                },
                equippedSkills: cls.skills.map(s => s.id),
                learnedSkills: cls.skills.map(s => s.id),
                equipment: {},
                statusEffects: [],
                portraitPromptKey: cls.promptKey,
              } as Mercenary;
            });
          }

          // 덱에 최소 5명이 없으면 기본 클래스로 보충
          if (deck.length < 5) {
            const defaultClasses = ['paladin', 'valhalla_blade', 'high_saintess', 'tactical_gunner', 'elementalist'];
            while (deck.length < 5) {
              const clsId = defaultClasses[deck.length % defaultClasses.length];
              const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
              const idx = deck.length;
              const pos = idx < 2 ? 'front' : idx === 2 ? 'mid' : 'back';
              deck.push({
                id: `opp_h_fill_${idx}`,
                name: `${user.nickname}의 ${cls.name}`,
                title: cls.name,
                classId: clsId,
                grade: 'veteran',
                level: Math.max(1, Math.floor((user.rating || 1000) / 80)),
                exp: 0,
                expToNext: 100,
                currentHp: cls.baseStats.hp * 2,
                maxHp: cls.baseStats.hp * 2,
                currentMp: cls.baseStats.mp,
                maxMp: cls.baseStats.mp,
                position: pos,
                stats: { ...cls.baseStats },
                equippedSkills: cls.skills.map(s => s.id),
                learnedSkills: cls.skills.map(s => s.id),
                equipment: {},
                statusEffects: [],
                portraitPromptKey: cls.promptKey,
              } as Mercenary);
            }
          }

          opponents.push({
            id: `real_${user.uid}`,
            name: user.nickname || '방주 지휘관',
            rank: user.rank || Math.max(1, myRank - 2 + opponents.length),
            rating: user.rating || myRating,
            defenseDeck: deck,
            guild: '심연 개척 원정대',
            gateLevel: user.gateLevel || 1,
            isBot: false, // 🌐 실제 유저!
          });
        }
      }
    } catch (err) {
      console.warn('[Firebase RTDB] getArenaOpponents error, falling back:', err);
    }

    // 2. 실제 유저가 부족할 경우 봇 아키타입으로 보충
    const botArchetypes = [
      { name: '철혈의 바사라', guild: '붉은 창끝 길드', classes: ['paladin', 'guardian', 'high_saintess', 'tactical_gunner', 'elementalist'] },
      { name: '심연의 루나', guild: '심연 탐험단', classes: ['assassin', 'shadow_phantom', 'calamity_mage', 'berserker', 'war_priest'] },
      { name: '폭풍의 제라드', guild: '황금 독수리단', classes: ['vanguard', 'berserker', 'valhalla_blade', 'sharpshooter', 'bishop'] },
      { name: '황금의 아라나', guild: '달빛 기사단', classes: ['aegis_valkyrie', 'elementalist', 'high_saintess', 'arcane_scholar', 'paladin'] },
      { name: '어둠의 클레오', guild: '무명의 소굴', classes: ['tactical_gunner', 'arcane_scholar', 'bishop', 'duelist', 'guardian'] },
      { name: '성전의 카시안', guild: '은빛 여명회', classes: ['paladin', 'valhalla_blade', 'war_priest', 'aegis_valkyrie', 'sharpshooter'] },
      { name: '흑염의 모건', guild: '재의 방주단', classes: ['calamity_mage', 'elementalist', 'berserker', 'assassin', 'shadow_phantom'] },
    ];

    let botIdx = 0;
    while (opponents.length < limit) {
      const cfg = botArchetypes[botIdx % botArchetypes.length];
      const i = opponents.length;
      const oppRank = Math.max(1, myRank - 4 + i * 2);
      const oppRating = Math.max(900, myRating - 120 + i * 60 + Math.floor(Math.random() * 40));
      const botGateLevel = Math.max(1, Math.min(10, myGateLevel + (i % 3 === 0 ? 0 : i % 3 === 1 ? (myGateLevel < 10 ? 1 : -1) : (myGateLevel > 1 ? -1 : 1))));

      const mockDeck: Mercenary[] = cfg.classes.map((clsId, idx) => {
        const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
        const pos = idx < 2 ? 'front' : idx === 2 ? 'mid' : 'back';
        return {
          id: `bot_hero_${i}_${idx}`,
          name: `${cfg.name}의 ${cls.name}`,
          title: cls.name,
          classId: clsId,
          grade: 'veteran',
          level: Math.max(1, Math.floor(oppRating / 80)),
          exp: 0,
          expToNext: 100,
          currentHp: cls.baseStats.hp * 2,
          maxHp: cls.baseStats.hp * 2,
          currentMp: cls.baseStats.mp,
          maxMp: cls.baseStats.mp,
          position: pos,
          stats: { ...cls.baseStats },
          equippedSkills: cls.skills.map(s => s.id),
          learnedSkills: cls.skills.map(s => s.id),
          equipment: {},
          statusEffects: [],
          portraitPromptKey: cls.promptKey,
        };
      });

      opponents.push({
        id: `bot_${botIdx}_${Date.now()}`,
        name: cfg.name,
        rank: oppRank,
        rating: oppRating,
        defenseDeck: mockDeck,
        guild: cfg.guild,
        gateLevel: botGateLevel,
        isBot: true, // 🤖 봇!
      });

      botIdx++;
    }

    return opponents;
  }

  /**
   * 🌌 월드 보스: 네메시스 실시간 동기화 리스너 등록
   * 모든 지휘관이 공유하는 네메시스 전체 체력, 부위별 체력, 6시간 요격 윈도우 정보를 실시간 수신
   */
  public subscribeNemesisWorldBoss(callback: (bossData: WorldBossNemesisData) => void): Unsubscribe {
    const bossRef = ref(db, 'world_boss/nemesis');
    return onValue(bossRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as WorldBossNemesisData);
      } else {
        // 데이터가 아직 없으면 최초 기본값으로 초기화
        this.initNemesisWorldBoss().then((initialData) => {
          if (initialData) callback(initialData);
        }).catch(() => {});
      }
    }, (err) => {
      console.warn('[Firebase RTDB] Nemesis world boss listen error:', err);
    });
  }

  /**
   * 🌌 월드 보스: 네메시스 데이터 초기 생성 또는 조회
   */
  public async initNemesisWorldBoss(): Promise<WorldBossNemesisData> {
    const bossRef = ref(db, 'world_boss/nemesis');
    const now = Date.now();
    const d = new Date(now);
    const daysSinceWed = (d.getDay() + 7 - 3) % 7;
    const wedTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceWed, 0, 0, 0, 0).getTime();

    try {
      const snapshot = await get(bossRef);
      if (snapshot.exists()) {
        const val = snapshot.val() as WorldBossNemesisData;
        if (!val.cycleStartTime || val.cycleStartTime < wedTimestamp) {
          const restored = await this.restoreNemesisWorldBossHp();
          if (restored) return restored;
        }
        return val;
      }
    } catch (_) {}

    const headCfg = NEMESIS_BOSS_CONFIG.parts.head;
    const bodyCfg = NEMESIS_BOSS_CONFIG.parts.body;
    const tailCfg = NEMESIS_BOSS_CONFIG.parts.tail;
    const totalMaxHp = NEMESIS_BOSS_CONFIG.maxHp;

    const initialData: WorldBossNemesisData = {
      currentBossHp: totalMaxHp,
      maxBossHp: totalMaxHp,
      parts: {
        head: { id: 'head', name: headCfg.name, position: 'front', currentHp: headCfg.maxHp, maxHp: headCfg.maxHp, isDefeated: false },
        body: { id: 'body', name: bodyCfg.name, position: 'mid', currentHp: bodyCfg.maxHp, maxHp: bodyCfg.maxHp, isDefeated: false },
        tail: { id: 'tail', name: tailCfg.name, position: 'back', currentHp: tailCfg.maxHp, maxHp: tailCfg.maxHp, isDefeated: false }
      },
      phase: 1,
      cycleStartTime: wedTimestamp,
      lastPlunderCheckTime: now,
      windowStartHp: totalMaxHp,
      isDefeated: false,
      updatedAt: now,
      lastAttackerNickname: '성채 수호대'
    };

    try {
      await set(bossRef, initialData);
    } catch (e) {
      console.warn('[Firebase RTDB] Init Nemesis World Boss failed:', e);
    }
    return initialData;
  }

  /**
   * 🌌 월드 보스: 토벌 피해량 원자적(Atomic) 반영 (모든 지휘관 공유)
   */
  public async recordNemesisWorldBossDamage(
    totalDmg: number,
    partDamages: { head?: number; body?: number; tail?: number } = {},
    attackerNickname: string = '지휘관'
  ): Promise<WorldBossNemesisData | null> {
    const bossRef = ref(db, 'world_boss/nemesis');

    try {
      const result = await runTransaction(bossRef, (currentData: WorldBossNemesisData | null) => {
        const now = Date.now();
        const headCfg = NEMESIS_BOSS_CONFIG.parts.head;
        const bodyCfg = NEMESIS_BOSS_CONFIG.parts.body;
        const tailCfg = NEMESIS_BOSS_CONFIG.parts.tail;
        const totalMaxHp = NEMESIS_BOSS_CONFIG.maxHp;

        if (!currentData) {
          currentData = {
            currentBossHp: totalMaxHp,
            maxBossHp: totalMaxHp,
            parts: {
              head: { id: 'head', name: headCfg.name, position: 'front', currentHp: headCfg.maxHp, maxHp: headCfg.maxHp, isDefeated: false },
              body: { id: 'body', name: bodyCfg.name, position: 'mid', currentHp: bodyCfg.maxHp, maxHp: bodyCfg.maxHp, isDefeated: false },
              tail: { id: 'tail', name: tailCfg.name, position: 'back', currentHp: tailCfg.maxHp, maxHp: tailCfg.maxHp, isDefeated: false }
            },
            phase: 1,
            cycleStartTime: now,
            lastPlunderCheckTime: now,
            windowStartHp: totalMaxHp,
            isDefeated: false,
            updatedAt: now,
            lastAttackerNickname: attackerNickname
          };
        }

        // 🌌 매주 수요일 설정된 최대 체력으로 정기 초기화
        const d = new Date(now);
        const daysSinceWed = (d.getDay() + 7 - 3) % 7;
        const wedTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceWed, 0, 0, 0, 0).getTime();

        if (!currentData.cycleStartTime || currentData.cycleStartTime < wedTimestamp) {
          currentData.cycleStartTime = wedTimestamp;
          currentData.parts = {
            head: { id: 'head', name: headCfg.name, position: 'front', currentHp: headCfg.maxHp, maxHp: headCfg.maxHp, isDefeated: false },
            body: { id: 'body', name: bodyCfg.name, position: 'mid', currentHp: bodyCfg.maxHp, maxHp: bodyCfg.maxHp, isDefeated: false },
            tail: { id: 'tail', name: tailCfg.name, position: 'back', currentHp: tailCfg.maxHp, maxHp: tailCfg.maxHp, isDefeated: false }
          };
          currentData.maxBossHp = totalMaxHp;
          currentData.currentBossHp = totalMaxHp;
          currentData.windowStartHp = totalMaxHp;
          currentData.phase = 1;
          currentData.isDefeated = false;
          currentData.defeatedTime = undefined;
        }

        // 6시간 주기 만료 검사 ➔ 요격 윈도우 갱신
        const lastPlunder = currentData.lastPlunderCheckTime || currentData.cycleStartTime || now;
        if (now - lastPlunder >= NEMESIS_CYCLE_CONSTANTS.PLUNDER_INTERVAL_MS) {
          const intervals = Math.floor((now - lastPlunder) / NEMESIS_CYCLE_CONSTANTS.PLUNDER_INTERVAL_MS);
          currentData.lastPlunderCheckTime = lastPlunder + intervals * NEMESIS_CYCLE_CONSTANTS.PLUNDER_INTERVAL_MS;
          currentData.windowStartHp = currentData.currentBossHp;
        }

        // 피해 적용 (부위별 및 전체 체력)
        if (currentData.parts) {
          (['head', 'body', 'tail'] as const).forEach(k => {
            const part = currentData!.parts[k];
            const pDmg = partDamages[k] || 0;
            if (part && pDmg > 0) {
              part.currentHp = Math.max(0, (part.currentHp || 0) - pDmg);
              if (part.currentHp <= 0) {
                part.isDefeated = true;
                part.currentHp = 0;
              }
            }
          });
          currentData.currentBossHp = Object.values(currentData.parts).reduce(
            (sum, p) => sum + (p.isDefeated ? 0 : Math.max(0, p.currentHp)),
            0
          );
        } else {
          currentData.currentBossHp = Math.max(0, (currentData.currentBossHp || totalMaxHp) - totalDmg);
        }

        // 페이즈 전환 검사
        const hpRatio = currentData.currentBossHp / (currentData.maxBossHp || totalMaxHp);
        if (hpRatio <= 0.3) currentData.phase = 3;
        else if (hpRatio <= 0.7) currentData.phase = 2;
        else currentData.phase = 1;

        if (currentData.currentBossHp <= 0) {
          currentData.isDefeated = true;
          currentData.defeatedTime = now;
        }

        currentData.updatedAt = now;
        currentData.lastAttackerNickname = attackerNickname;
        return currentData;
      });

      if (result.committed && result.snapshot.exists()) {
        return result.snapshot.val() as WorldBossNemesisData;
      }
      return null;
    } catch (err) {
      console.warn('[Firebase RTDB] Record Nemesis World Boss damage failed:', err);
      return null;
    }
  }

  /**
   * 🌌 월드 보스: 네메시스 체력 100% 완전 복구 (실시간 DB 동기화)
   */
  public async restoreNemesisWorldBossHp(): Promise<WorldBossNemesisData | null> {
    const bossRef = ref(db, 'world_boss/nemesis');
    try {
      const result = await runTransaction(bossRef, (currentData: WorldBossNemesisData | null) => {
        const now = Date.now();
        const headCfg = NEMESIS_BOSS_CONFIG.parts.head;
        const bodyCfg = NEMESIS_BOSS_CONFIG.parts.body;
        const tailCfg = NEMESIS_BOSS_CONFIG.parts.tail;
        const totalMaxHp = NEMESIS_BOSS_CONFIG.maxHp;

        return {
          currentBossHp: totalMaxHp,
          maxBossHp: totalMaxHp,
          parts: {
            head: { id: 'head', name: headCfg.name, position: 'front', currentHp: headCfg.maxHp, maxHp: headCfg.maxHp, isDefeated: false },
            body: { id: 'body', name: bodyCfg.name, position: 'mid', currentHp: bodyCfg.maxHp, maxHp: bodyCfg.maxHp, isDefeated: false },
            tail: { id: 'tail', name: tailCfg.name, position: 'back', currentHp: tailCfg.maxHp, maxHp: tailCfg.maxHp, isDefeated: false }
          },
          phase: 1,
          cycleStartTime: currentData?.cycleStartTime || now,
          lastPlunderCheckTime: now,
          windowStartHp: totalMaxHp,
          isDefeated: false,
          updatedAt: now,
          lastAttackerNickname: '성채 수호대'
        };
      });

      if (result.committed && result.snapshot.exists()) {
        return result.snapshot.val() as WorldBossNemesisData;
      }
      return null;
    } catch (err) {
      console.warn('[Firebase RTDB] Restore Nemesis World Boss HP failed:', err);
      return null;
    }
  }
}

export interface WorldBossNemesisData {
  currentBossHp: number;
  maxBossHp: number;
  parts: {
    head: { id: 'head'; name: string; position: 'front'; currentHp: number; maxHp: number; isDefeated: boolean };
    body: { id: 'body'; name: string; position: 'mid'; currentHp: number; maxHp: number; isDefeated: boolean };
    tail: { id: 'tail'; name: string; position: 'back'; currentHp: number; maxHp: number; isDefeated: boolean };
  };
  phase: number;
  cycleStartTime: number;
  lastPlunderCheckTime: number;
  windowStartHp: number;
  isDefeated: boolean;
  defeatedTime?: number;
  updatedAt: number;
  lastAttackerNickname?: string;
  totalDamageDealt?: number;
}
