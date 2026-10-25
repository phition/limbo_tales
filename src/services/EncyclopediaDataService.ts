import {
  STARTER_STEPS,
  WEAPON_TRAITS_GUIDE,
  FAQS_GUIDE,
  CLASS_LINEAGES,
  ARENA_RULE_GUIDES,
  NEMESIS_RULE_GUIDES,
  INVASION_RULE_GUIDES,
  StarterStepGuide,
  WeaponTraitGuide,
  FaqGuide,
  ClassLineageDef,
  ArenaRuleGuide,
} from '../data/encyclopediaData';
import { SYSTEM_GUIDES, SystemGuideItem } from '../data/systemGuides';
import { FirebaseService } from './FirebaseService';
import { db } from './firebaseConfig';
import { ref, set, onValue, Unsubscribe } from 'firebase/database';

export interface EncyclopediaPackage {
  version: number;
  updatedAt: number;
  updatedBy?: string;
  lang?: string;
  starterSteps?: StarterStepGuide[];
  weaponTraits?: WeaponTraitGuide[];
  faqs?: FaqGuide[];
  systemGuides?: SystemGuideItem[];
  arenaRules?: ArenaRuleGuide[];
  nemesisRules?: ArenaRuleGuide[];
  invasionRules?: ArenaRuleGuide[];
  classLineages?: ClassLineageDef[];
}

const STORAGE_KEY = 'limbo_custom_encyclopedia_data';
const REMOTE_DB_PATH = 'encyclopedia_data';

export class EncyclopediaDataService {
  private static instance: EncyclopediaDataService;

  private customOverrides: Partial<EncyclopediaPackage> = {};
  private listeners: Array<() => void> = [];
  private unsubscribeRealtime: Unsubscribe | null = null;

  private constructor() {
    this.initLocalStorage();
    this.initRealtimeSync();
  }

  public static getInstance(): EncyclopediaDataService {
    if (!EncyclopediaDataService.instance) {
      EncyclopediaDataService.instance = new EncyclopediaDataService();
    }
    return EncyclopediaDataService.instance;
  }

