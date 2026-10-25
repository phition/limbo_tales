/**
 * ═════════════════════════════════════════════════════════════════════════
 *  🎵 SoundManager: 웅장하고 강렬한 사운드 & 심포닉 BGM 엔진
 * ═════════════════════════════════════════════════════════════════════════
 *  - 웅장한 전쟁 북(War Drums), 드라이빙 서브 베이스, 고딕 스트링/브라스 화성 진행의
 *    실시간 다중 트랙 절차적 심포닉 BGM 엔진 내장
 *  - 타격감 극대화: 서브 드롭, 고주파 메탈릭 링, 왜곡 오버드라이브, 크리스탈 파편 사운드
 *  - 외부 오디오 파일(MP3/OGG/WAV) 자동 스트리밍 및 크로스페이드 하이브리드 지원
 *  - 브라우저 오디오 정책 완벽 대응 및 설정 자동 영속화
 */

import { CustomAssetService } from '../services/CustomAssetService';
import { triggerHaptic } from '../utils/haptics';
import { resolveCombatVfxAndSfx } from '../utils/skillComboUtils';

export type SoundEffectType =
  // ⚔️ 물리 타격계
  | 'slash'           // 검격 / 날카로운 도검 베기
  | 'crush'           // 둔기 / 해머 / 방패 강타 분쇄
  | 'pierce'          // 창 / 자창 / 날카로운 찌르기 관통
  | 'bow_shot'        // 활 / 석궁 사격 및 화살 풍절음
  | 'gunshot'         // 마도총 / 화포 격발 굉음
  | 'heavy_hit'       // 묵직한 타격 / 둔기 / 쇄골 강타
  | 'crit'            // 치명타 폭발 / 서브 드롭 쇼크웨이브
  // 🪄 마법 및 원소계
  | 'spell'           // 비전 마법 공격 / 에너지 방출 (기본)
  | 'arcane_magic'    // 순수 비전 / 에테르 마나 탄환
  | 'holy_spell'      // 성스러운 빛 / 신성 심판 / 성광
  | 'dark_magic'      // 암흑 / 심연 저주 / 흑마법
  | 'fire'            // 화염 폭발 / 작열 연소
  | 'ice'             // 빙결 / 혹한의 크리스탈 파쇄
  | 'lightning'       // 뇌격 / 고압 전격 폭음
  | 'wind_storm'      // 폭풍 / 돌풍 / 질풍 칼바람
  | 'poison'          // 맹독 분무 / 산성액 부식
  // 🛡️ 지원 및 상태이상
  | 'shield_break'    // 방패 / 방어구 파쇄 파편음
  | 'heal'            // 성스러운 치유 / 솔페지오 528Hz 하모니
  | 'shield'          // 철벽 방벽 / 마도 보호막 전개
  | 'debuff'          // 디버프 / 심연의 저주
  | 'stun'            // 뇌진탕 / 기절
  | 'drain'           // 흡혈 / 에테르 착취
  | 'bleed'           // 출혈 / 열상
  | 'evade'           // 회피 / 바람을 가르는 날렵한 회피 풍절음 (Dodge Whoosh)
  | 'combat_start'    // 전투 개시 / 조우 돌입 효과음
  // 👾 피격 및 전투 흐름
  | 'monster_hit'     // 몬스터 피격 / 갑각 파쇄
  | 'hero_hurt'       // 아군 피격
  | 'monster_death'   // 몬스터 처치 / 공허 붕괴
  | 'victory'         // 전투 승리 / 웅장한 금관 팡파르
  | 'defeat'          // 전투 패배 / 파멸의 징
  // 🏰 영지 및 시스템
  | 'click'           // UI 탭 / 버튼 클릭
  | 'button_click'    // UI 버튼 클릭 별칭
  | 'equip'           // 장비 장착 / 금속 체결
  | 'anvil'           // 대장간 모루 단조
  | 'forge_success'   // 강화 대성공 팡파르
  | 'forge_fail'      // 강화 실패 파편음
  | 'coin'            // 골드 / 보물 획득
  | 'level_up'        // 레벨업 심포니
  | 'camp_fire'       // 모닥불 휴식 / 힐링 엠비언트
  | 'torch_light'     // 횃불 점등
  | 'loot_open'       // 보물 상자 개방
  | 'reward'          // 보상 획득 효과음
  | 'quest_complete'  // 퀘스트 완료
  | 'charge'          // 마력 차징 / 기 모으기 / 주문 영창 음
  | 'craft'           // 연금술 / 마도서 제작 연성 완료
  | 'portal'          // 귀환 포탈 활성화 및 이동
  | 'item_upgrade'    // 아이템 강화 별칭
  | 'enhance'         // 장비 / 스킬 마도 강화 공명 음
  | 'fever_burst'     // FEVER 게이지 완충 및 궁극기 전술 폭발
  | 'fever_badge'     // 전술 모멘텀 뱃지 획득 및 슬롯 적립 음
  | 'boss_skill'      // 보스 전용 강력 광역 스킬 격발 음
  | 'build';          // 건물 건설 / 증축 완료 음

export type BgmTrack = 'citadel' | 'dungeon' | 'battle' | 'boss' | 'none';

export class SoundManager {
  private static instance: SoundManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private sfxVolume = 0.85;
  private bgmVolume = 0.50;
  private sfxMuted = false;
  private bgmMuted = false;

  private currentBgmTrack: BgmTrack = 'none';
  private pendingBgmTrack: BgmTrack = 'none';
  private bgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmTimers: number[] = [];
  private activeAudios: Set<HTMLAudioElement> = new Set();
  private audioGainMap: Map<HTMLAudioElement, number> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private readonly BGM_LOOP_ADVANCE_SEC = 0.5; // 루프 끝 지점을 0.5초 당김
  private readonly BGM_CROSSFADE_SEC = 0.5;    // 부드러운 교차 페이드 시간 (0.5초)
  private bgmPlaySessionId = 0;
  private isUnlocked = false;
  private isPausedForBackground = false;
  private customAudioMap: Map<string, HTMLAudioElement> = new Map();
  private bgmChangeListeners: Set<(muted: boolean, volume: number) => void> = new Set();

  private constructor() {
    this.loadSettings();
    this.setupUnlockListeners();
    this.setupBackgroundListeners();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /** 브라우저 오디오 정책에 맞춘 첫 제스처 언락 등록 */
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.isUnlocked = true;

      // 4대 제스처 이벤트 리스너를 한 번에 일괄 해제 (중복 실행 방지)
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);

