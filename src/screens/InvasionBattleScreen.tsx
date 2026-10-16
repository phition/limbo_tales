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
import { getSkillMagicSchool } from '../utils/skillComboUtils';
import { resolveSiegeTactic, SiegeTacticDefinition } from '../data/siegeTactics';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

// 🛡️ 차원 영지 침공 방어력 스케일
const INVASION_DEF_SCALE = 0.50;
const MAX_SIEGE_ROUNDS = 12;

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

interface SiegeTargetObject {
  id: 'dimensional_barrier' | 'turret_left' | 'turret_right';
  name: string;
  currentHp: number;
  maxHp: number;
  def: number;
  icon: string;
  type: 'barrier' | 'turret';
  side: 'left' | 'right' | 'center';
  isDestroyed: boolean;
  description: string;
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
          ? 'bg-gradient-to-r from-[#091424]/95 via-[#0d1c33]/95 to-[#07111e]/95 border-[#00d2ff55] shadow-[#00d2ff15]'
          : 'bg-gradient-to-r from-[#1c0c16]/95 via-[#270e1c]/95 to-[#140810]/95 border-[#ff416c55] shadow-[#ff416c15]'
      } ${isActing ? (isPlayer ? 'ring-2 ring-[#00d2ff] animate-pulse' : 'ring-2 ring-[#ff416c] animate-pulse') : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {/* 좌측: 오퍼레이터 대형 포트레이트 */}
        <div
          className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 ${
            isPlayer
              ? 'border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.4)]'
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
          <span className={`absolute top-0.5 left-0.5 text-[6.5px] font-bold px-1 py-0.2 rounded leading-none ${isPlayer ? 'bg-[#00d2ff]/80 text-black' : 'bg-[#ff416c]/80 text-white'}`}>
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
                    ? 'bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff66]'
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
            <div className="shrink-0 flex items-center gap-1 pl-1.5 border-l border-white/10 font-mono text-[7px] text-[#00d2ff]">
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

  // 2. 수성측 (3인 수비대 + 1인 오퍼레이터)
  const [oppTeam, setOppTeam] = useState<InvasionCombatant[]>([]);
  const [oppOperator, setOppOperator] = useState<any | null>(null);
  const oppOperatorRef = useRef<any | null>(null);

  // 3. 차원 보호막 및 좌/우 2개 전술 타워
  const [barrierState, setBarrierState] = useState<SiegeTargetObject>({
    id: 'dimensional_barrier',
    name: '차원 왜곡 보호막',
    currentHp: 80000,
    maxHp: 80000,
    def: 40,
    icon: '🛡️',
    type: 'barrier',
    side: 'center',
    isDestroyed: false,
    description: '수비대 전면을 가로지르는 절대 차원 역장',
  });
  const [turretLeft, setTurretLeft] = useState<SiegeTargetObject>({
    id: 'turret_left',
    name: '좌측 지원 포탑',
    currentHp: 20000,
    maxHp: 20000,
    def: 30,
    icon: '🗼',
    type: 'turret',
    side: 'left',
    isDestroyed: false,
    description: '공격 전술 지원 및 침입자 감속',
  });
  const [turretRight, setTurretRight] = useState<SiegeTargetObject>({
    id: 'turret_right',
    name: '우측 방호 포탑',
    currentHp: 20000,
    maxHp: 20000,
    def: 30,
    icon: '🗼',
    type: 'turret',
    side: 'right',
    isDestroyed: false,
    description: '차원 결계 보강 및 수비대 회복',
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
    sub: '12라운드 내에 적 영지의 차원 보호막을 돌파하십시오!',
    color: '#00d2ff',
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

    // 🗼 수비측 방어 전술 타워 레벨 산출
    const oppTower = target.tacticalTower || {
      attack: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
      defense: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
      utility: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
    };

    const totalTowerLv =
      (oppTower.attack?.tier1 || 0) + (oppTower.attack?.tier2 || 0) + (oppTower.attack?.tier3 || 0) +
      (oppTower.defense?.tier1 || 0) + (oppTower.defense?.tier2 || 0) + (oppTower.defense?.tier3 || 0) +
      (oppTower.utility?.tier1 || 0) + (oppTower.utility?.tier2 || 0) + (oppTower.utility?.tier3 || 0);

    // 차원 보호막 및 2대 타워 내구도 계산
    const baseGateLv = target.gateLevel || 6;
    const calcBarrierHp = Math.max(50000, 35000 + baseGateLv * 8000 + totalTowerLv * 3000);
    const calcTurretHp = Math.max(15000, 10000 + baseGateLv * 2200 + totalTowerLv * 1200);
    const barrierDef = Math.max(35, 20 + baseGateLv * 4 + (oppTower.defense?.tier1 || 0) * 8);

    const initBarrier: SiegeTargetObject = {
      id: 'dimensional_barrier',
      name: '차원 왜곡 보호막',
      currentHp: calcBarrierHp,
      maxHp: calcBarrierHp,
      def: barrierDef,
      icon: '🛡️',
      type: 'barrier',
      side: 'center',
      isDestroyed: false,
      description: `게이트 Lv.${baseGateLv} 에너지 공급 역장`,
    };
    const initLeftTurret: SiegeTargetObject = {
      id: 'turret_left',
      name: '좌측 전술 포탑',
      currentHp: calcTurretHp,
      maxHp: calcTurretHp,
      def: Math.round(barrierDef * 0.85),
      icon: '🗼',
      type: 'turret',
      side: 'left',
      isDestroyed: false,
      description: `자동 포격 & 감속 역장 (총 Lv.${(oppTower.attack?.tier1 || 0) + (oppTower.utility?.tier1 || 0)})`,
    };
    const initRightTurret: SiegeTargetObject = {
      id: 'turret_right',
      name: '우측 방호 포탑',
      currentHp: calcTurretHp,
      maxHp: calcTurretHp,
      def: Math.round(barrierDef * 0.85),
      icon: '🗼',
      type: 'turret',
      side: 'right',
      isDestroyed: false,
      description: `결계 수복 & 성역 치유 (총 Lv.${(oppTower.defense?.tier1 || 0) + (oppTower.defense?.tier2 || 0)})`,
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
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
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
        ...cls.skills,
        ...(cls.specialSkill ? [cls.specialSkill] : []),
      ];

      return {
        id: h.id,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade,
        level: h.level,
        position: idx < 2 ? 'front' : 'back',
        currentHp: eff.maxHp,
        maxHp: eff.maxHp,
        currentMp: eff.maxMp,
        maxMp: eff.maxMp,
        atk: eff.atk,
        def: eff.def,
        spd: eff.spd,
        luck: eff.luck,
        skills: allSkills,
        isPlayer: true,
        cooldowns: {},
        statusEffects: [],
        icon: cls.skills[0]?.icon || '⚔️',
        trait: h.trait,
        role: cls.role,
      };
    });

    // 1-2. 수성측 3인 수비대 + 1인 오퍼레이터
    const oppSquad = target.defenseSquad || [];
    const oppMain = oppSquad.slice(0, 3);
    const oppOp = oppSquad[3] || oppSquad[oppSquad.length - 1] || null;
    setOppOperator(oppOp);
    oppOperatorRef.current = oppOp;

    const oCombatants: InvasionCombatant[] = oppMain.map((h, idx) => {
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '성벽 요격 사격',
          description: '보호막 너머 침입자 요격 타격',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '🛡️⚔️',
        },
        ...cls.skills,
        ...(cls.specialSkill ? [cls.specialSkill] : []),
      ];

      return {
        id: `opp_${idx}_${h.id}`,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade,
        level: h.level,
        position: idx < 2 ? 'front' : 'back',
        currentHp: h.maxHp,
        maxHp: h.maxHp,
        currentMp: h.maxMp,
        maxMp: h.maxMp,
        atk: h.stats.atk,
        def: h.stats.def,
        spd: h.stats.spd,
        luck: h.stats.luck,
        skills: allSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: [{
          id: 'barrier_protection',
          name: '차원 차폐(무적)',
          type: 'buff',
          icon: '🛡️✨',
          duration: 99,
        }],
        icon: cls.skills[0]?.icon || '🛡️',
        trait: h.trait,
        role: cls.role,
      };
    });

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
      color: '#00d2ff',
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
    gm.emit('battleHitEffect', { x: 50, y: 38, color: 0x00d2ff, isCrit: true, type: 'fire' });

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

    // 침입자 아군에게 충격파 반격
    const aliveP = playerTeamRef.current.filter(c => c.currentHp > 0);
    const counterDmg = Math.max(15, Math.round(50 * (tactic.defensePower + 1)));
    const updatedP = playerTeamRef.current.map(c => {
      if (c.currentHp <= 0) return c;
      const finalD = Math.max(10, Math.round(counterDmg * (100 / (100 + c.def * INVASION_DEF_SCALE))));
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
    const aliveO = currentO.filter(c => c.currentHp > 0);

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

    // 🛡️ 승패 판정 3: 라운드 초과 (12라운드 방어 성공) -> 수성측 승리
    if (currentRoundNumber > MAX_SIEGE_ROUNDS) {
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

    // 행동자 선정: 아군 3인과 수비대 3인 중 속도 기반 추첨
    const allLivingCombatants = [...aliveP, ...aliveO].sort((a, b) => b.spd - a.spd);
    const attacker = allLivingCombatants[Math.floor(Math.random() * allLivingCombatants.length)];
    if (!attacker) {
      isProcessingRef.current = false;
      return;
    }

    setActiveCombatantId(attacker.id);
    const isAttackerPlayer = attacker.isPlayer;

    // 사용 가능한 스킬 선택
    const readySkills = attacker.skills.filter(s => {
      if (s.id === 'basic_attack') return true;
      const cd = attacker.cooldowns[s.id] || 0;
      return cd === 0 && attacker.currentMp >= s.manaCost;
    });
    const chosenSkill = readySkills.length > 1 && Math.random() < 0.65
      ? readySkills[Math.floor(Math.random() * (readySkills.length - 1)) + 1]
      : readySkills[0];

    if (chosenSkill.id !== 'basic_attack') {
      attacker.currentMp = Math.max(0, attacker.currentMp - chosenSkill.manaCost);
      attacker.cooldowns[chosenSkill.id] = (chosenSkill.cooldown || 2) + 1;
    }
    Object.keys(attacker.cooldowns).forEach(k => {
      if (k !== chosenSkill.id && attacker.cooldowns[k] > 0) attacker.cooldowns[k] -= 1;
    });

    // ─────────────────────────────────────────────────────────────
    // [분기 A] 공성측(아군)의 공격 -> 차원 보호막 or 좌/우 타워 타겟팅!
    // ─────────────────────────────────────────────────────────────
    if (isAttackerPlayer) {
      // 타겟 풀 구성: 보호막(중앙), 좌측 타워, 우측 타워
      const availableTargets: SiegeTargetObject[] = [];
      if (!curBarrier.isDestroyed) availableTargets.push(curBarrier);
      if (!curL.isDestroyed) availableTargets.push(curL);
      if (!curR.isDestroyed) availableTargets.push(curR);

      let targetObj = availableTargets.find(t => t.id === selectedFocusTargetId);
      if (!targetObj || targetObj.isDestroyed) {
        // 자동 가중치: 타워가 살아있다면 60% 보호막, 40% 타워
        if (availableTargets.some(t => t.type === 'turret')) {
          const turrets = availableTargets.filter(t => t.type === 'turret');
          if (Math.random() < 0.40 && turrets.length > 0) {
            targetObj = turrets[Math.floor(Math.random() * turrets.length)];
          } else {
            targetObj = curBarrier;
          }
        } else {
          targetObj = curBarrier;
        }
      }

      setActiveTargetDefenderId(targetObj.id);

      // 치명타 및 피해 계산
      const critChance = attacker.luck * 0.008 + 0.12;
      const isCrit = Math.random() < critChance;
      const rawDmg = attacker.atk * (chosenSkill.power || 1.0) * (isCrit ? 1.6 : 1.0);
      const targetDef = targetObj.def;
      const finalDmg = Math.max(15, Math.round(rawDmg * (100 / (100 + targetDef * INVASION_DEF_SCALE))));

      // 대상 체력 감소
      targetObj.currentHp = Math.max(0, targetObj.currentHp - finalDmg);
      if (targetObj.currentHp <= 0) targetObj.isDestroyed = true;

      if (targetObj.id === 'dimensional_barrier') {
        barrierStateRef.current = { ...targetObj };
        setBarrierState({ ...targetObj });
        setIsBarrierHit(true);
        setTimeout(() => setIsBarrierHit(false), 350);
      } else if (targetObj.id === 'turret_left') {
        turretLeftRef.current = { ...targetObj };
        setTurretLeft({ ...targetObj });
      } else if (targetObj.id === 'turret_right') {
        turretRightRef.current = { ...targetObj };
        setTurretRight({ ...targetObj });
      }

      // 메트릭스 업데이트
      const mAttacker = combatMetricsRef.current[attacker.id];
      if (mAttacker) {
        mAttacker.damageDealt += finalDmg;
        mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
        if (isCrit) mAttacker.critCount += 1;
      }

      // 피버 뱃지 적립
      if (isCrit) addFeverBadge('crit');
      else if (chosenSkill.id !== 'basic_attack') addFeverBadge('extra');
      else addFeverBadge('break');

      // 연출 배너
      const targetDisplayName = targetObj.id === 'dimensional_barrier' ? '🛡️ 차원 보호막' : `🗼 ${targetObj.name}`;
      setActionBanner({
        text: `⚔️ [공성 돌격] ${attacker.name}의 ${chosenSkill.name}!`,
        sub: `${targetDisplayName}에 ${finalDmg.toLocaleString()}의 공성 타격! ${isCrit ? '💥 치명타 작열!' : ''}`,
        color: '#00d2ff',
      });

      // 실시간 교전 정보 패널 업데이트
      setClashData({
        attacker: { ...attacker },
        defender: {
          name: targetObj.name,
          icon: targetObj.icon,
          className: targetObj.id === 'dimensional_barrier' ? '차원 절대 방어막' : '영지 방어 포탑',
          level: target.gateLevel,
          currentHp: targetObj.currentHp,
          maxHp: targetObj.maxHp,
          currentMp: 0,
          maxMp: 0,
          def: targetObj.def,
          classId: 'tactical_tower',
          position: 'center',
        },
        skill: chosenSkill,
        damage: finalDmg,
        isCrit,
        isPlayerAttacking: true,
      });
      setIsClashZoomed(true);

      const targetPos = getCombatantCardPos(targetObj.id, false);
      setVfxList(prev => [
        ...prev,
        {
          id: `vfx_hit_${Date.now()}`,
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
        color: 0x00d2ff,
        isCrit,
        type: isCrit ? 'crit_slash' : 'slash',
      });
      SoundManager.getInstance().play(isCrit ? 'crit' : 'heavy_hit');

      setBattleLogs(prev => [
        ...prev.slice(-30),
        {
          round: currentRoundNumber,
          attacker: attacker.name,
          defender: targetObj.name,
          damage: finalDmg,
          isCrit,
          skillName: chosenSkill.name,
          side: 'player',
        },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // [분기 B] 수성측(적군 수비대)의 공격 -> 차원 보호막 너머에서 아군 3인 타격!
    // ─────────────────────────────────────────────────────────────
    else {
      const targetDefender = aliveP[Math.floor(Math.random() * aliveP.length)];
      if (!targetDefender) {
        isProcessingRef.current = false;
        return;
      }

      setActiveTargetDefenderId(targetDefender.id);

      const critChance = attacker.luck * 0.008 + 0.10;
      const isCrit = Math.random() < critChance;
      const rawDmg = attacker.atk * (chosenSkill.power || 1.0) * (isCrit ? 1.5 : 1.0);
      const finalDmg = Math.max(10, Math.round(rawDmg * (100 / (100 + targetDefender.def * INVASION_DEF_SCALE))));

      targetDefender.currentHp = Math.max(0, targetDefender.currentHp - finalDmg);

      const mAttacker = combatMetricsRef.current[attacker.id];
      if (mAttacker) {
        mAttacker.damageDealt += finalDmg;
        mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
        if (isCrit) mAttacker.critCount += 1;
        if (targetDefender.currentHp <= 0) mAttacker.kills += 1;
      }
      const mDefender = combatMetricsRef.current[targetDefender.id];
      if (mDefender) {
        mDefender.damageTaken += finalDmg;
      }

      if (isCrit) addOppFeverBadge('crit');
      else addOppFeverBadge('break');

      setActionBanner({
        text: `🛡️ [보호막 너머 요격] ${attacker.name}의 ${chosenSkill.name}!`,
        sub: `결사대 [${targetDefender.name}]에게 ${finalDmg.toLocaleString()}의 요격 사격!`,
        color: '#ff416c',
      });

      setClashData({
        attacker: { ...attacker },
        defender: { ...targetDefender },
        skill: chosenSkill,
        damage: finalDmg,
        isCrit,
        isPlayerAttacking: false,
      });
      setIsClashZoomed(true);

      const defPos = getCombatantCardPos(targetDefender.id, true);
      setVfxList(prev => [
        ...prev,
        {
          id: `vfx_def_strike_${Date.now()}`,
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
        color: 0xff416c,
        isCrit,
        type: 'bullet',
      });
      SoundManager.getInstance().play('bow_shot');

      setBattleLogs(prev => [
        ...prev.slice(-30),
        {
          round: currentRoundNumber,
          attacker: attacker.name,
          defender: targetDefender.name,
          damage: finalDmg,
          isCrit,
          skillName: chosenSkill.name,
          side: 'enemy',
        },
      ]);
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

  const displayRound = Math.floor(currentRoundNumber);

  const battleViewContent = (
    <div
      className="fixed inset-0 z-[9999] bg-[#070a14] flex flex-col items-center justify-between p-2 sm:p-3 select-none overflow-hidden text-[#cfd8e8]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
      }}
    >
      {/* 배경 시각 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1526]/50 via-transparent to-[#0e1526]/70 pointer-events-none" />
      <BattleVFXOverlay vfxList={vfxList} onFinish={(id) => setVfxList(prev => prev.filter(v => v.id !== id))} />

      {/* ── 1. 상단 전장 헤더 ── */}
      <div className="w-full max-w-[560px] px-3 py-2 bg-[#0e1526]/95 backdrop-blur-md border border-[#1c2944] rounded-xl shadow-lg flex items-center justify-between shrink-0 z-10">
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
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] font-mono shrink-0">
                  🌐 지휘관
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
                차원 게이트 Lv.{target.gateLevel}
              </span>
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
                : 'bg-[#141b2c] border-[#212e48] text-[#ffd54f] hover:border-[#ffd54f]/50'
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
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[560px] my-auto p-1 flex flex-col justify-between gap-1 overflow-y-auto custom-scrollbar">

        {/* ════════ 🛡️ 수성측 영역 (오퍼레이터 + 보호막 뒤 3인 수비대) ════════ */}
        <div className="flex flex-col gap-1 w-full">
          {/* 수성 오퍼레이터 카드 */}
          <OperatorCard
            hero={oppOperator}
            tactic={oppTactic}
            side="enemy"
            isActing={activeCombatantId === oppOperator?.id}
          />

          {/* 차원 보호막 너머(뒤쪽)에 배치된 3인 수비대 */}
          <div className="relative w-full rounded-2xl p-1.5 bg-[#140b15]/60 border border-[#ff416c33] shadow-inner">
            <div className="flex items-center justify-between px-1 mb-1 text-[8.5px] font-bold text-[#ff80ab]">
              <span className="flex items-center gap-1">
                <span>🛡️</span>
                <span>차원 차폐 수비대 (보호막 방호 중)</span>
              </span>
              <span className="font-mono text-[7.5px] bg-[#ff416c22] px-1.5 py-0.2 rounded border border-[#ff416c44]">
                직접 타격 불가
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 w-full">
              {oppTeam.map(h => {
                const hpPct = Math.max(0, (h.currentHp / h.maxHp) * 100);
                const isDead = h.currentHp <= 0;
                const isActive = activeCombatantId === h.id;

                return (
                  <div
                    key={h.id}
                    className={`p-1.5 flex flex-col gap-0.5 rounded-xl transition-all duration-300 relative border ${
                      isDead
                        ? 'bg-[#10141d]/50 border-[#1f2533] opacity-40 grayscale'
                        : isActive
                        ? 'bg-[#3b1120] border-[#ff416c] shadow-[0_0_12px_rgba(255,65,108,0.7)] ring-1 ring-[#ff416c]'
                        : 'bg-[#180e1a] border-[#381c34]'
                    }`}
                  >
                    {isActive && !isDead && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] px-1 py-0.1 rounded-full font-bold bg-[#ff416c] text-white shadow-md z-10 animate-bounce">
                        사격
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm">{h.icon}</span>
                      <span className="text-[7.5px] font-mono text-[#ff80ab] font-bold">
                        {h.position === 'front' ? '전열' : '후열'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-white truncate">{h.name}</div>
                      <div className="text-[7.5px] text-[#ce93d8] truncate">{h.className} Lv.{h.level}</div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full bg-[#26152a] rounded-full h-1 overflow-hidden mt-0.5">
                      <div className="bg-[#ff416c] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>

                    <div className="text-[7px] text-right font-mono text-[#8b9bb4]">
                      {!isDead ? `${h.currentHp}` : '💀 격퇴'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════ 💥 전장 중앙: 2대 전술 타워 & 최대로 뻗은 차원 보호막 ════════ */}
        <div className="w-full flex flex-col gap-1.5 my-1 z-20">

          {/* 좌/우 2대 전술 타워 패널 */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* 좌측 전술 타워 (공격 지원) */}
            <div
              onClick={() => setSelectedFocusTargetId('turret_left')}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1 ${
                turretLeft.isDestroyed
                  ? 'bg-[#121216]/60 border-[#262832] opacity-45 grayscale'
                  : selectedFocusTargetId === 'turret_left'
                  ? 'bg-gradient-to-r from-[#2a111a] to-[#1a0a14] border-2 border-[#ff7043] shadow-[0_0_15px_rgba(255,112,67,0.6)] ring-1 ring-[#ff7043]'
                  : 'bg-[#150f1e] border-[#311f38] hover:border-[#ff7043]/60'
              }`}
            >
              {selectedFocusTargetId === 'turret_left' && !turretLeft.isDestroyed && (
                <span className="absolute top-1 right-1 text-[7px] px-1 py-0.2 rounded bg-[#ff7043] text-black font-black uppercase tracking-wider animate-pulse">
                  🎯 집중 공격
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>🗼</span>
                  <span>{turretLeft.name}</span>
                </span>
                <span className="text-[8px] font-mono text-[#ff8a80]">
                  {turretLeft.isDestroyed ? '🔥 파괴됨' : `방어 ${turretLeft.def}`}
                </span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ff416c] to-[#ff7043] h-full transition-all duration-300"
                  style={{ width: `${turretLeftHpPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7.5px] font-mono">
                <span className="text-[#8b9bb4]">내구도</span>
                <span className="text-white font-bold">
                  {turretLeft.currentHp.toLocaleString()} / {turretLeft.maxHp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 우측 전술 타워 (결계 방호) */}
            <div
              onClick={() => setSelectedFocusTargetId('turret_right')}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1 ${
                turretRight.isDestroyed
                  ? 'bg-[#121216]/60 border-[#262832] opacity-45 grayscale'
                  : selectedFocusTargetId === 'turret_right'
                  ? 'bg-gradient-to-r from-[#0c242c] to-[#0a1824] border-2 border-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.6)] ring-1 ring-[#00d2ff]'
                  : 'bg-[#0f1726] border-[#1d2d46] hover:border-[#00d2ff]/60'
              }`}
            >
              {selectedFocusTargetId === 'turret_right' && !turretRight.isDestroyed && (
                <span className="absolute top-1 right-1 text-[7px] px-1 py-0.2 rounded bg-[#00d2ff] text-black font-black uppercase tracking-wider animate-pulse">
                  🎯 집중 공격
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>🗼</span>
                  <span>{turretRight.name}</span>
                </span>
                <span className="text-[8px] font-mono text-[#80deea]">
                  {turretRight.isDestroyed ? '🔥 파괴됨' : `방어 ${turretRight.def}`}
                </span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#00d2ff] to-[#38ef7d] h-full transition-all duration-300"
                  style={{ width: `${turretRightHpPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7.5px] font-mono">
                <span className="text-[#8b9bb4]">내구도</span>
                <span className="text-white font-bold">
                  {turretRight.currentHp.toLocaleString()} / {turretRight.maxHp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 🛡️ [핵심] 수비대 앞을 가로질러 전장 전체 너비로 최대로 뻗어 있는 차원 보호막 */}
          <div
            onClick={() => setSelectedFocusTargetId('dimensional_barrier')}
            className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-2xl flex flex-col gap-1.5 ${
              barrierState.isDestroyed
                ? 'bg-[#10141d]/70 border-[#262f40] opacity-40'
                : selectedFocusTargetId === 'dimensional_barrier'
                ? 'bg-gradient-to-r from-[#09223b]/95 via-[#0b3356]/95 to-[#081f36]/95 border-[#00d2ff] shadow-[0_0_25px_rgba(0,210,255,0.7)] ring-2 ring-[#00d2ff]'
                : 'bg-gradient-to-r from-[#071728]/90 via-[#0a233b]/90 to-[#061525]/90 border-[#00d2ff66] shadow-[0_0_15px_rgba(0,210,255,0.35)] hover:border-[#00d2ff]'
            } ${isBarrierHit ? 'animate-pulse scale-[1.01] border-[#ff1744] shadow-[0_0_35px_rgba(255,23,68,0.9)]' : ''}`}
          >
            {/* 육각형 홀로그램 배리어 배경 텍스처 오버레이 */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #00d2ff 10%, transparent 60%)`,
              }}
            />

            {/* 상단: 보호막 헤더 및 집중 타겟 배지 */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl animate-pulse">🛡️</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] via-[#80deea] to-[#ffffff]">
                      차원 왜곡 보호막 (DIMENSIONAL BARRIER)
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55]">
                      방어력 {barrierState.def}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#8b9bb4]">
                    {barrierState.description}
                  </div>
                </div>
              </div>

              {selectedFocusTargetId === 'dimensional_barrier' && (
                <span className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-black bg-[#00d2ff] text-black shadow-[0_0_12px_rgba(0,210,255,0.8)] animate-bounce shrink-0">
                  🎯 결사대 집중 포격 중
                </span>
              )}
            </div>

            {/* 대형 보호막 HP 게이지 바 */}
            <div className="relative w-full bg-black/80 rounded-full h-3 sm:h-3.5 overflow-hidden p-0.5 border border-[#00d2ff44]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00d2ff] via-[#38ef7d] to-[#ffd54f] transition-all duration-300 relative shadow-[0_0_15px_rgba(0,210,255,0.8)]"
                style={{ width: `${barrierHpPct}%` }}
              >
                {/* 셰이머 빛무리 효과 */}
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </div>
            </div>

            {/* 정밀 내구도 수치 및 퍼센트 표기 */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono relative z-10">
              <span className="text-[#80deea] font-bold">
                보호막 잔여 내구도: {barrierHpPct.toFixed(1)}%
              </span>
              <span className="text-white font-black">
                {barrierState.currentHp.toLocaleString()} / {barrierState.maxHp.toLocaleString()}
              </span>
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
            <div className="px-4 py-1 rounded-full bg-[#0d1527ee] border border-[#00d2ff55] shadow-xl text-center max-w-[95%] transition-all duration-300 z-10">
              <span className="text-[10.5px] sm:text-xs font-bold block truncate" style={{ color: actionBanner.color }}>
                {actionBanner.text}
              </span>
              <span className="text-[9px] sm:text-[9.5px] text-[#ffd54f] font-bold block mt-0.5 truncate">
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
        </div>

        {/* ════════ ⚔️ 공성측 영역 (3인 결사대 + 오퍼레이터) ════════ */}
        <div className="flex flex-col gap-1 w-full">
          {/* 아군 3인 결사대 카드 그리드 */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {playerTeam.map(h => {
              const hpPct = Math.max(0, (h.currentHp / h.maxHp) * 100);
              const mpPct = Math.max(0, (h.currentMp / h.maxMp) * 100);
              const isDead = h.currentHp <= 0;
              const isActive = activeCombatantId === h.id;
              const isTargeted = activeTargetDefenderId === h.id && !isDead;

              return (
                <div
                  key={h.id}
                  className={`panel p-1 flex flex-col gap-0.5 rounded-xl transition-all duration-300 ease-out transform relative border ${
                    isDead
                      ? 'bg-[#10141d]/50 border-[#1f2533] opacity-40 grayscale'
                      : isTargeted
                      ? 'bg-[#3b0d18] border-2 border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.95)] scale-105 z-20'
                      : isActive
                      ? 'bg-[#0f243c] border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.4)] ring-1 ring-[#00d2ff]'
                      : 'bg-[#0d1726] border-[#1a2d48]'
                  }`}
                >
                  {isTargeted && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff1744] text-white z-30 animate-pulse">
                      🎯 피격
                    </span>
                  )}
                  {isActive && !isDead && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] px-1.5 py-0.1 rounded-full font-bold bg-[#00d2ff] text-black shadow-md z-10 animate-bounce">
                      돌격
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs">{h.icon}</span>
                    <span className="text-[8px] font-mono text-[#00d2ff] font-bold">
                      {h.position === 'front' ? '전열' : '후열'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-white truncate">{h.name}</div>
                    <div className="text-[8px] text-[#80deea] truncate">{h.className} Lv.{h.level}</div>
                  </div>

                  {/* HP Bar */}
                  <div className="w-full bg-[#102422] rounded-full h-1 overflow-hidden mt-0.5">
                    <div className="bg-[#38ef7d] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                  </div>
                  {/* MP Bar */}
                  <div className="w-full bg-[#151f33] rounded-full h-0.5 overflow-hidden">
                    <div className="bg-[#00d2ff] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                  </div>

                  <div className="text-[7.5px] text-right font-mono text-[#8b9bb4]">
                    {!isDead ? `${h.currentHp}` : '💀 DEAD'}
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
          <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#0f1626] border border-[#243756] rounded-2xl p-4 flex flex-col items-center text-center gap-3.5 shadow-2xl animate-scale-up custom-scrollbar">
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
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            backgroundColor: 'rgba(5, 8, 17, 0.94)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#ff416c55] via-[#8a2be244] to-[#00d2ff55] blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-[#00d2ff88] animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />

          {/* 상단 배너 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5 mb-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d2ff25] border border-[#00d2ff] text-[#00d2ff] text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,210,255,0.5)]">
              <span>🛡️ DIMENSIONAL SIEGE ASSAULT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_15px_rgba(0,210,255,0.8)] mt-2">
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
                  className="text-5xl sm:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#ff416c] via-[#ffd54f] to-[#00d2ff] animate-bounce text-center w-full flex justify-center items-center"
                  style={{
                    filter: 'drop-shadow(0 0 35px rgba(0,210,255,0.95))',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  SIEGE ENGAGE!
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#ffd54f] uppercase bg-black/80 px-6 py-2 rounded-full border border-[#ffd54f] shadow-[0_0_25px_rgba(255,213,79,0.6)] text-center mt-2">
                  🔥 12라운드 차원 보호막 돌파 작전 개시! 🔥
                </div>
              </div>
            ) : (
              <div key={countdown} className="relative flex items-center justify-center animate-scale-up">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-t-transparent border-b-[#ff416c] border-l-[#00d2ff] border-r-[#ffd54f] animate-spin shadow-[0_0_35px_rgba(0,210,255,0.6)]" />
                <span
                  className="absolute font-black font-cinzel leading-none select-none"
                  style={{
                    fontSize: '6.5rem',
                    color: countdown === 3 ? '#ffd54f' : countdown === 2 ? '#ff416c' : '#00d2ff',
                    textShadow: '0 0 50px rgba(0,210,255,0.95)',
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
                className="h-full bg-gradient-to-r from-[#00d2ff] via-[#ffd54f] to-[#ff416c] transition-all duration-700"
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