  public onUpdate(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('[EncyclopediaDataService] Error in update listener:', e);
      }
    });
  }

  /** 로컬 스토리지에서 저장된 백과사전 커스텀 데이터 로드 */
  private initLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.customOverrides = parsed;
          console.log('[EncyclopediaDataService] 로컬 커스텀 백과사전 데이터 로드 완료');
        }
      }
    } catch (e) {
      console.warn('[EncyclopediaDataService] 로컬 스토리지 데이터 로드 실패:', e);
    }
  }

  /** Firebase Realtime DB 실시간 동기화 구독 */
  private initRealtimeSync(): void {
    if (typeof window === 'undefined' || !db) return;
    try {
      const dataRef = ref(db, REMOTE_DB_PATH);
      this.unsubscribeRealtime = onValue(
        dataRef,
        snapshot => {
          if (!snapshot.exists()) return;
          const remoteData = snapshot.val();
          if (remoteData && typeof remoteData === 'object') {
            console.log('[EncyclopediaDataService] ☁️ Firebase 백과사전 데이터 수신:', remoteData);
            this.customOverrides = {
              ...this.customOverrides,
              ...remoteData,
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customOverrides));
            } catch (_) {}
            this.notifyListeners();
          }
        },
        error => {
          console.warn('[EncyclopediaDataService] Firebase 실시간 동기화 오류:', error);
        }
      );
    } catch (e) {
      console.warn('[EncyclopediaDataService] Firebase 구독 실패:', e);
    }
  }

  public hasCustomOverrides(): boolean {
    return Object.keys(this.customOverrides).some(k => {
      const val = (this.customOverrides as any)[k];
      return Array.isArray(val) && val.length > 0;
    });
  }

  public getStarterSteps(): StarterStepGuide[] {
    if (Array.isArray(this.customOverrides.starterSteps) && this.customOverrides.starterSteps.length > 0) {
      return this.customOverrides.starterSteps;
    }
    return STARTER_STEPS;
  }

  public getWeaponTraits(): WeaponTraitGuide[] {
    if (Array.isArray(this.customOverrides.weaponTraits) && this.customOverrides.weaponTraits.length > 0) {
      return this.customOverrides.weaponTraits;
    }
    return WEAPON_TRAITS_GUIDE;
  }

  public getFaqs(): FaqGuide[] {
    if (Array.isArray(this.customOverrides.faqs) && this.customOverrides.faqs.length > 0) {
      return this.customOverrides.faqs;
    }
    return FAQS_GUIDE;
  }

  public getSystemGuides(): SystemGuideItem[] {
    if (Array.isArray(this.customOverrides.systemGuides) && this.customOverrides.systemGuides.length > 0) {
      return this.customOverrides.systemGuides;
    }
    return SYSTEM_GUIDES;
  }

  public getArenaRules(): ArenaRuleGuide[] {
    if (Array.isArray(this.customOverrides.arenaRules) && this.customOverrides.arenaRules.length > 0) {
      return this.customOverrides.arenaRules;
    }
    return ARENA_RULE_GUIDES;
  }

  public getNemesisRules(): ArenaRuleGuide[] {
    if (Array.isArray(this.customOverrides.nemesisRules) && this.customOverrides.nemesisRules.length > 0) {
      return this.customOverrides.nemesisRules;
    }
    return NEMESIS_RULE_GUIDES;
  }

  public getInvasionRules(): ArenaRuleGuide[] {
    if (Array.isArray(this.customOverrides.invasionRules) && this.customOverrides.invasionRules.length > 0) {
      return this.customOverrides.invasionRules;
    }
    return INVASION_RULE_GUIDES;
  }

  public getClassLineages(): ClassLineageDef[] {
    if (Array.isArray(this.customOverrides.classLineages) && this.customOverrides.classLineages.length > 0) {
      return this.customOverrides.classLineages;
    }
    return CLASS_LINEAGES;
  }

  /** 현재 백과사전 전체 데이터를 포함하는 백과사전 패키지 생성 */
  public getCurrentPackage(lang: string = 'ko'): EncyclopediaPackage {
    return {
      version: (this.customOverrides.version || 1) + 1,
      updatedAt: Date.now(),
      updatedBy: FirebaseService.getInstance().getCurrentUser()?.email || 'Master Commander',
      lang,
      starterSteps: this.getStarterSteps(),
      weaponTraits: this.getWeaponTraits(),
      faqs: this.getFaqs(),
      systemGuides: this.getSystemGuides(),
      arenaRules: this.getArenaRules(),
      nemesisRules: this.getNemesisRules(),
      invasionRules: this.getInvasionRules(),
      classLineages: this.getClassLineages(),
    };
  }

  /**
   * HTML 또는 JSON 파일 텍스트로부터 백과사전 데이터를 파싱 및 적용
   */
  public async importFromText(content: string): Promise<{ success: boolean; message: string; pkg?: EncyclopediaPackage }> {
    let jsonStr = content.trim();

    // 1. HTML 파일인 경우 내부 <script id="limbo-encyclopedia-data"> 태그 추출
    if (jsonStr.startsWith('<!DOCTYPE html') || jsonStr.includes('<html') || jsonStr.includes('limbo-encyclopedia-data')) {
      const match = jsonStr.match(/<script[^>]*id=["']limbo-encyclopedia-data["'][^>]*>([\s\S]*?)<\/script>/i);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      } else {
        return {
          success: false,
          message: 'HTML 파일 내에서 백과사전 데이터 태그(#limbo-encyclopedia-data)를 찾을 수 없습니다.',
        };
      }
    }

    // 2. JSON 파싱
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err: any) {
      return {
        success: false,
        message: `JSON 파싱 오류: ${err?.message || '유효하지 않은 JSON 형식입니다.'}`,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        message: '유효한 백과사전 데이터 객체가 아닙니다.',
      };
    }

    // 3. 백과사전 가이드 필드 중 최소 하나 이상 존재하는지 검증
    const validKeys = ['starterSteps', 'weaponTraits', 'faqs', 'systemGuides', 'arenaRules', 'nemesisRules', 'invasionRules', 'classLineages'];
    const matchedKeys = validKeys.filter(k => Array.isArray(parsed[k]) && parsed[k].length > 0);

    if (matchedKeys.length === 0) {
      return {
        success: false,
        message: `백과사전 데이터 필드(${validKeys.join(', ')})를 찾을 수 없습니다.`,
      };
    }

    // 4. 새 패키지 구성
    const newPkg: EncyclopediaPackage = {
      version: (typeof parsed.version === 'number' ? parsed.version : (this.customOverrides.version || 1)) + 1,
      updatedAt: Date.now(),
      updatedBy: FirebaseService.getInstance().getCurrentUser()?.email || 'Master Commander',
      lang: parsed.lang || 'ko',
      starterSteps: Array.isArray(parsed.starterSteps) ? parsed.starterSteps : this.getStarterSteps(),
      weaponTraits: Array.isArray(parsed.weaponTraits) ? parsed.weaponTraits : this.getWeaponTraits(),
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : this.getFaqs(),
      systemGuides: Array.isArray(parsed.systemGuides) ? parsed.systemGuides : this.getSystemGuides(),
      arenaRules: Array.isArray(parsed.arenaRules) ? parsed.arenaRules : this.getArenaRules(),
      nemesisRules: Array.isArray(parsed.nemesisRules) ? parsed.nemesisRules : this.getNemesisRules(),
      invasionRules: Array.isArray(parsed.invasionRules) ? parsed.invasionRules : this.getInvasionRules(),
      classLineages: Array.isArray(parsed.classLineages) ? parsed.classLineages : this.getClassLineages(),
    };

    // 5. 로컬 상태 및 로컬 스토리지에 저장
    this.customOverrides = newPkg;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPkg));
    } catch (e) {
      console.warn('[EncyclopediaDataService] localStorage 저장 실패:', e);
    }

    // 6. Firebase 마스터 계정일 경우 클라우드 실시간 동기화
    let cloudSynced = false;
    let cloudMsg = '';
    const fb = FirebaseService.getInstance();
    if (fb.isMasterUser() && db) {
      try {
        const dataRef = ref(db, REMOTE_DB_PATH);
        await set(dataRef, newPkg);
        cloudSynced = true;
        cloudMsg = ' + Firebase 클라우드 배포 완료';
      } catch (err: any) {
        console.warn('[EncyclopediaDataService] Firebase 배포 실패:', err);
        cloudMsg = ' (Firebase 배포는 실패함)';
      }
    }

    this.notifyListeners();

    const sectionsSummary = matchedKeys.join(', ');
    return {
      success: true,
      message: `성공적으로 백과사전 데이터를 적용했습니다! (${sectionsSummary}${cloudMsg})`,
      pkg: newPkg,
    };
  }

  /** 원본 기본 데이터로 초기화 */
  public async resetToDefaults(): Promise<void> {
    this.customOverrides = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}

    const fb = FirebaseService.getInstance();
    if (fb.isMasterUser() && db) {
      try {
        const dataRef = ref(db, REMOTE_DB_PATH);
        await set(dataRef, null);
      } catch (e) {
        console.warn('[EncyclopediaDataService] Firebase 리셋 실패:', e);
      }
    }

    this.notifyListeners();
  }
}