      if (this.ctx && this.ctx.state === 'closed') {
        this.ctx = null;
        this.initContext();
      } else if (this.ctx && this.ctx.state === 'suspended') {
        try {
          const p = this.ctx.resume();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } catch (_) {}
      } else if (!this.ctx) {
        this.initContext();
      }

      // 대기 중인 트랙이 있거나 현재 재생 중인 음악이 없다면 1회만 재생
      if (this.pendingBgmTrack !== 'none') {
        const track = this.pendingBgmTrack;
        this.pendingBgmTrack = 'none';
        this.playBgm(track);
      } else if (this.currentBgmTrack !== 'none' && !this.currentAudio && this.bgmOscillators.length === 0) {
        const track = this.currentBgmTrack;
        this.currentBgmTrack = 'none';
        this.playBgm(track);
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /** 모바일 백그라운드 전환 및 탭 비활성화 시 자동 BGM 정지/재개 리스너 등록 */
  private setupBackgroundListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        this.pauseBgm();
      } else if (document.visibilityState === 'visible') {
        this.resumeBgm();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => this.pauseBgm());
    window.addEventListener('pageshow', () => this.resumeBgm());

    // 🎨 에셋 스튜디오에서 BGM이나 오디오 모드가 변경되었을 때 즉시 새 오디오로 갱신 재생
    CustomAssetService.getInstance().on('changed', () => {
      if (this.currentBgmTrack && !this.bgmMuted && this.isUnlocked) {
        this.playBgm(this.currentBgmTrack);
      }
    });
  }

  private initContext(): void {
    if (this.ctx && this.ctx.state !== 'closed') return;
    this.ctx = null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      try {
        this.ctx = new AudioCtx();

        // 🎛️ 마스터 다이내믹 컴프레서 (웅장한 사운드 시 왜곡 방지 및 펀치력 강화)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();

        this.sfxGain.connect(this.compressor);
        this.bgmGain.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateGains();
      } catch (_) {}
    }
  }

  /** AudioContext 초기화 및 브라우저 오디오 안전 검사 */
  private ensureContext(): AudioContext | null {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
      try {
        const p = this.ctx.resume();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (_) {}
    }
    return this.ctx;
  }

  /** 볼륨 노드 갱신 */
  private updateGains(): void {
    if (!this.ctx || !this.sfxGain || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, now);
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : this.bgmVolume, now);
    this.activeAudios.forEach(audio => {
      const mult = this.audioGainMap.get(audio) ?? 1.0;
      audio.volume = Math.max(0, Math.min(1, (this.bgmMuted ? 0 : this.bgmVolume) * mult));
    });
  }

  /** 설정 로컬 스토리지 로드 */
  private loadSettings(): void {
    try {
      const s = localStorage.getItem('limbo_sound_settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.sfxVolume !== undefined) this.sfxVolume = parsed.sfxVolume;
        if (parsed.bgmVolume !== undefined) this.bgmVolume = parsed.bgmVolume;
        if (parsed.sfxMuted !== undefined)  this.sfxMuted  = parsed.sfxMuted;
        if (parsed.bgmMuted !== undefined)  this.bgmMuted  = parsed.bgmMuted;
      }
    } catch (_) {}
  }

  /** 설정 저장 */
  private saveSettings(): void {
    try {
      localStorage.setItem('limbo_sound_settings', JSON.stringify({
        sfxVolume: this.sfxVolume,
        bgmVolume: this.bgmVolume,
        sfxMuted: this.sfxMuted,
        bgmMuted: this.bgmMuted,
      }));
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────────────────
  //  🔊 볼륨 및 음소거 제어 API
  // ─────────────────────────────────────────────────────────────

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.updateGains();
    this.saveSettings();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setBgmVolume(val: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    this.updateGains();
    this.saveSettings();
    this.notifyBgmChange();
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted;
    this.updateGains();
    this.saveSettings();
    return this.sfxMuted;
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public toggleBgmMute(): boolean {
    this.bgmMuted = !this.bgmMuted;
    this.updateGains();
    this.saveSettings();
    this.notifyBgmChange();
    return this.bgmMuted;
  }

  public isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  /** BGM 볼륨 또는 음소거 상태 변경 실시간 구독 리스너 등록 */
  public addBgmChangeListener(listener: (muted: boolean, volume: number) => void): () => void {
    this.bgmChangeListeners.add(listener);
    // 등록 즉시 현재 상태 1회 호출
    try {
      listener(this.bgmMuted, this.bgmVolume);
    } catch (e) {
      console.error('[SoundManager] Initial call error in addBgmChangeListener:', e);
    }
    return () => {
      this.bgmChangeListeners.delete(listener);
    };
  }

  private notifyBgmChange(): void {
    this.bgmChangeListeners.forEach(listener => {
      try {
        listener(this.bgmMuted, this.bgmVolume);
      } catch (e) {
        console.error('[SoundManager] Error in bgmChangeListener:', e);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  ⚔️ 효과음 재생 (타격감 & 웅장함 대폭 강화 신디사이저)
  // ─────────────────────────────────────────────────────────────

  public playSfx(type: string): void {
    if (type === 'ui_click' || type === 'button_click') {
      this.play('click');
    } else {
      this.play(type as SoundEffectType);
    }
  }

  public play(type: SoundEffectType): void {
    if (type === 'crit') {
      triggerHaptic('critical');
    } else if (type === 'defeat') {
      triggerHaptic('defeat');
    }

    if (this.sfxMuted || this.isPausedForBackground) return;

    // 🎵 커스텀 오디오 파일(MP3/WAV/DataURI/OGG) 오버라이드 확인
    const customSfxUrl = CustomAssetService.getInstance().getSfxOverride(type);
    if (customSfxUrl) {
      try {
        let audio = this.customAudioMap.get(type);
        if (!audio || audio.src !== customSfxUrl) {
          audio = new Audio(customSfxUrl);
          this.customAudioMap.set(type, audio);
        }
        audio.volume = this.sfxMuted ? 0 : this.sfxVolume;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            // 빠른 연타나 오디오 리셋에 의한 AbortError는 새 재생이 일어난 것이므로 합성음 fallback 중복 차단
            if (err && (err.name === 'AbortError' || err.code === 20)) return;
            this.playSynth(type);
          });
        }
        return;
      } catch (_) {
        this.playSynth(type);
        return;
      }
    }

    this.playSynth(type);
  }

  public playSynth(type: SoundEffectType): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      switch (type) {
        case 'slash':
          this.synthSlash(ctx);
          break;
        case 'heavy_hit':
        case 'combat_start':
          this.synthHeavyHit(ctx);
          break;
        case 'crit':
          this.synthCrit(ctx);
          break;
        case 'spell':
          this.synthSpell(ctx);
          break;
        case 'fire':
          this.synthFire(ctx);
          break;
        case 'ice':
          this.synthIce(ctx);
          break;
        case 'lightning':
          this.synthLightning(ctx);
          break;
        case 'heal':
          this.synthHeal(ctx);
          break;
        case 'shield':
          this.synthShield(ctx);
          break;
        case 'debuff':
          this.synthDebuff(ctx);
          break;
        case 'stun':
          this.synthStun(ctx);
          break;
        case 'drain':
          this.synthDrain(ctx);
          break;
        case 'bleed':
          this.synthBleed(ctx);
          break;
        case 'monster_hit':
          this.synthMonsterHit(ctx);
          break;
        case 'hero_hurt':
          this.synthHeroHurt(ctx);
          break;
        case 'monster_death':
          this.synthMonsterDeath(ctx);
          break;
        case 'victory':
        case 'reward':
          this.synthVictory(ctx);
          break;
        case 'defeat':
          this.synthDefeat(ctx);
          break;
        case 'click':
        case 'button_click':
          this.synthClick(ctx);
          break;
        case 'equip':
          this.synthEquip(ctx);
          break;
        case 'anvil':
          this.synthAnvil(ctx);
          break;
        case 'forge_success':
          this.synthForgeSuccess(ctx);
          break;
        case 'forge_fail':
          this.synthForgeFail(ctx);
          break;
        case 'coin':
          this.synthCoin(ctx);
          break;
        case 'level_up':
          this.synthLevelUp(ctx);
          break;
        case 'camp_fire':
          this.synthCampFire(ctx);
          break;
        case 'torch_light':
          this.synthTorchLight(ctx);
          break;
        case 'loot_open':
          this.synthLootOpen(ctx);
          break;
        case 'quest_complete':
          this.synthQuestComplete(ctx);
          break;
        case 'charge':
          this.synthCharge(ctx);
          break;
        case 'fever_burst':
          this.synthFeverBurst(ctx);
          break;
        case 'fever_badge':
          this.synthFeverBadge(ctx);
          break;
        case 'craft':
          this.synthCraft(ctx);
          break;
        case 'enhance':
          this.synthEnhance(ctx);
          break;
        case 'crush':
          this.synthCrush(ctx);
          break;
        case 'pierce':
          this.synthPierce(ctx);
          break;
        case 'bow_shot':
          this.synthBowShot(ctx);
          break;
        case 'gunshot':
          this.synthGunshot(ctx);
          break;
        case 'arcane_magic':
          this.synthArcaneMagic(ctx);
          break;
        case 'holy_spell':
          this.synthHolySpell(ctx);
          break;
        case 'dark_magic':
          this.synthDarkMagic(ctx);
          break;
        case 'wind_storm':
          this.synthWindStorm(ctx);
          break;
        case 'shield_break':
          this.synthShieldBreak(ctx);
          break;
        case 'poison':
          this.synthPoison(ctx);
          break;
        case 'evade':
          this.synthEvade(ctx);
          break;
        case 'boss_skill':
          this.synthSpell(ctx);
          break;
        case 'build':
          this.synthAnvil(ctx);
          break;
        default:
          this.synthClick(ctx);
      }
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────────────────
  //  🎵 강렬한 전투 및 효과음 합성 엔진
  // ─────────────────────────────────────────────────────────────

  /** 1. 검격 (날카로운 금속성 칼날 가르기 + 풍절음) */
  private synthSlash(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // 1) 고주파 금속 마찰 노이즈
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.18);
    filter.Q.setValueAtTime(5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);

    // 2) 묵직한 칼날 궤적 음 (톱니파 피치 드롭)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /** 2. 묵직한 둔기 강타 (40Hz 서브 킥 + 디스토션 크런치) */
  private synthHeavyHit(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 서브 베이스 펀치 (150Hz -> 38Hz)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.25);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.28);

    // 2) 둔탁한 타격 왜곡 노이즈
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.8, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain!);
    noise.start(now);
  }

  /** 3. 치명타 폭발 (서브 드롭 쇼크웨이브 + 고주파 크리스탈 공명 + 메탈 크랙) */
  private synthCrit(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 서브 드롭 폭발
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(260, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain!);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // 2) 묵직한 메탈릭 임팩트 크런치 톤
    const ringOsc = ctx.createOscillator();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(520, now);
    ringOsc.frequency.exponentialRampToValueAtTime(140, now + 0.3);

    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.25, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    ringOsc.connect(ringGain);
    ringGain.connect(this.sfxGain!);
    ringOsc.start(now);
    ringOsc.stop(now + 0.3);

    // 3) 파열음 노이즈
    this.synthSlash(ctx);
  }

  /** 4. 비전 마법 공격 */
  private synthSpell(ctx: AudioContext): void {
    const freqs = [350, 523.25, 784, 1046.5];
    freqs.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.035;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  /** 5. 화염 폭발 (작열하는 저음 연소 + 화염 방출) */
  private synthFire(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);

    const boom = ctx.createOscillator();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(110, now);
    boom.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    const bGain = ctx.createGain();
    bGain.gain.setValueAtTime(0.7, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    boom.connect(bGain);
    bGain.connect(this.sfxGain!);
    boom.start(now);
    boom.stop(now + 0.35);
  }

  /** 6. 빙결 서리 파편 (고주파 얼음 분쇄) */
  private synthIce(ctx: AudioContext): void {
    const notes = [2400, 3150, 4200];
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.025;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  /** 7. 번개 전격 폭발 */
  private synthLightning(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // 1) 고압 스파크
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3600, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);

    // 2) 벼락 천둥 우르릉
    const thunder = ctx.createOscillator();
    thunder.type = 'sawtooth';
    thunder.frequency.setValueAtTime(140, now);
    thunder.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    const tGain = ctx.createGain();
    tGain.gain.setValueAtTime(0.85, now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    thunder.connect(tGain);
    tGain.connect(this.sfxGain!);
    thunder.start(now);
    thunder.stop(now + 0.5);
  }

  /** 8. 성스러운 치유 (528Hz 솔페지오 하모닉 화음 + 상승 아르페지오) */
  private synthHeal(ctx: AudioContext): void {
    const chord = [528, 659.25, 792, 1056];
    chord.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  /** 9. 강철 방벽 / 결계 전개 */
  private synthShield(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** 10. 디버프 / 심연의 저주 */
  private synthDebuff(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** 11. 기절 / 스턴 */
  private synthStun(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.08);
    osc.frequency.setValueAtTime(400, now + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** 12. 흡혈 / 에테르 착취 */
  private synthDrain(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.28);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** 13. 출혈 / 열상 */
  private synthBleed(ctx: AudioContext): void {
    this.synthSlash(ctx);
  }

  /** 14. 몬스터 피격 */
  private synthMonsterHit(ctx: AudioContext): void {
    this.synthHeavyHit(ctx);
  }

  /** 15. 아군 피격 */
  private synthHeroHurt(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** 16. 몬스터 처치 / 공허 붕괴 */
  private synthMonsterDeath(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /** 17. 전투 승리 팡파르 (C -> G -> Am -> F -> G -> C 메이저 브라스 화음 진행) */
  private synthVictory(ctx: AudioContext): void {
    const notes = [
      { f: [261.63, 329.63, 392.00], d: 0.20 }, // C Maj
      { f: [293.66, 369.99, 440.00], d: 0.20 }, // D Maj
      { f: [329.63, 415.30, 493.88], d: 0.20 }, // E Maj
      { f: [523.25, 659.25, 783.99], d: 0.65 }, // High C Maj
    ];
    let offset = 0;
    notes.forEach(({ f, d }) => {
      const now = ctx.currentTime + offset;
      f.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + d);
      });
      offset += d * 0.85;
    });
  }

  /** 18. 전투 패배 (비극적인 파멸의 징 및 하강음) */
  private synthDefeat(ctx: AudioContext): void {
    const chord = [110, 155.56, 220]; // 트라이톤 불협화음
    const now = ctx.currentTime;
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 1.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  /** 19. UI 클릭 */
  private synthClick(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** 20. 장비 장착 */
  private synthEquip(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** 21. 대장간 모루 단조 */
  private synthAnvil(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const freqs = [1850, 3700];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.3);
    });
    this.synthHeavyHit(ctx);
  }

  /** 22. 강화 성공 */
  private synthForgeSuccess(ctx: AudioContext): void {
    this.synthAnvil(ctx);
    setTimeout(() => {
      const c = this.ensureContext();
      if (c) this.synthVictory(c);
    }, 180);
  }

  /** 23. 강화 실패 */
  private synthForgeFail(ctx: AudioContext): void {
    this.synthAnvil(ctx);
    setTimeout(() => {
      const c = this.ensureContext();
      if (c) this.synthDefeat(c);
    }, 180);
  }

  /** 24. 골드 코인 획득 */
  private synthCoin(ctx: AudioContext): void {
    const pitches = [987.77, 1318.51];
    pitches.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  /** 25. 레벨업 심포니 */
  private synthLevelUp(ctx: AudioContext): void {
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /** 26. 모닥불 휴식 */
  private synthCampFire(ctx: AudioContext): void {
    this.synthTorchLight(ctx);
    setTimeout(() => {
      const c = this.ensureContext();
      if (c) this.synthHeal(c);
    }, 120);
  }

  /** 27. 횃불 점등 */
  private synthTorchLight(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** 28. 보물 상자 개방 */
  private synthLootOpen(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.22);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.25);

    setTimeout(() => {
      const c = this.ensureContext();
      if (c) this.synthCoin(c);
    }, 120);
  }

  /** 29. 퀘스트 완료 */
  private synthQuestComplete(ctx: AudioContext): void {
    this.synthVictory(ctx);
    setTimeout(() => {
      const c = this.ensureContext();
      if (c) this.synthCoin(c);
    }, 280);
  }

  /** 30. 에테르 마력 차징 (기 모으기 / 주문 영창 음) */
  private synthCharge(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** FEVER 게이지 완충 및 궁극기 전술 폭발 (에테르 쇼크웨이브 & 고주파 공명) */
  private synthFeverBurst(ctx: AudioContext): void {
    const now = ctx.currentTime;
    
    // 1) 서브 드롭 임팩트 (강렬한 전술 폭발 기저음)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(450, now);
    subFilter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxGain!);
    subOsc.start(now);
    subOsc.stop(now + 0.38);

    // 2) 고주파 골든 크리스탈 아르페지오 (FEVER 각성 팡파르)
    const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    chordNotes.forEach((freq, idx) => {
      const startTime = now + idx * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  }

  /** 전술 모멘텀 뱃지 획득 및 슬롯 적립 음 (가볍고 경쾌한 챠임 펄스) */
  private synthFeverBadge(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** 31. 마도 연금 / 마도서 제작 연성 완료 */
  private synthCraft(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (신비로운 아르페지오)
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  /** 32. 장비 / 스킬 마도 강화 공명 */
  private synthEnhance(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);

    setTimeout(() => {
      const c = this.ensureContext();
      if (c) {
        const n = c.currentTime;
        const ring = c.createOscillator();
        ring.type = 'triangle';
        ring.frequency.setValueAtTime(1760, n);
        const rGain = c.createGain();
        rGain.gain.setValueAtTime(0.25, n);
        rGain.gain.exponentialRampToValueAtTime(0.001, n + 0.25);
        ring.connect(rGain);
        rGain.connect(this.sfxGain!);
        ring.start(n);
        ring.stop(n + 0.25);
      }
    }, 100);
  }

  /** 33. 둔기 / 해머 분쇄 강타 (서브 베이스 펀치 + 저역 디스토션 크런치) */
  private synthCrush(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 서브 베이스 펀치 (140Hz -> 26Hz 초저역 하강)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.32);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.35);

    // 2) 분쇄 파쇄 노이즈 (저역 통과 필터 크런치)
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.16);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.9, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain!);
    noise.start(now);
  }

  /** 34. 창 / 자창 관통 찌르기 (고속 금속성 관통음 + 공기 파열음) */
  private synthPierce(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 날카로운 고속 관통 풍절음
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(650, now + 0.12);
    filter.Q.setValueAtTime(6, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.85, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain!);
    noise.start(now);

    // 2) 예리한 금속 관통 핑 (고주파 하강 사인파)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** 35. 활 / 석궁 사격 (시위 튕김 텐션음 + 화살 비행 풍절음) */
  private synthBowShot(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 시위 플럭 튕김 (삼각파 빠른 감쇄)
    const stringOsc = ctx.createOscillator();
    stringOsc.type = 'triangle';
    stringOsc.frequency.setValueAtTime(460, now);
    stringOsc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    const stringGain = ctx.createGain();
    stringGain.gain.setValueAtTime(0.8, now);
    stringGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    stringOsc.connect(stringGain);
    stringGain.connect(this.sfxGain!);
    stringOsc.start(now);
    stringOsc.stop(now + 0.09);

    // 2) 화살 공기 가르기 (풍절 휘파람)
    const arrowOsc = ctx.createOscillator();
    arrowOsc.type = 'sine';
    arrowOsc.frequency.setValueAtTime(1100, now + 0.02);
    arrowOsc.frequency.exponentialRampToValueAtTime(680, now + 0.18);

    const arrowGain = ctx.createGain();
    arrowGain.gain.setValueAtTime(0.01, now);
    arrowGain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    arrowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    arrowOsc.connect(arrowGain);
    arrowGain.connect(this.sfxGain!);
    arrowOsc.start(now + 0.02);
    arrowOsc.stop(now + 0.22);
  }

  /** 36. 마도총 / 화포 격발 (폭발적인 화약 충격음 + 포구 저음 럼블) */
  private synthGunshot(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 고압 순간 폭발 노이즈 (트랜지언트 크랙)
    const crackSize = Math.floor(ctx.sampleRate * 0.08);
    const crackBuffer = ctx.createBuffer(1, crackSize, ctx.sampleRate);
    const crackData = crackBuffer.getChannelData(0);
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackSize * 0.15));
    }
    const crack = ctx.createBufferSource();
    crack.buffer = crackBuffer;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(1000, now);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(1.1, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.sfxGain!);
    crack.start(now);

    // 2) 포구 화약 폭발 서브 럼블
    const blastOsc = ctx.createOscillator();
    blastOsc.type = 'sawtooth';
    blastOsc.frequency.setValueAtTime(220, now);
    blastOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    const blastFilter = ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(600, now);
    blastFilter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const blastGain = ctx.createGain();
    blastGain.gain.setValueAtTime(0.9, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    blastOsc.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(this.sfxGain!);
    blastOsc.start(now);
    blastOsc.stop(now + 0.38);
  }

  /** 37. 순수 비전 / 에테르 마법 탄환 (신비로운 크리스탈 아르페지오 챠임) */
  private synthArcaneMagic(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const notes = [659.25, 880.00, 1318.51]; // E5, A5, E6
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.04;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, startTime + 0.22);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.38, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });

    // 비전 마력 공명 배음
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1760, now + 0.05);
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0.2, now + 0.05);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    shimmer.connect(sGain);
    sGain.connect(this.sfxGain!);
    shimmer.start(now + 0.05);
    shimmer.stop(now + 0.35);
  }

  /** 38. 성스러운 빛 / 신성 심판 (솔페지오 528Hz 화음 + 성스러운 챠임) */
  private synthHolySpell(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const freqs = [528.0, 660.0, 792.0]; // 528Hz Solfeggio Triad
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.45);
    });

    // 높은 성광 종소리 잔향
    const chime = ctx.createOscillator();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1056, now);
    chime.frequency.exponentialRampToValueAtTime(1056, now + 0.5);

    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.28, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain!);
    chime.start(now);
    chime.stop(now + 0.5);
  }

  /** 39. 암흑 / 심연 저주 / 흑마법 (증4도 트라이톤 불협화음 + 저역 필터 스위프) */
  private synthDarkMagic(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(98.0, now); // G2
    osc2.frequency.setValueAtTime(138.59, now); // C#3 (Tritone 불협화음)

    osc1.frequency.exponentialRampToValueAtTime(45.0, now + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(65.0, now + 0.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.4);
    filter.Q.setValueAtTime(8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  }

  /** 40. 폭풍 / 돌풍 / 질풍 칼바람 (휘몰아치는 바람 노이즈 공명 스위프) */
  private synthWindStorm(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.38);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(1750, now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.38);
    filter.Q.setValueAtTime(7, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);
  }

  /** 41. 방패 / 방어구 파쇄 파편음 (금속성 충격 + 크리스탈/세라믹 분쇄음) */
  private synthShieldBreak(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // 1) 묵직한 방패 충격
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.2);

    // 2) 와장창 파쇄되는 다중 고주파 파편음
    const shardFreqs = [2400, 3100, 3850, 4600];
    shardFreqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.02;
      const sOsc = ctx.createOscillator();
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(freq, startTime);
      sOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + 0.15);

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.35, startTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      sOsc.connect(sGain);
      sGain.connect(this.sfxGain!);
      sOsc.start(startTime);
      sOsc.stop(startTime + 0.18);
    });
  }

  /** 42. 맹독 분무 / 산성액 부식 (FM 변조 지글거리는 산성 기포 반응) */
  private synthPoison(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // FM 신디사이징으로 기포 거품 연출
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(360, now);
    carrier.frequency.exponentialRampToValueAtTime(180, now + 0.3);

    modulator.type = 'sawtooth';
    modulator.frequency.setValueAtTime(48, now);
    modulator.frequency.linearRampToValueAtTime(90, now + 0.3);

    modGain.gain.setValueAtTime(150, now);
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.3);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const cGain = ctx.createGain();
    cGain.gain.setValueAtTime(0.5, now);
    cGain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    carrier.connect(cGain);
    cGain.connect(this.sfxGain!);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.32);
    carrier.stop(now + 0.32);

    // 치이익 끓는 고주파 시즐 노이즈
    const sizzleSize = Math.floor(ctx.sampleRate * 0.25);
    const sizzleBuffer = ctx.createBuffer(1, sizzleSize, ctx.sampleRate);
    const sData = sizzleBuffer.getChannelData(0);
    for (let i = 0; i < sizzleSize; i++) {
      sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sizzleSize * 0.4));
    }
    const sizzle = ctx.createBufferSource();
    sizzle.buffer = sizzleBuffer;

    const sFilter = ctx.createBiquadFilter();
    sFilter.type = 'bandpass';
    sFilter.frequency.setValueAtTime(2600, now);
    sFilter.Q.setValueAtTime(5, now);

    const sGainNode = ctx.createGain();
    sGainNode.gain.setValueAtTime(0.45, now);
    sGainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    sizzle.connect(sFilter);
    sFilter.connect(sGainNode);
    sGainNode.connect(this.sfxGain!);
    sizzle.start(now);
  }

  /** 43. 회피 / 빗나감 (바람을 가르는 날렵한 회피 풍절음 - Dodge Whoosh) */
  private synthEvade(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const dur = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + dur);
    filter.Q.setValueAtTime(4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);

    // 가벼운 공기 변위 서브 사인파 피치 드롭
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + dur);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + dur);
  }

  // ─────────────────────────────────────────────────────────────
  //  🎯 스킬 태그 및 속성 기반 정밀 SFX 사운드 라우팅 엔진
  // ─────────────────────────────────────────────────────────────

  /**
   * 스킬 객체 또는 식별자와 시전자 정보를 분석하여 가장 적합한 디테일 사운드 타입을 결정
   */
  public resolveSkillSound(
    skill: any,
    heroOrClass?: any
  ): SoundEffectType {
    try {
      return resolveCombatVfxAndSfx(skill, heroOrClass).sfx;
    } catch (_) {
      return 'slash';
    }
  }

  /**
   * 스킬과 시전자 정보를 바탕으로 세분화된 사운드 자동 판별 및 재생
   */
  public playSkill(skill: any, heroOrClass?: any): void {
    const soundType = this.resolveSkillSound(skill, heroOrClass);
    this.play(soundType);
  }

  // ─────────────────────────────────────────────────────────────
  //  🌌 웅장한 다중 트랙 심포닉 BGM 엔진 (전쟁 북 & 고딕 오케스트라)
  // ─────────────────────────────────────────────────────────────

  public playBgm(track: BgmTrack): void {
    if (track === 'none') {
      this.stopBgm();
      return;
    }

    // 백그라운드 상태인 경우 트랙만 예약하고 실제 재생은 포그라운드 복귀 시로 연기
    if (this.isPausedForBackground) {
      this.currentBgmTrack = track;
      return;
    }

    // 이미 해당 트랙이 정상 재생 중인 경우 중복 시작 방지
    if (this.currentBgmTrack === track && (this.currentAudio || this.bgmOscillators.length > 0)) {
      return;
    }

    const sessionId = ++this.bgmPlaySessionId;
    this.stopBgmInternal();
    this.currentBgmTrack = track;

    if (this.bgmMuted) return;

    if (!this.isUnlocked) {
      this.pendingBgmTrack = track;
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    const assetService = CustomAssetService.getInstance();

    // 🎹 순수 신디사이저 모드인 경우 외부 MP3 로드를 건너뛰고 절차적 오디오로 바로 합성
    if (assetService.isSyntheticAudioOnly()) {
      this.playProceduralBgm(ctx, track, sessionId);
      return;
    }

    // 🎵 1. 외부 오디오 파일(MP3/커스텀 URL) 우선 재생 (0.5초 선행 트리거 & 부드러운 이퀄 파워 교차 루프)
    const customBgm = assetService.getBgmOverride(track);
    const audioPath = customBgm || `assets/bgm/bgm_${track}.mp3`;
    const audio = new Audio(audioPath);
    audio.loop = false; // 브라우저 고유의 뚝 끊기는 루프 방지
    audio.preload = 'auto';
    this.audioGainMap.set(audio, 1.0);
    audio.volume = this.bgmMuted ? 0 : this.bgmVolume;
    this.activeAudios.add(audio);
    this.currentAudio = audio;

    let hasStartedAudio = false;

    const onPlaySuccess = () => {
      hasStartedAudio = true;
      if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track || this.bgmMuted) {
        this.cleanupAudioElement(audio);
        return;
      }
      // 0.5초 선행 루프 모니터링 활성화
      this.setupAudioLoopMonitoring(audio, track, sessionId);
    };

    const onPlayError = () => {
      this.cleanupAudioElement(audio);

      // 🎼 2. 영지(citadel) 외 전투/던전 트랙에 대해서만 파일 부재 시 보조 신디사이저 동작
      // (영지 BGM은 기계 비트 신디사이저가 섞여 나오지 않도록 절차적 합성 배제)
      if (this.bgmPlaySessionId === sessionId && this.currentBgmTrack === track && !this.bgmMuted && ctx && track !== 'citadel') {
        this.playProceduralBgm(ctx, track, sessionId);
      }
    };

    audio.addEventListener('error', onPlayError, { once: true });

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(onPlaySuccess)
        .catch(() => {
          if (!hasStartedAudio) {
            onPlayError();
          }
        });
    }
  }

  /**
   * 🔁 오디오 재생 끝 0.5초 전 루프 트리거 모니터링 등록
   * 트랙의 파일 끝에 도달하기 0.5초 전에 다음 오디오 사이클을 미리 기동하여
   * 뚝 끊기거나 무음 구간 없이 매끄럽게 연결합니다.
   */
  private setupAudioLoopMonitoring(audio: HTMLAudioElement, track: BgmTrack, sessionId: number): void {
    let hasTriggeredLoop = false;
    let preloadedNext: HTMLAudioElement | null = null;
    let hasPreloaded = false;

    const triggerLoop = () => {
      if (hasTriggeredLoop) return;
      hasTriggeredLoop = true;
      clearInterval(monitorTimer);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      this.transitionToNextLoopCycle(audio, track, sessionId, preloadedNext);
    };

    // 정밀 고해상도 모니터링 타이머 (30ms 주기)
    const monitorTimer = window.setInterval(() => {
      if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track) {
        clearInterval(monitorTimer);
        return;
      }

      if (audio.paused || this.isPausedForBackground) {
        return;
      }

      const duration = audio.duration;
      if (!duration || isNaN(duration) || !isFinite(duration) || duration <= 0) {
        return;
      }

      const curTime = audio.currentTime;
      const advance = Math.min(this.BGM_LOOP_ADVANCE_SEC, duration * 0.5);
      const triggerTime = Math.max(0.1, duration - advance);

      // 루프 지점 도달 2초 전에 다음 오디오 인스턴스를 미리 생성/디코딩 버퍼링 (지연 제로화)
      if (!hasPreloaded && curTime >= Math.max(0, triggerTime - 2.0)) {
        hasPreloaded = true;
        try {
          const assetService = CustomAssetService.getInstance();
          const nextCustomBgm = assetService.getBgmOverride(track);
          const nextAudioPath = nextCustomBgm || `assets/bgm/bgm_${track}.mp3`;
          preloadedNext = new Audio(nextAudioPath);
          preloadedNext.preload = 'auto';
          preloadedNext.load();
        } catch (_) {}
      }

      // 루프 지점(끝나기 0.5초 전) 도달 시 크로스페이드 루프 전환
      if (curTime >= triggerTime) {
        triggerLoop();
      }
    }, 30);

    this.bgmTimers.push(monitorTimer);

    // timeupdate 이벤트 보조 리스너 (브라우저 인터벌 스케줄링 지연 보완)
    const onTimeUpdate = () => {
      if (hasTriggeredLoop || this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track) {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        return;
      }
      const duration = audio.duration;
      if (duration && isFinite(duration) && duration > 0) {
        const advance = Math.min(this.BGM_LOOP_ADVANCE_SEC, duration * 0.5);
        if (audio.currentTime >= Math.max(0.1, duration - advance)) {
          triggerLoop();
        }
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);

    // ended 이벤트 안전망 (시간 스킵 등으로 인터벌을 통과했을 경우 즉시 루프)
    const onEnded = () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      clearInterval(monitorTimer);
      if (!hasTriggeredLoop && this.bgmPlaySessionId === sessionId && this.currentBgmTrack === track) {
        triggerLoop();
      }
    };
    audio.addEventListener('ended', onEnded, { once: true });
  }

  /**
   * 🎚️ 루프 끝 지점에서 시작 지점으로 0.5초 부드러운 이퀄 파워 교차 페이드(Crossfade) 전환
   */
  private transitionToNextLoopCycle(
    outgoingAudio: HTMLAudioElement,
    track: BgmTrack,
    sessionId: number,
    preloadedAudio: HTMLAudioElement | null
  ): void {
    if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track) {
      if (preloadedAudio) {
        try { preloadedAudio.src = ''; } catch (_) {}
      }
      return;
    }

    const assetService = CustomAssetService.getInstance();
    const customBgm = assetService.getBgmOverride(track);
    const audioPath = customBgm || `assets/bgm/bgm_${track}.mp3`;

    let nextAudio: HTMLAudioElement;
    if (preloadedAudio && preloadedAudio.src) {
      nextAudio = preloadedAudio;
    } else {
      nextAudio = new Audio(audioPath);
    }

    nextAudio.loop = false;
    nextAudio.preload = 'auto';
    this.audioGainMap.set(nextAudio, 0);
    nextAudio.volume = 0;
    try { nextAudio.currentTime = 0; } catch (_) {}
    this.activeAudios.add(nextAudio);

    // 새 사이클 오디오 재생 시작
    const playPromise = nextAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[SoundManager] Seamless loop play error:', err);
      });
    }

    // 다음 오디오의 루프 모니터링 등록 (이 오디오 역시 끝나기 0.5초 전에 루프)
    this.setupAudioLoopMonitoring(nextAudio, track, sessionId);

    // 0.5초 동안 부드러운 이퀄 파워(Equal-Power) 교차 페이드 실행
    const crossfadeDurationMs = this.BGM_CROSSFADE_SEC * 1000;
    let elapsedMs = 0;
    let lastTime = performance.now();

    const fadeTimer = window.setInterval(() => {
      if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track) {
        clearInterval(fadeTimer);
        this.cleanupAudioElement(outgoingAudio);
        return;
      }

      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      if (!this.isPausedForBackground) {
        elapsedMs += dt;
      }

      const progress = Math.min(1, Math.max(0, elapsedMs / crossfadeDurationMs));

      // 이퀄 파워 코사인/사인 페이드 커브 (전체 음향 파워 1 유지)
      const outGain = Math.cos(progress * 0.5 * Math.PI);
      const inGain = Math.sin(progress * 0.5 * Math.PI);

      this.audioGainMap.set(outgoingAudio, outGain);
      this.audioGainMap.set(nextAudio, inGain);

      const baseVol = this.bgmMuted ? 0 : this.bgmVolume;
      outgoingAudio.volume = Math.max(0, Math.min(1, baseVol * outGain));
      nextAudio.volume = Math.max(0, Math.min(1, baseVol * inGain));

      if (progress >= 1) {
        clearInterval(fadeTimer);
        this.cleanupAudioElement(outgoingAudio);
        this.audioGainMap.set(nextAudio, 1.0);
        nextAudio.volume = this.bgmMuted ? 0 : this.bgmVolume;
        this.currentAudio = nextAudio;
      }
    }, 25);

    this.bgmTimers.push(fadeTimer);
  }

  /** 개별 오디오 엘리먼트 정지 및 메모리 정리 */
  private cleanupAudioElement(audio: HTMLAudioElement): void {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.removeAttribute('src');
    } catch (_) {}
    this.activeAudios.delete(audio);
    this.audioGainMap.delete(audio);
    if (this.currentAudio === audio) {
      this.currentAudio = null;
    }
  }

  private playProceduralBgm(ctx: AudioContext, track: BgmTrack, sessionId: number): void {
    if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== track) return;
    if (track === 'battle' || track === 'boss') {
      this.startEpicBattleBGM(ctx, track === 'boss', sessionId);
    } else if (track === 'citadel') {
      this.startEpicCitadelBGM(ctx, sessionId);
    } else if (track === 'dungeon') {
      this.startEpicDungeonBGM(ctx, sessionId);
    }
  }

  public stopBgm(): void {
    this.isPausedForBackground = false;
    this.bgmPlaySessionId++;
    this.currentBgmTrack = 'none';
    this.pendingBgmTrack = 'none';
    this.stopBgmInternal();
  }

  /** ⏸️ 모바일 백그라운드 진입 또는 화면 비활성화 시 BGM 일시정지 */
  public pauseBgm(): void {
    if (this.isPausedForBackground) return;
    this.isPausedForBackground = true;
    console.log('🔇 [SoundManager] 백그라운드 전환 감지 -> BGM 일시정지');

    // 1. 재생 중인 모든 외부 오디오 파일 일시정지 (크로스페이드 중인 복수 오디오 포함 위치 보존)
    this.activeAudios.forEach(audio => {
      try {
        if (!audio.paused) audio.pause();
      } catch (_) {}
    });

    // 2. Web Audio Context 일시정지 (절차적 합성음 및 오실레이터 정지)
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch (_) {}
    }
  }

  /** ▶️ 모바일 포그라운드 복귀 또는 화면 활성화 시 BGM 재생 재개 */
  public resumeBgm(): void {
    if (!this.isPausedForBackground) return;
    this.isPausedForBackground = false;
    console.log('🔊 [SoundManager] 포그라운드 복귀 감지 -> BGM 재생 재개');

    if (this.bgmMuted) return;

    // 1. Web Audio Context 재개
    if (this.ctx && this.ctx.state === 'closed') {
      this.ctx = null;
      this.initContext();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      try {
        const p = this.ctx.resume();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (_) {}
    }

    // 2. 외부 오디오 파일 재생 재개 (크로스페이드 중인 복수 오디오 일괄 복구)
    let anyAudioResumed = false;
    this.activeAudios.forEach(audio => {
      if (audio.paused) {
        anyAudioResumed = true;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    });

    if (!anyAudioResumed && this.currentBgmTrack !== 'none' && !this.currentAudio && this.bgmOscillators.length === 0) {
      const track = this.currentBgmTrack;
      this.currentBgmTrack = 'none';
      this.playBgm(track);
    }
  }

  private stopBgmInternal(): void {
    // 1. 모든 BGM 인터벌/타이머 즉시 정지
    this.bgmTimers.forEach(id => clearInterval(id));
    this.bgmTimers = [];

    // 2. 활성화된 모든 외부 오디오 엘리먼트 즉시 정지 및 초기화
    this.activeAudios.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.removeAttribute('src');
      } catch (_) {}
    });
    this.activeAudios.clear();
    this.audioGainMap.clear();
    this.currentAudio = null;

    // 3. 실행 중인 모든 절차적 신디사이저 오실레이터 정지
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.bgmOscillators.forEach(({ osc, gain }) => {
      try {
        if (this.ctx) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
          setTimeout(() => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (_) {}
          }, 180);
        } else {
          osc.stop();
          osc.disconnect();
        }
      } catch (_) {}
    });
    this.bgmOscillators = [];
  }

  // ═════════════════════════════════════════════════════════════
  //  ⚔️ 1. 웅장한 전투 BGM: 전쟁 북(War Drums) + 서브 베이스 + 고딕 브라스
  // ═════════════════════════════════════════════════════════════
  private startEpicBattleBGM(ctx: AudioContext, isBoss = false, sessionId: number): void {
    const tempo = isBoss ? 144 : 136; // BPM
    const stepDuration = 60 / tempo / 4; // 16th note (초 단위)
    let step = 0;

    // 고딕 전투 코드 진행 (Cm -> Ab -> Fm -> G7)
    const chords = [
      [130.81, 155.56, 196.00], // C minor (C3, Eb3, G3)
      [103.83, 130.81, 164.81], // Ab major (Ab2, C3, Eb3)
      [87.31,  103.83, 130.81], // F minor (F2, Ab2, C3)
      [98.00,  123.47, 146.83, 174.61], // G7 (G2, B2, D3, F3)
    ];

    // 1) 고딕 패드 드론 지속 레이어 (Cm)
    const droneFreqs = isBoss ? [65.41, 130.81, 196.00] : [65.41, 130.81];
    droneFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start();
      this.bgmOscillators.push({ osc, gain });
    });

    // 2) 리드미컬 전쟁 북(War Drum) & 서브 베이스 시퀀서 (16분 음표 기반 스케줄러)
    const intervalId = window.setInterval(() => {
      if (this.bgmPlaySessionId !== sessionId || (this.currentBgmTrack !== 'battle' && this.currentBgmTrack !== 'boss')) {
        clearInterval(intervalId);
        return;
      }
      const now = ctx.currentTime;
      const measureStep = step % 16;
      const chordIdx = Math.floor((step % 64) / 16);
      const curChord = chords[chordIdx] || chords[0];

      // ── [Track A] 전쟁 북 (War Timpani Kick & Snare) ──
      const isKick = measureStep === 0 || measureStep === 6 || measureStep === 8 || measureStep === 14;
      const isSnare = measureStep === 4 || measureStep === 12;

      if (isKick) {
        const kickOsc = ctx.createOscillator();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(isBoss ? 160 : 130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.16);

        const kickGain = ctx.createGain();
        kickGain.gain.setValueAtTime(isBoss ? 0.45 : 0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain!);
        kickOsc.start(now);
        kickOsc.stop(now + 0.22);
      }

      if (isSnare) {
        const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuf;

        const sFilter = ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(1200, now);

        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.25, now);
        sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noiseNode.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.bgmGain!);
        noiseNode.start(now);
      }

      // ── [Track B] 16분 음표 드라이빙 서브 베이스 (Saw Bassline) ──
      if (measureStep % 2 === 0) {
        const rootFreq = curChord[0] * 0.5;
        const bassOsc = ctx.createOscillator();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(rootFreq, now);

        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(isBoss ? 350 : 280, now);
        bassFilter.frequency.exponentialRampToValueAtTime(90, now + stepDuration * 1.8);

        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(0.20, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.8);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmGain!);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.9);
      }

      // ── [Track C] 매 마디 첫 박 브라스 화음 타격 ──
      if (measureStep === 0) {
        curChord.forEach(f => {
          const chordOsc = ctx.createOscillator();
          chordOsc.type = 'sawtooth';
          chordOsc.frequency.setValueAtTime(f, now);

          const cFilter = ctx.createBiquadFilter();
          cFilter.type = 'lowpass';
          cFilter.frequency.setValueAtTime(600, now);
          cFilter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

          const cGain = ctx.createGain();
          cGain.gain.setValueAtTime(0.12, now);
          cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          chordOsc.connect(cFilter);
          cFilter.connect(cGain);
          cGain.connect(this.bgmGain!);
          chordOsc.start(now);
          chordOsc.stop(now + 0.85);
        });
      }

      step++;
    }, stepDuration * 1000);

    this.bgmTimers.push(intervalId);
  }

  // ═════════════════════════════════════════════════════════════
  //  🏰 2. 방주 영지 BGM: 따스한 대성당 오르간 & 하프 펜타토닉 멜로디
  // ═════════════════════════════════════════════════════════════
  private startEpicCitadelBGM(ctx: AudioContext, sessionId: number): void {
    // 1) 따스한 D 마이너 고딕 오르간 패드 (D3, A3, F4, D4)
    const organChord = [146.83, 220.00, 293.66, 349.23];
    organChord.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start();
      this.bgmOscillators.push({ osc, gain });
    });

    // 2) 주기적 천상의 하프 / 차임 아르페지오 (D 마이너 펜타토닉)
    const harpNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33];
    const harpTimer = window.setInterval(() => {
      if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== 'citadel') {
        clearInterval(harpTimer);
        return;
      }
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const note = harpNotes[Math.floor(Math.random() * harpNotes.length)];
        const now = ctx.currentTime + i * 0.18;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.10, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.bgmGain!);
        osc.start(now);
        osc.stop(now + 0.95);
      }
    }, 4500);

    this.bgmTimers.push(harpTimer);
  }

  // ═════════════════════════════════════════════════════════════
  //  🌀 3. 심연 던전 BGM: 음산한 심층 서브 럼블 & 어둠의 불협화 종소리
  // ═════════════════════════════════════════════════════════════
  private startEpicDungeonBGM(ctx: AudioContext, sessionId: number): void {
    // 1) 36Hz 심연 초저음 럼블 드론
    const droneFreqs = [36.71, 73.42, 110.00];
    droneFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start();
      this.bgmOscillators.push({ osc, gain });
    });

    // 2) 불협화 심연 차임 (주기적으로 울리는 저주의 종소리)
    const darkChimes = [185.00, 246.94, 293.66, 369.99]; // F#3, B3, D4, F#4
    const dungeonTimer = window.setInterval(() => {
      if (this.bgmPlaySessionId !== sessionId || this.currentBgmTrack !== 'dungeon') {
        clearInterval(dungeonTimer);
        return;
      }
      const note = darkChimes[Math.floor(Math.random() * darkChimes.length)];
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(now);
      osc.stop(now + 2.1);
    }, 5500);

    this.bgmTimers.push(dungeonTimer);
  }
}
