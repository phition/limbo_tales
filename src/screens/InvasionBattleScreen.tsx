import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameManager } from '../hooks/useGameManager';
import { InvasionTarget, Skill, StatusEffect, ResourceType, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { BattleVFXOverlay, VFXEvent, VFXType } from '../components/BattleVFXOverlay';
import { GameIcon } from '../components/GameIcon';
import { CustomAssetService } from '../services/CustomAssetService';
import { FeverBadgeType } from '../types/fever';
import { FeverGaugeBar } from '../components/FeverGaugeBar';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { getSkillMagicSchool, getElementalSubtype } from '../utils/skillComboUtils';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

// 🛡️ 차원 영지 침공 방어력 50% 너프 상수
const INVASION_DEF_SCALE = 0.50;

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
}

export interface InvasionStatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  icon: string;
  duration?: number;
  value?: number;
}

interface LeaderInfoCardProps {
  leader: any | null;
  blessing: any | null;
  supporter: any | null;
  side: 'player' | 'enemy';
  isActing: boolean;
}

const LeaderInfoCard: React.FC<LeaderInfoCardProps> = ({
  leader,
  blessing,
  supporter,
  side,
  isActing,
}) => {
  const isPlayer = side === 'player';
  const customAssetService = CustomAssetService.getInstance();
  const classId = leader?.classId || '';
  const imageUrl = customAssetService.getMercenaryOverride(classId) || DEFAULT_CLASS_IMAGES[classId];
  const clsInfo = CHARACTER_CLASSES[classId];
  const clsName = clsInfo?.name || leader?.className || (isPlayer ? '원정대 사령관' : '수비대 사령관');

  return (
    <div
      className={`w-full p-2 rounded-2xl border transition-all relative overflow-hidden shadow-lg ${
        isPlayer
          ? 'bg-gradient-to-r from-[#091424]/95 via-[#0d1c33]/95 to-[#07111e]/95 border-[#00d2ff55] shadow-[#00d2ff15]'
          : 'bg-gradient-to-r from-[#1c0c16]/95 via-[#270e1c]/95 to-[#140810]/95 border-[#ff416c55] shadow-[#ff416c15]'
      } ${isActing ? (isPlayer ? 'ring-2 ring-[#00d2ff] animate-pulse' : 'ring-2 ring-[#ff416c] animate-pulse') : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {/* 좌측: 리더 대형 포트레이트 */}
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
              alt={leader?.name || 'Leader'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl">{clsInfo?.skills[0]?.icon || '👑'}</span>
          )}
          <span className="absolute bottom-0.5 right-0.5 text-[7.5px] font-mono font-black bg-black/85 px-1 py-0.2 rounded text-[#ffd54f] border border-[#ffd54f]/40 leading-none">
            Lv.{leader?.level || 1}
          </span>
          <span className="absolute top-0.5 left-0.5 text-[6.5px] font-bold bg-black/80 px-1 py-0.2 rounded text-[#ffd54f] leading-none">
            👑 LEADER
          </span>
        </div>

        {/* 중앙: 리더 이름, 등급 & 가호 정보 */}
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
                {isPlayer ? '아군 지휘 리더' : '적 영지 방어 리더'}
              </span>
              <span className="text-xs font-black text-white truncate">
                {leader?.name || (isPlayer ? '원정대 사령관' : '수비대 사령관')}
              </span>
              {leader?.grade && (
                <span className="text-[8px] font-bold text-[#ffd54f] shrink-0 font-mono">
                  [{leader.grade.toUpperCase()}]
                </span>
              )}
            </div>
            <span className="text-[9px] text-[#8b9bb4] shrink-0">
              {clsName}
            </span>
          </div>

          {/* 가호 & 서포터 상태 한 줄 패널 */}
          <div className="bg-black/40 rounded-lg px-2 py-0.5 border border-white/10 flex items-center justify-between gap-1.5 mt-1 text-[8.5px]">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-[#ffd54f] font-bold shrink-0">
                ✨ {blessing?.name || '차원의 가호'}:
              </span>
              <span className="text-[#cfd8e8] truncate text-[8px]">
                {blessing?.description || (isPlayer ? '원정 부대 전체 올스탯 증폭' : '영지 방어 부대 능력치 증폭')}
              </span>
            </div>
            {supporter && (
              <div className="shrink-0 flex items-center gap-1 pl-1.5 border-l border-white/10">
                <span className="text-[8px] text-[#ce93d8] truncate font-bold">🤝 {supporter.name}</span>
                <span className="text-[7px] font-mono px-1.5 py-0.2 rounded font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55]">
                  전술 원호 가동 중 ✨🛡️
                </span>
              </div>
            )}
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
  attacker: InvasionCombatant;
  defender: InvasionCombatant;
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

  const [playerTeam, setPlayerTeam] = useState<InvasionCombatant[]>([]);
  const [oppTeam, setOppTeam] = useState<InvasionCombatant[]>([]);
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null);
  const [isAuto] = useState(true);
  const [battleSpeed, setBattleSpeed] = useState<2 | 2.5>(2);
  const [battleRound, setBattleRound] = useState(1);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  
  // 👑 리더 & 🤝 서포터 상태 (3선발 + 1리더 + 1서포터 구성)
  const [playerLeader, setPlayerLeader] = useState<Mercenary | null>(null);
  const [playerSupporter, setPlayerSupporter] = useState<Mercenary | null>(null);
  const playerLeaderRef = useRef<Mercenary | null>(null);
  const playerSupporterRef = useRef<Mercenary | null>(null);

  const [oppLeader, setOppLeader] = useState<any | null>(null);
  const [oppSupporter, setOppSupporter] = useState<any | null>(null);
  const oppLeaderRef = useRef<any | null>(null);
  const oppSupporterRef = useRef<any | null>(null);

  playerLeaderRef.current = playerLeader;
  playerSupporterRef.current = playerSupporter;
  oppLeaderRef.current = oppLeader;
  oppSupporterRef.current = oppSupporter;

  const playerLeaderBlessing = playerLeader ? gm.getLeaderBlessing(playerLeader) : null;
  const oppLeaderBlessing = oppLeader ? gm.getLeaderBlessing(oppLeader) : null;

  // 🔥 피버 게이지 상태
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const [oppFeverBadges, setOppFeverBadges] = useState<FeverBadgeType[]>([]);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  const oppFeverBadgesRef = useRef<FeverBadgeType[]>([]);
  feverBadgesRef.current = feverBadges;
  oppFeverBadgesRef.current = oppFeverBadges;

  // 📊 전투 상세 딜미터기 상태
  const [combatMetrics, setCombatMetrics] = useState<CombatantMetrics[]>([]);
  const combatMetricsRef = useRef<Record<string, CombatantMetrics>>({});

  // 상시 유지되는 중앙 타원 배지 상태
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string }>({
    text: '⚔️ 3 vs 3 차원 영지 침공 프로토콜 가동',
    sub: '3인 선발 + 1인 리더 + 1인 서포터 교전 진행 중...',
    color: '#00d2ff',
  });
  
  const [battleLogs, setBattleLogs] = useState<CombatLogItem[]>([]);
  const [battleResult, setBattleResult] = useState<{
    win: boolean;
    plunderedAmount: number;
    rewardCoins: number;
    plunderedItems?: Array<{ resKey: any; name: string; icon: string; category: string; amount: number }>;
  } | null>(null);

  // ── ⏱️ 전투 시작 전 3초 카운트다운 오버레이 상태 ──
  const [countdown, setCountdown] = useState<number | 'ENGAGE' | null>(3);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const lastRoundTriggeredRef = useRef<number>(0);

  // ── 상/하단 공격자 비주얼 상태 ──
  const [lastPlayerAttacker, setLastPlayerAttacker] = useState<InvasionCombatant | null>(null);
  const [lastEnemyAttacker, setLastEnemyAttacker] = useState<InvasionCombatant | null>(null);

  // ── 💥 실시간 교전 상세 정보 패널 (공격자 & 방어자 반응형 줌인/줌아웃) ──
  const [clashData, setClashData] = useState<ClashData | null>(null);
  const [isClashZoomed, setIsClashZoomed] = useState(false);
  const [activeTargetDefenderId, setActiveTargetDefenderId] = useState<string | null>(null);

  const isProcessingRef = useRef(false);
  const playerTeamRef = useRef<InvasionCombatant[]>([]);
  const oppTeamRef = useRef<InvasionCombatant[]>([]);

  playerTeamRef.current = playerTeam;
  oppTeamRef.current = oppTeam;

  // ── 1. 3v3+1+1 양측 전투원 초기화 ──────────────────────────────────────────
  useEffect(() => {
    // 1. 아군 3선발 + 1리더 + 1서포터 파싱
    const { mainHeroes, leaderHero, supporterHero } = gm.getDimensionalDeck();
    const pSource = mainHeroes.length > 0 ? mainHeroes.slice(0, 3) : (gm.barracks.length > 0 ? gm.barracks.slice(0, 3) : gm.party.slice(0, 3));

    let resolvedSupporter = supporterHero;
    if (!resolvedSupporter) {
      const allHeroes = [...gm.barracks, ...gm.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
      const usedIds = new Set(pSource.map(h => h.id));
      if (leaderHero) usedIds.add(leaderHero.id);
      resolvedSupporter = allHeroes.find(h => !usedIds.has(h.id)) || null;
    }

    setPlayerLeader(leaderHero);
    setPlayerSupporter(resolvedSupporter);
    playerLeaderRef.current = leaderHero;
    playerSupporterRef.current = resolvedSupporter;

    const pBlessing = leaderHero ? gm.getLeaderBlessing(leaderHero) : null;
    const pAtkBonus = pBlessing?.buffs?.atkBonus || 1.0;
    const pDefBonus = pBlessing?.buffs?.defBonus || 1.0;
    const pHpBonus = pBlessing?.buffs?.maxHpBonus || (pBlessing?.buffs as any)?.hpBonus || 1.0;
    const pAllBonus = pBlessing?.buffs?.allStatsBonus || 1.0;

    const pCombatants: InvasionCombatant[] = pSource.map((h, idx) => {
      const eff = gm.getHeroEffectiveStats(h);
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '기본 물리/마법 타격',
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

      const maxHp = Math.round(eff.maxHp * pHpBonus * pAllBonus);
      const atk = Math.round(eff.atk * pAtkBonus * pAllBonus);
      const def = Math.round(eff.def * pDefBonus * pAllBonus);

      // 🗼 수비측 방어 전술 타워 레벨 산출
      const targetTower = target.tacticalTower || {
        attack: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
        defense: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
        utility: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
      };

      // ⚡ 유틸 1차: 침입자 전체 속도 감소 (-1/Lv) / 유틸 3차: 침입자 전체 행운 감소 (-10%/Lv)
      const debuffedSpd = Math.max(1, eff.spd - (targetTower.utility?.tier1 || 0));
      const debuffedLuck = Math.max(0, Math.round(eff.luck * (1 - (targetTower.utility?.tier3 || 0) * 0.1)));

      const pStatusEffects: InvasionStatusEffect[] = [];
      if (pBlessing) {
        pStatusEffects.push({
          id: 'leader_blessing',
          name: pBlessing.name,
          type: 'buff',
          icon: '👑',
          duration: 99,
        });
      }
      if ((targetTower.utility?.tier1 || 0) > 0) {
        pStatusEffects.push({
          id: 'tower_spd',
          name: `감속(-${targetTower.utility.tier1})`,
          type: 'debuff',
          icon: '⚡⬇️',
          duration: 99,
        });
      }
      if ((targetTower.utility?.tier2 || 0) > 0) {
        pStatusEffects.push({
          id: 'tower_mp',
          name: `마나누출(+${targetTower.utility.tier2 * 10}%)`,
          type: 'debuff',
          icon: '💧',
          duration: 99,
        });
      }
      if ((targetTower.utility?.tier3 || 0) > 0) {
        pStatusEffects.push({
          id: 'tower_luck',
          name: `불운(-${targetTower.utility.tier3 * 10}%)`,
          type: 'debuff',
          icon: '🎲⬇️',
          duration: 99,
        });
      }
      if ((targetTower.attack?.tier3 || 0) > 0) {
        pStatusEffects.push({
          id: 'tower_wither',
          name: `시들음(-${(targetTower.attack.tier3 * 0.5).toFixed(1)}%)`,
          type: 'debuff',
          icon: '💀',
          duration: 99,
        });
      }

      return {
        id: h.id,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade,
        level: h.level,
        position: idx < 2 ? 'front' : 'back',
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: eff.maxMp,
        maxMp: eff.maxMp,
        atk: atk,
        def: def,
        spd: debuffedSpd,
        luck: debuffedLuck,
        skills: allSkills,
        isPlayer: true,
        cooldowns: {},
        statusEffects: pStatusEffects,
        icon: cls.skills[0]?.icon || '⚔️',
      };
    });

    // 2. 적군 3선발 + 1리더 + 1서포터 파싱
    const oppSquad = target.defenseSquad || [];
    const oppMain = oppSquad.slice(0, 3);
    const oppLead = oppSquad[3] || null;
    const oppSupp = oppSquad[4] || null;

    setOppLeader(oppLead);
    setOppSupporter(oppSupp);
    oppLeaderRef.current = oppLead;
    oppSupporterRef.current = oppSupp;

    const oBlessing = oppLead ? gm.getLeaderBlessing(oppLead) : null;
    const oAtkBonus = oBlessing?.buffs?.atkBonus || 1.0;
    const oDefBonus = oBlessing?.buffs?.defBonus || 1.0;
    const oHpBonus = oBlessing?.buffs?.maxHpBonus || (oBlessing?.buffs as any)?.hpBonus || 1.0;
    const oAllBonus = oBlessing?.buffs?.allStatsBonus || 1.0;

    // 🗼 수비측 방어 전술 타워 레벨
    const oppTower = target.tacticalTower || {
      attack: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
      defense: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
      utility: { tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)), tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)), tier3: 0 },
    };
    // ⚔️ 공격 1차: 수비측 모든 아군 공격력 +1% per Lv
    const towerAtkMult = 1 + (oppTower.attack?.tier1 || 0) * 0.01;

    // 🛡️ 방어 1차: 시작 시 평균 방어력의 1% per Lv를 보호막으로 부여 (1턴 유지)
    const oppAvgDef = Math.round(oppMain.reduce((sum, h) => sum + h.stats.def, 0) / Math.max(1, oppMain.length));
    const towerShieldAmount = Math.max(10, Math.round(oppAvgDef * ((oppTower.defense?.tier1 || 0) * 0.01)));

    const oCombatants: InvasionCombatant[] = oppMain.map((h, idx) => {
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '기본 물리/마법 타격',
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

      const maxHp = Math.round(h.maxHp * oHpBonus * oAllBonus);
      const atk = Math.round(h.stats.atk * oAtkBonus * oAllBonus * towerAtkMult);
      const def = Math.round(h.stats.def * oDefBonus * oAllBonus);

      const oStatusEffects: InvasionStatusEffect[] = [];
      if (oBlessing) {
        oStatusEffects.push({
          id: 'opp_leader_blessing',
          name: oBlessing.name,
          type: 'buff',
          icon: '👑',
          duration: 99,
        });
      }
      if ((oppTower.attack?.tier1 || 0) > 0) {
        oStatusEffects.push({
          id: 'tower_atk',
          name: `공격증폭(+${oppTower.attack.tier1}%)`,
          type: 'buff',
          icon: '⚔️⬆️',
          duration: 99,
        });
      }
      if ((oppTower.defense?.tier1 || 0) > 0) {
        oStatusEffects.push({
          id: 'tower_shield',
          name: `결계(+${towerShieldAmount})`,
          type: 'buff',
          icon: '🛡️',
          duration: 1,
          value: towerShieldAmount,
        });
      }
      if ((oppTower.defense?.tier2 || 0) > 0) {
        oStatusEffects.push({
          id: 'tower_regen',
          name: `성역재생(+${oppTower.defense.tier2}%)`,
          type: 'buff',
          icon: '💚',
          duration: 99,
        });
      }

      return {
        id: `opp_${idx}_${h.id}`,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade,
        level: h.level,
        position: idx < 2 ? 'front' : 'back',
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: h.maxMp,
        maxMp: h.maxMp,
        atk: atk,
        def: def,
        spd: h.stats.spd,
        luck: h.stats.luck,
        skills: allSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: oStatusEffects,
        icon: cls.skills[0]?.icon || '🛡️',
      };
    });

    setPlayerTeam(pCombatants);
    setOppTeam(oCombatants);
    if (pCombatants.length > 0) setLastPlayerAttacker(pCombatants[0]);
    if (oCombatants.length > 0) setLastEnemyAttacker(oCombatants[0]);

    // 📊 전투 리포트 메트릭스 초기화
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
    if (leaderHero) {
      initMetrics[leaderHero.id] = {
        id: leaderHero.id,
        name: `${leaderHero.name} (👑리더)`,
        className: CHARACTER_CLASSES[leaderHero.classId]?.name || '리더',
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
    if (resolvedSupporter) {
      initMetrics[resolvedSupporter.id] = {
        id: resolvedSupporter.id,
        name: `${resolvedSupporter.name} (🤝서포터)`,
        className: CHARACTER_CLASSES[resolvedSupporter.classId]?.name || '서포터',
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
    if (oppLead) {
      initMetrics[`opp_lead_${oppLead.id}`] = {
        id: `opp_lead_${oppLead.id}`,
        name: `${oppLead.name} (💀적 리더)`,
        className: CHARACTER_CLASSES[oppLead.classId]?.name || '리더',
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
    if (oppSupp) {
      initMetrics[`opp_supp_${oppSupp.id}`] = {
        id: `opp_supp_${oppSupp.id}`,
        name: `${oppSupp.name} (🛡️적 서포터)`,
        className: CHARACTER_CLASSES[oppSupp.classId]?.name || '서포터',
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

    if (pCombatants.length > 0 && oCombatants.length > 0) {
      setClashData({
        attacker: pCombatants[0],
        defender: oCombatants[0],
        skill: pCombatants[0].skills[0] || { id: 'basic_attack', name: '기본 공격', description: '', manaCost: 0, cooldown: 0, targetType: 'single_enemy', power: 1, effectType: 'damage', icon: '⚔️' },
        damage: 0,
        isCrit: false,
        isPlayerAttacking: true,
      });
      setIsClashZoomed(false);
    }
    SoundManager.getInstance().playBgm('battle');
    gm.emit('phaserSceneChange', 'invasion_battle');

    return () => {
      gm.emit('phaserSceneChange', 'invasion');
    };
  }, [target, gm]);

  // 🔥 아군 피버 뱃지 추가
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 💀 적군 피버 뱃지 추가
  const addOppFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setOppFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      oppFeverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 🎯 각 유닛 카드 패널(3선발 그리드 및 리더 카드)의 정밀 좌표 (X%, Y%) 계산 헬퍼
  const getCombatantCardPos = useCallback((combatant: { id: string; isPlayer?: boolean }) => {
    const isPlayer = combatant.isPlayer !== undefined ? combatant.isPlayer : true;
    if (isPlayer) {
      if (playerLeaderRef.current && combatant.id === playerLeaderRef.current.id) {
        return { x: 50, y: 89 };
      }
      const pList = playerTeamRef.current.length > 0 ? playerTeamRef.current : playerTeam;
      const idx = pList.findIndex(c => c.id === combatant.id);
      if (idx !== -1) {
        const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
        return { x: colX, y: 76 };
      }
      return { x: 50, y: 76 };
    } else {
      if (oppLeaderRef.current && combatant.id === oppLeaderRef.current.id) {
        return { x: 50, y: 11 };
      }
      const oList = oppTeamRef.current.length > 0 ? oppTeamRef.current : oppTeam;
      const idx = oList.findIndex(c => c.id === combatant.id);
      if (idx !== -1) {
        const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
        return { x: colX, y: 22 };
      }
      return { x: 50, y: 22 };
    }
  }, [playerTeam, oppTeam]);

  // 👑 아군 리더 궁극기: ALL-OUT LEADER ULTIMATE (피버 만충 시 발동)
  const triggerPlayerLeaderUltimate = useCallback(() => {
    const aliveOpp = oppTeamRef.current.filter(c => c.currentHp > 0);
    const alivePlayer = playerTeamRef.current.filter(c => c.currentHp > 0);
    if (aliveOpp.length === 0 || alivePlayer.length === 0) return;

    const leader = playerLeaderRef.current;
    const cls = leader ? (CHARACTER_CLASSES[leader.classId] || CHARACTER_CLASSES['squire']) : null;
    const ultSkill = cls?.specialSkill || cls?.skills[cls?.skills.length - 1] || {
      id: 'leader_allout',
      name: '차원 총공격',
      description: '적 전원에게 강력한 차원 총폭격을 가합니다.',
      icon: '👑',
      power: 2.2,
      effectType: 'damage'
    };

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: leader
        ? `👑 아군 리더 궁극기: [${leader.name}] ➔ ${ultSkill.name}!`
        : `🔥 아군 피버 총공격: ALL-OUT FEVER BURST!`,
      sub: `아군 피버 게이지 만충! 적 전원에게 강력한 결전 궁극기 폭격!`,
      color: '#ffd54f',
    });

    const leaderEff = leader ? gm.getHeroEffectiveStats(leader) : null;
    const baseAtk = leaderEff ? leaderEff.atk : (alivePlayer.reduce((sum, h) => sum + h.atk, 0) / alivePlayer.length);
    const dmgPerTarget = Math.max(45, Math.floor(baseAtk * 2.2));

    const updatedOpp = oppTeamRef.current.map(c => {
      if (c.currentHp <= 0) return c;
      const finalD = Math.max(20, Math.round(dmgPerTarget * (100 / (100 + c.def * INVASION_DEF_SCALE))));
      if (combatMetricsRef.current[c.id]) combatMetricsRef.current[c.id].damageTaken += finalD;
      const leaderId = leader?.id || alivePlayer[0]?.id;
      if (leaderId && combatMetricsRef.current[leaderId]) {
        combatMetricsRef.current[leaderId].damageDealt += finalD;
        combatMetricsRef.current[leaderId].critCount += 1;
        combatMetricsRef.current[leaderId].actionsCount = (combatMetricsRef.current[leaderId].actionsCount || 0) + 1;
        if (c.currentHp - finalD <= 0) combatMetricsRef.current[leaderId].kills += 1;
      }
      return { ...c, currentHp: Math.max(0, c.currentHp - finalD) };
    });

    aliveOpp.forEach((t, i) => {
      const pos = getCombatantCardPos(t);
      setTimeout(() => {
        setVfxList(prev => [...prev, {
          id: `leader_ult_p_${Date.now()}_${t.id}_${i}`,
          type: 'crit_slash',
          damage: dmgPerTarget,
          isCrit: true,
          x: pos.x,
          y: pos.y,
          duration: 600,
        }]);
        gm.emit('battleHitEffect', {
          x: pos.x,
          y: pos.y,
          color: 0xffd54f,
          isCrit: true,
          type: 'crit_slash',
        });
      }, i * 70);
    });

    oppTeamRef.current = updatedOpp;
    setOppTeam(updatedOpp);
    setFeverBadges([]);
    feverBadgesRef.current = [];
  }, [gm, getCombatantCardPos]);

  // 💀 적군 리더 궁극기: DEFENSE LEADER ULTIMATE (적 피버 만충 시 발동)
  const triggerEnemyLeaderUltimate = useCallback(() => {
    const alivePlayer = playerTeamRef.current.filter(c => c.currentHp > 0);
    const aliveOpp = oppTeamRef.current.filter(c => c.currentHp > 0);
    if (alivePlayer.length === 0 || aliveOpp.length === 0) return;

    const leader = oppLeaderRef.current;
    const cls = leader ? (CHARACTER_CLASSES[leader.classId] || CHARACTER_CLASSES['squire']) : null;
    const ultSkill = cls?.specialSkill || cls?.skills[cls?.skills.length - 1] || {
      id: 'opp_leader_allout',
      name: '수비대 총반격',
      description: '아군 전원에게 강력한 방어 과부하 반격을 가합니다.',
      icon: '💀',
      power: 2.0,
      effectType: 'damage'
    };

    SoundManager.getInstance().play('boss_skill');
    setActionBanner({
      text: leader
        ? `💀 적 리더 궁극기: [${leader.name}] ➔ ${ultSkill.name}!`
        : `💀 영지 수비대 총반격: DEFENSE COUNTER BURST!`,
      sub: `적 피버 게이지 만충! 아군 전원에게 방어막 과부하 반격!`,
      color: '#ff416c',
    });

    const leaderAtk = leader?.stats?.atk || (aliveOpp.reduce((sum, h) => sum + h.atk, 0) / aliveOpp.length);
    const dmgPerTarget = Math.max(35, Math.floor(leaderAtk * 1.9));

    const updatedP = playerTeamRef.current.map(c => {
      if (c.currentHp <= 0) return c;
      const finalD = Math.max(15, Math.round(dmgPerTarget * (100 / (100 + c.def * INVASION_DEF_SCALE))));
      if (combatMetricsRef.current[c.id]) combatMetricsRef.current[c.id].damageTaken += finalD;
      const leadId = leader?.id || aliveOpp[0]?.id;
      if (leadId && combatMetricsRef.current[leadId]) {
        combatMetricsRef.current[leadId].damageDealt += finalD;
        combatMetricsRef.current[leadId].critCount += 1;
        combatMetricsRef.current[leadId].actionsCount = (combatMetricsRef.current[leadId].actionsCount || 0) + 1;
        if (c.currentHp - finalD <= 0) combatMetricsRef.current[leadId].kills += 1;
      }
      return { ...c, currentHp: Math.max(0, c.currentHp - finalD) };
    });

    alivePlayer.forEach((t, i) => {
      const pos = getCombatantCardPos(t);
      setTimeout(() => {
        setVfxList(prev => [...prev, {
          id: `leader_ult_e_${Date.now()}_${t.id}_${i}`,
          type: 'crit_slash',
          damage: dmgPerTarget,
          isCrit: true,
          x: pos.x,
          y: pos.y,
          duration: 600,
        }]);
        gm.emit('battleHitEffect', {
          x: pos.x,
          y: pos.y,
          color: 0xff416c,
          isCrit: true,
          type: 'crit_slash',
        });
      }, i * 70);
    });

    playerTeamRef.current = updatedP;
    setPlayerTeam(updatedP);
    setOppFeverBadges([]);
    oppFeverBadgesRef.current = [];
  }, [gm, getCombatantCardPos]);


  // ── ⏱️ 3카운트다운 타이머 연출 (3 -> 2 -> 1 -> ENGAGE -> 시작) ──────────
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

  // ── 2. 단일 턴 실행 ──────────────────────────────────────────────────
  const executeSingleTurn = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const currentP = [...playerTeamRef.current];
    const currentO = [...oppTeamRef.current];

    const aliveP = currentP.filter(c => c.currentHp > 0);
    const aliveO = currentO.filter(c => c.currentHp > 0);

    // 전투 종료 판정
    if (aliveP.length === 0 || aliveO.length === 0) {
      const isWin = aliveO.length === 0 && aliveP.length > 0;
      const result = gm.executeInvasionPlunder(target, isWin);

      setCombatMetrics(Object.values(combatMetricsRef.current));
      setBattleResult({
        win: isWin,
        plunderedAmount: result.plunderedAmount,
        rewardCoins: 0,
        plunderedItems: result.plunderedItems,
      });

      if (isWin) {
        SoundManager.getInstance().play('victory');
      } else {
        SoundManager.getInstance().play('defeat');
      }

      isProcessingRef.current = false;
      return;
    }

    // 🗼 수비측 방어 전술 타워 레벨
    const tower = target.tacticalTower || {
      attack: {
        tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)),
        tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)),
        tier3: 0,
      },
      defense: {
        tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)),
        tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)),
        tier3: 0,
      },
      utility: {
        tier1: Math.min(3, Math.max(1, (target.gateLevel || 6) - 5)),
        tier2: Math.min(3, Math.max(0, (target.gateLevel || 6) - 6)),
        tier3: 0,
      },
    };

    const defTowerAtkLv = tower.attack?.tier2 || 0;
    const defTowerDefLv = tower.defense?.tier2 || 0;
    const defTowerShredLv = tower.defense?.tier3 || 0;
    const defTowerWitherLv = tower.attack?.tier3 || 0;
    const defTowerUtilMpLv = tower.utility?.tier2 || 0;

    const totalTowerLv =
      (tower.attack?.tier1 || 0) + (tower.attack?.tier2 || 0) + (tower.attack?.tier3 || 0) +
      (tower.defense?.tier1 || 0) + (tower.defense?.tier2 || 0) + (tower.defense?.tier3 || 0) +
      (tower.utility?.tier1 || 0) + (tower.utility?.tier2 || 0) + (tower.utility?.tier3 || 0);

    const turnsPerRound = Math.max(1, aliveP.length + aliveO.length) + (totalTowerLv > 0 ? 1 : 0);
    const currentRoundIndex = Math.floor((battleRound - 1) / turnsPerRound) + 1;

    // 🗼 매 라운드 시작: 방어측 방어 전술 타워의 전용 턴 부여 및 연출
    if (currentRoundIndex > lastRoundTriggeredRef.current) {
      lastRoundTriggeredRef.current = currentRoundIndex;
      setCurrentRoundNumber(currentRoundIndex);

      if (totalTowerLv > 0) {
        const oppAvgAtk = Math.round(aliveO.reduce((sum, c) => sum + c.atk, 0) / Math.max(1, aliveO.length));
        const oppAvgDef = Math.round(aliveO.reduce((sum, c) => sum + c.def, 0) / Math.max(1, aliveO.length));

        // ⚔️ 공격 2차: 아군 평균 공격력의 1% * Lv 자동 포격 (적 전체)
        const towerBombDmg = defTowerAtkLv > 0 ? Math.max(15, Math.round(oppAvgAtk * (defTowerAtkLv * 0.01))) : 0;
        if (towerBombDmg > 0) {
          aliveP.forEach((p) => {
            p.currentHp = Math.max(1, p.currentHp - towerBombDmg);
            if (combatMetricsRef.current[p.id]) {
              combatMetricsRef.current[p.id].damageTaken += towerBombDmg;
            }
          });
        }

        // 🛡️ 방어 2차: 수비 아군 매 라운드 체력 1% * Lv 회복
        if (defTowerDefLv > 0) {
          aliveO.forEach((o) => {
            const healAmt = Math.max(10, Math.round(o.maxHp * (defTowerDefLv * 0.01)));
            o.currentHp = Math.min(o.maxHp, o.currentHp + healAmt);
          });
        }

        // 🛡️ 방어 3차: 침입자(플레이어) 방어력 1% * Lv 누적 감소
        if (defTowerShredLv > 0) {
          aliveP.forEach((p) => {
            const defShred = Math.max(1, Math.round(p.def * (defTowerShredLv * 0.01)));
            p.def = Math.max(1, p.def - defShred);
            const existing = p.statusEffects.find((s) => s.id === 'tower_def_shred');
            if (existing) {
              existing.value = (existing.value || 0) + defShred;
              existing.name = `방어파쇄(-${existing.value})`;
            } else {
              p.statusEffects.push({
                id: 'tower_def_shred',
                name: `방어파쇄(-${defShred})`,
                type: 'debuff',
                icon: '🛡️⬇️',
                duration: 99,
                value: defShred,
              });
            }
          });
        }

        const towerCombatant: InvasionCombatant = {
          id: 'defense_tower',
          name: '방어 전술 타워',
          classId: 'tactical_tower',
          className: `방어 전술 타워 (총 Lv.${totalTowerLv})`,
          grade: 'legend',
          level: totalTowerLv,
          position: 'back',
          currentHp: 9999,
          maxHp: 9999,
          currentMp: 999,
          maxMp: 999,
          atk: oppAvgAtk,
          def: oppAvgDef,
          spd: 999,
          luck: 0,
          skills: [],
          isPlayer: false,
          cooldowns: {},
          statusEffects: [],
          icon: '🗼',
        };

        setActiveCombatantId('defense_tower');
        setLastEnemyAttacker(towerCombatant);

        // 연출 사운드
        SoundManager.getInstance().play('boss_skill');

        // 전술 효과 요약 텍스트
        const effectSummaries: string[] = [];
        if (towerBombDmg > 0) effectSummaries.push(`자동 포격(-${towerBombDmg})`);
        if (defTowerDefLv > 0) effectSummaries.push(`성역 재생(+${defTowerDefLv}%)`);
        if (defTowerShredLv > 0) effectSummaries.push(`방어 파쇄(-${defTowerShredLv}%)`);
        if (effectSummaries.length === 0) effectSummaries.push('방어 전술 결계');

        setActionBanner({
          text: `🗼 [방어 전술 타워] 프로토콜 기동! (Round ${currentRoundIndex})`,
          sub: effectSummaries.join(' · '),
          color: '#ffd54f',
        });

        // 중앙 교전 배틀 아레나에 방어 전술 타워 연출 표기
        setClashData({
          attacker: towerCombatant,
          defender: aliveP[0] || currentP[0],
          skill: {
            id: 'tower_protocol',
            name: towerBombDmg > 0 ? '자동 포격 & 성역 재생' : '방어 전술 프로토콜',
            description: effectSummaries.join(' · '),
            manaCost: 0,
            cooldown: 0,
            targetType: 'all_enemies',
            power: 1.0,
            effectType: 'damage',
            icon: '🗼',
          },
          damage: towerBombDmg,
          isCrit: false,
          isPlayerAttacking: false,
        });
        setIsClashZoomed(true);

        // 침입자(아군) 전원에게 포격 폭발 VFX
        if (towerBombDmg > 0) {
          aliveP.forEach((p, idx) => {
            const pos = getCombatantCardPos(p);
            setTimeout(() => {
              setVfxList((prev) => [
                ...prev,
                {
                  id: `vfx_tower_bomb_${Date.now()}_${p.id}_${idx}`,
                  type: 'fire',
                  damage: towerBombDmg,
                  isCrit: false,
                  x: pos.x,
                  y: pos.y,
                  duration: battleSpeed === 2 ? 350 : 500,
                },
              ]);
              gm.emit('battleHitEffect', {
                x: pos.x,
                y: pos.y,
                color: 0xffa000,
                isCrit: false,
                type: 'fire',
              });
            }, idx * 70);
          });
        }

        // 수비측(적군) 전원에게 성역 회복 VFX
        if (defTowerDefLv > 0) {
          aliveO.forEach((o, idx) => {
            const heal = Math.max(10, Math.round(o.maxHp * (defTowerDefLv * 0.01)));
            const pos = getCombatantCardPos(o);
            setTimeout(() => {
              setVfxList((prev) => [
                ...prev,
                {
                  id: `vfx_tower_heal_${Date.now()}_${o.id}_${idx}`,
                  type: 'holy_heal',
                  text: `+${heal} 💚`,
                  damage: 0,
                  isHeal: true,
                  isCrit: false,
                  x: pos.x,
                  y: pos.y,
                  duration: battleSpeed === 2 ? 350 : 500,
                },
              ]);
              gm.emit('battleHitEffect', {
                x: pos.x,
                y: pos.y,
                color: 0x38ef7d,
                isCrit: false,
                type: 'holy_heal',
              });
            }, idx * 70);
          });
        }

        setBattleLogs((prev) => [
          ...prev.slice(-30),
          {
            round: currentRoundIndex,
            attacker: '🗼 방어 전술 타워',
            defender: '침입 부대 전원',
            damage: towerBombDmg,
            isCrit: false,
            skillName: effectSummaries.join(' / '),
            side: 'enemy',
          },
        ]);

        setPlayerTeam([...currentP]);
        setOppTeam([...currentO]);

        const zoomDuration = battleSpeed === 2 ? 550 : 850;
        setTimeout(() => {
          setIsClashZoomed(false);
          setActiveCombatantId(null);
          isProcessingRef.current = false;
          setBattleRound((r) => r + 1);
        }, zoomDuration);
        return;
      }
    }

    // 턴 순서: 속도(spd) 내림차순 정렬
    const allAlive = [...aliveP, ...aliveO].sort((a, b) => b.spd - a.spd);
    const attacker = allAlive[Math.floor(Math.random() * allAlive.length)];
    if (!attacker || attacker.currentHp <= 0) {
      isProcessingRef.current = false;
      return;
    }

    setActiveCombatantId(attacker.id);
    const isAttackerPlayer = attacker.isPlayer;

    // ⚔️ 공격 3차: 침입자(플레이어) 턴 시작 시 체력 0.5% * Lv 침식 감소
    if (isAttackerPlayer && defTowerWitherLv > 0) {
      const witherDmg = Math.max(5, Math.round(attacker.maxHp * (defTowerWitherLv * 0.005)));
      attacker.currentHp = Math.max(1, attacker.currentHp - witherDmg);
      setLastPlayerAttacker(attacker);
    } else if (isAttackerPlayer) {
      setLastPlayerAttacker(attacker);
    } else {
      setLastEnemyAttacker(attacker);
    }

    const defenders = isAttackerPlayer ? aliveO : aliveP;
    const targetDefender = defenders[Math.floor(Math.random() * defenders.length)];

    if (!targetDefender) {
      isProcessingRef.current = false;
      return;
    }

    // 타겟된 상대 ID 저장 (5인 카드 확대 연출용)
    setActiveTargetDefenderId(targetDefender.id);

    // 사용 가능한 스킬 선정
    const readySkills = attacker.skills.filter((s) => {
      if (s.id === 'basic_attack') return true;
      const cd = attacker.cooldowns[s.id] || 0;
      return cd === 0 && attacker.currentMp >= s.manaCost;
    });

    const chosenSkill =
      readySkills.length > 1 && Math.random() < 0.65
        ? readySkills[Math.floor(Math.random() * (readySkills.length - 1)) + 1]
        : readySkills[0];

    // 스킬 마나 및 쿨다운 적용
    if (chosenSkill.id !== 'basic_attack') {
      // ⚡ 유틸 2차: 침입자 스킬 MP 소모 10% * defTowerUtilMpLv 추가
      const mpCostMult = isAttackerPlayer ? 1 + defTowerUtilMpLv * 0.1 : 1.0;
      const finalMpCost = Math.round(chosenSkill.manaCost * mpCostMult);
      attacker.currentMp = Math.max(0, attacker.currentMp - finalMpCost);
      attacker.cooldowns[chosenSkill.id] = (chosenSkill.cooldown || 2) + 1;
    }

    // 쿨다운 1씩 감소
    Object.keys(attacker.cooldowns).forEach(k => {
      if (k !== chosenSkill.id && attacker.cooldowns[k] > 0) {
        attacker.cooldowns[k] -= 1;
      }
    });

    // 💨 회피(Evade) 판정
    const evadeChance = Math.min(0.25, Math.max(0.04, (targetDefender.spd * 0.001) + (targetDefender.luck * 0.001)));
    const isEvaded = Math.random() < evadeChance;
    if (isEvaded) {
      const mTarget = combatMetricsRef.current[targetDefender.id];
      if (mTarget) {
        mTarget.dodges += 1;
      }
      const mAttacker = combatMetricsRef.current[attacker.id];
      if (mAttacker) {
        mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
      }

      setActionBanner({
        text: `💨 [회피!] ${targetDefender.name}`,
        sub: `${attacker.name}의 ${chosenSkill.name} 공격을 날렵하게 회피했습니다!`,
        color: '#80deea',
      });

      setClashData({
        attacker: { ...attacker },
        defender: { ...targetDefender },
        skill: chosenSkill,
        damage: 0,
        isCrit: false,
        isPlayerAttacking: isAttackerPlayer,
      });
      setIsClashZoomed(true);

      const defenderPos = getCombatantCardPos(targetDefender);
      const clashY = isAttackerPlayer ? 38 : 62;

      setVfxList(prev => [
        ...prev,
        {
          id: `vfx_evade_clash_${Date.now()}`,
          type: 'evade',
          text: '💨 EVADE',
          x: 50,
          y: clashY,
          duration: battleSpeed === 2 ? 300 : 450,
        },
        {
          id: `vfx_evade_card_${Date.now()}`,
          type: 'evade',
          text: '💨 EVADE',
          x: defenderPos.x,
          y: defenderPos.y,
          duration: battleSpeed === 2 ? 300 : 450,
        },
      ]);
      SoundManager.getInstance().play('evade');

      setBattleLogs(prev => [
        ...prev.slice(-30),
        {
          round: battleRound,
          attacker: attacker.name,
          defender: targetDefender.name,
          damage: 0,
          isCrit: false,
          skillName: `${chosenSkill.name} (회피됨)`,
          side: isAttackerPlayer ? 'player' : 'enemy',
        },
      ]);

      setPlayerTeam([...currentP]);
      setOppTeam([...currentO]);

      const zoomDuration = battleSpeed === 2 ? 300 : 450;
      setTimeout(() => {
        setIsClashZoomed(false);
        setActiveTargetDefenderId(null);
        setActiveCombatantId(null);
        isProcessingRef.current = false;
        setBattleRound(r => r + 1);
      }, zoomDuration);
      return;
    }

    // 데미지 계산 및 마법 계열 특성 반영
    const magicSchool = getSkillMagicSchool(chosenSkill);
    let critChance = attacker.luck * 0.008 + 0.1;
    if (magicSchool === 'holy') {
      critChance += 0.30; // ✨ 신성: 치명타 확률 30% 상승
    }
    const isCrit = Math.random() < critChance;
    let rawDmg = attacker.atk * (chosenSkill.power || 1.0) * (isCrit ? 1.65 : 1.0);
    if (magicSchool === 'dark') {
      rawDmg = rawDmg * 1.20; // 🔮 암흑: 용병 대상 20% 추가 피해
    }
    const effectiveDefScale = magicSchool === 'dark' ? 0.80 : 1.0; // 🔮 암흑: 20% 방어 관통
    let finalDmg = Math.max(1, Math.round(rawDmg * (100 / (100 + (targetDefender.def * INVASION_DEF_SCALE * effectiveDefScale)))));

    // 🛡️ [서포터 전술 원호 방어 (Assist Guard)]
    // 공격 대상(피격자) 측 후방 서포터가 위기 시 방호벽 전개 (35% 확률 또는 치명타 피격 시, 생존 시에만 발동)
    const defSupporter = targetDefender.isPlayer ? playerSupporterRef.current : oppSupporterRef.current;
    const isDefSupporterAlive = defSupporter && (defSupporter.currentHp === undefined || defSupporter.currentHp > 0) && !defSupporter.isDead;
    let isAssistGuarded = false;
    if (isDefSupporterAlive && (isCrit || Math.random() < 0.35) && chosenSkill.effectType !== 'heal' && chosenSkill.effectType !== 'shield') {
      const guardReduction = 0.50; // 원호 데미지 50%로 조정 (50% 경감 및 50% 분담)
      const blockedDmg = Math.round(finalDmg * guardReduction);
      finalDmg = Math.max(1, finalDmg - blockedDmg);
      isAssistGuarded = true;

      const defSuppMetric = combatMetricsRef.current[defSupporter.id];
      if (defSuppMetric) {
        defSuppMetric.actionsCount = (defSuppMetric.actionsCount || 0) + 1;
        const suppDef = (defSupporter as any).def || 50;
        const suppTakenDmg = Math.max(1, Math.round(blockedDmg * (100 / (100 + suppDef * INVASION_DEF_SCALE))));
        defSuppMetric.damageTaken = (defSuppMetric.damageTaken || 0) + suppTakenDmg;
        if (defSupporter.currentHp !== undefined) {
          defSupporter.currentHp = Math.max(0, defSupporter.currentHp - suppTakenDmg);
          if (defSupporter.currentHp <= 0) {
            defSupporter.isDead = true;
          }
        }
      }

      const defPos = getCombatantCardPos(targetDefender);
      setVfxList(prev => [...prev, {
        id: `supp_guard_${Date.now()}`,
        type: 'shield',
        text: '🛡️ 원호 방어(-50%)',
        damage: 0,
        isShield: true,
        x: defPos.x,
        y: defPos.y,
        duration: battleSpeed === 2 ? 350 : 500,
      }]);
      SoundManager.getInstance().play('shield');
    }

    targetDefender.currentHp = Math.max(0, targetDefender.currentHp - finalDmg);

    // ⚔️/💚 [서포터 전술 원호 연계: 원호 추가타 or 원호 치유]
    // 공격측 후방 서포터가 40% 확률로 전술 지원 발동 (생존 시에만 발동, 힐러는 아군 치유, 비-힐러는 적 추가타)
    const atkSupporter = isAttackerPlayer ? playerSupporterRef.current : oppSupporterRef.current;
    const isAtkSupporterAlive = atkSupporter && (atkSupporter.currentHp === undefined || atkSupporter.currentHp > 0) && !atkSupporter.isDead;
    if (isAtkSupporterAlive && Math.random() < 0.40) {
      const suppCls = CHARACTER_CLASSES[atkSupporter.classId] || CHARACTER_CLASSES['squire'];
      const isHealer = suppCls.role === 'healer' || suppCls.skills.some(s => s.effectType === 'heal');
      const suppEff = isAttackerPlayer
        ? gm.getHeroEffectiveStats(atkSupporter)
        : { atk: (atkSupporter.stats?.atk || 30), def: (atkSupporter.stats?.def || 25), maxHp: (atkSupporter.maxHp || 300) };

      if (isHealer) {
        // 💚 원호 치유: 공격자 팀의 체력 비율 최저 아군 회복
        const allyTeam = isAttackerPlayer ? currentP : currentO;
        const livingAllies = allyTeam.filter(c => c.currentHp > 0);
        if (livingAllies.length > 0) {
          const sortedAllies = [...livingAllies].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
          const healTarget = sortedAllies[0];
          if (healTarget) {
            const healAmt = Math.max(25, Math.round(suppEff.atk * 0.85 + (suppEff.maxHp || 300) * 0.08));
            healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healAmt);

            const suppMetric = combatMetricsRef.current[atkSupporter.id];
            if (suppMetric) {
              suppMetric.healingDone += healAmt;
              suppMetric.actionsCount = (suppMetric.actionsCount || 0) + 1;
            }

            const pos = getCombatantCardPos(healTarget);
            setVfxList(prev => [...prev, {
              id: `supp_assist_heal_${Date.now()}`,
              type: 'holy_heal',
              text: `+${healAmt} 💚 원호 치유`,
              damage: 0,
              isHeal: true,
              x: pos.x,
              y: pos.y,
              duration: battleSpeed === 2 ? 400 : 550,
            }]);
            SoundManager.getInstance().play('heal');
          }
        }
      } else {
        // ⚔️ 원호 추가타: 피격당한 적 대상 추가 타격
        if (targetDefender.currentHp > 0) {
          const rawAssistDmg = Math.max(20, Math.round(suppEff.atk * 0.65));
          const assistDmg = Math.max(10, Math.round(rawAssistDmg * (100 / (100 + targetDefender.def * INVASION_DEF_SCALE))));
          targetDefender.currentHp = Math.max(0, targetDefender.currentHp - assistDmg);

          const suppMetric = combatMetricsRef.current[atkSupporter.id];
          if (suppMetric) {
            suppMetric.damageDealt += assistDmg;
            suppMetric.actionsCount = (suppMetric.actionsCount || 0) + 1;
            if (targetDefender.currentHp <= 0) suppMetric.kills += 1;
          }

          const pos = getCombatantCardPos(targetDefender);
          setVfxList(prev => [...prev, {
            id: `supp_assist_strike_${Date.now()}`,
            type: 'bullet',
            damage: assistDmg,
            text: `-${assistDmg} 💥 원호 추가타`,
            x: pos.x,
            y: pos.y,
            duration: battleSpeed === 2 ? 350 : 500,
          }]);
          SoundManager.getInstance().play('heavy_hit');
        }
      }
    }

    // 📊 딜미터기 메트릭스 업데이트
    const mRef = combatMetricsRef.current;
    const mAttacker = mRef[attacker.id];
    if (mAttacker) {
      mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
      if (chosenSkill.effectType === 'heal' || chosenSkill.effectType === 'shield') {
        mAttacker.healingDone += finalDmg;
      } else {
        mAttacker.damageDealt += finalDmg;
      }
      if (isCrit) mAttacker.critCount += 1;
      if (chosenSkill.effectType && ['burn', 'bleed', 'stun', 'freeze', 'debuff'].includes(chosenSkill.effectType)) {
        mRef[attacker.id].combosTriggered += 1;
      }
    }
    if (mRef[targetDefender.id]) {
      mRef[targetDefender.id].damageTaken += finalDmg;
      if (targetDefender.currentHp <= 0) {
        if (mRef[attacker.id]) mRef[attacker.id].kills += 1;
      }
    }

    // 🔥 피버 뱃지 적립
    const attackerTeam = isAttackerPlayer ? playerTeamRef.current : oppTeamRef.current;
    const livingAlliesCount = attackerTeam.filter((c: InvasionCombatant) => c.id !== attacker.id && c.currentHp > 0).length;

    if (isAttackerPlayer) {
      if (chosenSkill.effectType === 'heal') addFeverBadge('heal');
      else if (chosenSkill.effectType === 'shield') addFeverBadge('guard');
      else if (isCrit) addFeverBadge('crit');
      else if (chosenSkill.id !== 'basic_attack') addFeverBadge('extra');
      else if (livingAlliesCount > 0) addFeverBadge('assist');
      else addFeverBadge('break');
    } else {
      if (chosenSkill.effectType === 'heal') addOppFeverBadge('heal');
      else if (chosenSkill.effectType === 'shield') addOppFeverBadge('guard');
      else if (isCrit) addOppFeverBadge('crit');
      else if (chosenSkill.id !== 'basic_attack') addOppFeverBadge('extra');
      else if (livingAlliesCount > 0) addOppFeverBadge('assist');
      else addOppFeverBadge('break');
    }

    // 중앙 타원 배지는 사라지지 않고 항상 유지되며 최신 교전 텍스트로 업데이트
    const guardSubText = isAssistGuarded ? ` (🛡️${defSupporter?.name}의 원호 방어 -50%)` : '';
    setActionBanner({
      text: `${attacker.name}의 ${chosenSkill.name}!`,
      sub: `${targetDefender.name}에게 ${finalDmg.toLocaleString()} ${isCrit ? '치명타 폭발!' : '피해!'}${guardSubText}`,
      color: isAttackerPlayer ? '#00d2ff' : '#ff416c',
    });

    // 실시간 교전 정보 패널 업데이트 & 스무스 줌인 활성화
    setClashData({
      attacker: { ...attacker },
      defender: { ...targetDefender },
      skill: chosenSkill,
      damage: finalDmg,
      isCrit,
      isPlayerAttacking: isAttackerPlayer,
    });
    setIsClashZoomed(true);

    const isTargetFriendly = chosenSkill.effectType === 'heal' || chosenSkill.effectType === 'shield';
    const sid = (chosenSkill.id || '').toLowerCase();
    const sDesc = (chosenSkill.description || '').toLowerCase();
    let vfxType: VFXType = 'slash';
    if (chosenSkill.effectType === 'heal') {
      vfxType = 'holy_heal';
    } else if (chosenSkill.effectType === 'shield') {
      vfxType = 'shield';
    } else if (isCrit) {
      vfxType = 'crit_slash';
    } else if (sid.includes('fire') || sDesc.includes('화염') || chosenSkill.icon === '🔥') {
      vfxType = 'fire';
    } else if (sid.includes('ice') || sDesc.includes('빙결') || chosenSkill.icon === '❄️') {
      vfxType = 'ice';
    } else if (sid.includes('thunder') || sid.includes('light') || sDesc.includes('뇌전') || chosenSkill.icon === '⚡') {
      vfxType = 'lightning';
    } else if (chosenSkill.icon === '🏹' || chosenSkill.icon === '🎯') {
      vfxType = 'bullet';
    } else {
      vfxType = 'slash';
    }

    // 🎯 중앙 대형 교전 패널 좌표 (적군 상세 패널: y 38%, 아군 상세 패널: y 62%)
    const clashTargetY = isTargetFriendly ? (isAttackerPlayer ? 62 : 38) : (isAttackerPlayer ? 38 : 62);
    const clashTargetX = 50;
    const defenderCardPos = getCombatantCardPos(targetDefender);

    const newVfx: VFXEvent = {
      id: `vfx_${Date.now()}`,
      type: vfxType,
      x: clashTargetX,
      y: clashTargetY,
      damage: finalDmg,
      isCrit,
      isHeal: chosenSkill.effectType === 'heal',
      isShield: chosenSkill.effectType === 'shield',
      duration: battleSpeed === 2 ? 300 : 450,
    };
    setVfxList(prev => [...prev, newVfx]);

    // 💥 Phaser 캔버스 엔진 타격 파티클 이펙트 연동 (중앙 교전 패널 + 대상 유닛 카드 동시 파티클 연출)
    const hitColor = isTargetFriendly ? 0x38ef7d : (isAttackerPlayer ? 0x00d2ff : 0xff416c);
    gm.emit('battleHitEffect', {
      x: clashTargetX,
      y: clashTargetY,
      color: hitColor,
      isCrit,
      type: vfxType,
    });
    gm.emit('battleHitEffect', {
      x: defenderCardPos.x,
      y: defenderCardPos.y,
      color: hitColor,
      isCrit,
      type: vfxType,
    });

    SoundManager.getInstance().play(isCrit ? 'crit' : 'slash');

    // 로그 추가
    setBattleLogs(prev => [
      ...prev.slice(-30),
      {
        round: battleRound,
        attacker: attacker.name,
        defender: targetDefender.name,
        damage: finalDmg,
        isCrit,
        skillName: chosenSkill.name,
        side: isAttackerPlayer ? 'player' : 'enemy',
      },
    ]);

    setPlayerTeam([...currentP]);
    setOppTeam([...currentO]);

    // 피버 만충 시 리더 궁극기 발동 검사
    if (feverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerPlayerLeaderUltimate(), 350);
    }
    if (oppFeverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerEnemyLeaderUltimate(), 350);
    }

    // 스무스한 줌인 유지 후 부드럽게 줌아웃 (컴포넌트를 삭제하지 않아 깜빡임 없음)
    const zoomDuration = battleSpeed === 2 ? 350 : 550;
    setTimeout(() => {
      setIsClashZoomed(false);
      setActiveTargetDefenderId(null);
      setActiveCombatantId(null);
      isProcessingRef.current = false;
      setBattleRound(r => r + 1);
    }, zoomDuration);
  }, [battleRound, battleSpeed, gm, target, targetResource, addFeverBadge, addOppFeverBadge, triggerPlayerLeaderUltimate, triggerEnemyLeaderUltimate, getCombatantCardPos]);

  // ── 3. 자동 전투 루프 (카운트다운 완료 후 가동) ─────────────────────────
  useEffect(() => {
    if (!isAuto || battleResult || countdown !== null) return;
    const interval = setInterval(() => {
      executeSingleTurn();
    }, battleSpeed === 2.5 ? 320 : 460);

    return () => clearInterval(interval);
  }, [isAuto, battleSpeed, battleResult, countdown, executeSingleTurn]);

  const alivePlayerCount = playerTeam.filter(h => h.currentHp > 0).length;
  const aliveOppCount = oppTeam.filter(h => h.currentHp > 0).length;

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
      {/* 배경 시각 효과 - 하부 Phaser 캔버스 엔진 투과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1526]/40 via-transparent to-[#0e1526]/60 pointer-events-none" />
      <BattleVFXOverlay vfxList={vfxList} onFinish={(id) => setVfxList(prev => prev.filter(v => v.id !== id))} />

      {/* ── 상단 전장 헤더 ── */}
      <div className="w-full max-w-[520px] px-3 py-2 bg-[#0e1526]/95 backdrop-blur-md border border-[#1c2944] rounded-xl shadow-lg flex items-center justify-between shrink-0 z-10">
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
              군주: {target.ownerNickname} ({target.guildName || '자유 용병단'})
            </div>
          </div>
        </div>

        {/* 턴수 & 컨트롤 버튼 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-[#00d2ff] bg-[#091120] px-2.5 py-1 rounded-lg border border-[#1c2b48]">
            Round {currentRoundNumber}
          </span>
          {/* 속도 전환 스위치: 기본 2.0x ↔ 고속 2.5x */}
          <button
            className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              battleSpeed === 2.5
                ? 'bg-[#ff704322] border-[#ff7043] text-[#ff7043] shadow-[0_0_10px_rgba(255,112,67,0.4)]'
                : 'bg-[#141b2c] border-[#212e48] text-[#ffd54f] hover:border-[#ffd54f]/50'
            }`}
            onClick={() => setBattleSpeed(s => (s === 2 ? 2.5 : 2))}
            title="전투 속도 전환 (기본 2배 / 고속 2.5배)"
          >
            <span className={battleSpeed === 2.5 ? 'animate-pulse' : ''}>⚡</span>
            <span>{battleSpeed === 2.5 ? '고속 2.5x' : '2.0x'}</span>
          </button>
          <button
            className="btn btn-danger text-xs px-2 py-1 cursor-pointer"
            onClick={onRetreat}
          >
            퇴각
          </button>
        </div>
      </div>

      {/* ── 중앙 5 vs 5 아레나 스타일 전장 (상단: 적, 하단: 아군) ── */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[520px] my-auto p-1 flex flex-col justify-between gap-1 overflow-y-auto">
        
        {/* ── 1. 적 진영 (최상단 리더 정보 패널 + 3인 선발 카드 그리드) ── */}
        <div className="flex flex-col gap-1 w-full">
          {/* 최상단 적 리더 포트레이트 및 정보 패널 */}
          <LeaderInfoCard
            leader={oppLeader}
            blessing={oppLeaderBlessing}
            supporter={oppSupporter}
            side="enemy"
            isActing={activeCombatantId === oppLeader?.id}
          />

          {/* 적 3인 선발 카드 그리드 */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {oppTeam.map(h => {
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
                      ? 'bg-[#10141d]/50 border-[#1f2533] opacity-40 grayscale scale-100'
                      : isTargeted
                      ? 'bg-[#3b0d18] border-2 border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.95)] scale-110 sm:scale-115 z-20 ring-2 ring-[#ff1744]'
                      : isActive
                      ? 'bg-[#2a1322] border-[#ff416c] shadow-[0_0_10px_rgba(255,65,108,0.4)] ring-1 ring-[#ff416c] scale-100'
                      : 'bg-[#140f1d] border-[#2d1f38] scale-100'
                  }`}
                >
                  {isTargeted && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff1744] text-white shadow-[0_0_10px_rgba(255,23,68,0.9)] z-30 animate-pulse whitespace-nowrap">
                      🎯 TARGET
                    </span>
                  )}
                  {isActive && !isDead && !isTargeted && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7.5px] px-1 py-0.1 rounded-full font-bold bg-[#ff416c] text-white shadow-md z-10">
                      ACT
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs">{h.icon}</span>
                    <span className="text-[7.5px] font-mono text-[#ff80ab] font-bold">
                      {h.position === 'front' ? '전열' : '후열'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-white truncate">{h.name}</div>
                    <div className="text-[8px] text-[#b39ddb] truncate">{h.className} Lv.{h.level}</div>
                  </div>

                  {/* HP Bar */}
                  <div className="w-full bg-[#26152a] rounded-full h-1 overflow-hidden mt-0.5">
                    <div className="bg-[#ff416c] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                  </div>
                  {/* MP Bar */}
                  <div className="w-full bg-[#151f33] rounded-full h-0.5 overflow-hidden">
                    <div className="bg-[#ce93d8] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                  </div>

                  <div className="text-[7.5px] text-right font-mono text-[#8b9bb4]">
                    {!isDead ? `${h.currentHp}` : '💀 DEAD'}
                  </div>

                  {/* 버프 / 디버프 뱃지 영역 */}
                  {!isDead && h.statusEffects && h.statusEffects.length > 0 && (
                    <div className="flex items-center gap-0.5 flex-wrap mt-0.5 min-h-[14px]">
                      {h.statusEffects.map((eff, sIdx) => {
                        const isBuff = eff.type === 'buff';
                        return (
                          <span
                            key={sIdx}
                            className={`text-[7px] font-bold px-1 py-0.2 rounded-full font-mono flex items-center gap-0.5 border leading-none shadow-sm ${
                              isBuff
                                ? 'bg-[#00d2ff20] text-[#00d2ff] border-[#00d2ff44]'
                                : 'bg-[#ff174420] text-[#ff8a80] border-[#ff174444]'
                            }`}
                            title={`${eff.name} (${isBuff ? '버프' : '디버프'})`}
                          >
                            <span>{eff.icon}</span>
                            <span className="truncate max-w-[42px]">{eff.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. 중앙 배틀 아레나 (위: 적군 패널, 중앙: 타원 배지, 아래: 아군 패널) ── */}
        <div className="w-full max-w-[500px] relative flex flex-col items-center justify-center my-1 z-20 gap-1.5 px-1">
          {clashData && (() => {
            const enemyCombatant = clashData.isPlayerAttacking ? clashData.defender : clashData.attacker;
            const playerCombatant = clashData.isPlayerAttacking ? clashData.attacker : clashData.defender;
            const isEnemyAttacker = !clashData.isPlayerAttacking;
            const isPlayerAttacker = clashData.isPlayerAttacking;

            const enemyHpPct = Math.max(0, (enemyCombatant.currentHp / enemyCombatant.maxHp) * 100);
            const enemyMpPct = Math.max(0, (enemyCombatant.currentMp / enemyCombatant.maxMp) * 100);
            const playerHpPct = Math.max(0, (playerCombatant.currentHp / playerCombatant.maxHp) * 100);
            const playerMpPct = Math.max(0, (playerCombatant.currentMp / playerCombatant.maxMp) * 100);

            return (
              <>
                {/* ── [위쪽] 적군 상세 정보 패널 (2배 대형 포트레이트 + 3단 확장 정보) ── */}
                <div
                  className={`w-full p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 flex items-center gap-2.5 sm:gap-3 relative overflow-hidden ${
                    isEnemyAttacker
                      ? 'bg-gradient-to-r from-[#2c0c1b]/95 via-[#1e0712]/95 to-[#12040a]/95 border-[#ff416c88] shadow-[0_0_20px_rgba(255,65,108,0.35)]'
                      : 'bg-gradient-to-r from-[#200a18]/90 via-[#160610]/90 to-[#0e040a]/90 border-[#ff174466] shadow-[0_0_15px_rgba(255,23,68,0.3)]'
                  } ${isClashZoomed ? 'scale-100 opacity-100 ring-2 ring-[#ff416c]/60' : 'scale-[0.98] opacity-85'}`}
                >
                  {/* 좌측: 2배 대형 포트레이트 (80px ~ 88px) */}
                  <div
                    className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border-2 ${
                      isEnemyAttacker
                        ? 'border-[#ff416c] shadow-[0_0_15px_rgba(255,65,108,0.7)]'
                        : 'border-[#ff1744] shadow-[0_0_15px_rgba(255,23,68,0.7)]'
                    } bg-[#0c1222] flex items-center justify-center`}
                  >
                    {CustomAssetService.getInstance().getMercenaryOverride(enemyCombatant.classId) ||
                    DEFAULT_CLASS_IMAGES[enemyCombatant.classId] ? (
                      <img
                        src={
                          CustomAssetService.getInstance().getMercenaryOverride(enemyCombatant.classId) ||
                          DEFAULT_CLASS_IMAGES[enemyCombatant.classId]
                        }
                        alt={enemyCombatant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{enemyCombatant.icon}</span>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono font-black bg-black/85 px-1.5 py-0.2 rounded-md text-[#ffd54f] border border-[#ffd54f]/40">
                      Lv.{enemyCombatant.level}
                    </span>
                    <span className="absolute top-1 left-1 text-[8px] font-bold bg-black/80 px-1 py-0.2 rounded text-[#ff80ab] border border-white/10">
                      {enemyCombatant.position === 'front' ? '전열' : '후열'}
                    </span>
                  </div>

                  {/* 우측: 3단 확장 정보 구역 */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-20 sm:h-22 py-0.5">
                    {/* 1단: 헤더 (진영/액션 배지 + 이름 + 클래스) */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[8.5px] sm:text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isEnemyAttacker
                              ? 'bg-[#ff416c25] text-[#ff80ab] border border-[#ff416c88]'
                              : 'bg-[#ff174425] text-[#ff8a80] border border-[#ff174488]'
                          }`}
                        >
                          {isEnemyAttacker ? '⚔️ 적군 공습' : '🎯 적군 피격'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {enemyCombatant.name}
                        </span>
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] text-[#ce93d8] font-bold shrink-0">
                        {enemyCombatant.className}
                      </span>
                    </div>

                    {/* 2단: 스킬 또는 피격 액션 박스 */}
                    <div className="bg-black/45 rounded-lg px-2 py-0.5 border border-white/10 flex items-center justify-between text-[9.5px] sm:text-[10px]">
                      {isEnemyAttacker ? (
                        <>
                          <span className="text-[#ffd54f] font-bold flex items-center gap-1 truncate">
                            <span>{clashData.skill.icon || '⚔️'}</span>
                            <span className="truncate">{clashData.skill.name}</span>
                          </span>
                          <span className="text-[8.5px] font-mono text-[#ffb74d] shrink-0">
                            {clashData.skill.power}x 위력
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#ff5252] font-mono font-bold truncate flex items-center gap-1">
                            <span>💥</span>
                            {clashData.damage > 0 ? (
                              <span>-{clashData.damage.toLocaleString()} 피해!</span>
                            ) : (
                              <span>피해 없음</span>
                            )}
                          </span>
                          <span className="text-[8.5px] font-mono text-[#ff8a80] shrink-0 font-bold">
                            {clashData.isCrit ? '🔥 치명타!' : `방어력 ${enemyCombatant.def}`}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 3단: HP & MP 게이지 및 정밀 수치 */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[9px] sm:text-[9px] font-mono">
                        <span className="text-[#ff80ab] font-bold">HP</span>
                        <span className="text-white">
                          <span className="font-bold">{enemyCombatant.currentHp}</span>
                          <span className="text-[#90a4ae]">/{enemyCombatant.maxHp}</span>
                        </span>
                      </div>
                      <div className="w-full bg-black/70 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#ff416c] to-[#ff1744] h-full transition-all duration-300"
                          style={{ width: `${enemyHpPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[8px] sm:text-[8px] font-mono mt-0.5">
                        <span className="text-[#ce93d8] font-bold">MP</span>
                        <span className="text-purple-200">
                          <span>{enemyCombatant.currentMp}</span>
                          <span className="text-[#90a4ae]">/{enemyCombatant.maxMp}</span>
                        </span>
                      </div>
                      <div className="w-full bg-black/70 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-[#ce93d8] h-full transition-all duration-300"
                          style={{ width: `${enemyMpPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 💀 적군 피버 게이지 (적군 패널 바로 아래, 중앙 로그와 마주보도록 배치) */}
                <div className="w-full">
                  <FeverGaugeBar
                    badges={oppFeverBadges}
                    party={oppTeam.map(c => ({ classId: c.classId } as any))}
                    label="ENEMY FEVER"
                    side="enemy"
                  />
                </div>

                {/* ── [중앙] 상시 유지되는 타원 배지형 교전 로그 ── */}
                <div className="px-4 py-1 rounded-full bg-[#0d1527ee] border border-[#00d2ff55] shadow-xl text-center max-w-[95%] transition-all duration-300 z-10">
                  <span className="text-[11px] sm:text-xs font-bold block truncate" style={{ color: actionBanner.color }}>
                    {actionBanner.text}
                  </span>
                  <span className="text-[9.5px] sm:text-[10px] text-[#ffdd88] font-bold block mt-0.5 truncate">
                    {actionBanner.sub}
                  </span>
                </div>

                {/* 🔥 아군 피버 게이지 (중앙 로그 바로 아래, 아군 패널과 마주보도록 배치) */}
                <div className="w-full">
                  <FeverGaugeBar
                    badges={feverBadges}
                    party={playerTeam.map(c => ({ classId: c.classId } as any))}
                    label="PLAYER FEVER"
                    side="player"
                  />
                </div>

                {/* ── [아래쪽] 아군 상세 정보 패널 (2배 대형 포트레이트 + 3단 확장 정보) ── */}
                <div
                  className={`w-full p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 flex items-center gap-2.5 sm:gap-3 relative overflow-hidden ${
                    isPlayerAttacker
                      ? 'bg-gradient-to-r from-[#0a1a30]/95 via-[#0b1c33]/95 to-[#07111f]/95 border-[#00d2ff88] shadow-[0_0_20px_rgba(0,210,255,0.35)]'
                      : 'bg-gradient-to-r from-[#0c1626]/90 via-[#0d192c]/90 to-[#07101c]/90 border-[#00d2ff66] shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                  } ${isClashZoomed ? 'scale-100 opacity-100 ring-2 ring-[#00d2ff]/60' : 'scale-[0.98] opacity-85'}`}
                >
                  {/* 좌측: 2배 대형 포트레이트 (80px ~ 88px) */}
                  <div
                    className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border-2 ${
                      isPlayerAttacker
                        ? 'border-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.7)]'
                        : 'border-[#80deea] shadow-[0_0_15px_rgba(128,222,234,0.7)]'
                    } bg-[#0c1222] flex items-center justify-center`}
                  >
                    {CustomAssetService.getInstance().getMercenaryOverride(playerCombatant.classId) ||
                    DEFAULT_CLASS_IMAGES[playerCombatant.classId] ? (
                      <img
                        src={
                          CustomAssetService.getInstance().getMercenaryOverride(playerCombatant.classId) ||
                          DEFAULT_CLASS_IMAGES[playerCombatant.classId]
                        }
                        alt={playerCombatant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{playerCombatant.icon}</span>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono font-black bg-black/85 px-1.5 py-0.2 rounded-md text-[#ffd54f] border border-[#ffd54f]/40">
                      Lv.{playerCombatant.level}
                    </span>
                    <span className="absolute top-1 left-1 text-[8px] font-bold bg-black/80 px-1 py-0.2 rounded text-[#00d2ff] border border-white/10">
                      {playerCombatant.position === 'front' ? '전열' : '후열'}
                    </span>
                  </div>

                  {/* 우측: 3단 확장 정보 구역 */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-20 sm:h-22 py-0.5">
                    {/* 1단: 헤더 (진영/액션 배지 + 이름 + 클래스) */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[8.5px] sm:text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isPlayerAttacker
                              ? 'bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff88]'
                              : 'bg-[#ff174425] text-[#ff8a80] border border-[#ff174488]'
                          }`}
                        >
                          {isPlayerAttacker ? '⚔️ 아군 진격' : '🎯 아군 피격'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {playerCombatant.name}
                        </span>
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] text-[#80deea] font-bold shrink-0">
                        {playerCombatant.className}
                      </span>
                    </div>

                    {/* 2단: 스킬 또는 피격 액션 박스 */}
                    <div className="bg-black/45 rounded-lg px-2 py-0.5 border border-white/10 flex items-center justify-between text-[9.5px] sm:text-[10px]">
                      {isPlayerAttacker ? (
                        <>
                          <span className="text-[#ffd54f] font-bold flex items-center gap-1 truncate">
                            <span>{clashData.skill.icon || '⚔️'}</span>
                            <span className="truncate">{clashData.skill.name}</span>
                          </span>
                          <span className="text-[8.5px] font-mono text-[#00e5ff] shrink-0">
                            {clashData.skill.manaCost > 0 ? `${clashData.skill.manaCost} MP` : '일반'} · {clashData.skill.power}x
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#ff5252] font-mono font-bold truncate flex items-center gap-1">
                            <span>💥</span>
                            {clashData.damage > 0 ? (
                              <span>-{clashData.damage.toLocaleString()} 피해!</span>
                            ) : (
                              <span>피해 없음</span>
                            )}
                          </span>
                          <span className="text-[8.5px] font-mono text-[#80deea] shrink-0 font-bold">
                            {clashData.isCrit ? '🔥 치명타!' : `방어력 ${playerCombatant.def}`}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 3단: HP & MP 게이지 및 정밀 수치 */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[9px] sm:text-[9px] font-mono">
                        <span className="text-[#38ef7d] font-bold">HP</span>
                        <span className="text-white">
                          <span className="font-bold">{playerCombatant.currentHp}</span>
                          <span className="text-[#90a4ae]">/{playerCombatant.maxHp}</span>
                        </span>
                      </div>
                      <div className="w-full bg-black/70 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#11998e] to-[#38ef7d] h-full transition-all duration-300"
                          style={{ width: `${playerHpPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[8px] sm:text-[8px] font-mono mt-0.5">
                        <span className="text-[#00d2ff] font-bold">MP</span>
                        <span className="text-blue-200">
                          <span>{playerCombatant.currentMp}</span>
                          <span className="text-[#90a4ae]">/{playerCombatant.maxMp}</span>
                        </span>
                      </div>
                      <div className="w-full bg-black/70 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-[#00d2ff] h-full transition-all duration-300"
                          style={{ width: `${playerMpPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* ── 3. 아군 진영 (3인 선발 카드 그리드 + 최하단 리더 정보 패널) ── */}
        <div className="flex flex-col gap-1 w-full">
          {/* 아군 3인 선발 카드 그리드 */}
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
                      ? 'bg-[#10141d]/50 border-[#1f2533] opacity-40 grayscale scale-100'
                      : isTargeted
                      ? 'bg-[#3b0d18] border-2 border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.95)] scale-110 sm:scale-115 z-20 ring-2 ring-[#ff1744]'
                      : isActive
                      ? 'bg-[#0f243c] border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.4)] ring-1 ring-[#00d2ff] scale-100'
                      : 'bg-[#0d1726] border-[#1a2d48] scale-100'
                  }`}
                >
                  {isTargeted && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff1744] text-white shadow-[0_0_10px_rgba(255,23,68,0.9)] z-30 animate-pulse whitespace-nowrap">
                      🎯 TARGET
                    </span>
                  )}
                  {isActive && !isDead && !isTargeted && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7.5px] px-1 py-0.1 rounded-full font-bold bg-[#00d2ff] text-black shadow-md z-10 animate-bounce">
                      ACT
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs">{h.icon}</span>
                    <span className="text-[9px] font-mono text-[#00d2ff] font-bold">
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

                  {/* 버프 / 디버프 뱃지 영역 */}
                  {!isDead && h.statusEffects && h.statusEffects.length > 0 && (
                    <div className="flex items-center gap-0.5 flex-wrap mt-0.5 min-h-[14px]">
                      {h.statusEffects.map((eff, sIdx) => {
                        const isBuff = eff.type === 'buff';
                        return (
                          <span
                            key={sIdx}
                            className={`text-[7px] font-bold px-1 py-0.2 rounded-full font-mono flex items-center gap-0.5 border leading-none shadow-sm ${
                              isBuff
                                ? 'bg-[#00d2ff20] text-[#00d2ff] border-[#00d2ff44]'
                                : 'bg-[#ff174420] text-[#ff8a80] border-[#ff174444]'
                            }`}
                            title={`${eff.name} (${isBuff ? '버프' : '디버프'})`}
                          >
                            <span>{eff.icon}</span>
                            <span className="truncate max-w-[42px]">{eff.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 최하단 아군 리더 포트레이트 및 정보 패널 */}
          <LeaderInfoCard
            leader={playerLeader}
            blessing={playerLeaderBlessing}
            supporter={playerSupporter}
            side="player"
            isActing={activeCombatantId === playerLeader?.id}
          />
        </div>

      </div>

      {/* ── 🏆 침공 결과 & 30% 자원 약탈 모달 ── */}
      {battleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#0f1626] border border-[#243756] rounded-2xl p-4 flex flex-col items-center text-center gap-3.5 shadow-2xl animate-scale-up custom-scrollbar">
            <div className={`text-4xl p-3 rounded-2xl border ${battleResult.win ? 'bg-[#38ef7d22] border-[#38ef7d66] text-[#38ef7d]' : 'bg-[#ff416c22] border-[#ff416c66] text-[#ff416c]'}`}>
              {battleResult.win ? '🏆' : '💀'}
            </div>

            <div>
              <h3 className={`text-xl font-black ${battleResult.win ? 'text-[#38ef7d]' : 'text-[#ff416c]'}`}>
                {battleResult.win ? '차원 영지 침공 대승리!' : '차원 영지 침공 격퇴'}
              </h3>
              <p className="text-xs text-[#8b9bb4] mt-1">
                {battleResult.win
                  ? `『${target.name}』의 5인 방어 부대를 전멸시키고 영지 자원을 약탈했습니다!`
                  : `『${target.name}』의 방어 부대가 강력하여 약탈에 실패하고 퇴각했습니다.`}
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

            {/* 📊 전투 상세 전투 리포트 (용병별 딜량, 회복량, 방어, 회피, 상태이상 연계 등) */}
            <div className="w-full text-left">
              <CombatMeterTable metrics={combatMetrics} title="⚔️ 3v3 영지 침공 전투 리포트" />
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

      {/* ── ⏱️ 전투 시작 직전 화려한 3카운트다운 오버레이 ── */}
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
          {/* 심연 차원 포탈 배경 방사형 글로우 & 다단계 회전 링 */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#ff416c55] via-[#8a2be244] to-[#00d2ff55] blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-[#ff416c88] animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />
          <div className="absolute w-88 h-88 rounded-full border border-[#00d2ff55] animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />

          {/* 상단 침공 작전 개시 배너 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5 mb-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff416c25] border border-[#ff416c] text-[#ff80ab] text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,65,108,0.5)]">
              <span className="animate-spin text-sm">🌀</span>
              <span>DIMENSIONAL INVASION PROTOCOL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_15px_rgba(255,65,108,0.8)] mt-2">
              vs {target.name}
            </h2>
            <div className="text-xs text-[#a0aec0] mt-0.5">
              영주 <span className="text-white font-bold">{target.ownerNickname}</span> ({target.guildName || '자유 용병단'}) · 차원 게이트 Lv.{target.gateLevel}
            </div>
          </div>

          {/* 중앙 화려한 카운트다운 (3 -> 2 -> 1 -> BATTLE START) */}
          <div className="relative z-10 flex items-center justify-center my-4 min-h-[180px] w-full">
            {countdown === 'ENGAGE' ? (
              <div className="flex flex-col items-center justify-center text-center w-full animate-scale-up">
                <div
                  className="text-5xl sm:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#ff416c] via-[#ffd54f] to-[#00d2ff] animate-bounce text-center w-full flex justify-center items-center"
                  style={{
                    filter: 'drop-shadow(0 0 35px rgba(255,65,108,0.95))',
                    WebkitBackgroundClip: 'text',
                    letterSpacing: '0px',
                  }}
                >
                  BATTLE START!
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#ffd54f] uppercase bg-black/80 px-6 py-2 rounded-full border border-[#ffd54f] shadow-[0_0_25px_rgba(255,213,79,0.6)] text-center mt-2">
                  🔥 차원 공성전 전면 돌격 개시! 🔥
                </div>
              </div>
            ) : (
              <div key={countdown} className="relative flex items-center justify-center animate-scale-up">
                {/* 외곽 회전 홀로그램 링 */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-t-transparent border-b-[#ff416c] border-l-[#00d2ff] border-r-[#ffd54f] animate-spin shadow-[0_0_35px_rgba(0,210,255,0.6)]" />
                
                {/* 내부 펄스 링 */}
                <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/40 animate-ping opacity-50" />

                {/* 중앙 거대 카운트다운 숫자 */}
                <span
                  className="absolute font-black font-cinzel leading-none select-none"
                  style={{
                    fontSize: '6.5rem',
                    color: countdown === 3 ? '#ffd54f' : countdown === 2 ? '#ff416c' : '#00d2ff',
                    textShadow: countdown === 3
                      ? '0 0 50px rgba(255,213,79,0.95), 0 0 20px #ffd54f'
                      : countdown === 2
                      ? '0 0 50px rgba(255,65,108,0.95), 0 0 20px #ff416c'
                      : '0 0 50px rgba(0,210,255,0.95), 0 0 20px #00d2ff',
                  }}
                >
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* 하단 출격 현황 & 충전 게이지 바 */}
          <div className="relative z-10 mt-6 flex flex-col items-center gap-2 text-center">
            <div className="text-xs font-mono text-[#cbd5e1]">
              아군 5인 차원 부대 출격 완료 · 전장 진입 중
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
