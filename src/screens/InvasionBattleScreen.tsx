import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameManager } from '../hooks/useGameManager';
import { InvasionTarget, Skill, StatusEffect, ResourceType, Mercenary, CharacterClassRole } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { CustomAssetService } from '../services/CustomAssetService';
import { FeverBadgeType } from '../types/fever';
import { FeverGaugeBar } from '../components/FeverGaugeBar';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { getSkillMagicSchool, getEffectivePositionBonus } from '../utils/skillComboUtils';
import { resolveSiegeTactic, SiegeTacticDefinition } from '../data/siegeTactics';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/portraits/portrait_t2_valkyrie.png',
  paladin: 'assets/portraits/portrait_paladin_female.png',
  high_saintess: 'assets/portraits/portrait_t2_high_saintess.png',
  valhalla_blade: 'assets/portraits/portrait_t2_valhalla_blade.png',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

export const getHeroPortraitUrl = (classId?: string) => {
  if (!classId) return '';
  return CustomAssetService.getInstance().getMercenaryOverride(classId) || DEFAULT_CLASS_IMAGES[classId] || '';
};

// 🛡️ 차원 영지 침공 방어력 스케일
const INVASION_DEF_SCALE = 0.50;
const MAX_SIEGE_ROUNDS = 7;

interface InvasionCombatant {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  level: number;
  position: 'front' | 'back';
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  skills: Skill[];
  isPlayer: boolean;
  cooldowns: Record<string, number>;
  statusEffects: InvasionStatusEffect[];
  icon: string;
  trait?: string;
  role?: CharacterClassRole;
}

export interface InvasionStatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  icon: string;
  duration?: number;
  value?: number;
}

export function applyInvasionStatusEffect(
  target: { statusEffects: InvasionStatusEffect[]; luck?: number; name?: string },
  effect: InvasionStatusEffect,
  maxCapTurns = 5,
  options?: {
    skipResistCheck?: boolean;
    onResist?: (targetName: string, luck: number, effectName: string) => void;
  }
): { isNew: boolean; currentTurns: number; resisted?: boolean } {
  if (!Array.isArray(target.statusEffects)) {
    target.statusEffects = [];
  }

  // 🛡️ 상태이상/디버프 피격 시 피격자의 행운(Luck) 비례 완전 저항 판정 (최대 50% 상한 - PvE 표준 규격 100% 동일)
  if (effect.type === 'debuff' && !options?.skipResistCheck) {
    const luck = Math.max(1, target.luck ?? 10);
    const resistChance = Math.min(50, luck * 0.35);
    if (Math.random() * 100 < resistChance) {
      if (options?.onResist) {
        options.onResist(target.name || '대상', luck, effect.name);
      }
      return { isNew: false, currentTurns: 0, resisted: true };
    }
  }

  const existing = target.statusEffects.find(se => se.id === effect.id);
  if (existing) {
    existing.duration = Math.min(maxCapTurns, (existing.duration || 1) + (effect.duration || 1));
    if (effect.value !== undefined) existing.value = effect.value;
    return { isNew: false, currentTurns: existing.duration, resisted: false };
  } else {
    target.statusEffects.push({ ...effect });
    return { isNew: true, currentTurns: effect.duration || 1, resisted: false };
  }
}

export const renderStatusBadges = (statusEffects: InvasionStatusEffect[] | undefined, isDestroyed = false) => {
  if (!statusEffects || statusEffects.length === 0 || isDestroyed) return null;
  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 z-10">
      {statusEffects.map((st, sidx) => (
        <span
          key={sidx}
          className="text-[6.5px] px-1 py-0.2 rounded bg-black/85 border border-white/20 flex items-center gap-0.5 text-white shrink-0 font-mono shadow-sm"
          title={`${st.name} (${st.duration}턴)`}
        >
          <span>{st.icon}</span>
          <span className="text-[#ffd54f] font-bold">{st.duration}T</span>
        </span>
      ))}
    </div>
  );
};

interface SiegeTargetObject {
  id: 'dimensional_barrier' | 'turret_left' | 'turret_right';
  name: string;
  currentHp: number;
  maxHp: number;
  def: number;
  icon: string;
  type: 'barrier' | 'turret';
  side: 'left' | 'right' | 'center';
  position: 'front' | 'back';
  isDestroyed: boolean;
  description: string;
  statusEffects: InvasionStatusEffect[];
  luck?: number; // 🍀 상태이상 저항용 행운 수치
}

interface OperatorCardProps {
  hero: Mercenary | any | null;
  tactic: SiegeTacticDefinition;
  side: 'player' | 'enemy';
  isActing: boolean;
}

