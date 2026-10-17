import { Mercenary } from './game';

export type FeverBadgeType =
  | 'assist'   // 🎯 원호 추격 (ASSIST)
  | 'extra'    // ⚡ 스킬 연계 (EXTRA / COMBO)
  | 'crit'     // 💥 치명 일격 (CRITICAL)
  | 'guard'    // 🛡️ 수호 개입 (GUARD)
  | 'heal'     // 💖 신성 치유 (HEAL)
  | 'counter'  // ⚔️ 환영 반격 (COUNTER)
  | 'break'    // 💫 차징 붕괴 (BREAK)
  | 'evade';   // 🌀 회피 기동 (EVADE)

export interface FeverBadgeMeta {
  type: FeverBadgeType;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  borderColor: string;
  bg: string;
  description: string;
}

export type FeverSynergyId =
  | 'miracle_resurrection' // 🕊️ 기적의 소생 (가드 2 + 힐 3: 사망 1인 30% 부활 & 신성공격 / 전체 30% 회복 & 신성공격)
  | 'divine_sanctuary'     // 💖 신성 성역 (힐 3개 이상: 전체 회복 50% + 디버프 면역 1턴)
  | 'miracle_revive'       // 🩸 기사회생 (가드 3개 이상 또는 힐 3개 이상: 사망 1인 10% 부활, 사망자 없을 시 생존자 50% 회복)
  | 'iron_bulwark'         // 🛡️🧱 철벽 수호 (가드 4개 이상: 파티 전원 최대 HP 25% 에테르 보호막 부여)
  | 'flurry_overdrive'     // ⚡ 질풍노도 (방어력 50% 관통 + 확정 치명타 + 치명타 피해 +30%)
  | 'total_assault'        // 🎯 총력 섬멸 (광역화 + 위력 60% 증폭)
  | 'immortal_bastion'     // 🛡️ 불멸의 요새 (HP 30% 보호막 + 반격 결계 2턴)
  | 'extra_onslaught'      // ⚡🌪️ 연격 폭풍 (엑스트라 4개 이상: 적 전체화 + 위력 50% + 치명타 50%)
  | 'mirage_evasion'       // 🌀⚔️ 환영 신기루 (회피 3개 이상: 전체 명중력 50% + 환영 반격 2턴)
  | 'vampiric_requiem'     // 🍷 흡혈 진혼곡 (100% 흡혈 + 초과분 방벽)
  | 'grand_maestro'        // 🌐 전술의 극의 (올라운더 스트레이트: MP 30% 회복 등)
  | 'tactical_burst';      // 🌟 전술 파동 (기본 조합)

export interface FeverSynergyResult {
  id: FeverSynergyId;
  name: string;
  subTitle: string;
  icon: string;
  color: string;
  bg: string;
  borderColor: string;
  summary: string;
  // 적용될 수치 및 특수 효과
  powerMult: number;          // 위력 배율 (예: 1.8 = 80% 증가)
  critRateBonus: number;      // 치명타 확률 추가 (0 ~ 1.0)
  critDamageBonus: number;    // 치명타 피해 추가 (0 ~ 1.5)
  armorPenetration: number;   // 방어 무시/관통 비율 (0 ~ 1.0)
  isForceAoe: boolean;        // 단일기여도 적 전체로 확장
  lifestealPct: number;       // 가한 피해의 흡혈 파티 배분 비율
  partyShieldPct: number;     // 아군 최대 체력 대비 보호막 부여율
  reviveFallen: boolean;      // 사망 아군 부활 여부 (사경 극복)
  reviveHpPct: number;        // 부활 체력 비율
  reviveSingle?: boolean;     // 사망 아군 중 1인만 부활
  partyFullHeal: boolean;     // 생존 아군 완전 회복 여부
  partyHealPct?: number;      // 생존 아군 체력 회복 비율 (예: 0.5 = 50%)
  cleanseDebuffs: boolean;    // 모든 디버프 정화 여부
  immunityTurns: number;      // 디버프 면역 턴 수
  riposteTurns: number;       // 반격 결계 턴 수
  stunTurns: number;          // 적 전체 그로기/기절 턴 수
  rechargePartyMp: boolean;   // 파티 MP 100% 충전 여부
  rechargePartyMpPct?: number;// 파티 MP 일정 비율 회복 (예: 0.3 = 30%)
  hitRateBonus?: number;      // 아군 전체 명중력 증가 (예: 0.5 = 50%)
}

export type FeverAffinity = 'burst' | 'guard' | 'trick' | 'joker' | 'neutral';
export type FeverShowdownOutcome = 'player_win' | 'opp_win' | 'clash';

export interface ShowdownResult {
  outcome: FeverShowdownOutcome;
  playerSynergy: FeverSynergyResult;
  oppSynergy: FeverSynergyResult;
  playerAffinity: FeverAffinity;
  oppAffinity: FeverAffinity;
  playerScore: number;
  oppScore: number;
  weeklyRuleTitle?: string;
  bannerTitle: string;
  bannerSub: string;
  narrative: string;
  icon: string;
}