const OperatorCard: React.FC<OperatorCardProps> = ({
  hero,
  tactic,
  side,
  isActing,
}) => {
  const isPlayer = side === 'player';
  const customAssetService = CustomAssetService.getInstance();
  const classId = hero?.classId || '';
  const imageUrl = customAssetService.getMercenaryOverride(classId) || DEFAULT_CLASS_IMAGES[classId];
  const clsInfo = CHARACTER_CLASSES[classId];
  const clsName = clsInfo?.name || hero?.className || (isPlayer ? '공성 전술 오퍼레이터' : '수성 방어 오퍼레이터');

  const tacticSkillName = isPlayer ? tactic.siegeSkillName : tactic.defenseSkillName;
  const tacticSkillDesc = isPlayer ? tactic.siegeDesc : tactic.defenseDesc;
  const tacticIcon = isPlayer ? tactic.siegeIcon : tactic.defenseIcon;

  return (
    <div
      className={`w-full p-2 rounded-2xl border transition-all relative overflow-hidden shadow-lg ${
        isPlayer
          ? 'bg-gradient-to-r from-[#0d0f14]/95 via-[#12141a]/95 to-[#090a0d]/95 border-[#c8aa6e55] shadow-[#c8aa6e15]'
          : 'bg-gradient-to-r from-[#1c0c16]/95 via-[#270e1c]/95 to-[#140810]/95 border-[#ff416c55] shadow-[#ff416c15]'
      } ${isActing ? (isPlayer ? 'ring-2 ring-[#c8aa6e] animate-pulse' : 'ring-2 ring-[#ff416c] animate-pulse') : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {/* 좌측: 오퍼레이터 대형 포트레이트 */}
        <div
          className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 ${
            isPlayer
              ? 'border-[#c8aa6e] shadow-[0_0_10px_rgba(200, 170, 110,0.4)]'
              : 'border-[#ff416c] shadow-[0_0_10px_rgba(255,65,108,0.4)]'
          } bg-[#0c1222] flex items-center justify-center`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hero?.name || 'Operator'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl">{tacticIcon || '📡'}</span>
          )}
          <span className="absolute bottom-0.5 right-0.5 text-[7.5px] font-mono font-black bg-black/85 px-1 py-0.2 rounded text-[#ffd54f] border border-[#ffd54f]/40 leading-none">
            Lv.{hero?.level || 1}
          </span>
          <span className={`absolute top-0.5 left-0.5 text-[6.5px] font-bold px-1 py-0.2 rounded leading-none ${isPlayer ? 'bg-[#c8aa6e]/80 text-black' : 'bg-[#ff416c]/80 text-white'}`}>
            {isPlayer ? '🎯 OPERATOR' : '🛡️ DEF-OP'}
          </span>
        </div>

        {/* 중앙: 오퍼레이터 이름, 성향, 전술 정보 */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                  isPlayer
                    ? 'bg-[#c8aa6e25] text-[#c8aa6e] border border-[#c8aa6e66]'
                    : 'bg-[#ff416c25] text-[#ff80ab] border border-[#ff416c66]'
                }`}
              >
                {isPlayer ? '공성 전술 오퍼레이터' : '수성 방어 오퍼레이터'}
              </span>
              <span className="text-xs font-black text-white truncate">
                {hero?.name || (isPlayer ? '원정대 오퍼레이터' : '수비대 오퍼레이터')}
              </span>
              <span className="text-[8px] font-bold text-[#ffd54f] px-1 py-0.2 bg-[#ffd54f]/10 rounded border border-[#ffd54f]/30 shrink-0 font-mono">
                {tactic.trait}
              </span>
            </div>
            <span className="text-[9px] text-[#8b9bb4] shrink-0 font-mono">
              {clsName} ({tactic.name})
            </span>
          </div>

          {/* 전술 스킬 요약 패널 */}
          <div className="bg-black/40 rounded-lg px-2 py-0.5 border border-white/10 flex items-center justify-between gap-1.5 mt-1 text-[8.5px]">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-base shrink-0">{tacticIcon}</span>
              <span className="text-[#ffd54f] font-bold shrink-0">
                [{tacticSkillName}]:
              </span>
              <span className="text-[#cfd8e8] truncate text-[8px]">
                {tacticSkillDesc}
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 pl-1.5 border-l border-white/10 font-mono text-[7px] text-[#c8aa6e]">
              계수 {isPlayer ? `${Math.round(tactic.siegePower * 100)}%` : `${Math.round(tactic.defensePower * 100)}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CombatLogItem {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  skillName?: string;
  side: 'player' | 'enemy';
}

interface ClashData {
  attacker: InvasionCombatant | { name: string; icon: string; className: string; level: number; currentHp: number; maxHp: number; currentMp: number; maxMp: number; def: number; classId: string; position?: string };
  defender: InvasionCombatant | { name: string; icon: string; className: string; level: number; currentHp: number; maxHp: number; currentMp: number; maxMp: number; def: number; classId: string; position?: string };
  skill: Skill;
  damage: number;
  isCrit: boolean;
  isPlayerAttacking: boolean;
}

interface Props {
  target: InvasionTarget;
  targetResource?: ResourceType;
  onFinish: (isWin: boolean, plunderedAmount: number, rewardCoins: number) => void;
  onRetreat: () => void;
}

export const InvasionBattleScreen: React.FC<Props> = ({
  target,
  targetResource = 'gold',
  onFinish,
  onRetreat,
}) => {
  const { gm } = useGameManager();

  // 1. 공격측 (3인 결사대 + 1인 오퍼레이터)
  const [playerTeam, setPlayerTeam] = useState<InvasionCombatant[]>([]);
  const [playerOperator, setPlayerOperator] = useState<Mercenary | null>(null);
  const playerOperatorRef = useRef<Mercenary | null>(null);

  // 2. 수성측 결사대 (차원 보호막 결속, 좌/우 포탑 사수, 수성 오퍼레이터)
  const [oppTeam, setOppTeam] = useState<InvasionCombatant[]>([]);
  const [barrierHero, setBarrierHero] = useState<Mercenary | any | null>(null);
  const [leftTurretHero, setLeftTurretHero] = useState<Mercenary | any | null>(null);
  const [rightTurretHero, setRightTurretHero] = useState<Mercenary | any | null>(null);
  const [oppOperator, setOppOperator] = useState<any | null>(null);
  const oppOperatorRef = useRef<any | null>(null);
  const [oppTower, setOppTower] = useState<any>(null);
  const oppTowerRef = useRef<any>(null);
  const [barrierHeroBonus, setBarrierHeroBonus] = useState<{ hp: number; def: number }>({ hp: 0, def: 0 });

  // 3. 차원 보호막 및 좌/우 2개 전술 타워 (기본 HP: 보호막 2,500 / 타워 400)
  const [barrierState, setBarrierState] = useState<SiegeTargetObject>({
    id: 'dimensional_barrier',
    name: '차원 왜곡 보호막',
    currentHp: 2500,
    maxHp: 2500,
    def: 25,
    icon: '🛡️',
    type: 'barrier',
    side: 'center',
    position: 'back',
    isDestroyed: false,
    description: '수비대 전면을 가로지르는 절대 차원 역장',
    statusEffects: [],
    luck: 10,
  });
  const [turretLeft, setTurretLeft] = useState<SiegeTargetObject>({
    id: 'turret_left',
    name: '좌측 전술 포탑',
    currentHp: 400,
    maxHp: 400,
    def: 20,
    icon: '🗼',
    type: 'turret',
    side: 'left',
    position: 'front',
    isDestroyed: false,
    description: '화력 공세 & 요격 사격 (광역 폭격 / 집중 요격)',
    statusEffects: [],
    luck: 10,
  });
  const [turretRight, setTurretRight] = useState<SiegeTargetObject>({
    id: 'turret_right',
    name: '우측 방호 포탑',
    currentHp: 400,
    maxHp: 400,
    def: 20,
    icon: '🗼',
    type: 'turret',
    side: 'right',
    position: 'front',
    isDestroyed: false,
    description: '성역 결계 & 전술 지원 (마나·행운 기반 증폭)',
    statusEffects: [],
    luck: 15,
  });

  const barrierStateRef = useRef(barrierState);
  const turretLeftRef = useRef(turretLeft);
  const turretRightRef = useRef(turretRight);
  barrierStateRef.current = barrierState;
  turretLeftRef.current = turretLeft;
  turretRightRef.current = turretRight;

  // 4. 플레이어 수동 타겟 지정 상태 (보호막 또는 타워 집중 공격)
  const [selectedFocusTargetId, setSelectedFocusTargetId] = useState<'dimensional_barrier' | 'turret_left' | 'turret_right'>('dimensional_barrier');

  // 5. 전술 산출 (공성 전술 & 수성 전술)
  const playerTactic: SiegeTacticDefinition = playerOperator
    ? resolveSiegeTactic(playerOperator.trait, CHARACTER_CLASSES[playerOperator.classId]?.role)
    : resolveSiegeTactic('균형잡힌 정예', 'tank');

  const oppTactic: SiegeTacticDefinition = oppOperator
    ? resolveSiegeTactic(oppOperator.trait, CHARACTER_CLASSES[oppOperator.classId]?.role)
    : resolveSiegeTactic('강철의 수호자', 'tank');

  // 전투 및 연출 상태
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null);
  const [battleSpeed, setBattleSpeed] = useState<2 | 2.5>(2);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [isBarrierHit, setIsBarrierHit] = useState(false);

  // 🔥 피버 게이지 상태
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const [oppFeverBadges, setOppFeverBadges] = useState<FeverBadgeType[]>([]);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  const oppFeverBadgesRef = useRef<FeverBadgeType[]>([]);
  feverBadgesRef.current = feverBadges;
  oppFeverBadgesRef.current = oppFeverBadges;

  // 📊 전투 메트릭스 및 로그
  const [combatMetrics, setCombatMetrics] = useState<CombatantMetrics[]>([]);
  const combatMetricsRef = useRef<Record<string, CombatantMetrics>>({});
  const [battleLogs, setBattleLogs] = useState<CombatLogItem[]>([]);
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string }>({
    text: '🏰 차원 공성전 프로토콜 개시 (3인 결사대 + 1인 오퍼레이터)',
    sub: `${MAX_SIEGE_ROUNDS}라운드 내에 적 영지의 차원 보호막을 돌파하십시오!`,
    color: '#c8aa6e',
  });

  const [battleResult, setBattleResult] = useState<{
    win: boolean;
    reason: string;
    plunderedAmount: number;
    rewardCoins: number;
    plunderedItems?: Array<{ resKey: any; name: string; icon: string; category: string; amount: number }>;
  } | null>(null);

  // 카운트다운 오버레이
  const [countdown, setCountdown] = useState<number | 'ENGAGE' | null>(3);

  // 실시간 교전 상세 Clash 패널
  const [clashData, setClashData] = useState<ClashData | null>(null);
  const [isClashZoomed, setIsClashZoomed] = useState(false);
  const [activeTargetDefenderId, setActiveTargetDefenderId] = useState<string | null>(null);

  const isProcessingRef = useRef(false);
  const playerTeamRef = useRef<InvasionCombatant[]>([]);
  const oppTeamRef = useRef<InvasionCombatant[]>([]);
  playerTeamRef.current = playerTeam;
  oppTeamRef.current = oppTeam;

  // ── 1. 부대 및 차원 보호막 & 2대 전술 타워 초기화 ────────────────────────────
  useEffect(() => {
    // 1-1. 아군 3인 결사대 + 1인 오퍼레이터
    const { mainHeroes, operatorHero, leaderHero } = gm.getDimensionalDeck();
    const pSource = mainHeroes.length >= 3
      ? mainHeroes.slice(0, 3)
      : (gm.barracks.length >= 3 ? gm.barracks.slice(0, 3) : gm.party.slice(0, 3));

    const resolvedOp = operatorHero || leaderHero || (gm.barracks[3] || gm.party[3] || null);
    setPlayerOperator(resolvedOp);
    playerOperatorRef.current = resolvedOp;

    // 🗼 수비측 방어 전술 타워 레벨 산출 (최대 5레벨)
    const oppTowerData = target.tacticalTower || {
      attack: { tier1: Math.min(5, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(5, Math.max(0, (target.gateLevel || 6) - 6)), tier3: Math.min(5, Math.max(0, (target.gateLevel || 6) - 7)) },
      defense: { tier1: Math.min(5, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(5, Math.max(0, (target.gateLevel || 6) - 6)), tier3: Math.min(5, Math.max(0, (target.gateLevel || 6) - 7)) },
      utility: { tier1: Math.min(5, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(5, Math.max(0, (target.gateLevel || 6) - 6)), tier3: Math.min(5, Math.max(0, (target.gateLevel || 6) - 7)) },
    };
    setOppTower(oppTowerData);
    oppTowerRef.current = oppTowerData;

    const totalTowerLv =
      (oppTowerData.attack?.tier1 || 0) + (oppTowerData.attack?.tier2 || 0) + (oppTowerData.attack?.tier3 || 0) +
      (oppTowerData.defense?.tier1 || 0) + (oppTowerData.defense?.tier2 || 0) + (oppTowerData.defense?.tier3 || 0) +
      (oppTowerData.utility?.tier1 || 0) + (oppTowerData.utility?.tier2 || 0) + (oppTowerData.utility?.tier3 || 0);

    // 1-2. 수성측 3인 수비 결사대 + 1인 오퍼레이터 매핑
    // Slot 0: 차원 보호막 결속 용병 (Tank) - 직접 공격하지 않고 체력/방어력 성벽 가산
    // Slot 1: 좌측 포탑 사수 (Gunner/Physical) - 포탑 턴에 공격, 기본 공격 시 화력 버프
    // Slot 2: 우측 포탑 사수 (Mage/Healer) - 포탑 턴에 공격, 스킬 사용 시 전술 버프
    // Slot 3: 수성 오퍼레이터 (Tactical Commander)
    const oppSquad = target.defenseSquad || [];
    const bHero = oppSquad[0] || null;
    const lTurretHero = oppSquad[1] || oppSquad[0] || null;
    const rTurretHero = oppSquad[2] || oppSquad[1] || oppSquad[0] || null;
    const oppOp = oppSquad[3] || oppSquad[oppSquad.length - 1] || null;

    setBarrierHero(bHero);
    setLeftTurretHero(lTurretHero);
    setRightTurretHero(rTurretHero);
    setOppOperator(oppOp);
    oppOperatorRef.current = oppOp;

    const baseGateLv = target.gateLevel || 6;

    // 🛡️ 차원 보호막 내구도 및 방어력 계산 (기본 2,500 HP 기준)
    const defTier1 = oppTowerData.defense?.tier1 || 0;
    const extraBarrierHp = bHero ? Math.round(bHero.maxHp * 0.35 * (1.0 + defTier1 * 0.20)) : 0;
    const extraBarrierDef = bHero ? Math.round((bHero.stats?.def || 0) * 0.50) : 0;
    setBarrierHeroBonus({ hp: extraBarrierHp, def: extraBarrierDef });

    const calcBarrierHp = 2500 + baseGateLv * 250 + totalTowerLv * 175 + extraBarrierHp;
    const barrierDef = 25 + baseGateLv * 3 + (oppTowerData.defense?.tier3 || 0) * 8 + extraBarrierDef;

    // 🗼 좌/우 전술 포탑 스펙 산출 (기본 400 HP 기준)
    const defTier2 = oppTowerData.defense?.tier2 || 0;
    const calcTurretHp = 400 + baseGateLv * 100 + totalTowerLv * 105;
    const turretDef = 20 + defTier2 * 4;
    const turretSpd = 15 + (oppTowerData.utility?.tier1 || 0) * 3;
    const turretLuck = 10 + (oppTowerData.utility?.tier2 || 0) * 2;

    const initBarrier: SiegeTargetObject = {
      id: 'dimensional_barrier',
      name: '차원 왜곡 보호막',
      currentHp: calcBarrierHp,
      maxHp: calcBarrierHp,
      def: barrierDef,
      icon: '🛡️',
      type: 'barrier',
      side: 'center',
      position: 'back',
      isDestroyed: false,
      description: bHero
        ? `게이트 Lv.${baseGateLv} | 결속 수호자: ${bHero.name} (+${extraBarrierHp.toLocaleString()} HP)`
        : `게이트 Lv.${baseGateLv} 에너지 공급 역장`,
      statusEffects: [],
      luck: turretLuck + (bHero ? Math.round((bHero.stats?.luck || 15) * 0.5) : 0),
    };
    const initLeftTurret: SiegeTargetObject = {
      id: 'turret_left',
      name: '좌측 전술 포탑',
      currentHp: calcTurretHp,
      maxHp: calcTurretHp,
      def: turretDef,
      icon: '🗼',
      type: 'turret',
      side: 'left',
      position: 'front',
      isDestroyed: false,
      description: lTurretHero
        ? `사수: ${lTurretHero.name} | 화력 복합 지원 (포탑+용병 공격력 합산)`
        : `자동 요격 포탑`,
      statusEffects: [],
      luck: turretLuck + (lTurretHero ? (lTurretHero.stats?.luck || 15) : 10),
    };
    const initRightTurret: SiegeTargetObject = {
      id: 'turret_right',
      name: '우측 방호 포탑',
      currentHp: calcTurretHp,
      maxHp: calcTurretHp,
      def: turretDef,
      icon: '🗼',
      type: 'turret',
      side: 'right',
      position: 'front',
      isDestroyed: false,
      description: rTurretHero
        ? `사수: ${rTurretHero.name} | 전술 증폭 지원 (마나·행운 기반 전술 지원)`
        : `성역 결계 포탑`,
      statusEffects: [],
      luck: turretLuck + (rTurretHero ? (rTurretHero.stats?.luck || 15) : 10),
    };

    setBarrierState(initBarrier);
    setTurretLeft(initLeftTurret);
    setTurretRight(initRightTurret);
    barrierStateRef.current = initBarrier;
    turretLeftRef.current = initLeftTurret;
    turretRightRef.current = initRightTurret;

    // 아군 결사대 3인 변환
    const pCombatants: InvasionCombatant[] = pSource.slice(0, 3).map((h, idx) => {
      const eff = gm.getHeroEffectiveStats(h);
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['sharpshooter'] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '공성 기본 타격',
          description: '적 구조물 및 방어선 물리/마법 타격',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '⚔️',
        },
        ...(cls?.skills || []),
        ...(cls?.specialSkill ? [cls.specialSkill] : []),
      ];

      // ⚡ 유틸 연구: 침입자 속도(tier1 -% 감속) 및 행운(tier3 -% 감속) 적용
      const utilTier1 = oppTowerData.utility?.tier1 || 0;
      const utilTier3 = oppTowerData.utility?.tier3 || 0;
      const debuffedSpd = Math.max(5, Math.round(eff.spd * (1 - utilTier1 * 0.05)));
      const debuffedLuck = Math.max(1, Math.round(eff.luck * (1 - utilTier3 * 0.10)));

      return {
        id: h.id,
        name: h.name,
        classId: h.classId,
        className: cls?.name || '결사대원',
        grade: h.grade,
        level: h.level,
        position: idx < 2 ? 'front' : 'back',
        currentHp: eff.maxHp,
        maxHp: eff.maxHp,
        currentMp: eff.maxMp,
        maxMp: eff.maxMp,
        atk: eff.atk,
        def: eff.def,
        spd: debuffedSpd,
        luck: debuffedLuck,
        skills: allSkills,
        isPlayer: true,
        cooldowns: {},
        statusEffects: [],
        icon: cls?.skills?.[0]?.icon || '⚔️',
        trait: h.trait,
        role: cls?.role || 'tank',
      };
    });

    // 1-3. 수성측 포탑 전투 유닛 (포탑의 체력/방어/속도/행운 + 탑승 사수의 공격력 및 스킬)
    const oCombatants: InvasionCombatant[] = [];

    // 좌측 포탑 사수 (물리/사격 화력 지원)
    if (lTurretHero || target.gateLevel) {
      const cls = (lTurretHero ? CHARACTER_CLASSES[lTurretHero.classId] : undefined) || CHARACTER_CLASSES['sharpshooter'] || CHARACTER_CLASSES['squire'];
      const heroSkills: Skill[] = lTurretHero ? [
        {
          id: 'basic_attack',
          name: '포탑 요격 사격',
          description: '좌측 타워 기본 사격 (화력 버프 적용)',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '🗼🏹',
        },
        ...(cls?.skills || []),
        ...(cls?.specialSkill ? [cls.specialSkill] : []),
      ] : [
        {
          id: 'basic_attack',
          name: '포탑 요격 사격',
          description: '좌측 타워 기본 사격',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '🗼🏹',
        }
      ];

      const leftTurretBaseAtk = 90 + baseGateLv * 12 + (oppTowerData.attack?.tier1 || 0) * 15;
      const leftTurretHeroAtk = lTurretHero ? lTurretHero.stats.atk : 0;
      const leftTurretTotalAtk = leftTurretBaseAtk + leftTurretHeroAtk;

      oCombatants.push({
        id: 'turret_left',
        name: lTurretHero ? `좌측 포탑 [${lTurretHero.name}]` : '좌측 전술 포탑',
        classId: lTurretHero?.classId || 'sharpshooter',
        className: cls?.name || '포탑 사수',
        grade: lTurretHero?.grade || 'veteran',
        level: lTurretHero?.level || baseGateLv,
        position: 'back',
        currentHp: calcTurretHp,
        maxHp: calcTurretHp,
        currentMp: lTurretHero ? lTurretHero.currentMp : 100,
        maxMp: lTurretHero ? lTurretHero.maxMp : 100,
        atk: leftTurretTotalAtk,
        def: turretDef,
        spd: turretSpd,
        luck: turretLuck,
        skills: heroSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: [],
        icon: '🗼',
        trait: lTurretHero?.trait,
        role: cls?.role || 'gunner',
      });
    }

    // 우측 방호 포탑 사수 (마법/전술 증폭 지원 - 마나 및 행운 특화)
    if (rTurretHero || target.gateLevel) {
      const cls = (rTurretHero ? CHARACTER_CLASSES[rTurretHero.classId] : undefined) || CHARACTER_CLASSES['calamity_mage'] || CHARACTER_CLASSES['bishop'] || CHARACTER_CLASSES['squire'];
      const heroSkills: Skill[] = rTurretHero ? [
        {
          id: 'basic_attack',
          name: '성역 결계 사격',
          description: '우측 타워 기본 사격',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '🗼✨',
        },
        ...(cls?.skills || []),
        ...(cls?.specialSkill ? [cls.specialSkill] : []),
      ] : [
        {
          id: 'basic_attack',
          name: '방호 마력 방출',
          description: '우측 타워 기본 사격',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '🗼✨',
        }
      ];

      const rightTurretMaxMp = 120 + (rTurretHero ? rTurretHero.maxMp : 60);
      const rightTurretLuck = turretLuck + (rTurretHero ? (rTurretHero.stats?.luck || 15) : 10);

      oCombatants.push({
        id: 'turret_right',
        name: rTurretHero ? `우측 포탑 [${rTurretHero.name}]` : '우측 방호 포탑',
        classId: rTurretHero?.classId || 'calamity_mage',
        className: cls?.name || '전술 사수',
        grade: rTurretHero?.grade || 'veteran',
        level: rTurretHero?.level || baseGateLv,
        position: 'back',
        currentHp: calcTurretHp,
        maxHp: calcTurretHp,
        currentMp: rightTurretMaxMp,
        maxMp: rightTurretMaxMp,
        atk: rTurretHero ? rTurretHero.stats.atk : 110 + baseGateLv * 10,
        def: turretDef,
        spd: turretSpd,
        luck: rightTurretLuck,
        skills: heroSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: [],
        icon: '🗼',
        trait: rTurretHero?.trait,
        role: cls?.role || 'dealer_mag',
      });
    }

    setPlayerTeam(pCombatants);
    setOppTeam(oCombatants);

    // 딜미터기 초기화
    const initMetrics: Record<string, CombatantMetrics> = {};
    pCombatants.forEach(c => {
      initMetrics[c.id] = {
        id: c.id,
        name: c.name,
        className: c.className,
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    });
    if (resolvedOp) {
      initMetrics[resolvedOp.id] = {
        id: resolvedOp.id,
        name: `${resolvedOp.name} (📡오퍼레이터)`,
        className: CHARACTER_CLASSES[resolvedOp.classId]?.name || '오퍼레이터',
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    if (bHero) {
      initMetrics[`barrier_${bHero.id}`] = {
        id: `barrier_${bHero.id}`,
        name: `${bHero.name} (🛡️성벽 결속 수호자)`,
        className: CHARACTER_CLASSES[bHero.classId]?.name || '수호자',
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    oCombatants.forEach(c => {
      initMetrics[c.id] = {
        id: c.id,
        name: c.name,
        className: c.className,
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    });
    if (oppOp) {
      initMetrics[`opp_op_${oppOp.id}`] = {
        id: `opp_op_${oppOp.id}`,
        name: `${oppOp.name} (🛡️수성 오퍼레이터)`,
        className: CHARACTER_CLASSES[oppOp.classId]?.name || '오퍼레이터',
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }

    combatMetricsRef.current = initMetrics;
    setCombatMetrics(Object.values(initMetrics));
    setFeverBadges([]);
    setOppFeverBadges([]);
    feverBadgesRef.current = [];
    oppFeverBadgesRef.current = [];

    SoundManager.getInstance().playBgm('battle');
    gm.emit('phaserSceneChange', 'invasion_battle');

    return () => {
      gm.emit('phaserSceneChange', 'invasion');
    };
  }, [target, gm]);

  // 🔥 아군 피버 뱃지
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 💀 적군 피버 뱃지
  const addOppFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setOppFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      oppFeverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 🎯 좌표 계산 헬퍼
  const getCombatantCardPos = useCallback((id: string, isPlayerSide: boolean) => {
    if (isPlayerSide) {
      const idx = playerTeamRef.current.findIndex(c => c.id === id);
      const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
      return { x: colX, y: 78 };
    } else {
      if (id === 'dimensional_barrier') return { x: 50, y: 38 };
      if (id === 'turret_left') return { x: 18, y: 32 };
      if (id === 'turret_right') return { x: 82, y: 32 };
      const idx = oppTeamRef.current.findIndex(c => c.id === id);
      const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
      return { x: colX, y: 20 };
    }
  }, []);

  // 📡 아군 오퍼레이터 공성 전술 총공격 (ALL-OUT SIEGE TACTIC)
  const triggerPlayerSiegeTactic = useCallback(() => {
    const op = playerOperatorRef.current;
    const tactic = playerTactic;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: `🎯 [공성 전술 발동] ${op ? op.name : '오퍼레이터'} ➔ ${tactic.siegeSkillName}!`,
      sub: `${tactic.siegeDesc} (공성 파괴력 ${Math.round(tactic.siegePower * 100)}%)`,
      color: '#c8aa6e',
    });

    const aliveP = playerTeamRef.current.filter(c => c.currentHp > 0);
    const avgAtk = aliveP.length > 0 ? aliveP.reduce((s, h) => s + h.atk, 0) / aliveP.length : 150;
    const siegeDmg = Math.max(120, Math.round(avgAtk * tactic.siegePower * 1.8));

    // 차원 보호막에 대규모 피해 가함
    const curBarrier = { ...barrierStateRef.current };
    const barrierDefDmg = Math.max(80, Math.round(siegeDmg * (100 / (100 + curBarrier.def * INVASION_DEF_SCALE))));
    curBarrier.currentHp = Math.max(0, curBarrier.currentHp - barrierDefDmg);
    if (curBarrier.currentHp <= 0) curBarrier.isDestroyed = true;
    barrierStateRef.current = curBarrier;
    setBarrierState(curBarrier);

    // 타워가 살아있다면 타워에도 40% 분산 타격
    const curL = { ...turretLeftRef.current };
    const curR = { ...turretRightRef.current };
    const turretSplash = Math.round(barrierDefDmg * 0.4);
    if (!curL.isDestroyed) {
      curL.currentHp = Math.max(0, curL.currentHp - turretSplash);
      if (curL.currentHp <= 0) curL.isDestroyed = true;
      turretLeftRef.current = curL;
      setTurretLeft(curL);
    }
    if (!curR.isDestroyed) {
      curR.currentHp = Math.max(0, curR.currentHp - turretSplash);
      if (curR.currentHp <= 0) curR.isDestroyed = true;
      turretRightRef.current = curR;
      setTurretRight(curR);
    }

    oppTeamRef.current = oppTeamRef.current.map(c => {
      if (c.id === 'turret_left') return { ...c, currentHp: curL.currentHp };
      if (c.id === 'turret_right') return { ...c, currentHp: curR.currentHp };
      return c;
    });
    setOppTeam([...oppTeamRef.current]);

    if (op) {
      const opMetric = combatMetricsRef.current[op.id];
      if (opMetric) {
        opMetric.damageDealt += barrierDefDmg + turretSplash * 2;
        opMetric.actionsCount = (opMetric.actionsCount || 0) + 1;
        opMetric.critCount += 1;
      }
    }

    // VFX 연출
    setIsBarrierHit(true);
    setTimeout(() => setIsBarrierHit(false), 500);

    setVfxList(prev => [
      ...prev,
      {
        id: `tactic_siege_vfx_${Date.now()}`,
        type: 'fire',
        damage: barrierDefDmg,
        isCrit: true,
        x: 50,
        y: 38,
        duration: 700,
      },
    ]);
    gm.emit('battleHitEffect', { x: 50, y: 38, color: 0xc8aa6e, isCrit: true, type: 'fire' });

    setBattleLogs(prev => [
      ...prev.slice(-30),
      {
        round: currentRoundNumber,
        attacker: `🎯 ${op ? op.name : '오퍼레이터'}`,
        defender: '차원 왜곡 보호막',
        damage: barrierDefDmg,
        isCrit: true,
        skillName: tactic.siegeSkillName,
        side: 'player',
      },
    ]);

    setFeverBadges([]);
    feverBadgesRef.current = [];
  }, [playerTactic, currentRoundNumber, gm]);

  // 🛡️ 수성 오퍼레이터 수성 전술 총방어 (ALL-OUT DEFENSE TACTIC)
  const triggerEnemyDefenseTactic = useCallback(() => {
    const op = oppOperatorRef.current;
    const tactic = oppTactic;

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: `🛡️ [수성 전술 발동] ${op ? op.name : '수비 오퍼레이터'} ➔ ${tactic.defenseSkillName}!`,
      sub: `${tactic.defenseDesc}`,
      color: '#ff416c',
    });

    // 차원 보호막 및 타워 수복
    const curBarrier = { ...barrierStateRef.current };
    if (!curBarrier.isDestroyed) {
      const repairAmt = Math.max(300, Math.round(curBarrier.maxHp * (tactic.defensePower * 0.08 + 0.04)));
      curBarrier.currentHp = Math.min(curBarrier.maxHp, curBarrier.currentHp + repairAmt);
      barrierStateRef.current = curBarrier;
      setBarrierState(curBarrier);

      setVfxList(prev => [
        ...prev,
        {
          id: `tactic_def_heal_${Date.now()}`,
          type: 'holy_heal',
          text: `+${repairAmt.toLocaleString()} 🛡️ 결계 수복`,
          damage: 0,
          isHeal: true,
          x: 50,
          y: 38,
          duration: 600,
        },
      ]);
    }

    const curL = { ...turretLeftRef.current };
    const curR = { ...turretRightRef.current };
    if (!curL.isDestroyed) {
      const repL = Math.round(curL.maxHp * 0.15);
      curL.currentHp = Math.min(curL.maxHp, curL.currentHp + repL);
      turretLeftRef.current = curL;
      setTurretLeft(curL);
    }
    if (!curR.isDestroyed) {
      const repR = Math.round(curR.maxHp * 0.15);
      curR.currentHp = Math.min(curR.maxHp, curR.currentHp + repR);
      turretRightRef.current = curR;
      setTurretRight(curR);
    }
    oppTeamRef.current = oppTeamRef.current.map(c => {
      if (c.id === 'turret_left') return { ...c, currentHp: curL.currentHp };
      if (c.id === 'turret_right') return { ...c, currentHp: curR.currentHp };
      return c;
    });
    setOppTeam([...oppTeamRef.current]);

    // 침입자 아군에게 충격파 반격
    const aliveP = playerTeamRef.current.filter(c => c.currentHp > 0);
    const counterDmg = Math.max(15, Math.round(50 * (tactic.defensePower + 1)));
    const updatedP = playerTeamRef.current.map(c => {
      if (c.currentHp <= 0) return c;
      let effectiveDef = c.def;
      if ((c.statusEffects || []).some(e => e.id === 'burn')) effectiveDef = Math.round(effectiveDef * 0.5);
      if ((c.statusEffects || []).some(e => e.id === 'freeze')) effectiveDef = Math.round(effectiveDef * 1.4);
      const finalD = Math.max(10, Math.round(counterDmg * (100 / (100 + effectiveDef * INVASION_DEF_SCALE))));
      if (combatMetricsRef.current[c.id]) combatMetricsRef.current[c.id].damageTaken += finalD;
      return { ...c, currentHp: Math.max(0, c.currentHp - finalD) };
    });

    aliveP.forEach((p, idx) => {
      const pos = getCombatantCardPos(p.id, true);
      setTimeout(() => {
        setVfxList(prev => [
          ...prev,
          {
            id: `vfx_op_counter_${Date.now()}_${idx}`,
            type: 'lightning',
            damage: counterDmg,
            x: pos.x,
            y: pos.y,
            duration: 400,
          },
        ]);
      }, idx * 60);
    });

    playerTeamRef.current = updatedP;
    setPlayerTeam(updatedP);

    setOppFeverBadges([]);
    oppFeverBadgesRef.current = [];
  }, [oppTactic, getCombatantCardPos]);

  // ⏱️ 카운트다운 타이머
  useEffect(() => {
    SoundManager.getInstance().play('heavy_hit');
    const timer3 = setTimeout(() => {
      setCountdown(2);
      SoundManager.getInstance().play('lightning');
    }, 1000);

    const timer2 = setTimeout(() => {
      setCountdown(1);
      SoundManager.getInstance().play('fire');
    }, 2000);

    const timer1 = setTimeout(() => {
      setCountdown('ENGAGE');
      SoundManager.getInstance().play('crit');
    }, 3000);

    const timerEnd = setTimeout(() => {
      setCountdown(null);
    }, 4100);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timer1);
      clearTimeout(timerEnd);
    };
  }, []);

  // ── 2. 단일 턴 실행 (공성 루프) ───────────────────────────────────────
  const executeSingleTurn = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const currentP = [...playerTeamRef.current];
    const currentO = [...oppTeamRef.current];
    const aliveP = currentP.filter(c => c.currentHp > 0);
    const aliveO = currentO.filter(c => {
      if (c.id === 'turret_left') return !turretLeftRef.current.isDestroyed && turretLeftRef.current.currentHp > 0;
      if (c.id === 'turret_right') return !turretRightRef.current.isDestroyed && turretRightRef.current.currentHp > 0;
      return c.currentHp > 0;
    });

    const curBarrier = { ...barrierStateRef.current };
    const curL = { ...turretLeftRef.current };
    const curR = { ...turretRightRef.current };

    // 🏆 승패 판정 1: 차원 보호막 HP <= 0 -> 공성측 대승리!
    if (curBarrier.currentHp <= 0) {
      const result = gm.executeInvasionPlunder(target, true);
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setBattleResult({
        win: true,
        reason: '차원 왜곡 보호막을 돌파하고 영지 핵심부를 함락시켰습니다!',
        plunderedAmount: result.plunderedAmount,
        rewardCoins: 0,
        plunderedItems: result.plunderedItems,
      });
      SoundManager.getInstance().play('victory');
      isProcessingRef.current = false;
      return;
    }

    // 💀 승패 판정 2: 아군 결사대 3인 전멸 -> 침공 실패
    if (aliveP.length === 0) {
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setBattleResult({
        win: false,
        reason: '3인 원정 결사대가 모두 쓰러져 차원 보호막을 돌파하지 못했습니다.',
        plunderedAmount: 0,
        rewardCoins: 0,
      });
      SoundManager.getInstance().play('defeat');
      isProcessingRef.current = false;
      return;
    }

    // 🛡️ 승패 판정 3: 라운드 초과 (7라운드 방어 성공) -> 수성측 승리
    if (Math.floor(currentRoundNumber) > MAX_SIEGE_ROUNDS || currentRoundNumber >= MAX_SIEGE_ROUNDS + 1) {
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setBattleResult({
        win: false,
        reason: `제한 라운드(${MAX_SIEGE_ROUNDS}R) 동안 차원 보호막이 방어에 성공하여 침공이 격퇴되었습니다.`,
        plunderedAmount: 0,
        rewardCoins: 0,
      });
      SoundManager.getInstance().play('defeat');
      isProcessingRef.current = false;
      return;
    }

    // 행동자 선정: 아군 3인과 생존 포탑 중 속도 기반 추첨
    const allLivingCombatants = [...aliveP, ...aliveO].sort((a, b) => b.spd - a.spd);
    const attacker = allLivingCombatants.length > 0
      ? allLivingCombatants[Math.floor(Math.random() * allLivingCombatants.length)]
      : aliveP[0];
    if (!attacker) {
      isProcessingRef.current = false;
      return;
    }

    setActiveCombatantId(attacker.id);
    const isAttackerPlayer = attacker.isPlayer;

    let shouldSkipTurn = false;
    const skipReasons: string[] = [];
    let hasDiedFromDot = false;

    // 🔥 상태이상 처리 (PvE BattleScreen.tsx 표준 규격 100% 동일 적용)
    if (attacker.statusEffects && attacker.statusEffects.length > 0) {
      const pos = getCombatantCardPos(attacker.id, attacker.isPlayer);

      attacker.statusEffects = attacker.statusEffects.filter(se => {
        if (se.id === 'freeze') {
          // ❄️ 결빙: 최대 HP 4% 동상 피해 & 방어력 +40% 외피 & 100% 행동 불가(턴 스킵)
          const dot = Math.max(1, Math.round(attacker.maxHp * 0.04));
          attacker.currentHp = Math.max(0, attacker.currentHp - dot);
          skipReasons.push('❄️ 극저온 빙결');
          shouldSkipTurn = true;
          SoundManager.getInstance().play('ice');
          setVfxList(prev => [...prev, { id: `vfx_freeze_${Date.now()}_${Math.random()}`, type: 'slash', damage: dot, x: pos.x, y: pos.y, duration: 350 }]);
        } else if (se.id === 'poison') {
          // ☠️ 맹독: 최대 HP 14% 치명적 중독 피해 (최대 DoT)
          const dot = Math.max(1, Math.round(attacker.maxHp * 0.14));
          attacker.currentHp = Math.max(0, attacker.currentHp - dot);
          SoundManager.getInstance().play('poison');
          setVfxList(prev => [...prev, { id: `vfx_poison_${Date.now()}_${Math.random()}`, type: 'bullet', damage: dot, x: pos.x, y: pos.y, duration: 350 }]);
        } else if (se.id === 'burn') {
          // 🔥 화상: 최대 HP 8% 화염 피해 & 방어력 50% 분쇄
          const dot = Math.max(1, Math.round(attacker.maxHp * 0.08));
          attacker.currentHp = Math.max(0, attacker.currentHp - dot);
          SoundManager.getInstance().play('fire');
          setVfxList(prev => [...prev, { id: `vfx_burn_${Date.now()}_${Math.random()}`, type: 'fire', damage: dot, x: pos.x, y: pos.y, duration: 350 }]);
        } else if (se.id === 'bleed') {
          // 🩸 출혈: 최대 HP 7% 지속 피해
          const dot = Math.max(1, Math.round(attacker.maxHp * 0.07));
          attacker.currentHp = Math.max(0, attacker.currentHp - dot);
          SoundManager.getInstance().play('bleed');
          setVfxList(prev => [...prev, { id: `vfx_bleed_${Date.now()}_${Math.random()}`, type: 'slash', damage: dot, x: pos.x, y: pos.y, duration: 350 }]);
        } else if (se.id === 'stun') {
          // ⚡ 기절: 100% 행동 불가(턴 스킵)
          skipReasons.push('⚡ 전자기 기절');
          shouldSkipTurn = true;
          SoundManager.getInstance().play('stun');
        }

        se.duration = (se.duration || 1) - 1;
        return (se.duration || 0) > 0;
      });

      // 포탑 공격자 상태 실시간 동기화
      if (attacker.id === 'turret_left') {
        turretLeftRef.current.statusEffects = [...attacker.statusEffects];
        turretLeftRef.current.currentHp = attacker.currentHp;
        if (attacker.currentHp <= 0) turretLeftRef.current.isDestroyed = true;
        setTurretLeft({ ...turretLeftRef.current });
      } else if (attacker.id === 'turret_right') {
        turretRightRef.current.statusEffects = [...attacker.statusEffects];
        turretRightRef.current.currentHp = attacker.currentHp;
        if (attacker.currentHp <= 0) turretRightRef.current.isDestroyed = true;
        setTurretRight({ ...turretRightRef.current });
      }

      if (attacker.currentHp <= 0) {
        hasDiedFromDot = true;
      }
    }

    // DoT 지속 피해로 사망 시 즉시 턴 종료
    if (hasDiedFromDot) {
      if (attacker.id === 'turret_left') {
        turretLeftRef.current.isDestroyed = true;
        setTurretLeft({ ...turretLeftRef.current });
      } else if (attacker.id === 'turret_right') {
        turretRightRef.current.isDestroyed = true;
        setTurretRight({ ...turretRightRef.current });
      }
      setActionBanner({
        text: `💀 [지속 피해 격멸] ${attacker.name}!`,
        sub: `중독/화상/동상/출혈 등의 치명적인 지속 피해를 견디지 못하고 쓰러졌습니다!`,
        color: '#ff416c',
      });
      setPlayerTeam([...currentP]);
      setOppTeam([...currentO]);
      setTimeout(() => {
        setActiveCombatantId(null);
        isProcessingRef.current = false;
      }, 300);
      return;
    }

    // 기절 또는 결빙으로 인한 행동 불가 턴 스킵
    if (shouldSkipTurn && skipReasons.length > 0) {
      setActionBanner({
        text: `⚠️ [행동 불가] ${attacker.name}!`,
        sub: `[${skipReasons.join(', ')}] 상태로 인해 이번 턴 아무 행동도 하지 못하고 턴을 넘깁니다!`,
        color: '#ffd54f',
      });
      setPlayerTeam([...currentP]);
      setOppTeam([...currentO]);
      setTimeout(() => {
        setActiveCombatantId(null);
        isProcessingRef.current = false;
        setCurrentRoundNumber(r => Number((r + 0.1).toFixed(2)));
      }, battleSpeed === 2 ? 300 : 450);
      return;
    }

    // ⚡ 유틸 연구 (tier2): 침입자 스킬 마나 소모량 +15% * tier2
    const utilTier2 = isAttackerPlayer ? (oppTowerRef.current?.utility?.tier2 || 0) : 0;
    const manaTaxMult = 1.0 + utilTier2 * 0.15;

    // 사용 가능한 스킬 선택
    const readySkills = attacker.skills.filter(s => {
      if (s.id === 'basic_attack') return true;
      const effectiveCost = Math.round(s.manaCost * manaTaxMult);
      const cd = attacker.cooldowns[s.id] || 0;
      return cd === 0 && attacker.currentMp >= effectiveCost;
    });
    const chosenSkill = readySkills.length > 1 && Math.random() < 0.65
      ? readySkills[Math.floor(Math.random() * (readySkills.length - 1)) + 1]
      : readySkills[0];

    if (chosenSkill.id !== 'basic_attack') {
      const effectiveCost = Math.round(chosenSkill.manaCost * manaTaxMult);
      attacker.currentMp = Math.max(0, attacker.currentMp - effectiveCost);
      attacker.cooldowns[chosenSkill.id] = (chosenSkill.cooldown || 2) + 1;
    }
    Object.keys(attacker.cooldowns).forEach(k => {
      if (k !== chosenSkill.id && attacker.cooldowns[k] > 0) attacker.cooldowns[k] -= 1;
    });

    // ─────────────────────────────────────────────────────────────
    // [분기 A] 공성측(아군)의 스킬 및 공격 -> 아군 지원/치유 or 적 성벽·타워 타겟팅 & 디버프 부여!
    // ─────────────────────────────────────────────────────────────
    if (isAttackerPlayer) {
      // 1. 아군 대상 버프/치유/보호막 스킬 판정
      const isSupportSkill =
        ['heal', 'shield', 'buff', 'regen', 'cleanse'].includes(chosenSkill.effectType || '') ||
        ['all_allies', 'single_ally', 'self'].includes(chosenSkill.targetType || '') ||
        (chosenSkill.description && (chosenSkill.description.includes('회복') || chosenSkill.description.includes('보호막') || chosenSkill.description.includes('치유') || chosenSkill.description.includes('아군 전체')) && !chosenSkill.targetType?.includes('enemy'));

      if (isSupportSkill) {
        // [지원/치유/버프 분기]
        let targetAllies: InvasionCombatant[] = [];
        if (chosenSkill.targetType === 'all_allies' || chosenSkill.description?.includes('전체') || chosenSkill.description?.includes('모든 아군')) {
          targetAllies = aliveP;
        } else if (chosenSkill.targetType === 'single_ally') {
          const lowest = aliveP.slice().sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
          targetAllies = [lowest];
        } else {
          targetAllies = [attacker];
        }

        const isHeal = chosenSkill.effectType === 'heal' || chosenSkill.description?.includes('회복') || chosenSkill.description?.includes('치유');
        const isShield = chosenSkill.effectType === 'shield' || chosenSkill.description?.includes('보호막') || chosenSkill.description?.includes('방벽');
        const isAtkBuff = chosenSkill.effectType === 'buff' || (chosenSkill.description?.includes('공격력') && chosenSkill.description?.includes('증가'));
        const isDefBuff = chosenSkill.description?.includes('방어력') && chosenSkill.description?.includes('증가');

        let totalHealed = 0;
        targetAllies.forEach((ally, aIdx) => {
          const allyPos = getCombatantCardPos(ally.id, true);

          if (isHeal) {
            const healAmt = Math.max(25, Math.round(attacker.atk * (chosenSkill.power || 1.3)));
            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
            totalHealed += healAmt;
            setVfxList(prev => [
              ...prev,
              {
                id: `vfx_heal_${Date.now()}_${aIdx}`,
                type: 'holy_heal',
                damage: healAmt,
                isHeal: true,
                x: allyPos.x,
                y: allyPos.y,
                duration: 500,
              },
            ]);
            SoundManager.getInstance().play('holy_spell');
          }

          if (isShield) {
            const shieldAmt = Math.max(30, Math.round(attacker.maxHp * 0.25 * (chosenSkill.power || 1.0)));
            applyInvasionStatusEffect(ally, {
              id: 'shield',
              name: '에테르 방벽',
              type: 'buff',
              icon: '🛡️',
              duration: 2,
              value: shieldAmt,
            });
            setVfxList(prev => [
              ...prev,
              {
                id: `vfx_shield_${Date.now()}_${aIdx}`,
                type: 'shield',
                damage: shieldAmt,
                x: allyPos.x,
                y: allyPos.y,
                duration: 400,
              },
            ]);
            SoundManager.getInstance().play('shield');
          }

          if (isAtkBuff) {
            applyInvasionStatusEffect(ally, {
              id: 'buff_atk',
              name: '공격력 증폭',
              type: 'buff',
              icon: '⚔️',
              duration: 2,
              value: 0.25,
            });
            SoundManager.getInstance().play('holy_spell');
          }

          if (isDefBuff) {
            applyInvasionStatusEffect(ally, {
              id: 'buff_def',
              name: '방어력 증폭',
              type: 'buff',
              icon: '🛡️',
              duration: 2,
              value: 0.30,
            });
            SoundManager.getInstance().play('shield');
          }
        });

        const mAttacker = combatMetricsRef.current[attacker.id];
        if (mAttacker) {
          mAttacker.healingDone += totalHealed;
          mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
        }

        addFeverBadge('extra');

        setActionBanner({
          text: `✨ [전술 지원] ${attacker.name}의 ${chosenSkill.name}!`,
          sub: `${targetAllies.map(a => a.name).join(', ')}에게 아군 전술 지원 효과 전개!`,
          color: '#38ef7d',
        });

        setBattleLogs(prev => [
          ...prev.slice(-30),
          {
            round: currentRoundNumber,
            attacker: attacker.name,
            defender: targetAllies.map(a => a.name).join(', '),
            damage: -totalHealed,
            isCrit: false,
            skillName: chosenSkill.name,
            side: 'player',
          },
        ]);

        setPlayerTeam([...currentP]);
      } else {
        // [공격 스킬 분기] -> 포지션 판정(성벽: 후열, 좌우 타워: 전열) 적용 및 타겟팅 & PvE 디버프 부여!
        const availableTargets: SiegeTargetObject[] = [];
        if (!curBarrier.isDestroyed) availableTargets.push(curBarrier);
        if (!curL.isDestroyed) availableTargets.push(curL);
        if (!curR.isDestroyed) availableTargets.push(curR);

        const posBonus = chosenSkill.positionBonus || getEffectivePositionBonus(chosenSkill);
        const aliveFrontTargets = [curL, curR].filter(t => !t.isDestroyed && t.currentHp > 0);
        const isBarrierAlive = !curBarrier.isDestroyed && curBarrier.currentHp > 0;

        const isAoeSkill =
          chosenSkill.targetType === 'all_enemies' ||
          (chosenSkill.description && (
            chosenSkill.description.includes('전체') ||
            chosenSkill.description.includes('모든 적') ||
            chosenSkill.description.includes('광역')
          ));
        let targetsToHit: SiegeTargetObject[] = [];

        if (isAoeSkill && availableTargets.length > 1) {
          // 전열/후열 특정 광역 체크
          const isFrontAoe = chosenSkill.description && (chosenSkill.description.includes('전열') && (chosenSkill.description.includes('전체') || chosenSkill.description.includes('모든')));
          const isBackAoe = chosenSkill.description && (chosenSkill.description.includes('후열') && (chosenSkill.description.includes('전체') || chosenSkill.description.includes('모든')));

          if (isFrontAoe && aliveFrontTargets.length > 0) {
            targetsToHit = aliveFrontTargets;
          } else if (isBackAoe && isBarrierAlive) {
            targetsToHit = [curBarrier];
          } else {
            targetsToHit = availableTargets;
          }
        } else {
          // 단일 타겟팅: 전열/후열 포지션 특화 엄격 적용
          if (posBonus === 'front') {
            // ⚔️ 전열 특화 스킬: 전열(좌/우 타워)을 우선 타격!
            if (aliveFrontTargets.length > 0) {
              const matchedFocus = aliveFrontTargets.find(t => t.id === selectedFocusTargetId);
              targetsToHit = [matchedFocus || aliveFrontTargets[0]];
            } else {
              // 전열 타워가 모두 파괴되었을 때만 후열(차원 왜곡 보호막) 타격
              targetsToHit = isBarrierAlive ? [curBarrier] : [];
            }
          } else if (posBonus === 'back') {
            // 🎯 후열 저격 스킬: 전열 타워를 무시하고 후열(성벽 / 차원 보호막)을 직격 관통!
            if (isBarrierAlive) {
              targetsToHit = [curBarrier];
            } else {
              // 성벽이 파괴되었을 때 남은 전열 타워 타격
              const matchedFocus = aliveFrontTargets.find(t => t.id === selectedFocusTargetId);
              targetsToHit = matchedFocus ? [matchedFocus] : (aliveFrontTargets.length > 0 ? [aliveFrontTargets[0]] : []);
            }
          } else {
            // 🌟 일반 공격 / 전후열 대응: 유저가 선택한 타겟 우선, 파괴 시 기본 타겟
            let targetObj = availableTargets.find(t => t.id === selectedFocusTargetId);
            if (!targetObj || targetObj.isDestroyed) {
              if (aliveFrontTargets.length > 0) {
                targetObj = aliveFrontTargets[0];
              } else {
                targetObj = curBarrier;
              }
            }
            targetsToHit = targetObj ? [targetObj] : (curBarrier ? [curBarrier] : []);
          }
        }

        if (targetsToHit.length > 0) {
          setActiveTargetDefenderId(targetsToHit[0].id);
        }

        let totalDmgDealt = 0;
        let anyCrit = false;
        const allDebuffsApplied: string[] = [];
        const positionBonusLogs: string[] = [];

        // 공격자 공격력 버프/디버프 연산
        let effectiveAtk = attacker.atk;
        const atkBuff = (attacker.statusEffects || []).find(e => e.id === 'buff_atk');
        if (atkBuff) effectiveAtk = Math.round(effectiveAtk * (1 + (atkBuff.value || 0.25)));
        const atkDebuff = (attacker.statusEffects || []).find(e => e.id === 'debuff_atk');
        if (atkDebuff) effectiveAtk = Math.max(10, Math.round(effectiveAtk * (1 - (atkDebuff.value || 0.30))));

        // 기본 치명타 확률 + 후열 저격 치명타율 보너스 (+20%)
        let critChance = attacker.luck * 0.008 + 0.12;
        if (posBonus === 'back') {
          critChance += 0.20;
        }
        const isCrit = Math.random() < critChance;
        if (isCrit) anyCrit = true;

        targetsToHit.forEach((targetObj, tIdx) => {
          const isTargetFront = targetObj.id === 'turret_left' || targetObj.id === 'turret_right';
          const isTargetBack = targetObj.id === 'dimensional_barrier';
          const hasAliveFront = aliveFrontTargets.length > 0;

          // 타겟 방어력 연산 (화상 50% 분쇄, 결빙 +40%, 방어 분쇄)
          let targetDef = targetObj.def;
          const targetEffects = targetObj.statusEffects || [];
          if (targetEffects.some(e => e.id === 'burn')) {
            targetDef = Math.round(targetDef * 0.5);
          }
          if (targetEffects.some(e => e.id === 'freeze')) {
            targetDef = Math.round(targetDef * 1.4);
          }
          const defDebuff = targetEffects.find(e => e.id === 'debuff_def');
          if (defDebuff) {
            targetDef = Math.max(5, Math.round(targetDef * (1 - (defDebuff.value || 0.35))));
          }

          const aoeMultiplier = targetsToHit.length > 1 ? 0.75 : 1.0;
          let rawDmg = effectiveAtk * (chosenSkill.power || 1.0) * (isCrit ? 1.6 : 1.0) * aoeMultiplier;

          // 🌟 [포지션 판정 보너스 및 페널티 연산 - PvE 규격 동일]
          // 1) 전열 특화 스킬: 전열 거점(좌/우 타워) 타격 시 +25% 피해 증폭
          if (posBonus === 'front') {
            if (isTargetFront) {
              rawDmg = rawDmg * 1.25;
              if (!positionBonusLogs.includes('전열 분쇄(+25%)')) positionBonusLogs.push('전열 분쇄(+25%)');
            }
          }
          // 2) 후열 저격 스킬: 후열 거점(성벽 / 차원 보호막) 타격 시 +20% 피해 증폭
          else if (posBonus === 'back') {
            if (isTargetBack) {
              rawDmg = rawDmg * 1.20;
              if (!positionBonusLogs.includes('후열 저격(+20%)')) positionBonusLogs.push('후열 저격(+20%)');
            }
          }
          // 3) 전열 방호선 엄호 페널티: 살아있는 전열 타워가 있는데 후열(성벽)을 일반/근접 공격으로 타격 시 25% 경감
          else if (isTargetBack && hasAliveFront && posBonus !== 'any') {
            rawDmg = rawDmg * 0.75;
            if (!positionBonusLogs.includes('전열 타워 엄호(-25%)')) positionBonusLogs.push('전열 타워 엄호(-25%)');
          }

          let finalDmg = Math.max(15, Math.round(rawDmg * (100 / (100 + targetDef * INVASION_DEF_SCALE))));

          // 보호막(shield) 버프 흡수 연산
          const shieldEff = targetEffects.find(e => e.id === 'shield');
          if (shieldEff && (shieldEff.value || 0) > 0) {
            const absorbed = Math.min(finalDmg, shieldEff.value || 0);
            shieldEff.value = (shieldEff.value || 0) - absorbed;
            finalDmg -= absorbed;
            if (shieldEff.value <= 0) {
              targetObj.statusEffects = targetObj.statusEffects.filter(e => e.id !== 'shield');
            }
          }

          // 대상 체력 감소
          targetObj.currentHp = Math.max(0, targetObj.currentHp - finalDmg);
          if (targetObj.currentHp <= 0) targetObj.isDestroyed = true;
          totalDmgDealt += finalDmg;

          // 🌟 PvE 표준 상태이상 및 디버프 성벽/타워 부여 판정 (행운 비례 저항 시스템 연동)
          const sName = (chosenSkill.name || '').toLowerCase();
          const sId = (chosenSkill.id || '').toLowerCase();
          const sDesc = (chosenSkill.description || '').toLowerCase();

          // 1. 🔥 화상 (Burn)
          const isBurn = chosenSkill.effectType === 'burn' || sId.includes('flame') || sId.includes('burn') || sId.includes('meteor') || sName.includes('화염') || sName.includes('화상') || sDesc.includes('화염') || sDesc.includes('화상');
          if (isBurn) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'burn',
              name: '작열 화상',
              type: 'debuff',
              icon: '🔥',
              duration: chosenSkill.statusDuration || 2,
              value: 0.08,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️화상저항')) allDebuffsApplied.push('🛡️화상저항');
            } else {
              if (!allDebuffsApplied.includes('🔥화상')) allDebuffsApplied.push('🔥화상');
            }
          }

          // 2. ☠️ 중독 (Poison)
          const isPoison = chosenSkill.effectType === 'poison' || sId.includes('poison') || sName.includes('독') || sDesc.includes('중독');
          if (isPoison) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'poison',
              name: '맹독 부식',
              type: 'debuff',
              icon: '☠️',
              duration: chosenSkill.statusDuration || 3,
              value: 0.14,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️중독저항')) allDebuffsApplied.push('🛡️중독저항');
            } else {
              if (!allDebuffsApplied.includes('☠️중독')) allDebuffsApplied.push('☠️중독');
            }
          }

          // 3. ❄️ 결빙 (Freeze)
          const isFreeze = chosenSkill.effectType === 'freeze' || sId.includes('freeze') || sId.includes('blizzard') || sName.includes('빙결') || sName.includes('냉각') || sName.includes('눈보라') || sDesc.includes('빙결') || sDesc.includes('냉각') || sDesc.includes('동상');
          if (isFreeze) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'freeze',
              name: '극저온 동결',
              type: 'debuff',
              icon: '❄️',
              duration: chosenSkill.statusDuration || 2,
              value: 0.04,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️결빙저항')) allDebuffsApplied.push('🛡️결빙저항');
            } else {
              if (!allDebuffsApplied.includes('❄️결빙')) allDebuffsApplied.push('❄️결빙');
            }
          }

          // 4. 💫 기절 (Stun)
          const isStun = chosenSkill.effectType === 'stun' || sDesc.includes('기절') || sDesc.includes('속박');
          if (isStun) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'stun',
              name: '기절 무력화',
              type: 'debuff',
              icon: '💫',
              duration: chosenSkill.statusDuration || 1,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️기절저항')) allDebuffsApplied.push('🛡️기절저항');
            } else {
              if (!allDebuffsApplied.includes('💫기절')) allDebuffsApplied.push('💫기절');
            }
          }

          // 5. 🛡️⬇️ 방어력 분쇄 (debuff_def)
          const isDefDebuff = chosenSkill.effectType === 'debuff' || chosenSkill.effectType === 'debuff_def' || (sDesc.includes('방어력') && (sDesc.includes('분쇄') || sDesc.includes('감소') || sDesc.includes('파쇄') || sDesc.includes('약화')));
          if (isDefDebuff) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'debuff_def',
              name: '방어력 분쇄',
              type: 'debuff',
              icon: '🛡️',
              duration: chosenSkill.statusDuration || 3,
              value: 0.35,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️방어저항')) allDebuffsApplied.push('🛡️방어저항');
            } else {
              if (!allDebuffsApplied.includes('🛡️방어분쇄')) allDebuffsApplied.push('🛡️방어분쇄');
            }
          }

          // 6. ⚔️⬇️ 공격력 약화 (debuff_atk)
          const isAtkDebuff = chosenSkill.effectType === 'debuff_atk' || (sDesc.includes('공격력') && (sDesc.includes('감소') || sDesc.includes('약화')));
          if (isAtkDebuff) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'debuff_atk',
              name: '공격력 약화',
              type: 'debuff',
              icon: '⚔️',
              duration: chosenSkill.statusDuration || 2,
              value: 0.30,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️공격저항')) allDebuffsApplied.push('🛡️공격저항');
            } else {
              if (!allDebuffsApplied.includes('⚔️공격감소')) allDebuffsApplied.push('⚔️공격감소');
            }
          }

          // 7. 🩸 출혈 (Bleed)
          const isBleed = chosenSkill.effectType === 'bleed' || sName.includes('출혈') || sDesc.includes('출혈');
          if (isBleed) {
            const res = applyInvasionStatusEffect(targetObj, {
              id: 'bleed',
              name: '치명 출혈',
              type: 'debuff',
              icon: '🩸',
              duration: chosenSkill.statusDuration || 3,
              value: 0.07,
            });
            if (res.resisted) {
              if (!allDebuffsApplied.includes('🛡️출혈저항')) allDebuffsApplied.push('🛡️출혈저항');
            } else {
              if (!allDebuffsApplied.includes('🩸출혈')) allDebuffsApplied.push('🩸출혈');
            }
          }

          // 거점 상태 동기화
          if (targetObj.id === 'dimensional_barrier') {
            barrierStateRef.current = { ...targetObj };
            setBarrierState({ ...targetObj });
            setIsBarrierHit(true);
            setTimeout(() => setIsBarrierHit(false), 350);
          } else if (targetObj.id === 'turret_left') {
            turretLeftRef.current = { ...targetObj };
            setTurretLeft({ ...targetObj });
            oppTeamRef.current = oppTeamRef.current.map(c => c.id === 'turret_left' ? { ...c, currentHp: targetObj.currentHp, statusEffects: [...targetObj.statusEffects] } : c);
            setOppTeam([...oppTeamRef.current]);
          } else if (targetObj.id === 'turret_right') {
            turretRightRef.current = { ...targetObj };
            setTurretRight({ ...targetObj });
            oppTeamRef.current = oppTeamRef.current.map(c => c.id === 'turret_right' ? { ...c, currentHp: targetObj.currentHp, statusEffects: [...targetObj.statusEffects] } : c);
            setOppTeam([...oppTeamRef.current]);
          }

          const targetPos = getCombatantCardPos(targetObj.id, false);
          setVfxList(prev => [
            ...prev,
            {
              id: `vfx_hit_${Date.now()}_${tIdx}`,
              type: isCrit ? 'crit_slash' : 'slash',
              damage: finalDmg,
              isCrit,
              x: targetPos.x,
              y: targetPos.y,
              duration: battleSpeed === 2 ? 350 : 500,
            },
          ]);
          gm.emit('battleHitEffect', {
            x: targetPos.x,
            y: targetPos.y,
            color: 0xc8aa6e,
            isCrit,
            type: isCrit ? 'crit_slash' : 'slash',
          });
        });

        // 메트릭스 업데이트
        const mAttacker = combatMetricsRef.current[attacker.id];
        if (mAttacker) {
          mAttacker.damageDealt += totalDmgDealt;
          mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
          if (anyCrit) mAttacker.critCount += 1;
        }

        // 피버 뱃지 적립
        if (anyCrit) addFeverBadge('crit');
        else if (chosenSkill.id !== 'basic_attack') addFeverBadge('extra');
        else addFeverBadge('break');

        // 🌟 아군 시전자 포지션 연계 보너스 (PvE 동일)
        if (posBonus === 'front' && attacker.position === 'front' && totalDmgDealt > 0) {
          const shieldAmt = Math.max(15, Math.floor(totalDmgDealt * 0.25));
          applyInvasionStatusEffect(attacker, {
            id: 'shield',
            name: '전열 돌격 방벽',
            type: 'buff',
            icon: '🛡️',
            duration: 2,
            value: shieldAmt,
          });
          if (!positionBonusLogs.includes('전열 돌격 방벽')) positionBonusLogs.push('전열 돌격 방벽');
        } else if (posBonus === 'back' && attacker.position === 'back' && chosenSkill.id !== 'basic_attack') {
          const refundMp = Math.max(1, Math.floor((chosenSkill.manaCost || 0) * 0.35));
          if (refundMp > 0) {
            attacker.currentMp = Math.min(attacker.maxMp, attacker.currentMp + refundMp);
            if (!positionBonusLogs.includes(`후열 마나환급(+${refundMp})`)) positionBonusLogs.push(`후열 마나환급(+${refundMp})`);
          }
        }

        // 연출 배너
        const targetNames = targetsToHit.map(t => t.id === 'dimensional_barrier' ? '🛡️ 차원 보호막(후열)' : `🗼 ${t.name}(전열)`).join(', ');
        const posBonusNotice = positionBonusLogs.length > 0 ? ` [${positionBonusLogs.join(', ')}]` : '';
        const debuffNotice = allDebuffsApplied.length > 0 ? ` [디버프: ${allDebuffsApplied.join(', ')}]` : '';
        setActionBanner({
          text: `⚔️ [공성 돌격] ${attacker.name}의 ${chosenSkill.name}!`,
          sub: `${targetNames}에 총 ${totalDmgDealt.toLocaleString()}의 공성 타격! ${anyCrit ? '💥 치명타 작열!' : ''}${posBonusNotice}${debuffNotice}`,
          color: '#c8aa6e',
        });

        // 실시간 교전 정보 패널 업데이트
        const primaryTarget = targetsToHit[0];
        if (primaryTarget) {
          setClashData({
            attacker: { ...attacker },
            defender: {
              name: primaryTarget.name,
              icon: primaryTarget.icon,
              className: primaryTarget.id === 'dimensional_barrier' ? '차원 절대 방어막 (후열)' : '영지 방어 포탑 (전열)',
              level: target.gateLevel,
              currentHp: primaryTarget.currentHp,
              maxHp: primaryTarget.maxHp,
              currentMp: 0,
              maxMp: 0,
              def: primaryTarget.def,
              classId: 'tactical_tower',
              position: primaryTarget.id === 'dimensional_barrier' ? 'back' : 'front',
            },
            skill: chosenSkill,
            damage: totalDmgDealt,
            isCrit: anyCrit,
            isPlayerAttacking: true,
          });
          setIsClashZoomed(true);
        }

        SoundManager.getInstance().play(anyCrit ? 'crit' : 'heavy_hit');

        setBattleLogs(prev => [
          ...prev.slice(-30),
          {
            round: currentRoundNumber,
            attacker: attacker.name,
            defender: targetNames,
            damage: totalDmgDealt,
            isCrit: anyCrit,
            skillName: `${chosenSkill.name}${posBonusNotice}${debuffNotice}`,
            side: 'player',
          },
        ]);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // [분기 B] 수성측(포탑)의 턴 -> 좌측 화력 포탑 / 우측 전술 지원 포탑 행동 분기
    // ─────────────────────────────────────────────────────────────
    else {
      // 🛡️ 차원 왜곡 보호막 디버프 DoT 처리 (수성측 턴 개시 시 일괄 정산)
      const curB = barrierStateRef.current;
      if (curB && !curB.isDestroyed && curB.statusEffects && curB.statusEffects.length > 0) {
        let bDotTotal = 0;
        curB.statusEffects = curB.statusEffects.filter(se => {
          let dot = 0;
          if (se.id === 'burn') {
            dot = Math.max(1, Math.round(curB.maxHp * 0.08));
            SoundManager.getInstance().play('fire');
            setVfxList(prev => [...prev, { id: `vfx_b_burn_${Date.now()}_${Math.random()}`, type: 'fire', damage: dot, x: 50, y: 38, duration: 400 }]);
          } else if (se.id === 'poison') {
            dot = Math.max(1, Math.round(curB.maxHp * 0.14));
            SoundManager.getInstance().play('poison');
            setVfxList(prev => [...prev, { id: `vfx_b_poison_${Date.now()}_${Math.random()}`, type: 'bullet', damage: dot, x: 50, y: 38, duration: 400 }]);
          } else if (se.id === 'bleed') {
            dot = Math.max(1, Math.round(curB.maxHp * 0.07));
            SoundManager.getInstance().play('bleed');
            setVfxList(prev => [...prev, { id: `vfx_b_bleed_${Date.now()}_${Math.random()}`, type: 'slash', damage: dot, x: 50, y: 38, duration: 400 }]);
          } else if (se.id === 'freeze') {
            dot = Math.max(1, Math.round(curB.maxHp * 0.04));
            SoundManager.getInstance().play('ice');
            setVfxList(prev => [...prev, { id: `vfx_b_freeze_${Date.now()}_${Math.random()}`, type: 'slash', damage: dot, x: 50, y: 38, duration: 400 }]);
          }
          if (dot > 0) {
            curB.currentHp = Math.max(0, curB.currentHp - dot);
            bDotTotal += dot;
          }
          se.duration = (se.duration || 1) - 1;
          return (se.duration || 0) > 0;
        });

        if (curB.currentHp <= 0) {
          curB.isDestroyed = true;
        }
        barrierStateRef.current = { ...curB };
        setBarrierState({ ...curB });
        if (bDotTotal > 0) {
          setIsBarrierHit(true);
          setTimeout(() => setIsBarrierHit(false), 300);
        }
      }

      if (aliveP.length === 0) {
        isProcessingRef.current = false;
        return;
      }

      const opTrait = oppOperatorRef.current?.trait || '';
      const opRole = oppOperatorRef.current?.role || '';
      const heroTrait = attacker.trait || '';
      const heroRole = attacker.role || '';

      // ─────────────────────────────────────────────────────────
      // 1) 좌측 전술 화력 포탑 (포탑+용병 공격력 합산 / 광역 폭격 vs 약점 타겟 집중 공격)
      // ─────────────────────────────────────────────────────────
      if (attacker.id === 'turret_left') {
        const isFocusFire =
          ['투사', '그림자', '혈통', '냉혹', '사격', '저격', '치명', '암살', '집중'].some(k => opTrait.includes(k) || heroTrait.includes(k)) ||
          opRole === 'dealer_phy' || heroRole === 'dealer_phy' || heroRole === 'gunner';

        let effectiveTurretAtk = attacker.atk;
        const atkDebuff = (attacker.statusEffects || []).find(e => e.id === 'debuff_atk');
        if (atkDebuff) effectiveTurretAtk = Math.max(10, Math.round(effectiveTurretAtk * (1 - (atkDebuff.value || 0.30))));

        const atkBuffTier = oppTowerRef.current?.attack?.tier1 || 0;
        const atkBuffMult = 1.0 + atkBuffTier * 0.15;
        const burnTier = oppTowerRef.current?.attack?.tier2 || 0;
        const burnChance = burnTier * 0.20;
        const poisonTier = oppTowerRef.current?.attack?.tier3 || 0;
        const poisonChance = poisonTier * 0.20;

        const critChance = attacker.luck * 0.008 + 0.12;
        const isCrit = Math.random() < critChance;

        if (isFocusFire) {
          // [약점 집중 사격] 가장 생명력 비율이 낮거나 위협적인 대상 1인 집중 타격!
          const targetDefender = aliveP.slice().sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || aliveP[0];
          setActiveTargetDefenderId(targetDefender.id);

          const rawDmg = effectiveTurretAtk * 1.45 * (isCrit ? 1.5 : 1.0) * atkBuffMult;
          let effectiveDef = targetDefender.def;
          if ((targetDefender.statusEffects || []).some(e => e.id === 'burn')) effectiveDef = Math.round(effectiveDef * 0.5);
          if ((targetDefender.statusEffects || []).some(e => e.id === 'freeze')) effectiveDef = Math.round(effectiveDef * 1.4);
          const finalDmg = Math.max(15, Math.round(rawDmg * (100 / (100 + effectiveDef * INVASION_DEF_SCALE))));
          targetDefender.currentHp = Math.max(0, targetDefender.currentHp - finalDmg);

          // 🔥 작열 화상 (공격 2차 테크) 부여 판정: PvE 규격 2턴 지속, 8% 화염 DoT & 방어력 50% 분쇄 (행운 저항 연동)
          let debuffSuffix = '';
          if (burnTier > 0 && Math.random() < burnChance) {
            const res = applyInvasionStatusEffect(targetDefender, {
              id: 'burn',
              name: '작열 화상',
              type: 'debuff',
              icon: '🔥',
              duration: 2,
              value: 0.08,
            });
            if (res.resisted) {
              debuffSuffix += ` [🛡️화상저항(🍀${targetDefender.luck})]`;
              SoundManager.getInstance().play('shield');
            } else {
              debuffSuffix += ' [🔥화상]';
            }
          }

          // 🧪 맹독 부식 (공격 3차 테크) 부여 판정: PvE 규격 3턴 지속, 14% 치명적 중독 DoT (행운 저항 연동)
          if (poisonTier > 0 && Math.random() < poisonChance) {
            const res = applyInvasionStatusEffect(targetDefender, {
              id: 'poison',
              name: '맹독 부식',
              type: 'debuff',
              icon: '☠️',
              duration: 3,
              value: 0.14,
            });
            if (res.resisted) {
              debuffSuffix += ` [🛡️맹독저항(🍀${targetDefender.luck})]`;
              SoundManager.getInstance().play('shield');
            } else {
              debuffSuffix += ' [☠️중독]';
            }
          }

          const mAttacker = combatMetricsRef.current[attacker.id];
          if (mAttacker) {
            mAttacker.damageDealt += finalDmg;
            mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
            if (isCrit) mAttacker.critCount += 1;
            if (targetDefender.currentHp <= 0) mAttacker.kills += 1;
          }
          const mDefender = combatMetricsRef.current[targetDefender.id];
          if (mDefender) mDefender.damageTaken += finalDmg;

          if (isCrit) addOppFeverBadge('crit');
          else addOppFeverBadge('break');

          setActionBanner({
            text: `🎯 [약점 집중 사격${isCrit ? ' · 치명타!' : ''}] ${attacker.name}!`,
            sub: `가장 취약한 [${targetDefender.name}]에게 집중 화력 포화 (${finalDmg.toLocaleString()} 피해)${debuffSuffix}!`,
            color: '#ff5722',
          });

          setClashData({
            attacker: { ...attacker },
            defender: { ...targetDefender },
            skill: { ...chosenSkill, name: '약점 집중 사격' },
            damage: finalDmg,
            isCrit,
            isPlayerAttacking: false,
          });
          setIsClashZoomed(true);

          const defPos = getCombatantCardPos(targetDefender.id, true);
          setVfxList(prev => [
            ...prev,
            {
              id: `vfx_focus_strike_${Date.now()}`,
              type: 'bullet',
              damage: finalDmg,
              isCrit,
              x: defPos.x,
              y: defPos.y,
              duration: battleSpeed === 2 ? 350 : 500,
            },
          ]);
          gm.emit('battleHitEffect', {
            x: defPos.x,
            y: defPos.y,
            color: 0xff3d00,
            isCrit,
            type: 'bullet',
          });
          SoundManager.getInstance().play(isCrit ? 'crit' : 'heavy_hit');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: targetDefender.name,
              damage: finalDmg,
              isCrit,
              skillName: `약점 집중 사격${debuffSuffix}`,
              side: 'enemy',
            },
          ]);
        } else {
          // [전탄 광역 폭격] 침공 결사대 전원(3인)에게 무차별 일제 포격!
          let totalDmg = 0;
          let anyBurnApplied = false;
          let anyPoisonApplied = false;
          let anyBurnResisted = false;
          let anyPoisonResisted = false;

          aliveP.forEach((defender, idx) => {
            const rawDmg = effectiveTurretAtk * 0.72 * (isCrit ? 1.35 : 1.0) * atkBuffMult;
            let def = defender.def;
            if ((defender.statusEffects || []).some(e => e.id === 'burn')) def = Math.round(def * 0.5);
            if ((defender.statusEffects || []).some(e => e.id === 'freeze')) def = Math.round(def * 1.4);
            const finalDmg = Math.max(10, Math.round(rawDmg * (100 / (100 + def * INVASION_DEF_SCALE))));
            defender.currentHp = Math.max(0, defender.currentHp - finalDmg);
            totalDmg += finalDmg;

            // 🔥 광역 작열 화상 (공격 2차): PvE 규격 2턴 지속, 8% 화염 DoT & 방어력 50% 분쇄 (행운 저항 연동)
            if (burnTier > 0 && Math.random() < burnChance) {
              const res = applyInvasionStatusEffect(defender, {
                id: 'burn',
                name: '작열 화상',
                type: 'debuff',
                icon: '🔥',
                duration: 2,
                value: 0.08,
              });
              if (res.resisted) {
                anyBurnResisted = true;
              } else {
                anyBurnApplied = true;
              }
            }

            // 🧪 광역 맹독 부식 (공격 3차): PvE 규격 3턴 지속, 14% 치명적 중독 DoT (행운 저항 연동)
            if (poisonTier > 0 && Math.random() < poisonChance) {
              const res = applyInvasionStatusEffect(defender, {
                id: 'poison',
                name: '맹독 부식',
                type: 'debuff',
                icon: '☠️',
                duration: 3,
                value: 0.14,
              });
              if (res.resisted) {
                anyPoisonResisted = true;
              } else {
                anyPoisonApplied = true;
              }
            }

            const mDef = combatMetricsRef.current[defender.id];
            if (mDef) mDef.damageTaken += finalDmg;
            if (defender.currentHp <= 0) {
              const mAtk = combatMetricsRef.current[attacker.id];
              if (mAtk) mAtk.kills += 1;
            }

            const defPos = getCombatantCardPos(defender.id, true);
            setVfxList(prev => [
              ...prev,
              {
                id: `vfx_aoe_strike_${defender.id}_${Date.now()}_${idx}`,
                type: 'bullet',
                damage: finalDmg,
                isCrit,
                x: defPos.x,
                y: defPos.y,
                duration: battleSpeed === 2 ? 350 : 500,
              },
            ]);
            gm.emit('battleHitEffect', {
              x: defPos.x,
              y: defPos.y,
              color: 0xff6d00,
              isCrit,
              type: 'bullet',
            });
          });

          const mAttacker = combatMetricsRef.current[attacker.id];
          if (mAttacker) {
            mAttacker.damageDealt += totalDmg;
            mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
            if (isCrit) mAttacker.critCount += 1;
          }

          if (isCrit) addOppFeverBadge('crit');
          else addOppFeverBadge('break');

          const debuffMsg = (anyBurnApplied ? ' [🔥화상]' : (anyBurnResisted ? ' [🛡️화상저항]' : '')) + (anyPoisonApplied ? ' [🧪중독]' : (anyPoisonResisted ? ' [🛡️중독저항]' : ''));

          setActionBanner({
            text: `🚀 [전탄 광역 폭격${isCrit ? ' · 융단폭격!' : ''}] ${attacker.name}!`,
            sub: `침공 결사대 3인 전원에게 일제 폭격 (총 ${totalDmg.toLocaleString()} 피해)${debuffMsg}!`,
            color: '#ff6d00',
          });

          SoundManager.getInstance().play('heavy_hit');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: '결사대 전원',
              damage: totalDmg,
              isCrit,
              skillName: `전탄 광역 폭격${debuffMsg}`,
              side: 'enemy',
            },
          ]);
        }
      }

      // ─────────────────────────────────────────────────────────
      // 2) 우측 전술 지원 포탑 (마나와 행운 기반 / 긴급 수복, 결계 방어, EMP 디버프, 어그로 교란)
      // ─────────────────────────────────────────────────────────
      else if (attacker.id === 'turret_right') {
        const manaCost = 15;
        const currentMp = attacker.currentMp || 0;
        const isMpSufficient = currentMp >= manaCost;

        if (isMpSufficient) {
          attacker.currentMp = Math.max(0, currentMp - manaCost);
        } else {
          // 마나 고갈 시 마나 리차지
          attacker.currentMp = Math.min(attacker.maxMp || 120, currentMp + 45);
        }

        const isTactCrit = Math.random() < (attacker.luck * 0.008 + 0.15);
        const tactPowerMult = (isTactCrit ? 1.35 : 1.0) * (isMpSufficient ? 1.0 : 0.6);

        let effectiveTurretAtk = attacker.atk;
        const atkDebuff = (attacker.statusEffects || []).find(e => e.id === 'debuff_atk');
        if (atkDebuff) effectiveTurretAtk = Math.max(10, Math.round(effectiveTurretAtk * (1 - (atkDebuff.value || 0.30))));

        // 🛡️ 방어 연구 연동: 성벽 회복(tier1), 기절(tier2), 결빙(tier3)
        const defTier1 = oppTowerRef.current?.defense?.tier1 || 0;
        const stunTier = oppTowerRef.current?.defense?.tier2 || 0;
        const freezeTier = oppTowerRef.current?.defense?.tier3 || 0;
        const healBonusMult = 1.0 + defTier1 * 0.20;

        const curBarrier = { ...barrierStateRef.current };
        const curLeft = { ...turretLeftRef.current };
        const barrierHpRatio = curBarrier.currentHp / curBarrier.maxHp;
        const leftHpRatio = curLeft.maxHp > 0 ? (curLeft.currentHp / curLeft.maxHp) : 1;

        // 전술 상황 판단 및 오퍼레이터 성향 매칭
        const needRepair = barrierHpRatio < 0.85 || (leftHpRatio < 0.75 && !curLeft.isDestroyed);
        const isDefenderTrait = ['수호', '방어', '철벽', '가디언', '인내'].some(k => opTrait.includes(k) || heroTrait.includes(k));
        const isDebuffTrait = ['비전', '제압', '파괴', '암흑', '마법', '간섭'].some(k => opTrait.includes(k) || heroTrait.includes(k));

        if (needRepair) {
          // [긴급 전술 수복 - 방어 1차 나노 결계 복원 증폭] 차원 보호막 및 좌측 타워 HP 재생
          const healBarrier = Math.round(((320 + attacker.luck * 14 + (attacker.currentMp || 0) * 0.5) * tactPowerMult * healBonusMult) + (defTier1 * 150));
          const healTurret = Math.round((180 + attacker.luck * 8) * tactPowerMult * healBonusMult);

          curBarrier.currentHp = Math.min(curBarrier.maxHp, curBarrier.currentHp + healBarrier);
          barrierStateRef.current = curBarrier;
          setBarrierState(curBarrier);

          let turretHealedNotice = '';
          if (!curLeft.isDestroyed && curLeft.currentHp > 0) {
            curLeft.currentHp = Math.min(curLeft.maxHp, curLeft.currentHp + healTurret);
            turretLeftRef.current = curLeft;
            setTurretLeft(curLeft);
            turretHealedNotice = ` & 좌측포탑(+${healTurret.toLocaleString()} HP)`;
          }

          setActionBanner({
            text: `🔧 [긴급 전술 수복${isTactCrit ? ' · 대성공' : ''}] ${attacker.name}!`,
            sub: `차원 보호막(+${healBarrier.toLocaleString()} HP)${turretHealedNotice} 수복 복원!`,
            color: '#00e676',
          });
          SoundManager.getInstance().play('holy_spell');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: '차원 보호막/포탑',
              damage: -healBarrier,
              isCrit: isTactCrit,
              skillName: '긴급 전술 수복',
              side: 'enemy',
            },
          ]);
        } else if (isDefenderTrait) {
          // [성벽 굴절 방호막] 차원 보호막 DEF 영구/일시 강화
          const addedDef = Math.round((6 + (attacker.luck || 10) * 0.15) * tactPowerMult);
          curBarrier.def = (curBarrier.def || 25) + addedDef;
          barrierStateRef.current = curBarrier;
          setBarrierState(curBarrier);

          setActionBanner({
            text: `🛡️ [결계 굴절 방호막${isTactCrit ? ' · 극대화' : ''}] ${attacker.name}!`,
            sub: `차원 결계에 고밀도 위상 굴절막 전개 (방어력 +${addedDef} 상승)!`,
            color: '#c8aa6e',
          });
          SoundManager.getInstance().play('shield');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: '차원 보호막',
              damage: 0,
              isCrit: isTactCrit,
              skillName: '결계 굴절 방호막',
              side: 'enemy',
            },
          ]);
        } else if (isDebuffTrait) {
          // [전자기 위상 간섭 - EMP 디버프] 결사대 전원에게 전격 충격 및 출력 저하
          let totalDmg = 0;
          aliveP.forEach((defender, idx) => {
            let def = defender.def;
            if ((defender.statusEffects || []).some(e => e.id === 'burn')) def = Math.round(def * 0.5);
            if ((defender.statusEffects || []).some(e => e.id === 'freeze')) def = Math.round(def * 1.4);
            const shockDmg = Math.max(10, Math.round((140 + attacker.luck * 7 + (attacker.currentMp || 0) * 0.3) * tactPowerMult * (100 / (100 + def * INVASION_DEF_SCALE))));
            defender.currentHp = Math.max(0, defender.currentHp - shockDmg);
            totalDmg += shockDmg;

            const mDef = combatMetricsRef.current[defender.id];
            if (mDef) mDef.damageTaken += shockDmg;

            const defPos = getCombatantCardPos(defender.id, true);
            setVfxList(prev => [
              ...prev,
              {
                id: `vfx_emp_shock_${defender.id}_${Date.now()}_${idx}`,
                type: 'slash',
                damage: shockDmg,
                isCrit: isTactCrit,
                x: defPos.x,
                y: defPos.y,
                duration: battleSpeed === 2 ? 350 : 500,
              },
            ]);
            gm.emit('battleHitEffect', {
              x: defPos.x,
              y: defPos.y,
              color: 0xc8aa6e,
              isCrit: isTactCrit,
              type: 'slash',
            });
          });

          setActionBanner({
            text: `⚡ [전자기 위상 간섭${isTactCrit ? ' · 과부하' : ''}] ${attacker.name}!`,
            sub: `침공 결사대 전원에게 EMP 펄스 방출 (총 ${totalDmg.toLocaleString()} 충격 피해)!`,
            color: '#2979ff',
          });
          SoundManager.getInstance().play('lightning');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: '결사대 전원',
              damage: totalDmg,
              isCrit: isTactCrit,
              skillName: '전자기 위상 간섭',
              side: 'enemy',
            },
          ]);
        } else {
          // [차원 왜곡 기만 / 어그로 교란] 홀로그램 미끼 전개 & 단일 견제 사격
          const targetDefender = aliveP[Math.floor(Math.random() * aliveP.length)];
          setActiveTargetDefenderId(targetDefender.id);

          let def = targetDefender.def;
          if ((targetDefender.statusEffects || []).some(e => e.id === 'burn')) def = Math.round(def * 0.5);
          if ((targetDefender.statusEffects || []).some(e => e.id === 'freeze')) def = Math.round(def * 1.4);
          const tacticDmg = Math.max(10, Math.round((160 + attacker.luck * 9 + effectiveTurretAtk * 0.6) * tactPowerMult * (100 / (100 + def * INVASION_DEF_SCALE))));
          targetDefender.currentHp = Math.max(0, targetDefender.currentHp - tacticDmg);

          const mDefender = combatMetricsRef.current[targetDefender.id];
          if (mDefender) mDefender.damageTaken += tacticDmg;

          setActionBanner({
            text: `🌀 [차원 왜곡 기만] ${attacker.name}!`,
            sub: `홀로그램 미끼로 조준 센서 교란 & [${targetDefender.name}]에게 ${tacticDmg.toLocaleString()} 견제!`,
            color: '#b388ff',
          });

          const defPos = getCombatantCardPos(targetDefender.id, true);
          setVfxList(prev => [
            ...prev,
            {
              id: `vfx_decoy_strike_${Date.now()}`,
              type: 'bullet',
              damage: tacticDmg,
              isCrit: isTactCrit,
              x: defPos.x,
              y: defPos.y,
              duration: battleSpeed === 2 ? 350 : 500,
            },
          ]);
          SoundManager.getInstance().play('spell');

          setBattleLogs(prev => [
            ...prev.slice(-30),
            {
              round: currentRoundNumber,
              attacker: attacker.name,
              defender: targetDefender.name,
              damage: tacticDmg,
              isCrit: isTactCrit,
              skillName: '차원 왜곡 기만',
              side: 'enemy',
            },
          ]);
        }

        // ⚡ 방어 2차 연구: 충격 전자기파 (기절 유발 판정) - PvE 규격 1턴간 완전 행동 불능 (행운 저항 연동)
        const stunChance = stunTier * 0.16;
        if (stunTier > 0 && Math.random() < stunChance && aliveP.length > 0) {
          const stunTarget = aliveP[Math.floor(Math.random() * aliveP.length)];
          if (stunTarget) {
            const res = applyInvasionStatusEffect(stunTarget, {
              id: 'stun',
              name: '기절 무력화',
              type: 'debuff',
              icon: '💫',
              duration: 1,
            });
            if (res.resisted) {
              SoundManager.getInstance().play('shield');
              setActionBanner(prev => ({
                text: `${prev.text} · 🛡️ [기절 저항!]`,
                sub: `${prev.sub} | [${stunTarget.name}]이(가) 높은 행운(🍀${stunTarget.luck})으로 충격 전자기파(기절)를 완전히 저항해냈습니다!`,
                color: '#38ef7d',
              }));
            } else {
              SoundManager.getInstance().play('stun');
              setActionBanner(prev => ({
                text: `${prev.text} · 💫 [기절 유발!]`,
                sub: `${prev.sub} | [${stunTarget.name}]의 신경계가 마비되어 1턴간 완전 행동 불능에 빠집니다!`,
                color: '#ffd54f',
              }));
            }
          }
        }

        // ❄️ 방어 3차 연구: 극저온 동결 역장 (결빙 유발 판정) - PvE 규격 2턴 지속, 4% 동상 DoT & 행동 불가 & 방어력 +40% (행운 저항 연동)
        const freezeChance = freezeTier * 0.18;
        if (freezeTier > 0 && Math.random() < freezeChance && aliveP.length > 0) {
          const appliedHeroes: string[] = [];
          const resistedHeroes: string[] = [];
          aliveP.forEach(defender => {
            const res = applyInvasionStatusEffect(defender, {
              id: 'freeze',
              name: '극저온 동결',
              type: 'debuff',
              icon: '❄️',
              duration: 2,
              value: 0.04,
            });
            if (res.resisted) {
              resistedHeroes.push(`${defender.name}(🍀${defender.luck})`);
            } else {
              appliedHeroes.push(defender.name);
            }
          });

          if (appliedHeroes.length > 0) {
            SoundManager.getInstance().play('ice');
          } else if (resistedHeroes.length > 0) {
            SoundManager.getInstance().play('shield');
          }

          const freezeSubNotice = [
            appliedHeroes.length > 0 ? `[${appliedHeroes.join(', ')}] 동결 구속` : '',
            resistedHeroes.length > 0 ? `🛡️[${resistedHeroes.join(', ')}] 행운 저항!` : '',
          ].filter(Boolean).join(' | ');

          setActionBanner(prev => ({
            text: `${prev.text} · ❄️ [극저온 동결!]`,
            sub: `${prev.sub} | ${freezeSubNotice}`,
            color: appliedHeroes.length > 0 ? '#80d8ff' : '#38ef7d',
          }));
        }

        const mAttacker = combatMetricsRef.current[attacker.id];
        if (mAttacker) {
          mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
          if (isTactCrit) mAttacker.critCount += 1;
        }

        if (isTactCrit) addOppFeverBadge('crit');
        else addOppFeverBadge('break');
      }
    }

    setPlayerTeam([...currentP]);
    setOppTeam([...currentO]);

    // 피버 만충 시 전술 스킬 발동 검사
    if (feverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerPlayerSiegeTactic(), 350);
    }
    if (oppFeverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerEnemyDefenseTactic(), 350);
    }

    // 턴 종료 및 라운드 증가
    const zoomDuration = battleSpeed === 2 ? 350 : 520;
    setTimeout(() => {
      setIsClashZoomed(false);
      setActiveTargetDefenderId(null);
      setActiveCombatantId(null);
      isProcessingRef.current = false;
      // 턴이 순환할 때마다 라운드 계산 (모든 유닛 행동 주기)
      setCurrentRoundNumber(r => {
        const nextR = r + 0.15;
        return Math.min(MAX_SIEGE_ROUNDS + 1, Number(nextR.toFixed(2)));
      });
    }, zoomDuration);

  }, [
    currentRoundNumber,
    battleSpeed,
    gm,
    target,
    selectedFocusTargetId,
    addFeverBadge,
    addOppFeverBadge,
    getCombatantCardPos,
    triggerPlayerSiegeTactic,
    triggerEnemyDefenseTactic,
  ]);

  // 3. 자동 전투 인터벌
  useEffect(() => {
    if (battleResult || countdown !== null) return;
    const interval = setInterval(() => {
      executeSingleTurn();
    }, battleSpeed === 2.5 ? 320 : 450);

    return () => clearInterval(interval);
  }, [battleSpeed, battleResult, countdown, executeSingleTurn]);

  // 보호막 내구도 퍼센트
  const barrierHpPct = Math.max(0, Math.min(100, (barrierState.currentHp / barrierState.maxHp) * 100));
  const turretLeftHpPct = Math.max(0, Math.min(100, (turretLeft.currentHp / turretLeft.maxHp) * 100));
  const turretRightHpPct = Math.max(0, Math.min(100, (turretRight.currentHp / turretRight.maxHp) * 100));

  const displayRound = Math.min(MAX_SIEGE_ROUNDS, Math.floor(currentRoundNumber));

  const battleViewContent = (
    <div
      className="fixed inset-0 z-[9999] bg-[#070a14] flex flex-col items-center justify-between p-2 sm:p-3 select-none overflow-hidden text-[#cfd8e8]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    >
      {/* 배경 시각 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1526]/50 via-transparent to-[#0e1526]/70 pointer-events-none" />
      <BattleVFXOverlay vfxList={vfxList} onFinish={(id) => setVfxList(prev => prev.filter(v => v.id !== id))} />

      {/* ── 1. 상단 전장 헤더 ── */}
      <div className="w-full max-w-[560px] md:max-w-3xl lg:max-w-4xl px-3 py-2 bg-[#0e1526]/95 backdrop-blur-md border border-[#1c2944] rounded-xl shadow-lg flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl p-1 bg-[#ff416c22] border border-[#ff416c44] rounded-lg">🏰</span>
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-1.5 flex-wrap">
              <span>{target.name}</span>
              {target.isBot ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono shrink-0">
                  🤖 BOT
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44] font-mono shrink-0">
                  🌐 지휘관
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
                차원 게이트 Lv.{target.gateLevel}
              </span>
              {target.defenseConcept && (
                <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f18] text-[#ffd54f] border border-[#ffd54f44] shrink-0">
                  {target.defenseConcept}
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#8b9bb4]">
              영주: {target.ownerNickname} ({target.guildName || '자유 용병단'})
            </div>
          </div>
        </div>

        {/* 라운드 & 컨트롤 */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold text-[#ffd54f] bg-[#091120] px-2.5 py-0.5 rounded-lg border border-[#1c2b48]">
              Round {displayRound} / {MAX_SIEGE_ROUNDS}
            </span>
            <span className="text-[8px] text-[#8b9bb4] mt-0.5">
              보호막 돌파 시 승리
            </span>
          </div>

          <button
            className={`px-2 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              battleSpeed === 2.5
                ? 'bg-[#ff704322] border-[#ff7043] text-[#ff7043] shadow-[0_0_10px_rgba(255,112,67,0.4)]'
                : 'bg-[#14161c] border-[#212e48] text-[#ffd54f] hover:border-[#ffd54f]/50'
            }`}
            onClick={() => setBattleSpeed(s => (s === 2 ? 2.5 : 2))}
            title="전투 속도 전환"
          >
            <span>⚡{battleSpeed}x</span>
          </button>
          <button
            className="btn btn-danger text-xs px-2.5 py-1 cursor-pointer"
            onClick={onRetreat}
          >
            퇴각
          </button>
        </div>
      </div>

      {/* ── 2. 중앙 공성 전장 아레나 (반응형 풀와이드 차원 보호막 & 2개 타워 & 수비대) ── */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[560px] md:max-w-3xl lg:max-w-4xl my-auto p-1 flex flex-col justify-between gap-1 overflow-y-auto custom-scrollbar">

        {/* ════════ 🛡️ 수성측 영역 (오퍼레이터 + 2대 포탑 + 가로지르는 차원 보호막) ════════ */}
        <div className="flex flex-col gap-1.5 w-full">
          {/* 수성 오퍼레이터 카드 */}
          <OperatorCard
            hero={oppOperator}
            tactic={oppTactic}
            side="enemy"
            isActing={activeCombatantId === oppOperator?.id}
          />

          {/* 좌/우 2대 전술 타워 패널 */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {/* 좌측 전술 타워 (공격 지원 / 기본 공격 버프) */}
            <div
              onClick={() => setSelectedFocusTargetId('turret_left')}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1 ${
                turretLeft.isDestroyed
                  ? 'bg-[#121216]/60 border-[#262832] opacity-45 grayscale'
                  : selectedFocusTargetId === 'turret_left'
                  ? 'bg-gradient-to-r from-[#2a111a] to-[#1a0a14] border-2 border-[#ff7043] shadow-[0_0_15px_rgba(255,112,67,0.6)] ring-1 ring-[#ff7043]'
                  : 'bg-[#150f1e] border-[#311f38] hover:border-[#ff7043]/60'
              }`}
            >
              {selectedFocusTargetId === 'turret_left' && !turretLeft.isDestroyed && (
                <span className="absolute top-1 right-1 text-[6.5px] px-1 py-0.2 rounded bg-[#ff7043] text-black font-black uppercase tracking-wider animate-pulse z-10">
                  🎯 집중 공격
                </span>
              )}

              {/* 포탑 헤더 & 사수 포트레이트 */}
              <div className="flex items-center gap-1.5">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 border border-[#ff704355] bg-black/60 flex items-center justify-center">
                  {leftTurretHero && getHeroPortraitUrl(leftTurretHero.classId) ? (
                    <img
                      src={getHeroPortraitUrl(leftTurretHero.classId)}
                      alt={leftTurretHero.name}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-base">🗼</span>
                  )}
                  <span className="absolute bottom-0 right-0 text-[6.5px] font-mono font-bold bg-black/85 px-0.5 rounded text-[#ffd54f] leading-none">
                    Lv.{leftTurretHero?.level || target.gateLevel}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs font-bold text-white truncate">
                        {turretLeft.name}
                      </span>
                      <span className="text-[6.5px] px-1 py-0.2 rounded font-bold bg-[#ef535025] text-[#ef5350] border border-[#ef535055] shrink-0">
                        전열
                      </span>
                    </div>
                    <span className="text-[7.5px] font-mono text-[#ff8a80] shrink-0">
                      방어 {turretLeft.def}
                    </span>
                  </div>
                  <div className="text-[7.5px] text-[#ffab91] truncate">
                    사수: {leftTurretHero?.name || '배치 사수'}
                  </div>
                </div>
              </div>

              {/* 버프 배지 */}
              <div className="flex items-center justify-between text-[7.5px] px-1 py-0.5 bg-black/40 rounded border border-white/5">
                <span className="text-[#ff7043] font-bold truncate">💥 화력 지원 (평타)</span>
                <span className="font-mono text-[#ffd54f] shrink-0">
                  +{((oppTower?.attack?.tier1 || 1) * 25)}%
                </span>
              </div>

              {/* 상태이상/디버프 뱃지 */}
              {renderStatusBadges(turretLeft.statusEffects, turretLeft.isDestroyed)}

              {/* HP Bar */}
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ff416c] to-[#ff7043] h-full transition-all duration-300"
                  style={{ width: `${turretLeftHpPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7px] font-mono">
                <span className="text-[#8b9bb4]">
                  {turretLeft.isDestroyed ? '🔥 파괴됨 (사격 중단)' : '내구도'}
                </span>
                <span className="text-white font-bold">
                  {turretLeft.currentHp.toLocaleString()} / {turretLeft.maxHp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 우측 전술 타워 (방호 지원 / 스킬 전술 버프) */}
            <div
              onClick={() => setSelectedFocusTargetId('turret_right')}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1 ${
                turretRight.isDestroyed
                  ? 'bg-[#121216]/60 border-[#262832] opacity-45 grayscale'
                  : selectedFocusTargetId === 'turret_right'
                  ? 'bg-gradient-to-r from-[#0c242c] to-[#0a1824] border-2 border-[#c8aa6e] shadow-[0_0_15px_rgba(200, 170, 110,0.6)] ring-1 ring-[#c8aa6e]'
                  : 'bg-[#0f1726] border-[#1d2d46] hover:border-[#c8aa6e]/60'
              }`}
            >
              {selectedFocusTargetId === 'turret_right' && !turretRight.isDestroyed && (
                <span className="absolute top-1 right-1 text-[6.5px] px-1 py-0.2 rounded bg-[#c8aa6e] text-black font-black uppercase tracking-wider animate-pulse z-10">
                  🎯 집중 공격
                </span>
              )}

              {/* 포탑 헤더 & 사수 포트레이트 */}
              <div className="flex items-center gap-1.5">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 border border-[#c8aa6e55] bg-black/60 flex items-center justify-center">
                  {rightTurretHero && getHeroPortraitUrl(rightTurretHero.classId) ? (
                    <img
                      src={getHeroPortraitUrl(rightTurretHero.classId)}
                      alt={rightTurretHero.name}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-base">🗼</span>
                  )}
                  <span className="absolute bottom-0 right-0 text-[6.5px] font-mono font-bold bg-black/85 px-0.5 rounded text-[#ffd54f] leading-none">
                    Lv.{rightTurretHero?.level || target.gateLevel}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs font-bold text-white truncate">
                        {turretRight.name}
                      </span>
                      <span className="text-[6.5px] px-1 py-0.2 rounded font-bold bg-[#ef535025] text-[#ef5350] border border-[#ef535055] shrink-0">
                        전열
                      </span>
                    </div>
                    <span className="text-[7.5px] font-mono text-[#80deea] shrink-0">
                      방어 {turretRight.def}
                    </span>
                  </div>
                  <div className="text-[7.5px] text-[#80deea] truncate">
                    사수: {rightTurretHero?.name || '배치 사수'}
                  </div>
                </div>
              </div>

              {/* 버프 배지 */}
              <div className="flex items-center justify-between text-[7.5px] px-1 py-0.5 bg-black/40 rounded border border-white/5">
                <span className="text-[#c8aa6e] font-bold truncate">✨ 전술 증폭 (스킬)</span>
                <span className="font-mono text-[#ffd54f] shrink-0">
                  +{((oppTower?.defense?.tier3 || oppTower?.attack?.tier2 || 1) * 30)}%
                </span>
              </div>

              {/* 상태이상/디버프 뱃지 */}
              {renderStatusBadges(turretRight.statusEffects, turretRight.isDestroyed)}

              {/* HP Bar */}
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#c8aa6e] to-[#38ef7d] h-full transition-all duration-300"
                  style={{ width: `${turretRightHpPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7px] font-mono">
                <span className="text-[#8b9bb4]">
                  {turretRight.isDestroyed ? '🔥 파괴됨 (사격 중단)' : '내구도'}
                </span>
                <span className="text-white font-bold">
                  {turretRight.currentHp.toLocaleString()} / {turretRight.maxHp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 🛡️ [핵심] 수비대 앞을 가로질러 전장 전체 너비로 최대로 뻗어 있는 차원 보호막 + 결속 수호자 */}
          <div
            onClick={() => setSelectedFocusTargetId('dimensional_barrier')}
            className={`w-full p-2 sm:p-2.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-2xl flex flex-col gap-1.5 ${
              barrierState.isDestroyed
                ? 'bg-[#10141d]/70 border-[#262f40] opacity-40'
                : selectedFocusTargetId === 'dimensional_barrier'
                ? 'bg-gradient-to-r from-[#09223b]/95 via-[#0b3356]/95 to-[#081f36]/95 border-[#c8aa6e] shadow-[0_0_25px_rgba(200, 170, 110,0.7)] ring-2 ring-[#c8aa6e]'
                : 'bg-gradient-to-r from-[#071728]/90 via-[#0a233b]/90 to-[#061525]/90 border-[#c8aa6e66] shadow-[0_0_15px_rgba(200, 170, 110,0.35)] hover:border-[#c8aa6e]'
            } ${isBarrierHit ? 'animate-pulse scale-[1.01] border-[#ff1744] shadow-[0_0_35px_rgba(255,23,68,0.9)]' : ''}`}
          >
            {/* 육각형 홀로그램 배리어 배경 텍스처 오버레이 */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #c8aa6e 10%, transparent 60%)`,
              }}
            />

            {/* 상단: 보호막 정보 및 결속 수호자 포트레이트 */}
            <div className="flex items-center justify-between relative z-10 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* 결속 수호자 포트레이트 */}
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 border-2 border-[#c8aa6e] bg-black/60 flex items-center justify-center shadow-[0_0_8px_rgba(200, 170, 110,0.4)]">
                  {barrierHero && getHeroPortraitUrl(barrierHero.classId) ? (
                    <img
                      src={getHeroPortraitUrl(barrierHero.classId)}
                      alt={barrierHero.name}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-xl">🛡️</span>
                  )}
                  <span className="absolute bottom-0 right-0 text-[6.5px] font-mono font-bold bg-black/85 px-0.5 rounded text-[#ffd54f] leading-none">
                    Lv.{barrierHero?.level || target.gateLevel}
                  </span>
                  <span className="absolute top-0 left-0 text-[5.5px] font-bold bg-[#c8aa6e] text-black px-0.5 rounded-br leading-none">
                    결속
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8aa6e] via-[#80deea] to-[#ffffff] truncate">
                      차원 왜곡 보호막
                    </span>
                    <span className="text-[7px] px-1 py-0.2 rounded font-bold bg-[#42a5f525] text-[#42a5f5] border border-[#42a5f555] shrink-0">
                      후열
                    </span>
                    <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[#c8aa6e25] text-[#c8aa6e] border border-[#c8aa6e55] shrink-0">
                      방어력 {barrierState.def}
                    </span>
                  </div>
                  <div className="text-[7.5px] sm:text-[8px] text-[#80deea] truncate mt-0.5">
                    {barrierHero ? (
                      <span>
                        수호자 <strong className="text-white">{barrierHero.name}</strong> 결속 (+{barrierHeroBonus.hp.toLocaleString()} HP / +{barrierHeroBonus.def} DEF 반영 · 비전투)
                      </span>
                    ) : (
                      <span>기본 차원 역장 작동 중</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedFocusTargetId === 'dimensional_barrier' && (
                <span className="text-[7.5px] sm:text-[8.5px] px-2 py-0.5 rounded-full font-black bg-[#c8aa6e] text-black shadow-[0_0_12px_rgba(200, 170, 110,0.8)] animate-bounce shrink-0">
                  🎯 집중 돌파 중
                </span>
              )}
            </div>

            {/* 차원 보호막 상태이상/디버프 뱃지 */}
            {renderStatusBadges(barrierState.statusEffects, barrierState.isDestroyed)}

            {/* 대형 보호막 HP 게이지 바 */}
            <div className="relative w-full bg-black/80 rounded-full h-2.5 sm:h-3 overflow-hidden p-0.5 border border-[#c8aa6e44]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c8aa6e] via-[#38ef7d] to-[#ffd54f] transition-all duration-300 relative shadow-[0_0_15px_rgba(200, 170, 110,0.8)]"
                style={{ width: `${barrierHpPct}%` }}
              >
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </div>
            </div>

            {/* 정밀 내구도 수치 및 승리 조건 표기 */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono relative z-10">
              <span className="text-[#80deea] font-bold">
                잔여 내구도: {barrierHpPct.toFixed(1)}% (돌파 시 즉시 공성 승리!)
              </span>
              <span className="text-white font-black">
                {barrierState.currentHp.toLocaleString()} / {barrierState.maxHp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── 상시 유지되는 중앙 액션 로그 타원 배지 & 피버 게이지 ── */}
        <div className="w-full flex flex-col items-center gap-1 my-0.5">
          {/* 적군 피버 바 */}
          <div className="w-full">
            <FeverGaugeBar
              badges={oppFeverBadges}
              party={oppTeam.map(c => ({ classId: c.classId } as any))}
              label="DEFENSE FEVER"
              side="enemy"
            />
          </div>

          {/* 중앙 배지 */}
          <div className="px-3 py-1 rounded-full bg-[#0d1527ee] border border-[#c8aa6e55] shadow-xl text-center max-w-[95%] transition-all duration-300 z-10">
            <span className="text-[10px] sm:text-[11px] font-bold block truncate" style={{ color: actionBanner.color }}>
              {actionBanner.text}
            </span>
            <span className="text-[8.5px] sm:text-[9px] text-[#ffd54f] font-bold block mt-0.5 truncate">
              {actionBanner.sub}
            </span>
          </div>

          {/* 아군 피버 바 */}
          <div className="w-full">
            <FeverGaugeBar
              badges={feverBadges}
              party={playerTeam.map(c => ({ classId: c.classId } as any))}
              label="SIEGE FEVER"
              side="player"
            />
          </div>
        </div>

        {/* ════════ ⚔️ 공성측 결사대 영역 (3인 결사대 + 오퍼레이터) ════════ */}
        <div className="flex flex-col gap-1 w-full">
          {/* 아군 3인 결사대 카드 그리드 (포트레이트 교체 및 모바일 최적화) */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {playerTeam.map(h => {
              const hpPct = Math.max(0, (h.currentHp / h.maxHp) * 100);
              const mpPct = Math.max(0, (h.currentMp / h.maxMp) * 100);
              const isDead = h.currentHp <= 0;
              const isActive = activeCombatantId === h.id;
              const isTargeted = activeTargetDefenderId === h.id && !isDead;
              const portraitUrl = getHeroPortraitUrl(h.classId);

              return (
                <div
                  key={h.id}
                  className={`p-1.5 flex flex-col gap-1 rounded-xl transition-all duration-300 ease-out transform relative border ${
                    isDead
                      ? 'bg-[#10141d]/50 border-[#1f2533] opacity-40 grayscale'
                      : isTargeted
                      ? 'bg-[#3b0d18] border-2 border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.95)] scale-105 z-20'
                      : isActive
                      ? 'bg-[#0f243c] border-[#c8aa6e] shadow-[0_0_10px_rgba(200, 170, 110,0.4)] ring-1 ring-[#c8aa6e]'
                      : 'bg-[#0d1726] border-[#1a2d48]'
                  }`}
                >
                  {isTargeted && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff1744] text-white z-30 animate-pulse">
                      🎯 피격
                    </span>
                  )}
                  {isActive && !isDead && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[6.5px] px-1.5 py-0.1 rounded-full font-bold bg-[#c8aa6e] text-black shadow-md z-10 animate-bounce">
                      돌격
                    </span>
                  )}

                  {/* 포트레이트 및 영웅 정보 */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 border border-[#c8aa6e55] bg-black/60 flex items-center justify-center">
                      {portraitUrl ? (
                        <img
                          src={portraitUrl}
                          alt={h.name}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-base">{h.icon}</span>
                      )}
                      <span className="absolute bottom-0 right-0 text-[6px] font-mono font-bold bg-black/85 px-0.5 rounded text-[#ffd54f] leading-none">
                        Lv.{h.level}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[9px] sm:text-[9.5px] font-bold text-white truncate">{h.name}</div>
                        <span className="text-[6.5px] font-mono text-[#c8aa6e] font-bold shrink-0">
                          {h.position === 'front' ? '전열' : '후열'}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#80deea] truncate">{h.className}</div>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="w-full bg-[#102422] rounded-full h-1 overflow-hidden">
                    <div className="bg-[#38ef7d] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                  </div>
                  {/* MP Bar */}
                  <div className="w-full bg-[#151f33] rounded-full h-0.5 overflow-hidden">
                    <div className="bg-[#c8aa6e] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                  </div>

                  {/* 상태이상 뱃지 표시 */}
                  {h.statusEffects && h.statusEffects.length > 0 && !isDead && (
                    <div className="flex items-center gap-0.5 overflow-x-auto custom-scrollbar py-0.5">
                      {h.statusEffects.map((st, sidx) => (
                        <span
                          key={sidx}
                          className="text-[6.5px] px-1 py-0.2 rounded bg-black/75 border border-white/20 flex items-center gap-0.5 text-white shrink-0 font-mono shadow"
                          title={`${st.name} (${st.duration}턴)`}
                        >
                          <span>{st.icon}</span>
                          <span className="text-[#ffd54f]">{st.duration}T</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[7px] text-right font-mono text-[#8b9bb4]">
                    {!isDead ? `${h.currentHp} / ${h.maxHp}` : '💀 DEAD'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 공성 오퍼레이터 카드 */}
          <OperatorCard
            hero={playerOperator}
            tactic={playerTactic}
            side="player"
            isActing={activeCombatantId === playerOperator?.id}
          />
        </div>
      </div>

      {/* ── 3. 🏆 침공 결과 & 30% 자원 약탈 모달 ── */}
      {battleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[520px] md:max-w-xl max-h-[90vh] overflow-y-auto bg-[#0f1626] border border-[#243756] rounded-2xl p-4 flex flex-col items-center text-center gap-3.5 shadow-2xl animate-scale-up custom-scrollbar">
            <div className={`text-4xl p-3 rounded-2xl border ${battleResult.win ? 'bg-[#38ef7d22] border-[#38ef7d66] text-[#38ef7d]' : 'bg-[#ff416c22] border-[#ff416c66] text-[#ff416c]'}`}>
              {battleResult.win ? '🏰💥' : '🛡️'}
            </div>

            <div>
              <h3 className={`text-xl font-black ${battleResult.win ? 'text-[#38ef7d]' : 'text-[#ff416c]'}`}>
                {battleResult.win ? '차원 보호막 돌파 성공! (공성 대승리)' : '차원 공성전 돌파 실패'}
              </h3>
              <p className="text-xs text-[#8b9bb4] mt-1 max-w-sm">
                {battleResult.reason}
              </p>
            </div>

            {/* 승리 시 30% 복합 약탈 전리품 표시 */}
            {battleResult.win && (
              <div className="w-full bg-[#0b101c] p-3 rounded-xl border border-[#1b263b] flex flex-col gap-2">
                <div className="text-xs font-bold text-[#ffd54f] flex items-center justify-center gap-1.5">
                  <span>🪙</span>
                  <span>영지 30% 전리품 약탈 완료 (고정 2종 + 카테고리별 랜덤 3종)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#121a2c] p-2 rounded-lg border border-[#223352]">
                  {(battleResult.plunderedItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-[#0b1120] border border-[#1d2b45] flex items-center gap-2"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div className="text-left min-w-0">
                        <div className="text-[8.5px] text-[#8b9bb4] truncate">
                          [{item.category}] {item.name}
                        </div>
                        <div className="text-xs font-black text-[#38ef7d] font-mono">
                          +{item.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📊 전투 상세 리포트 */}
            <div className="w-full text-left">
              <CombatMeterTable metrics={combatMetrics} title="⚔️ 3인 결사대 + 오퍼레이터 공성전투 리포트" />
            </div>

            <button
              className={`btn w-full py-2.5 font-bold text-sm ${battleResult.win ? 'btn-primary' : 'btn-danger'}`}
              onClick={() => onFinish(battleResult.win, battleResult.plunderedAmount, 0)}
            >
              확인 및 영지로 복귀
            </button>
          </div>
        </div>
      )}

      {/* ── 4. ⏱️ 3초 카운트다운 오버레이 ── */}
      {countdown !== null && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center p-4 select-none overflow-hidden animate-fade-in pointer-events-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            zIndex: 10000,
            backgroundColor: 'rgba(5, 8, 17, 0.94)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#ff416c55] via-[#8a2be244] to-[#c8aa6e55] blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-[#c8aa6e88] animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />

          {/* 상단 배너 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5 mb-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c8aa6e25] border border-[#c8aa6e] text-[#c8aa6e] text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(200, 170, 110,0.5)]">
              <span>🛡️ DIMENSIONAL SIEGE ASSAULT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_15px_rgba(200, 170, 110,0.8)] mt-2">
              vs {target.name}
            </h2>
            <div className="text-xs text-[#a0aec0] mt-0.5">
              영주 <span className="text-white font-bold">{target.ownerNickname}</span> · 차원 게이트 Lv.{target.gateLevel}
            </div>
          </div>

          {/* 카운트다운 */}
          <div className="relative z-10 flex items-center justify-center my-4 min-h-[180px] w-full">
            {countdown === 'ENGAGE' ? (
              <div className="flex flex-col items-center justify-center text-center w-full animate-scale-up">
                <div
                  className="text-5xl sm:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#ff416c] via-[#ffd54f] to-[#c8aa6e] animate-bounce text-center w-full flex justify-center items-center"
                  style={{
                    filter: 'drop-shadow(0 0 35px rgba(200, 170, 110,0.95))',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  SIEGE ENGAGE!
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#ffd54f] uppercase bg-black/80 px-6 py-2 rounded-full border border-[#ffd54f] shadow-[0_0_25px_rgba(255,213,79,0.6)] text-center mt-2">
                  🔥 {MAX_SIEGE_ROUNDS}라운드 차원 보호막 돌파 작전 개시! 🔥
                </div>
              </div>
            ) : (
              <div key={countdown} className="relative flex items-center justify-center animate-scale-up">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-t-transparent border-b-[#ff416c] border-l-[#c8aa6e] border-r-[#ffd54f] animate-spin shadow-[0_0_35px_rgba(200, 170, 110,0.6)]" />
                <span
                  className="absolute font-black font-cinzel leading-none select-none"
                  style={{
                    fontSize: '6.5rem',
                    color: countdown === 3 ? '#ffd54f' : countdown === 2 ? '#ff416c' : '#c8aa6e',
                    textShadow: '0 0 50px rgba(200, 170, 110,0.95)',
                  }}
                >
                  {countdown}
                </span>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 flex flex-col items-center gap-2 text-center">
            <div className="text-xs font-mono text-[#cbd5e1]">
              3인 결사대 + 1인 오퍼레이터 전술 편성 완료 · 차원 보호막 전면 진입 중
            </div>
            <div className="w-60 h-2 bg-[#141d2e] rounded-full overflow-hidden border border-[#23334d]">
              <div
                className="h-full bg-gradient-to-r from-[#c8aa6e] via-[#ffd54f] to-[#ff416c] transition-all duration-700"
                style={{
                  width: countdown === 3 ? '33%' : countdown === 2 ? '66%' : '100%',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(battleViewContent, document.body)
    : battleViewContent;
};
