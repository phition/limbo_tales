import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { ActionButton } from '../components/ActionButton';
import { ArenaOpponent, EquipmentItem, Mercenary, Skill, StatusEffect, STATUS_EFFECT_META } from '../types/game';
import { FirebaseService, LeaderboardEntry } from '../services/FirebaseService';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { GameManager } from '../managers/GameManager';
import { BattleVFXOverlay, VFXEvent } from '../components/BattleVFXOverlay';
import { generateArenaRewardEquipment, CLASS_HONOR_SHOP_DEFINITIONS, createClassHonorEquipment, recalculateEquipmentStats } from '../data/equipment';
import { NemesisView } from './NemesisView';
import { InvasionView } from './InvasionView';
import { AttackerVisualBox } from '../components/AttackerVisualBox';
import { calculatePartySynergies } from '../data/synergies';
import { FeverBadgeType } from '../types/fever';
import { FeverGaugeBar } from '../components/FeverGaugeBar';
import { evaluateFeverSynergy } from '../utils/feverUtils';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { CustomAssetService } from '../services/CustomAssetService';
import { gameDialog } from '../services/DialogService';
import { getSkillMagicSchool, getElementalSubtype } from '../utils/skillComboUtils';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

// ⚔️ 차원 아레나 PVP 전투 스케일 밸런스 상수
export const ARENA_ATK_SCALE = 0.70; // 공격력 30% 너프 (0.70x)
export const ARENA_DEF_SCALE = 0.50; // 방어력 50% 너프 (0.50x)

interface LeaderInfoCardProps {
  leader: any | null;
  blessing: any | null;
  supporter: any | null;
  side: 'player' | 'enemy';
  isActing: boolean;
  isBot?: boolean;
}

const LeaderInfoCard: React.FC<LeaderInfoCardProps> = ({
  leader,
  blessing,
  supporter,
  side,
  isActing,
  isBot,
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
                {isPlayer ? '아군 지휘 리더' : '상대 결투 리더'}
              </span>
              {!isPlayer && (
                isBot ? (
                  <span className="text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] shrink-0 font-mono">
                    🤖 BOT
                  </span>
                ) : (
                  <span className="text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0 font-mono">
                    🌐 지휘관
                  </span>
                )
              )}
              <span className="text-xs font-black text-white truncate">
                {leader?.name || (isPlayer ? '원정대 사령관' : '결투장 수비 리더')}
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
                {blessing?.description || (isPlayer ? '원정 부대 전체 올스탯 증폭' : '상대 결투 부대 능력치 증폭')}
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

// ── 3v3 아레나 전투 참가자 인터페이스 ─────────────────────────────────────────
interface ArenaCombatant {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  level: number;
  position: 'front' | 'mid' | 'back';
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
  statusEffects: StatusEffect[];
  icon: string;
}

// ── 가짜 상대 생성 ─────────────────────────────────────────────────────────
function generateOpponents(myRank: number, myRating: number, gateLevel: number = 1): ArenaOpponent[] {
  const opponentConfigs = [
    { name: '철혈의 바사라', guild: '붉은 창끝 길드', classes: ['paladin', 'guardian', 'high_saintess', 'tactical_gunner', 'elementalist'] },
    { name: '심연의 루나', guild: '심연 탐험단', classes: ['assassin', 'shadow_phantom', 'calamity_mage', 'berserker', 'war_priest'] },
    { name: '폭풍의 제라드', guild: '황금 독수리단', classes: ['vanguard', 'berserker', 'valhalla_blade', 'sharpshooter', 'bishop'] },
    { name: '황금의 아라나', guild: '달빛 기사단', classes: ['aegis_valkyrie', 'elementalist', 'high_saintess', 'arcane_scholar', 'paladin'] },
    { name: '어둠의 클레오', guild: '무명의 소굴', classes: ['tactical_gunner', 'arcane_scholar', 'bishop', 'duelist', 'guardian'] },
  ];

  return opponentConfigs.map((cfg, i) => {
    const oppRank = Math.max(1, myRank - 4 + i * 2);
    const oppRating = Math.max(900, myRating - 120 + i * 60 + Math.floor(Math.random() * 40));
    const botGateLevel = Math.max(1, Math.min(10, gateLevel + (i % 3 === 0 ? 0 : i % 2 === 0 ? 1 : -1)));
    const mockDeck: Mercenary[] = cfg.classes.map((clsId, idx) => {
      const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
      const pos = idx < 2 ? 'front' : idx === 2 ? 'mid' : 'back';
      return {
        id: `opp_hero_${i}_${idx}`,
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

    return {
      id: `opp_${i}_${Date.now()}`,
      name: cfg.name,
      rank: oppRank,
      rating: oppRating,
      defenseDeck: mockDeck,
      guild: cfg.guild,
      gateLevel: botGateLevel,
      isBot: true,
    };
  });
}

// ── 랭크 뱃지 ──────────────────────────────────────────────────────────────
function getRankBadge(rating: number): { label: string; color: string; border: string; bg: string; icon: string } {
  if (rating >= 2200) return { label: 'Grand Master', color: '#ff416c', border: '#ff416c88', bg: '#ff416c22', icon: '👑' };
  if (rating >= 1900) return { label: 'Master', color: '#ce93d8', border: '#ce93d888', bg: '#ce93d822', icon: '💎' };
  if (rating >= 1600) return { label: 'Diamond', color: '#42a5f5', border: '#42a5f588', bg: '#42a5f522', icon: '💠' };
  if (rating >= 1300) return { label: 'Platinum', color: '#66bb6a', border: '#66bb6a88', bg: '#66bb6a22', icon: '⚔️' };
  if (rating >= 1000) return { label: 'Gold', color: '#ffd54f', border: '#ffd54f88', bg: '#ffd54f22', icon: '🏆' };
  return { label: 'Silver', color: '#9e9e9e', border: '#9e9e9e88', bg: '#9e9e9e22', icon: '🛡️' };
}

type Tab = 'match' | 'ranking' | 'shop';

interface CombatLogItem {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  skillName?: string;
  side: 'player' | 'enemy';
}

export const ArenaScreen: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const gateLevel = gm.isMasterAccount ? 10 : (state.buildings['arenaGate']?.level || 0);
  const isGateBuilt = gateLevel >= 1;
  const isNemesisUnlocked = gateLevel >= 3;
  const isInvasionUnlocked = gateLevel >= 6;

  const [gateMode, setGateMode] = useState<'arena' | 'nemesis' | 'invasion'>('arena');
  const [tab, setTab] = useState<Tab>('match');
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLb, setIsLoadingLb] = useState(false);

  // 게이트 레벨에 따른 개방 모드 자동 보정
  useEffect(() => {
    if (gateMode === 'invasion' && !isInvasionUnlocked) {
      setGateMode(isNemesisUnlocked ? 'nemesis' : 'arena');
    } else if (gateMode === 'nemesis' && !isNemesisUnlocked) {
      setGateMode('arena');
    }
  }, [gateMode, isNemesisUnlocked, isInvasionUnlocked]);

  // ── ⚔️ 3v3+1+1 차원 아레나 몰입형 인터랙티브 전장 상태 ──
  const [activeBattleOpp, setActiveBattleOpp] = useState<ArenaOpponent | null>(null);
  const [playerTeam, setPlayerTeam] = useState<ArenaCombatant[]>([]);
  const [oppTeam, setOppTeam] = useState<ArenaCombatant[]>([]);
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null);
  const [targetEnemyId, setTargetEnemyId] = useState<string | null>(null);
  const [isAuto] = useState(true);
  const [battleSpeed, setBattleSpeed] = useState<1.5 | 2>(1.5);
  const [battleRound, setBattleRound] = useState(1);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [battleLogs, setBattleLogs] = useState<CombatLogItem[]>([]);
  const [turnTick, setTurnTick] = useState(0);
  const [combatMetrics, setCombatMetrics] = useState<CombatantMetrics[]>([]);
  const combatMetricsRef = useRef<Record<string, CombatantMetrics>>({});

  // 👑 리더 & 🛡️ 서포터 상태 (아군 및 적군)
  const [playerLeader, setPlayerLeader] = useState<Mercenary | null>(null);
  const [playerSupporter, setPlayerSupporter] = useState<Mercenary | null>(null);

  const [oppLeader, setOppLeader] = useState<Mercenary | null>(null);
  const [oppSupporter, setOppSupporter] = useState<Mercenary | null>(null);
  const [oppLeaderBlessing, setOppLeaderBlessing] = useState<any | null>(null);

  // 🔥 피버 게이지 (아군 및 적군)
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const [oppFeverBadges, setOppFeverBadges] = useState<FeverBadgeType[]>([]);
  const [isLeaderUltCutin, setIsLeaderUltCutin] = useState(false);
  const [isOppLeaderUltCutin, setIsOppLeaderUltCutin] = useState(false);

  // 🏃 속도(SPD) 기반 턴 순서 큐
  const [roundQueue, setRoundQueue] = useState<string[]>([]);
  const roundQueueRef = useRef<string[]>([]);

  // ── 상/하단 공격자 비주얼 상태 ──
  const [lastPlayerAttacker, setLastPlayerAttacker] = useState<ArenaCombatant | null>(null);
  const [lastEnemyAttacker, setLastEnemyAttacker] = useState<ArenaCombatant | null>(null);

  // ── 대전 상태 동기화용 Refs ──
  const isProcessingRef = useRef(false);
  const playerTeamRef = useRef<ArenaCombatant[]>([]);
  const oppTeamRef = useRef<ArenaCombatant[]>([]);
  const targetEnemyIdRef = useRef<string | null>(null);
  const activeCombatantIdRef = useRef<string | null>(null);
  const isAutoRef = useRef(true);
  const activeBattleOppRef = useRef<ArenaOpponent | null>(null);
  const playerLeaderRef = useRef<Mercenary | null>(null);
  const playerSupporterRef = useRef<Mercenary | null>(null);
  const oppLeaderRef = useRef<Mercenary | null>(null);
  const oppSupporterRef = useRef<Mercenary | null>(null);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  const oppFeverBadgesRef = useRef<FeverBadgeType[]>([]);

  // 대전 최종 결과
  const [finalReward, setFinalReward] = useState<{
    win: boolean;
    ratingDelta: number;
    coins: number;
    equipment: EquipmentItem | null;
    streak: number;
    expGained: number;
    levelUps: string[];
  } | null>(null);
  const finalRewardRef = useRef<typeof finalReward>(null);

  playerTeamRef.current = playerTeam;
  oppTeamRef.current = oppTeam;
  targetEnemyIdRef.current = targetEnemyId;
  activeCombatantIdRef.current = activeCombatantId;
  isAutoRef.current = isAuto;
  finalRewardRef.current = finalReward;
  activeBattleOppRef.current = activeBattleOpp;
  playerLeaderRef.current = playerLeader;
  playerSupporterRef.current = playerSupporter;
  oppLeaderRef.current = oppLeader;
  oppSupporterRef.current = oppSupporter;
  feverBadgesRef.current = feverBadges;
  oppFeverBadgesRef.current = oppFeverBadges;

  const fb = FirebaseService.getInstance();
  const badge = getRankBadge(state.currentArenaRating);
  const isTop10 = state.currentArenaRank <= 10 || state.pveBuffActive;
  const streak = state.arenaStreak || 0;

  // 🌌 5인 차원 부대 편성 검증 및 덱 정보
  const squadCheck = useMemo(() => {
    return gm.isDimensionalSquadReady();
  }, [state.invasionState, state.barracks, state.party, turnTick, gm]);

  const dimDeck = useMemo(() => {
    return gm.getDimensionalDeck();
  }, [state.invasionState, state.barracks, state.party, turnTick, gm]);

  const allAvailableHeroes = useMemo(() => {
    return [...state.barracks, ...state.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
  }, [state.barracks, state.party]);

  // 👑 리더의 가호 및 심연의 백과 도감 보너스, 3인 진형 시너지 계산
  const playerLeaderBlessing = useMemo(() => {
    return playerLeader ? gm.getLeaderBlessing(playerLeader) : null;
  }, [playerLeader, gm]);

  const codexBonus = useMemo(() => {
    return gm.getCodexBonus();
  }, [gm, state.codexUnlockedItems]);

  const activePartySynergies = useMemo(() => {
    const living = playerTeam.filter(c => c.currentHp > 0);
    return calculatePartySynergies(living.map(c => ({ classId: c.classId, position: c.position } as any)));
  }, [playerTeam]);

  // 상대 풀 로드 (차원 앵커 게이트 레벨 반영 + 실제 유저 데이터 우선 매칭 + 부족 시 봇 보충)
  const refreshOpponents = useCallback(async () => {
    try {
      const list = await fb.getArenaOpponents(state.currentArenaRating, state.currentArenaRank, gateLevel, 5);
      if (list && list.length > 0) {
        setOpponents(list);
        return;
      }
    } catch (err) {
      console.warn('[ArenaScreen] fetch arena opponents error:', err);
    }
    setOpponents(generateOpponents(state.currentArenaRank, state.currentArenaRating, gateLevel));
  }, [fb, state.currentArenaRating, state.currentArenaRank, gateLevel]);

  useEffect(() => {
    refreshOpponents();
  }, [refreshOpponents]);

  // 리더보드 로드
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLb(true);
    const data = await fb.getLeaderboard();
    setLeaderboard(data);
    setIsLoadingLb(false);
  }, [fb]);

  useEffect(() => {
    if (tab === 'ranking') {
      fetchLeaderboard();
    }
  }, [tab, fetchLeaderboard]);

  // ── ⚔️ 3v3+1+1 아레나 전투 시작 (진영 초기화) ──────────────────────────────────
  const startPvpSimulation = (opp: ArenaOpponent) => {
    const check = gm.isDimensionalSquadReady();
    if (!check.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 5인 부대 편성 필요',
        message: check.reason || '차원 게이트 전투는 5인 부대(선발 3인 + 리더 1인 + 서포터 1인)가 모두 편성되어야 진행할 수 있습니다.',
        icon: '⚠️',
      });
      return;
    }

    setActiveBattleOpp(opp);
    setBattleLogs([]);
    setFinalReward(null);
    setBattleRound(1);
    setActionBanner(null);
    setVfxList([]);
    setFeverBadges([]);
    setOppFeverBadges([]);
    setIsLeaderUltCutin(false);
    setIsOppLeaderUltCutin(false);
    gm.emit('arenaBattleStateChanged', true);
    gm.emit('phaserSceneChange', 'arena_battle');

    // 1. 아군 3+1+1 덱 파싱
    const { mainHeroes, leaderHero, supporterHero } = gm.getDimensionalDeck();
    setPlayerLeader(leaderHero);
    setPlayerSupporter(supporterHero);

    // 2. 적군 3+1+1 덱 파싱 (opp.defenseDeck 기준 3선발 + 1리더 + 1서포터)
    const oDeck = opp.defenseDeck || [];
    const oppMainHeroes = oDeck.slice(0, 3);
    const oppLeaderHero = oDeck[3] || null;
    const oppSupporterHero = oDeck[4] || null;
    setOppLeader(oppLeaderHero);
    setOppSupporter(oppSupporterHero);

    // 적 리더 가호 보너스 계산 (동등한 전투 조건)
    const oppLeaderBlessing = oppLeaderHero ? gm.getLeaderBlessing(oppLeaderHero) : null;
    setOppLeaderBlessing(oppLeaderBlessing);

    // 3. 아군 3인 선발 전투원 빌드
    const pCombatants: ArenaCombatant[] = mainHeroes.map((h, idx) => {
      const eff = gm.getHeroEffectiveStats(h);
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '단일 대상에게 100% 위력의 물리 기본 공격을 가합니다.',
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
        position: idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back',
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
      };
    });

    // 4. 적군 3인 선발 전투원 빌드 (레벨 성장치, 레이팅 스케일, 리더 가호 반영)
    const oCombatants: ArenaCombatant[] = oppMainHeroes.map((h, idx) => {
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '단일 대상에게 100% 위력의 물리 기본 공격.',
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

      const lvlBonus = 1 + (h.level - 1) * 0.08;
      const ratingScale = Math.max(1.0, opp.rating / 1000);
      const oppAtkBonus = oppLeaderBlessing?.buffs?.atkBonus || 1.0;
      const oppDefBonus = oppLeaderBlessing?.buffs?.defBonus || 1.0;
      const oppHpBonus = oppLeaderBlessing?.buffs?.maxHpBonus || (oppLeaderBlessing?.buffs as any)?.hpBonus || 1.0;
      const oppAllBonus = oppLeaderBlessing?.buffs?.allStatsBonus || 1.0;

      const maxHp = Math.round((cls.baseStats.hp * lvlBonus * 2.3 + h.level * 25) * ratingScale * oppHpBonus * oppAllBonus);
      const maxMp = cls.baseStats.mp;
      const calcAtk = Math.round((cls.baseStats.atk * lvlBonus * 1.5 + h.level * 5) * ratingScale * oppAtkBonus * oppAllBonus);
      const calcDef = Math.round((cls.baseStats.def * lvlBonus * 1.3 + h.level * 3) * ratingScale * oppDefBonus * oppAllBonus);
      const calcSpd = Math.round(cls.baseStats.spd * (1 + (h.level - 1) * 0.03));

      return {
        id: `opp_${idx}_${h.classId}`,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade || 'veteran',
        level: h.level,
        position: idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back',
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: maxMp,
        maxMp: maxMp,
        atk: calcAtk,
        def: calcDef,
        spd: calcSpd,
        luck: cls.baseStats.luck,
        skills: allSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: [],
        icon: cls.skills[0]?.icon || '👾',
      };
    });

    playerTeamRef.current = pCombatants;
    oppTeamRef.current = oCombatants;
    targetEnemyIdRef.current = oCombatants[0]?.id || null;
    setPlayerTeam(pCombatants);
    setOppTeam(oCombatants);
    setTargetEnemyId(oCombatants[0]?.id || null);
    if (pCombatants.length > 0) setLastPlayerAttacker(pCombatants[0]);
    if (oCombatants.length > 0) setLastEnemyAttacker(oCombatants[0]);

    // 📊 전투 딜미터기 메트릭스 초기화
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
    if (supporterHero) {
      initMetrics[supporterHero.id] = {
        id: supporterHero.id,
        name: `${supporterHero.name} (🤝서포터)`,
        className: CHARACTER_CLASSES[supporterHero.classId]?.name || '서포터',
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
    if (oppLeaderHero) {
      initMetrics['opp_leader'] = {
        id: 'opp_leader',
        name: `${oppLeaderHero.name} (💀적 리더)`,
        className: CHARACTER_CLASSES[oppLeaderHero.classId]?.name || '리더',
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
    if (oppSupporterHero) {
      initMetrics['opp_supporter'] = {
        id: 'opp_supporter',
        name: `${oppSupporterHero.name} (🛡️적 서포터)`,
        className: CHARACTER_CLASSES[oppSupporterHero.classId]?.name || '서포터',
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

    // 🏃 속도(SPD) 내림차순으로 전체 턴 순서 큐 생성 (정통 속도 기반 턴제 진행)
    const allSorted = [...pCombatants, ...oCombatants].sort((a, b) => b.spd - a.spd || b.luck - a.luck);
    const queueIds = allSorted.map(c => c.id);
    roundQueueRef.current = queueIds;
    setRoundQueue(queueIds);
    activeCombatantIdRef.current = queueIds[0] || null;
    setActiveCombatantId(queueIds[0] || null);

    isProcessingRef.current = false;
    setTurnTick(0);
  };

  // 🔥 아군 피버 뱃지 추가 헬퍼
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 💀 적군 피버 뱃지 추가 헬퍼
  const addOppFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    setOppFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      oppFeverBadgesRef.current = next;
      return next;
    });
  }, []);

  // 👑 아군 리더 궁극기 자동 발동 실행 함수
  const triggerLeaderUltimate = useCallback(() => {
    const leader = playerLeaderRef.current;
    if (!leader) {
      setFeverBadges([]);
      return;
    }

    const cls = CHARACTER_CLASSES[leader.classId] || CHARACTER_CLASSES['squire'];
    const ultSkill = cls?.specialSkill || cls?.skills[cls.skills.length - 1] || {
      id: 'leader_burst',
      name: '영령의 심판',
      description: '적 전체에게 강력한 리더 궁극기를 가합니다.',
      manaCost: 0,
      cooldown: 0,
      targetType: 'all_enemies' as const,
      power: 2.5,
      effectType: 'damage' as const,
      icon: '👑',
    };

    setIsLeaderUltCutin(true);
    SoundManager.getInstance().play('boss_skill');

    setActionBanner({
      text: `👑 리더 궁극기: ${leader.name} ➔ ${ultSkill.name}!`,
      sub: `🔥 아군 피버 게이지 만충! 적 진영 전체 강타!`,
      color: '#ffd54f',
    });

    const leaderEff = gm.getHeroEffectiveStats(leader);
    const leaderAtk = leaderEff.atk * ARENA_ATK_SCALE;

    const currentOppTeam = oppTeamRef.current;
    const livingTargets = currentOppTeam.filter(c => c.currentHp > 0);

    const updatedOppTeam = currentOppTeam.map(c => {
      if (c.currentHp <= 0) return c;
      const effectiveDef = c.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
      const defFactor = 1 - (effectiveDef / (effectiveDef + 160));
      const dmg = Math.max(25, Math.floor(leaderAtk * (ultSkill.power || 2.2) * 1.3 * defFactor));
      return {
        ...c,
        currentHp: Math.max(0, c.currentHp - dmg),
      };
    });

    // VFX: 살아있는 각 적 카드 위치에 던전처럼 각각 모두 폭발 이펙트 출력
    livingTargets.forEach((t, i) => {
      const idx = Math.max(0, currentOppTeam.findIndex(c => c.id === t.id));
      const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
      setTimeout(() => {
        const vfxId = `vfx_leader_ult_${Date.now()}_${t.id}_${i}`;
        setVfxList(prev => [...prev, {
          id: vfxId,
          type: 'crit_slash',
          damage: Math.floor(leaderAtk * 1.8),
          isCrit: true,
          x: colX,
          y: 24,
          duration: 650,
        }]);
        gm.emit('battleHitEffect', {
          x: colX,
          y: 24,
          color: 0xffd54f,
          isCrit: true,
          type: 'crit_slash',
        });
      }, i * 60);
    });

    oppTeamRef.current = updatedOppTeam;
    setOppTeam(updatedOppTeam);
    setFeverBadges([]);
    feverBadgesRef.current = [];

    // 딜미터기 메트릭스 기록 (아군 리더)
    const mRef = combatMetricsRef.current;
    const mLeader = mRef[leader.id];
    if (mLeader) {
      mLeader.actionsCount = (mLeader.actionsCount || 0) + 1;
      mLeader.critCount += livingTargets.length;
      mLeader.combosTriggered += 1;
    }
    updatedOppTeam.forEach((c, idx) => {
      const oldHp = currentOppTeam[idx]?.currentHp || 0;
      if (oldHp > 0) {
        const dealt = oldHp - c.currentHp;
        if (mRef[leader.id]) mRef[leader.id].damageDealt += dealt;
        if (mRef[c.id]) {
          mRef[c.id].damageTaken += dealt;
          if (c.currentHp <= 0 && mRef[leader.id]) mRef[leader.id].kills += 1;
        }
      }
    });

    // 🏆 리더 궁극기로 적 전원 처치 시 즉시 승리 처리
    const oppRemains = updatedOppTeam.filter(c => c.currentHp > 0);
    if (oppRemains.length === 0 && activeBattleOppRef.current) {
      isProcessingRef.current = false;
      const opp = activeBattleOppRef.current;
      const rewardResult = gm.claimArenaMatchRewards(opp, true);
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setFinalReward({ ...rewardResult, win: true });
      try {
        SoundManager.getInstance().play('victory');
      } catch (_) {}
      setOpponents(generateOpponents(gm.currentArenaRank, gm.currentArenaRating, gateLevel));
    }

    setTimeout(() => {
      setIsLeaderUltCutin(false);
    }, 1200);
  }, [gm]);

  // 💀 적군 리더 궁극기 자동 발동 실행 함수
  const triggerOppLeaderUltimate = useCallback(() => {
    const leader = oppLeaderRef.current;
    if (!leader) {
      setOppFeverBadges([]);
      oppFeverBadgesRef.current = [];
      return;
    }

    const cls = CHARACTER_CLASSES[leader.classId] || CHARACTER_CLASSES['squire'];
    const ultSkill = cls?.specialSkill || cls?.skills[cls.skills.length - 1] || {
      id: 'opp_leader_burst',
      name: '심연의 단죄',
      description: '아군 전체에게 치명적인 적 리더 궁극기를 가합니다.',
      manaCost: 0,
      cooldown: 0,
      targetType: 'all_enemies' as const,
      power: 2.2,
      effectType: 'damage' as const,
      icon: '💀',
    };

    setIsOppLeaderUltCutin(true);
    SoundManager.getInstance().play('boss_skill');

    setActionBanner({
      text: `💀 적 리더 궁극기: ${leader.name} ➔ ${ultSkill.name}!`,
      sub: `⚠️ 상대 피버 게이지 만충! 아군 전원에게 강력한 참격!`,
      color: '#ff416c',
    });

    const oppRating = activeBattleOppRef.current?.rating || 1000;
    const ratingScale = Math.max(1.0, oppRating / 1000);
    const leaderAtk = ((cls.baseStats.atk * 1.5 + (leader.level || 10) * 5) * ratingScale) * ARENA_ATK_SCALE;

    const currentPTeam = playerTeamRef.current;
    const livingTargets = currentPTeam.filter(c => c.currentHp > 0);

    const updatedPTeam = currentPTeam.map(c => {
      if (c.currentHp <= 0) return c;
      const effectiveDef = c.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
      const defFactor = 1 - (effectiveDef / (effectiveDef + 160));
      const dmg = Math.max(25, Math.floor(leaderAtk * (ultSkill.power || 2.0) * defFactor));
      return {
        ...c,
        currentHp: Math.max(0, c.currentHp - dmg),
      };
    });

    // VFX: 살아있는 각 아군 카드 위치에 던전처럼 각각 모두 폭발 이펙트 출력
    livingTargets.forEach((t, i) => {
      const idx = Math.max(0, currentPTeam.findIndex(c => c.id === t.id));
      const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
      setTimeout(() => {
        const vfxId = `vfx_opp_leader_ult_${Date.now()}_${t.id}_${i}`;
        setVfxList(prev => [...prev, {
          id: vfxId,
          type: 'crit_slash',
          damage: Math.floor(leaderAtk * 1.6),
          isCrit: true,
          x: colX,
          y: 74,
          duration: 650,
        }]);
        gm.emit('battleHitEffect', {
          x: colX,
          y: 74,
          color: 0xff416c,
          isCrit: true,
          type: 'crit_slash',
        });
      }, i * 60);
    });

    playerTeamRef.current = updatedPTeam;
    setPlayerTeam(updatedPTeam);
    setOppFeverBadges([]);
    oppFeverBadgesRef.current = [];

    // 딜미터기 메트릭스 기록 (적 리더)
    const mRefOpp = combatMetricsRef.current;
    const mOppLeader = mRefOpp['opp_leader'];
    if (mOppLeader) {
      mOppLeader.actionsCount = (mOppLeader.actionsCount || 0) + 1;
      mOppLeader.critCount += livingTargets.length;
      mOppLeader.combosTriggered += 1;
    }
    updatedPTeam.forEach((c, idx) => {
      const oldHp = currentPTeam[idx]?.currentHp || 0;
      if (oldHp > 0) {
        const dealt = oldHp - c.currentHp;
        if (mRefOpp['opp_leader']) mRefOpp['opp_leader'].damageDealt += dealt;
        if (mRefOpp[c.id]) {
          mRefOpp[c.id].damageTaken += dealt;
          if (c.currentHp <= 0 && mRefOpp['opp_leader']) mRefOpp['opp_leader'].kills += 1;
        }
      }
    });

    playerTeamRef.current = updatedPTeam;
    setPlayerTeam(updatedPTeam);

    // 💀 아군 전원 사망 시 패배 처리
    const pRemains = updatedPTeam.filter(c => c.currentHp > 0);
    if (pRemains.length === 0 && activeBattleOppRef.current) {
      isProcessingRef.current = false;
      const opp = activeBattleOppRef.current;
      const rewardResult = gm.claimArenaMatchRewards(opp, false);
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setFinalReward({ ...rewardResult, win: false });
      try {
        SoundManager.getInstance().play('defeat');
      } catch (_) {}
      setOpponents(generateOpponents(gm.currentArenaRank, gm.currentArenaRating, gateLevel));
    }

    setTimeout(() => {
      setIsOppLeaderUltCutin(false);
    }, 1200);
  }, [gm]);

  // ── 턴 액션 실행 (광역기 다중 타겟 및 정상 공방 처리) ──────────────────────
  const executeCombatMove = useCallback((attacker: ArenaCombatant, skill: Skill, target: ArenaCombatant) => {
    const opp = activeBattleOppRef.current;
    if (!opp || finalRewardRef.current) return;

    // 공격자 상태 기록
    if (attacker.isPlayer) {
      setLastPlayerAttacker(attacker);
    } else {
      setLastEnemyAttacker(attacker);
    }

    // 1. 쿨다운 1턴씩 감소 & 마나 및 쿨다운 적용
    const nextCooldowns = { ...attacker.cooldowns };
    Object.keys(nextCooldowns).forEach(sid => {
      if (nextCooldowns[sid] > 0) nextCooldowns[sid] -= 1;
    });

    let currentMp = attacker.currentMp;
    if (skill.manaCost > 0) {
      currentMp = Math.max(0, currentMp - skill.manaCost);
    }
    if (skill.cooldown && skill.cooldown > 0) {
      nextCooldowns[skill.id] = skill.cooldown;
    }
    if (skill.id === 'basic_attack') {
      currentMp = Math.min(attacker.maxMp, currentMp + 15);
    }

    // 상태이상 지속시간 감소
    const nextStatusEffects = (attacker.statusEffects || [])
      .map(eff => {
        const curDuration = eff.duration ?? eff.turnsLeft ?? 1;
        const nextDuration = curDuration - 1;
        return { ...eff, turnsLeft: nextDuration, duration: nextDuration };
      })
      .filter(eff => (eff.duration ?? eff.turnsLeft ?? 0) > 0);

    const updatedAttacker: ArenaCombatant = {
      ...attacker,
      currentMp,
      cooldowns: nextCooldowns,
      statusEffects: nextStatusEffects,
    };

    // 2. 광역기(AOE) 판별 및 대상 유닛 목록 선정
    const isAoeAllEnemies = skill.targetType === 'all_enemies';
    const isAoeAllAllies = skill.targetType === 'all_allies';
    const isAoe = isAoeAllEnemies || isAoeAllAllies;

    const currentP = playerTeamRef.current;
    const currentO = oppTeamRef.current;

    let targetUnits: ArenaCombatant[] = [];
    if (isAoeAllEnemies) {
      targetUnits = (attacker.isPlayer ? currentO : currentP).filter(c => c.currentHp > 0);
    } else if (isAoeAllAllies) {
      targetUnits = (attacker.isPlayer ? currentP : currentO).filter(c => c.currentHp > 0);
    } else {
      targetUnits = [target];
    }

    // 3. 데미지 또는 회복 계산
    const ARENA_ATK_SCALE = 0.70; // 긴장감 있는 상호 공방 계수
    const effectiveAtk = attacker.atk * ARENA_ATK_SCALE;
    const isHealing = skill.effectType === 'heal';
    const isShield = skill.effectType === 'shield';

    let totalDamageDealt = 0;
    let anyCrit = false;

    // 각 대상별 결과 계산
    const targetResults: { unitId: string; newHp: number; dmg: number; isCrit: boolean; isHeal: boolean; isShield: boolean; addedEffect?: any }[] = [];

    targetUnits.forEach((t) => {
      if (isHealing) {
        const healAmt = Math.round(effectiveAtk * (skill.power || 1.0) * 1.4);
        targetResults.push({
          unitId: t.id,
          newHp: Math.min(t.maxHp, t.currentHp + healAmt),
          dmg: healAmt,
          isCrit: false,
          isHeal: true,
          isShield: false,
        });
      } else if (isShield) {
        targetResults.push({
          unitId: t.id,
          newHp: t.currentHp,
          dmg: Math.round(effectiveAtk * 0.8),
          isCrit: false,
          isHeal: false,
          isShield: true,
        });
      } else {
        // 💨 회피 (Dodge / Evade) 판정
        const evadeChance = Math.min(0.25, Math.max(0.04, (t.spd * 0.001) + (t.luck * 0.001)));
        const isEvaded = Math.random() < evadeChance;
        if (isEvaded) {
          if (combatMetricsRef.current[t.id]) {
            combatMetricsRef.current[t.id].dodges += 1;
          }
          targetResults.push({
            unitId: t.id,
            newHp: t.currentHp,
            dmg: 0,
            isCrit: false,
            isHeal: false,
            isShield: false,
            isEvade: true,
          } as any);
          return;
        }

        const magicSchool = getSkillMagicSchool(skill);
        let critChance = Math.min(0.75, (gm.getCritChance(attacker.luck, 1) / 100));
        if (magicSchool === 'holy') {
          critChance = Math.min(1.0, critChance + 0.30); // ✨ 신성: 치명타 확률 30% 상승
        }
        const isCrit = Math.random() < critChance;
        if (isCrit) anyCrit = true;

        let effectiveDef = t.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
        if (magicSchool === 'dark') {
          effectiveDef = effectiveDef * 0.80; // 🔮 암흑: 기본 방어 관통 20%
        }
        const defFactor = 1 - (effectiveDef / (effectiveDef + 160));
        let rawDmg = effectiveAtk * (skill.power || 1.0) * defFactor * (0.95 + Math.random() * 0.12);
        if (magicSchool === 'dark') {
          rawDmg = rawDmg * 1.20; // 🔮 암흑: 용병(PvP) 대상 20% 추가 데미지
        }
        const minDmg = Math.max(15, Math.floor(effectiveAtk * 0.25));
        let dmg = Math.max(minDmg, Math.floor(rawDmg * (isCrit ? 1.5 : 1.0)));

        // 🛡️ [서포터 원호 방어 (Assist Guard)]
        // 방어자 측 후방 서포터가 원호 방어 전개 (치명타 피격 시 또는 35% 확률, 생존 시에만 발동)
        const defSupporter = t.isPlayer ? playerSupporterRef.current : oppSupporterRef.current;
        const isDefSupporterAlive = defSupporter && (defSupporter.currentHp === undefined || defSupporter.currentHp > 0) && !defSupporter.isDead;
        let isAssistGuarded = false;
        if (isDefSupporterAlive && (isCrit || Math.random() < 0.35)) {
          const guardReduction = 0.50; // 원호 데미지 50%로 조정 (50% 경감 및 50% 분담)
          const blockedDmg = Math.floor(dmg * guardReduction);
          dmg = Math.max(10, dmg - blockedDmg);
          isAssistGuarded = true;

          const defSuppId = t.isPlayer ? defSupporter.id : 'opp_supporter';
          if (combatMetricsRef.current[defSuppId]) {
            combatMetricsRef.current[defSuppId].actionsCount = (combatMetricsRef.current[defSuppId].actionsCount || 0) + 1;
            // 서포터 자신이 받은 데미지로 계산해서 누적
            const suppDef = (defSupporter as any).def || 50;
            const suppTakenDmg = Math.max(1, Math.round(blockedDmg * (100 / (100 + suppDef * ARENA_DEF_SCALE))));
            combatMetricsRef.current[defSuppId].damageTaken = (combatMetricsRef.current[defSuppId].damageTaken || 0) + suppTakenDmg;
            if (defSupporter.currentHp !== undefined) {
              defSupporter.currentHp = Math.max(0, defSupporter.currentHp - suppTakenDmg);
              if (defSupporter.currentHp <= 0) {
                defSupporter.isDead = true;
              }
            }
          }
        }

        // 암살자 고유 추가타
        if (attacker.classId === 'assassin' && isCrit) {
          const extraRate = Math.min(0.80, 0.30 + (attacker.luck || 0) * 0.0025);
          if (Math.random() < extraRate) {
            const extraDmg = Math.max(10, Math.floor(effectiveAtk * 0.70 * defFactor));
            dmg += extraDmg;
          }
        }

        // 상태이상 부여 검사
        let addedEffect: any = undefined;
        if (skill.effectType === 'burn') {
          addedEffect = { type: 'debuff', name: '화상', icon: '🔥', duration: 2, value: Math.round(effectiveAtk * 0.2) };
        } else if (skill.effectType === 'bleed') {
          addedEffect = { type: 'debuff', name: '출혈', icon: '🩸', duration: 2, value: Math.round(effectiveAtk * 0.25) };
        } else if (skill.effectType === 'stun') {
          addedEffect = { type: 'debuff', name: '기절', icon: '⚡', duration: 1 };
        } else if (skill.effectType === 'freeze') {
          addedEffect = { type: 'debuff', name: '빙결', icon: '❄️', duration: 1 };
        } else if (skill.effectType === 'debuff') {
          addedEffect = { type: 'debuff', name: '약화', icon: '💀', duration: 2 };
        } else if (magicSchool === 'elemental') {
          // 🔮 원소 마법: 해당 원소 상태 이상 추가 부여
          const elem = getElementalSubtype(skill);
          if (elem === 'fire') {
            addedEffect = { type: 'debuff', name: '화상', icon: '🔥', duration: 2, value: Math.round(effectiveAtk * 0.2) };
          } else if (elem === 'ice') {
            addedEffect = { type: 'debuff', name: '빙결', icon: '❄️', duration: 1 };
          } else if (elem === 'lightning') {
            addedEffect = { type: 'debuff', name: '기절', icon: '⚡', duration: 1 };
          }
        }

        totalDamageDealt += dmg;
        targetResults.push({
          unitId: t.id,
          newHp: Math.max(0, t.currentHp - dmg),
          dmg,
          isCrit,
          isHeal: false,
          isShield: false,
          isAssistGuarded,
          addedEffect,
        } as any);
      }
    });

    // 📊 딜미터기 메트릭스 업데이트
    const mRef = combatMetricsRef.current;
    const mAttacker = mRef[attacker.id];
    if (mAttacker) {
      mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
      if (isHealing || isShield) {
        mAttacker.healingDone += totalDamageDealt;
      } else {
        mAttacker.damageDealt += totalDamageDealt;
      }
      if (anyCrit) mAttacker.critCount += 1;
      if (skill.effectType && ['burn', 'bleed', 'stun', 'freeze', 'debuff'].includes(skill.effectType)) {
        mRef[attacker.id].combosTriggered += 1;
      }
    }

    targetResults.forEach(res => {
      if (mRef[res.unitId]) {
        if (!res.isHeal && !res.isShield && !(res as any).isEvade) {
          mRef[res.unitId].damageTaken += res.dmg;
          if (res.newHp <= 0 && (currentP.find(c => c.id === res.unitId)?.currentHp! > 0 || currentO.find(c => c.id === res.unitId)?.currentHp! > 0)) {
            if (mRef[attacker.id]) mRef[attacker.id].kills += 1;
          }
        }
      }
    });

    // 4. 피버 뱃지 적립 (동등한 조건으로 아군 및 적군 모두 적립)
    if (attacker.isPlayer) {
      if (isHealing) addFeverBadge('heal');
      else if (isShield) addFeverBadge('guard');
      else if (anyCrit) addFeverBadge('crit');
      else if (skill.id !== 'basic_attack') addFeverBadge('extra');
      else addFeverBadge('assist');
    } else {
      if (isHealing) addOppFeverBadge('heal');
      else if (isShield) addOppFeverBadge('guard');
      else if (anyCrit) addOppFeverBadge('crit');
      else if (skill.id !== 'basic_attack') addOppFeverBadge('extra');
      else addOppFeverBadge('assist');
    }

    // 5. 던전처럼 각 타겟의 패널 카드 위에 개별 VFX 동시/시차 폭발 연출
    targetResults.forEach((res, i) => {
      const tgt = targetUnits.find(u => u.id === res.unitId);
      if (!tgt) return;

      const sideTeam = tgt.isPlayer ? currentP : currentO;
      const tIdx = Math.max(0, sideTeam.findIndex(c => c.id === tgt.id));
      const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
      const rowY = tgt.isPlayer ? 74 : 24;

      setTimeout(() => {
        const vfxId = `vfx_${Date.now()}_${tgt.id}_${i}`;
        if ((res as any).isEvade) {
          if (tgt.isPlayer) addFeverBadge('evade');
          else addOppFeverBadge('evade');
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'evade',
            text: '💨 EVADE',
            x: colX,
            y: rowY,
            duration: 450,
          }]);
          SoundManager.getInstance().play('evade');
        } else if (res.isHeal) {
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'holy_heal',
            damage: res.dmg,
            isHeal: true,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
        } else if (res.isShield) {
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'shield',
            isShield: true,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
        } else {
          const vfxType = res.isCrit ? 'crit_slash' : (skill.icon === '🔥' ? 'fire' : skill.icon === '❄️' ? 'ice' : 'slash');
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: vfxType,
            damage: res.dmg,
            isCrit: res.isCrit,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
          gm.emit('battleHitEffect', {
            x: colX,
            y: rowY,
            color: attacker.isPlayer ? 0x00d2ff : 0xff416c,
            isCrit: res.isCrit,
            type: vfxType,
          });
        }
      }, isAoe ? i * 70 : 0);
    });

    try {
      if (isHealing) SoundManager.getInstance().play('heal');
      else if (isShield) SoundManager.getInstance().play('shield');
      else SoundManager.getInstance().play(anyCrit ? 'crit' : 'slash');
    } catch (_) {}

    // 6. 전투 로그 및 배너 기록
    const targetNames = targetUnits.map(u => u.name).join(', ');
    const logItem: CombatLogItem = {
      round: battleRound,
      attacker: attacker.name,
      defender: isAoe ? `${targetUnits.length}명 전체` : target.name,
      damage: totalDamageDealt,
      isCrit: anyCrit,
      skillName: skill.name,
      side: attacker.isPlayer ? 'player' : 'enemy',
    };
    setBattleLogs(prev => [logItem, ...prev.slice(0, 19)]);

    setActionBanner({
      text: `${attacker.name} ➔ ${skill.name} ${isAoe ? '[광역 전체기]' : ''}`,
      sub: isHealing
        ? `❤️ ${targetNames} 회복!`
        : `💥 ${isAoe ? `${targetUnits.length}인에게 총 -${totalDamageDealt} 피해` : `${target.name}에게 -${totalDamageDealt} 피해`} ${anyCrit ? '[CRIT!]' : ''}`,
      color: attacker.isPlayer ? '#00d2ff' : '#ff416c',
    });

    // 7. 팀 상태 동기화 (최신 ref 기반)
    let nextP = currentP.map(c => {
      if (c.id === updatedAttacker.id) return updatedAttacker;
      const res = targetResults.find(r => r.unitId === c.id);
      if (res) {
        const effects = [...(c.statusEffects || [])];
        if (res.addedEffect) effects.push(res.addedEffect);
        return { ...c, currentHp: res.newHp, statusEffects: effects };
      }
      return c;
    });

    let nextO = currentO.map(c => {
      if (c.id === updatedAttacker.id) return updatedAttacker;
      const res = targetResults.find(r => r.unitId === c.id);
      if (res) {
        const effects = [...(c.statusEffects || [])];
        if (res.addedEffect) effects.push(res.addedEffect);
        return { ...c, currentHp: res.newHp, statusEffects: effects };
      }
      return c;
    });

    // ⚔️/💖 [서포터 전술 원호: 원호 추가타 or 원호 치유]
    // 공격자 측 서포터가 40% 확률로 후방 지원 발동 (생존 시에만 발동, 힐러는 아군 치유, 딜러/탱커는 추가타)
    const atkSupporter = attacker.isPlayer ? playerSupporterRef.current : oppSupporterRef.current;
    const isAtkSupporterAlive = atkSupporter && (atkSupporter.currentHp === undefined || atkSupporter.currentHp > 0) && !atkSupporter.isDead;
    if (isAtkSupporterAlive && Math.random() < 0.40) {
      const suppCls = CHARACTER_CLASSES[atkSupporter.classId] || CHARACTER_CLASSES['squire'];
      const isHealer = suppCls.role === 'healer' || suppCls.skills.some(s => s.effectType === 'heal');
      const suppEff = attacker.isPlayer
        ? gm.getHeroEffectiveStats(atkSupporter)
        : {
            atk: Math.round(((suppCls.baseStats.atk * 1.5 + (atkSupporter.level || 10) * 5) * Math.max(1.0, (activeBattleOppRef.current?.rating || 1000) / 1000))),
            def: Math.round(suppCls.baseStats.def * 1.2),
            maxHp: Math.round(suppCls.baseStats.hp * 2.0)
          };

      const suppMetricId = attacker.isPlayer ? atkSupporter.id : 'opp_supporter';
      if (isHealer) {
        // 💖 원호 치유: 체력 비율 가장 낮은 아군 회복
        const allyTeam = attacker.isPlayer ? nextP : nextO;
        const livingAllies = allyTeam.filter(c => c.currentHp > 0);
        if (livingAllies.length > 0) {
          const sortedAllies = [...livingAllies].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
          const healTarget = sortedAllies[0];
          const healAmt = Math.round(suppEff.atk * 0.9 * 1.3);
          healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healAmt);

          const aIdx = Math.max(0, allyTeam.findIndex(c => c.id === healTarget.id));
          const colX = aIdx === 0 ? 20 : aIdx === 1 ? 50 : 80;
          const rowY = healTarget.isPlayer ? 74 : 24;

          setTimeout(() => {
            setVfxList(prev => [...prev, {
              id: `supp_assist_heal_${Date.now()}`,
              type: 'holy_heal',
              text: `+${healAmt} 💖 원호 치유`,
              damage: 0,
              isHeal: true,
              x: colX,
              y: rowY,
              duration: 550,
            }]);
            SoundManager.getInstance().play('heal');
          }, 300);

          if (attacker.isPlayer) addFeverBadge('heal');
          else addOppFeverBadge('heal');

          if (mRef[suppMetricId]) {
            mRef[suppMetricId].healingDone += healAmt;
            mRef[suppMetricId].actionsCount = (mRef[suppMetricId].actionsCount || 0) + 1;
          }
        }
      } else {
        // ⚔️ 원호 추가타: 타겟에게 추가 타격
        const mainTarget = targetUnits.find(u => u.currentHp > 0) || target;
        const targetSide = mainTarget.isPlayer ? nextP : nextO;
        const liveTarget = targetSide.find(c => c.id === mainTarget.id);
        if (liveTarget && liveTarget.currentHp > 0) {
          const rawAssistDmg = Math.max(20, Math.round(suppEff.atk * 0.65));
          const effectiveDef = liveTarget.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
          const assistDmg = Math.max(10, Math.floor(rawAssistDmg * (1 - (effectiveDef / (effectiveDef + 160)))));
          liveTarget.currentHp = Math.max(0, liveTarget.currentHp - assistDmg);

          const tIdx = Math.max(0, targetSide.findIndex(c => c.id === liveTarget.id));
          const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
          const rowY = liveTarget.isPlayer ? 74 : 24;

          setTimeout(() => {
            setVfxList(prev => [...prev, {
              id: `supp_assist_strike_${Date.now()}`,
              type: 'crit_slash',
              damage: assistDmg,
              text: `-${assistDmg} 💥 원호 추가타`,
              x: colX,
              y: rowY,
              duration: 500,
            }]);
            SoundManager.getInstance().play('heavy_hit');
          }, 300);

          if (attacker.isPlayer) addFeverBadge('assist');
          else addOppFeverBadge('assist');

          if (mRef[suppMetricId]) {
            mRef[suppMetricId].damageDealt += assistDmg;
            mRef[suppMetricId].actionsCount = (mRef[suppMetricId].actionsCount || 0) + 1;
            if (liveTarget.currentHp <= 0) mRef[suppMetricId].kills += 1;
          }
        }
      }
    }

    // 팀 상태 동기화 (난입 없이 3선발 그대로 유지)
    playerTeamRef.current = nextP;
    oppTeamRef.current = nextO;
    setPlayerTeam(nextP);
    setOppTeam(nextO);

    // 8. 피버 만충 시 리더 궁극기 발동 검사
    if (feverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerLeaderUltimate(), 400);
    }
    if (oppFeverBadgesRef.current.length >= 5) {
      setTimeout(() => triggerOppLeaderUltimate(), 400);
    }

    // 9. 승패 검증 (즉시 결과창 팝업)
    const pAlive = nextP.filter(c => c.currentHp > 0);
    const oAlive = nextO.filter(c => c.currentHp > 0);

    if (oAlive.length === 0 || pAlive.length === 0) {
      isProcessingRef.current = false;
      const isWin = oAlive.length === 0;
      const rewardResult = gm.claimArenaMatchRewards(opp, isWin);
      setCombatMetrics(Object.values(combatMetricsRef.current));
      setFinalReward({ ...rewardResult, win: isWin });
      try {
        SoundManager.getInstance().play(isWin ? 'victory' : 'defeat');
      } catch (_) {}
      refreshOpponents();
      return;
    }

    // 타겟 사망 시 다음 적 자동 타겟팅
    const activeTargetDied = targetResults.some(r => r.unitId === targetEnemyIdRef.current && r.newHp <= 0);
    if (activeTargetDied) {
      const nextTarget = oAlive[0];
      if (nextTarget) {
        targetEnemyIdRef.current = nextTarget.id;
        setTargetEnemyId(nextTarget.id);
      }
    }

    // 10. 🏃 속도(SPD) 기반 정통 턴제 순서 전진
    // 현재 살아있는 유닛들로 큐 필터링
    const currentQueue = roundQueueRef.current.filter(id => {
      const u = [...nextP, ...nextO].find(c => c.id === id);
      return u && u.currentHp > 0;
    });

    const curIdx = currentQueue.indexOf(attacker.id);
    let nextId: string | null = null;

    if (curIdx >= 0 && curIdx < currentQueue.length - 1) {
      // 이번 라운드에 아직 행동하지 않은 다음 속도 순위 유닛
      nextId = currentQueue[curIdx + 1];
      roundQueueRef.current = currentQueue;
    } else {
      // 라운드 종료! 새 라운드 시작 -> 생존자 전원을 spd 순으로 재정렬
      setBattleRound(r => r + 1);
      const allLiving = [...nextP, ...nextO].filter(c => c.currentHp > 0);
      const sortedNew = allLiving.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
      const newQueue = sortedNew.map(c => c.id);
      roundQueueRef.current = newQueue;
      setRoundQueue(newQueue);
      nextId = newQueue[0] || null;
    }

    activeCombatantIdRef.current = nextId;
    setActiveCombatantId(nextId);
    setTurnTick(t => t + 1);
  }, [battleRound, gm, addFeverBadge, addOppFeverBadge, triggerLeaderUltimate, triggerOppLeaderUltimate]);

  // ── 턴 자동 진행 루프 (스킬 연계 최우선 콤보 AI & Auto Battle) ──────────────────────────────
  useEffect(() => {
    if (!activeBattleOpp || finalReward || !activeCombatantId) return;
    if (isProcessingRef.current) return;

    const pTeam = playerTeamRef.current;
    const oTeam = oppTeamRef.current;
    const allLiving = [...pTeam, ...oTeam].filter(c => c.currentHp > 0);
    if (allLiving.length === 0) return;

    const currentAttacker = allLiving.find(c => c.id === activeCombatantId);
    if (!currentAttacker) {
      const fallback = allLiving[0];
      if (fallback) {
        activeCombatantIdRef.current = fallback.id;
        setActiveCombatantId(fallback.id);
      }
      return;
    }

    // 수동 모드이고 플레이어 턴인 경우: 플레이어 스킬 입력 대기
    if (currentAttacker.isPlayer && !isAuto) {
      return;
    }

    isProcessingRef.current = true;
    const delay = battleSpeed === 2 ? 320 : 600;

    const timer = setTimeout(() => {
      try {
        if (!activeBattleOppRef.current || finalRewardRef.current) return;

        const latestP = playerTeamRef.current;
        const latestO = oppTeamRef.current;
        const living = [...latestP, ...latestO].filter(c => c.currentHp > 0);
        const attacker = living.find(c => c.id === activeCombatantIdRef.current);
        if (!attacker) {
          const fallback = living[0];
          if (fallback) {
            activeCombatantIdRef.current = fallback.id;
            setActiveCombatantId(fallback.id);
          }
          return;
        }

        // 🧠 스킬 연계 최우선 알고리즘 (Combo Chain AI)
        // 1. 사용 가능한 스킬 목록 추출
        const availableSkills = attacker.skills.filter(s => {
          const cd = attacker.cooldowns[s.id] || 0;
          return cd <= 0 && attacker.currentMp >= s.manaCost;
        });

        // 2. 가중치 점수 평가
        const allyTeam = attacker.isPlayer ? latestP : latestO;
        const enemyTeam = attacker.isPlayer ? latestO : latestP;
        const allyLiving = allyTeam.filter(c => c.currentHp > 0);
        const enemyLiving = enemyTeam.filter(c => c.currentHp > 0);
        const lowestAllyHpRatio = allyLiving.length > 0
          ? Math.min(...allyLiving.map(c => c.currentHp / c.maxHp))
          : 1.0;

        let bestSkill = attacker.skills[0];
        let bestScore = -999;

        for (const s of availableSkills) {
          let score = (s.power || 1.0) * 10;

          // 치유/보호막 우선 판정 (아군 위급 시 가산점)
          if (s.effectType === 'heal' || s.effectType === 'shield') {
            if (lowestAllyHpRatio < 0.40) score += 60; // 초위급 시 힐 최우선
            else if (lowestAllyHpRatio < 0.70) score += 25;
            else score -= 15; // 체력 충분할 때 힐 낭비 방지
          }

          // 상태이상 연계 셋업 및 피니셔 가산점
          if (s.effectType === 'bleed' || s.effectType === 'stun' || s.effectType === 'burn' || s.effectType === 'freeze' || s.effectType === 'debuff') {
            score += 35; // 선제 디버프/셋업 유도
          }

          // 적 빈사 시 고위력 피니셔 스킬 우선
          const hasDyingEnemy = enemyLiving.some(e => (e.currentHp / e.maxHp) < 0.35);
          if (hasDyingEnemy && s.effectType === 'damage') {
            score += (s.power || 1.0) * 20;
          }

          // 기본 공격은 MP 없을 때만
          if (s.id === 'basic_attack') {
            score = 5;
          }

          if (score > bestScore) {
            bestScore = score;
            bestSkill = s;
          }
        }

        const selectedSkill = bestSkill;

        // 3. 타겟 선택 (스킬 목적에 따른 스마트 타겟팅)
        const isAllySkill = selectedSkill.effectType === 'heal' || selectedSkill.effectType === 'shield' || selectedSkill.effectType === 'buff';
        let selectedTarget: ArenaCombatant | undefined;

        if (attacker.isPlayer) {
          if (isAllySkill) {
            selectedTarget = [...allyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
          } else {
            // 유저가 찍은 타겟이 있으면 우선, 없으면 적 중 가장 체력 비율이 낮은 적(점사 피니시)
            selectedTarget = enemyLiving.find(c => c.id === targetEnemyIdRef.current)
              || [...enemyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
          }
        } else {
          if (isAllySkill) {
            selectedTarget = [...allyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
          } else {
            // 적 AI: 아군 중 가장 체력이 적은 대상을 집중 점사 (스킬 연계 마무리)
            selectedTarget = [...enemyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || enemyLiving[0];
          }
        }

        if (attacker && selectedSkill && selectedTarget) {
          executeCombatMove(attacker, selectedSkill, selectedTarget);
        }
      } finally {
        isProcessingRef.current = false;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [activeBattleOpp, finalReward, activeCombatantId, isAuto, battleSpeed, turnTick, executeCombatMove]);

  // 🛡️ [아레나 멈춤 방지 워치독]: 만약 2.5초 이상 턴이 멈춰 있으면 강제 복구 및 다음 턴 진행
  useEffect(() => {
    if (!activeBattleOpp || finalReward || !activeCombatantId) return;
    const watchdog = setTimeout(() => {
      if (isProcessingRef.current) {
        console.warn('⚠️ [아레나 멈춤 방지 워치독] 2.5초간 응답 없음 감지 -> 강제 플래그 해제 및 턴 진행');
        isProcessingRef.current = false;
        const living = [...playerTeamRef.current, ...oppTeamRef.current].filter(c => c.currentHp > 0);
        if (living.length > 0) {
          const curIdx = living.findIndex(c => c.id === activeCombatantIdRef.current);
          const next = living[(curIdx + 1) % living.length];
          if (next) {
            activeCombatantIdRef.current = next.id;
            setActiveCombatantId(next.id);
            setTurnTick(t => t + 1);
          }
        }
      }
    }, 2500);
    return () => clearTimeout(watchdog);
  }, [activeBattleOpp, finalReward, activeCombatantId, turnTick]);

  // ── ⏩ 즉시 결과 확인 (Skip) ──────────────────────────────────────────────
  const handleInstantSkip = () => {
    if (!activeBattleOpp || finalReward) return;
    isProcessingRef.current = false;

    let pTeam = [...playerTeamRef.current];
    let oTeam = [...oppTeamRef.current];
    let maxTurns = 40;

    while (maxTurns > 0 && pTeam.some(c => c.currentHp > 0) && oTeam.some(c => c.currentHp > 0)) {
      maxTurns--;
      const pAlive = pTeam.filter(c => c.currentHp > 0);
      const oAlive = oTeam.filter(c => c.currentHp > 0);
      if (pAlive.length === 0 || oAlive.length === 0) break;

      // 1. 플레이어 공격 (0.40x 너프 반영, 상대 방어력 50% 너프 적용)
      const pAttacker = pAlive[Math.floor(Math.random() * pAlive.length)];
      const oTarget = oAlive[0];
      const pDmg = Math.max(12, Math.floor((pAttacker.atk * 0.40) * 1.3 - (oTarget.def * ARENA_DEF_SCALE) * 0.3));
      oTarget.currentHp = Math.max(0, oTarget.currentHp - pDmg);

      if (oTeam.every(c => c.currentHp <= 0)) break;

      // 2. 적군 반격 (0.40x 너프 반영, 아군 방어력 50% 너프 적용)
      const oAttacker = oAlive[Math.floor(Math.random() * oAlive.length)];
      const pTarget = pAlive[0];
      const oDmg = Math.max(10, Math.floor((oAttacker.atk * 0.40) * 1.15 - (pTarget.def * ARENA_DEF_SCALE) * 0.3));
      pTarget.currentHp = Math.max(0, pTarget.currentHp - oDmg);
    }

    const isWin = oTeam.every(c => c.currentHp <= 0) || pTeam.reduce((sum, c) => sum + c.currentHp, 0) >= oTeam.reduce((sum, c) => sum + c.currentHp, 0);
    const rewardResult = gm.claimArenaMatchRewards(activeBattleOpp, isWin);
    setCombatMetrics(Object.values(combatMetricsRef.current));
    setFinalReward({ ...rewardResult, win: isWin });
    try {
      SoundManager.getInstance().play(isWin ? 'victory' : 'defeat');
    } catch (_) {}
    refreshOpponents();
  };

  // ── 수동 스킬 클릭 실행 ──────────────────────────────────────────────────
  const handleManualSkillClick = (skill: Skill) => {
    if (isProcessingRef.current || finalReward) return;
    const attacker = playerTeamRef.current.find(c => c.id === activeCombatantIdRef.current);
    if (!attacker) return;

    const isAllySkill = skill.effectType === 'heal' || skill.effectType === 'shield' || skill.effectType === 'buff';
    let target: ArenaCombatant | undefined;
    if (isAllySkill) {
      const pAlive = playerTeamRef.current.filter(c => c.currentHp > 0);
      target = [...pAlive].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
    } else {
      const oAlive = oppTeamRef.current.filter(c => c.currentHp > 0);
      target = oAlive.find(c => c.id === targetEnemyIdRef.current) || oAlive[0];
    }

    if (attacker && target) {
      isProcessingRef.current = true;
      executeCombatMove(attacker, skill, target);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 150);
    }
  };

  // ── 🎖️ 명예 상점 아이템 구매 ──────────────────────────────────────────
  const handleBuyShopItem = (itemKey: string, cost: number, name: string) => {
    if ((state.arenaCoins ?? 0) < cost) {
      gm.addLog('투사의 인장이 부족합니다!', 'danger');
      return;
    }

    gm.spendArenaCoins(cost);

    // 1. 티어별 장비 보급함
    if (itemKey === 'glory_chest_silver') {
      const equip = generateArenaRewardEquipment(900, 45, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_gold') {
      const equip = generateArenaRewardEquipment(1150, 30, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_platinum') {
      const equip = generateArenaRewardEquipment(1450, 15, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_diamond') {
      const equip = generateArenaRewardEquipment(1750, 8, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`👑 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_master') {
      const equip = generateArenaRewardEquipment(2050, 3, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🌌 [명예 상점] [${name}]을 개봉하여 신화급 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    }
    // 2. 클래스별 전용 희귀/에픽 장비
    else if (CLASS_HONOR_SHOP_DEFINITIONS[itemKey]) {
      const equip = createClassHonorEquipment(itemKey);
      if (equip) {
        gm.addEquipmentToInventory(equip);
        gm.addLog(`🎖️ [명예 상점] [${CLASS_HONOR_SHOP_DEFINITIONS[itemKey].className}] ${equip.rarity.toUpperCase()} [${equip.name}]을(를) 획득하여 장비함에 보관했습니다!`, 'reward');
      }
    }
    // 3. 직군별 투사의 무기 & 판금갑 (호환성 유지)
    else if (itemKey === 'glory_sword') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory_fierce',
        name: '맹렬한',
        type: 'prefix' as const,
        rarity: 'epic' as const,
        stats: { atk: 6, luck: 3 },
        description: '공격력 +6, 행운 +3'
      } : undefined;
      const sword: EquipmentItem = {
        id: `equip_glory_sword_${Date.now()}`,
        name: prefix ? `[${prefix.name}] 투사의 처형검` : '투사의 처형검',
        baseName: '투사의 처형검',
        slot: 'weapon',
        level: 0,
        rarity: 'epic',
        baseStats: { atk: 22, def: 7, luck: 6 },
        stats: { atk: 22, def: 7, luck: 6 },
        prefix,
        description: '차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 결전 명검.',
        icon: '🗡️'
      };
      sword.stats = recalculateEquipmentStats(sword, 0);
      gm.addEquipmentToInventory(sword);
      gm.addLog(`🎖️ [명예 상점] 에픽 무기 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_gun') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory_precise',
        name: '정밀한',
        type: 'prefix' as const,
        rarity: 'epic' as const,
        stats: { atk: 6, spd: 2 },
        description: '공격력 +6, 속도 +2'
      } : undefined;
      const gun: EquipmentItem = {
        id: `equip_glory_gun_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prefix ? `[${prefix.name}] 투사의 결전 마총` : '투사의 결전 마총',
        baseName: '투사의 결전 마총',
        slot: 'weapon',
        level: 0,
        rarity: 'epic',
        baseStats: { atk: 15, spd: 4, luck: 4 },
        stats: { atk: 15, spd: 4, luck: 4 },
        prefix,
        description: '고열 에테르 탄환을 고속 연사하는 차원 아레나 제식 마총.',
        icon: '🔫'
      };
      gun.stats = recalculateEquipmentStats(gun, 0);
      gm.addEquipmentToInventory(gun);
      gm.addLog(`🎖️ [명예 상점] 에픽 무기 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_plate') {
      const hasSuffix = Math.random() < 0.20;
      const suffix = hasSuffix ? {
        id: 'suffix_glory_guard',
        name: '수호',
        type: 'suffix' as const,
        rarity: 'epic' as const,
        stats: { def: 8, hp: 42 },
        description: '방어력 +8, HP +42'
      } : undefined;
      const plate: EquipmentItem = {
        id: `equip_glory_plate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: suffix ? `투사의 불패 판금갑 [${suffix.name}]` : '투사의 불패 판금갑',
        baseName: '투사의 불패 판금갑',
        slot: 'armor',
        level: 0,
        rarity: 'epic',
        baseStats: { def: 27, hp: 98 },
        stats: { def: 27, hp: 98 },
        suffix,
        description: '어떠한 맹공도 버텨내는 불패의 투사 중장갑주.',
        icon: '🛡️'
      };
      plate.stats = recalculateEquipmentStats(plate, 0);
      gm.addEquipmentToInventory(plate);
      gm.addLog(`🎖️ [명예 상점] 에픽 방어구 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    }
    // 3. 기존 자원/악세서리/유물
    else if (itemKey === 'food_pack') {
      gm.modifyResource('food', 25);
      gm.addLog(`🎖️ [명예 상점] 특제 보급 식량 세트를 구매했습니다! (식량 +25)`, 'reward');
    } else if (itemKey === 'torch_pack') {
      gm.modifyResource('coal', 20);
      gm.addLog(`🎖️ [명예 상점] 에테르 횃불 세트를 구매했습니다! (석탄 +20)`, 'reward');
    } else if (itemKey === 'pure_prefix') {
      gm.modifyResource('pure_prefix_stone', 1);
      gm.addLog(`🎖️ [명예 상점] 순수 접두 마도석 1개를 획득했습니다!`, 'reward');
    } else if (itemKey === 'pure_suffix') {
      gm.modifyResource('pure_suffix_stone', 1);
      gm.addLog(`🎖️ [명예 상점] 순수 접미 마도석 1개를 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_amulet') {
      const amulet: EquipmentItem = {
        id: `equip_glory_amulet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: '투사의 용맹 목걸이',
        baseName: '투사의 용맹 목걸이',
        slot: 'accessory',
        level: 0,
        rarity: 'rare',
        baseStats: { hp: 84, def: 14, luck: 8, spd: 4 },
        stats: { hp: 84, def: 14, luck: 8, spd: 4 },
        description: '차원 투기장에서 용맹을 증명한 투사에게 수여되는 펜던트.',
        icon: '📿'
      };
      amulet.stats = recalculateEquipmentStats(amulet, 0);
      gm.addEquipmentToInventory(amulet);
      gm.addLog(`🎖️ [명예 상점] 희귀 장신구 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_ring') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory',
        name: '투사의',
        type: 'prefix' as const,
        rarity: 'legendary' as const,
        stats: { atk: 10, luck: 6 },
        description: '공격력 +10, 행운 +6'
      } : undefined;
      const ring: EquipmentItem = {
        id: `equip_glory_ring_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prefix ? `[${prefix.name}] 투사의 영광 반지` : '투사의 영광 반지',
        baseName: '투사의 영광 반지',
        slot: 'accessory',
        level: 0,
        rarity: 'legendary',
        baseStats: { atk: 25, def: 18, luck: 11, spd: 6, mp: 42 },
        stats: { atk: 25, def: 18, luck: 11, spd: 6, mp: 42 },
        prefix,
        description: '차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 전설의 반지.',
        icon: '💍'
      };
      ring.stats = recalculateEquipmentStats(ring, 0);
      gm.addEquipmentToInventory(ring);
      gm.addLog(`🎖️ [명예 상점] 전설 아티팩트 [${name}]을(를) 획득하여 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'overlord_crown') {
      const hasPrefix = Math.random() < 0.25;
      const hasSuffix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_overlord',
        name: '패왕의',
        type: 'prefix' as const,
        rarity: 'legendary' as const,
        stats: { atk: 21, luck: 10 },
        description: '공격력 +21, 행운 +10'
      } : undefined;
      const suffix = hasSuffix ? {
        id: 'suffix_dimension',
        name: '차원의',
        type: 'suffix' as const,
        rarity: 'legendary' as const,
        stats: { def: 18, hp: 105 },
        description: '방어력 +18, 최대 HP +105'
      } : undefined;
      const prefixPart = prefix ? `[${prefix.name}] ` : '';
      const suffixPart = suffix ? ` [${suffix.name}]` : '';
      const crown: EquipmentItem = {
        id: `equip_overlord_crown_${Date.now()}`,
        name: `${prefixPart}차원 패왕의 주권 관${suffixPart}`,
        baseName: '차원 패왕의 주권 관',
        slot: 'accessory',
        level: 0,
        rarity: 'legendary',
        baseStats: { atk: 42, def: 35, luck: 20, spd: 8, hp: 210, mp: 84 },
        stats: { atk: 42, def: 35, luck: 20, spd: 8, hp: 210, mp: 84 },
        prefix,
        suffix,
        description: '차원 게이트 10레벨의 극한을 뚫고 모든 차원을 평정한 절대 패왕의 신화 보관.',
        icon: '👑'
      };
      crown.stats = recalculateEquipmentStats(crown, 0);
      gm.addEquipmentToInventory(crown);
      gm.addLog(`👑 [명예 상점] 최고위 신화 아티팩트 [${name}]을(를) 영구 획득했습니다!`, 'reward');
    }

    gm.saveGame();
  };

  const [shopCategory, setShopCategory] = useState<'all' | 'equip' | 'box' | 'material' | 'supply'>('all');

  const SHOP_ITEMS = [
    // ── 1. 티어별 확정 장비 보급 상자 ──
    {
      key: 'glory_chest_silver',
      name: '[실버] 투사의 장비 보급함',
      desc: '실버 등급 투사를 위한 희귀(Rare) 제식 무구 1종 확정',
      cost: 200,
      icon: '📦',
      tag: '실버 상자',
      category: 'box' as const,
      reqGateLv: 1,
    },
    {
      key: 'glory_chest_gold',
      name: '[골드] 투사의 결전 무구함',
      desc: '골드 등급 투사를 위한 희귀~에픽(Epic) 무구 1종 확정',
      cost: 450,
      icon: '🎁',
      tag: '골드 상자',
      category: 'box' as const,
      reqGateLv: 3,
    },
    {
      key: 'glory_chest_platinum',
      name: '[플래티넘] 사령관 아티팩트 상자',
      desc: '플래티넘 사령관을 위한 에픽(Epic) 무구 1종 확정',
      cost: 850,
      icon: '💎',
      tag: '플래티넘 상자',
      category: 'box' as const,
      reqGateLv: 5,
    },
    {
      key: 'glory_chest_diamond',
      name: '[다이아몬드] 지휘관 성유물함',
      desc: '다이아몬드 전사를 위한 에픽~전설(Legendary) 결전 무구 확정',
      cost: 1400,
      icon: '👑',
      tag: '다이아 상자',
      category: 'box' as const,
      reqGateLv: 7,
    },
    {
      key: 'glory_chest_master',
      name: '[마스터] 패왕의 신화 무기고',
      desc: '최상위 마스터를 위한 전설(Legendary) 무구 1종 확정',
      cost: 2500,
      icon: '🌌',
      tag: '신화 무기고',
      category: 'box' as const,
      reqGateLv: 9,
    },

    // ── 2. 클래스별 전용 명예 장비 (희귀 / 에픽 각 1종, 총 12종) ──
    ...Object.values(CLASS_HONOR_SHOP_DEFINITIONS).map(def => ({
      key: def.key,
      name: def.name,
      desc: def.desc,
      cost: def.cost,
      icon: def.icon,
      tag: `[${def.className}] ${def.grade === 'rare' ? '희귀' : '에픽'}`,
      category: 'equip' as const,
      reqGateLv: def.reqGateLv,
    })),
    {
      key: 'glory_amulet',
      name: '희귀 장신구: 투사의 용맹 목걸이',
      desc: 'HP+84, DEF+14, CRIT+6%, SPD+4',
      cost: 450,
      icon: '📿',
      tag: '희귀 장신구',
      category: 'equip' as const,
      reqGateLv: 4,
    },
    {
      key: 'glory_ring',
      name: '전설 장신구: 투사의 영광 반지',
      desc: 'ATK+25, DEF+18, CRIT+7%, SPD+6, MP+42',
      cost: 800,
      icon: '💍',
      tag: '전설 장비',
      category: 'equip' as const,
      reqGateLv: 5,
    },
    {
      key: 'overlord_crown',
      name: '신화 아티팩트: 차원 패왕의 주권 관',
      desc: 'ATK+42, DEF+35, CRIT+20%, SPD+8, HP+210, MP+84',
      cost: 3000,
      icon: '👑',
      tag: '신화 장비',
      category: 'equip' as const,
      reqGateLv: 10,
    },

    // ── 3. 재료 / 인챈트 ──
    {
      key: 'pure_prefix',
      name: '순수 접두 마도석 (Pure Prefix)',
      desc: '+7강 이상 장비에 파괴적 상위 접두어 마법 부여',
      cost: 250,
      icon: '🔮',
      tag: '인챈트',
      category: 'material' as const,
      reqGateLv: 2,
    },
    {
      key: 'pure_suffix',
      name: '순수 접미 마도석 (Pure Suffix)',
      desc: '+7강 이상 장비에 수호/생명 상위 접미어 부여',
      cost: 250,
      icon: '🔮',
      tag: '인챈트',
      category: 'material' as const,
      reqGateLv: 2,
    },

    // ── 4. 보급품 ──
    {
      key: 'food_pack',
      name: '특제 원정 보급 식량 세트',
      desc: '심연 탐험 시 허기를 달래주는 전술 보급 식량 +25개',
      cost: 100,
      icon: '🍖',
      tag: '보급품',
      category: 'supply' as const,
      reqGateLv: 1,
    },
    {
      key: 'torch_pack',
      name: '에테르 횃불 연료 세트',
      desc: '심연의 흑무를 밝혀주는 고열 제련 석탄 +20개',
      cost: 100,
      icon: '🔥',
      tag: '보급품',
      category: 'supply' as const,
      reqGateLv: 1,
    },
  ];

  const filteredShopItems = SHOP_ITEMS.filter(item => {
    if (shopCategory === 'all') return true;
    return item.category === shopCategory;
  });

  const activeAttacker = playerTeam.find(c => c.id === activeCombatantId);
  const isMyTurn = activeAttacker && activeAttacker.isPlayer && !finalReward;

  // 🔒 1. 차원 앵커 게이트 미건설 상태 진입 방어
  if (!isGateBuilt) {
    return (
      <div className="flex-1 min-h-0 w-full max-w-full flex flex-col items-center justify-center p-6 bg-[#080c16] text-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[#ff416c15] border border-[#ff416c44] flex items-center justify-center text-3xl shadow-lg shadow-[#ff416c15]">
          🏆
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-base font-bold text-white tracking-wide">차원 앵커 게이트 미건설</div>
          <div className="text-xs text-[#8b9bb4] max-w-[290px] leading-relaxed">
            차원의 관문이 아직 닫혀 있습니다.<br />
            성채(Citadel)에서 <span className="text-[#ffd54f] font-bold">영혼의 제단(Lv.1)</span>을 먼저 세운 후 <span className="text-[#00d2ff] font-bold">차원 앵커 게이트</span>를 건설하여 3v3 아레나, 네메시스, 영지 침공을 개방하십시오.
          </div>
        </div>
        <ActionButton
          label="🏰 방주 성채로 돌아가기"
          variant="primary"
          size="md"
          className="px-6 font-bold"
          onClick={() => navigateTo('citadel')}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full max-w-full flex flex-col bg-transparent overflow-hidden overflow-x-hidden relative">

      {/* 🌌 차원 관문 게이트 전환 바 (PvP 결투장 <-> 차원 네메시스 월드 레이드 <-> 차원 영지 침공) */}
      <div className="px-3 pt-2 shrink-0 w-full max-w-full z-10">
        <div className="p-1 rounded-xl bg-[#090e1a] border border-[#1a2538] flex items-center gap-1.5 shadow-lg">
          {/* 1. 차원 아레나 (Lv.1 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              gateMode === 'arena'
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white shadow-md shadow-[#ff416c33]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              setGateMode('arena');
              gm.emit('phaserSceneChange', 'arena');
            }}
          >
            <span className="shrink-0">⚔️</span>
            <span className="truncate">차원 아레나</span>
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-black/40 text-[#ffd54f] font-mono shrink-0">PvP</span>
          </button>

          {/* 2. 네메시스 월드 레이드 (Lv.3 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 relative overflow-hidden ${
              !isNemesisUnlocked
                ? 'text-[#506078] hover:bg-[#0c1220] opacity-65 cursor-pointer'
                : gateMode === 'nemesis'
                ? 'bg-gradient-to-r from-[#8a2be2] to-[#4a0e78] text-white shadow-md shadow-[#8a2be244] border border-[#a855f766]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              if (!isNemesisUnlocked) {
                gameDialog.alert({
                  title: '차원 관문 미개방',
                  message: `차원 네메시스 월드 레이드는 차원 앵커 게이트 Lv.3 이상부터 개방됩니다.\n(현재 게이트 레벨: Lv.${gateLevel})\n\n성채에서 차원 앵커 게이트를 증축해주세요.`,
                  icon: '🔒',
                });
                return;
              }
              setGateMode('nemesis');
              gm.emit('phaserSceneChange', 'arena');
            }}
          >
            <span className={`shrink-0 ${isNemesisUnlocked ? 'animate-pulse' : ''}`}>🌌</span>
            <span className="truncate">네메시스</span>
            {isNemesisUnlocked ? (
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-[#e0aaff] font-mono shrink-0">
                RAID
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#1e2538] border border-[#2d3a54] text-[#90a4ae] font-mono shrink-0">
                🔒Lv.3
              </span>
            )}
            {isNemesisUnlocked && (state.nemesisState?.dailyAttempts ?? 3) > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#38ef7d] animate-ping ml-0.5 shrink-0" />
            )}
          </button>

          {/* 3. 영지 침공 (Lv.6 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 relative overflow-hidden ${
              !isInvasionUnlocked
                ? 'text-[#506078] hover:bg-[#0c1220] opacity-65 cursor-pointer'
                : gateMode === 'invasion'
                ? 'bg-gradient-to-r from-[#e53e3e] via-[#dd6b20] to-[#d69e2e] text-white shadow-md shadow-[#e53e3e44] border border-[#f6ad5566]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              if (!isInvasionUnlocked) {
                gameDialog.alert({
                  title: '차원 관문 미개방',
                  message: `차원 영지 침공(5인 원정대 약탈전)은 차원 앵커 게이트 Lv.6 이상부터 개방됩니다.\n(현재 게이트 레벨: Lv.${gateLevel})\n\n성채에서 차원 앵커 게이트를 증축해주세요.`,
                  icon: '🔒',
                });
                return;
              }
              setGateMode('invasion');
              gm.emit('phaserSceneChange', 'invasion');
            }}
          >
            <span className={`shrink-0 ${isInvasionUnlocked ? 'animate-bounce' : ''}`}>🏰</span>
            <span className="truncate">영지 침공</span>
            {isInvasionUnlocked ? (
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-[#ffd54f] font-mono shrink-0">
                5v5
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#1e2538] border border-[#2d3a54] text-[#90a4ae] font-mono shrink-0">
                🔒Lv.6
              </span>
            )}
          </button>
        </div>
      </div>

      {gateMode === 'invasion' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
            <InvasionView />
          </div>
          <div className="px-3 py-1.5 shrink-0 w-full max-w-full border-t border-[#1a2333] bg-[#090e18]">
            <ActionButton
              label="🏰 방주 성채로 귀환"
              variant="ghost"
              className="w-full py-1.5 text-xs"
              onClick={() => navigateTo('citadel')}
            />
          </div>
        </div>
      ) : gateMode === 'nemesis' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <NemesisView />
          <div className="px-3 py-1.5 shrink-0 w-full max-w-full border-t border-[#1a2333] bg-[#090e18]">
            <ActionButton
              label="🏰 방주 성채로 귀환"
              variant="ghost"
              className="w-full py-1.5 text-xs"
              onClick={() => navigateTo('citadel')}
            />
          </div>
        </div>
      ) : (
        <>
          {/* 👑 Top 10 랭커 PVE 버프 활성화 배너 */}
      {isTop10 && (
        <div className="px-3 pt-2 w-full max-w-full shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd54f33] via-[#ff416c33] to-[#ffd54f33] border border-[#ffd54f] flex items-center justify-between shadow-lg shadow-[#ffd54f22] animate-pulse">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-base shrink-0">👑</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#ffd54f] truncate block">Top 10 랭커 전용 PVE 버프 발동 중</span>
                <span className="text-[10px] text-[#ffdd88] truncate block">전 파티원 ATK/HP +15% · 식량 소모 -20% · 희귀 드랍률 +25%</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#ff416c] font-mono shrink-0 ml-2">Rank #{state.currentArenaRank}</span>
          </div>
        </div>
      )}

      {/* 지휘관 랭크 & 재화 헤더 카드 */}
      <div className="px-3 pt-2 w-full max-w-full shrink-0">
        <div className="panel-accent p-3 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md"
              style={{ background: badge.bg, border: `2px solid ${badge.border}` }}
            >
              {badge.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-cinzel text-sm font-bold truncate" style={{ color: badge.color }}>
                  {badge.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#00d2ff] font-mono font-bold shrink-0">
                  Rank #{state.currentArenaRank}
                </span>
                {streak > 1 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff416c22] border border-[#ff416c88] text-[#ff416c] font-mono font-bold animate-pulse shrink-0">
                    🔥 {streak}연승
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-white leading-none">{state.currentArenaRating}</span>
                <span className="text-[10px] text-[#8b9bb4]">MMR</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="text-[10px] text-[#8b9bb4]">'보유 투사의 인장'</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm">🪙</span>
              <span className="font-mono text-sm font-bold text-[#ffd54f]">{state.arenaCoins ?? 0}</span>
            </div>
            <span className="text-[9px] text-[#00d2ff]">'인장 획득 ➔ 명예 상점에서 장비 교환'</span>
          </div>
        </div>
      </div>

      {/* 탭 내비게이션 (3단 탭) */}
      <div className="px-3 pt-2 flex gap-1.5 shrink-0 w-full max-w-full">
        {[
          { key: 'match', label: '⚔️ 차원 매칭' },
          { key: 'ranking', label: '🏆 클라우드 랭킹' },
          { key: 'shop', label: '🎖️ 명예 암시장' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn flex-1 text-xs py-2 transition-all ${tab === t.key ? 'btn-primary font-bold shadow-md shadow-[#42321955]' : 'btn-ghost text-[#8b9bb4]'}`}
            onClick={() => setTab(t.key as Tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 영역 */}
      <div className="flex-1 min-h-0 px-3 pt-2 pb-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
        {/* ── 1. 매칭 탭 ── */}
        {tab === 'match' && (
          <div className="flex flex-col gap-2.5 w-full max-w-full">
            {/* 🌌 내 5인 차원 부대 편성 상태 배너 */}
            {!squadCheck.isReady ? (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#2c1216] via-[#1f0f15] to-[#120d18] border border-[#ef535088] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl p-1.5 rounded-lg bg-black/40 border border-[#ef535044] shrink-0">⚠️</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-[#ff8a80] flex items-center gap-1.5 flex-wrap">
                      <span>차원 5인 부대 미편성</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 text-[#ffd54f] font-mono font-bold border border-[#ffd54f33]">
                        현재 {squadCheck.count}/5인 배치
                      </span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc] mt-0.5 leading-relaxed">
                      차원 게이트 전투는 5인 부대(선발 3인 + 리더 1인 + 서포터 1인)가 모두 편성되어야 진행할 수 있습니다.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {allAvailableHeroes.length >= 5 ? (
                    <button
                      className="btn btn-primary text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md shadow-[#00d2ff33]"
                      onClick={() => {
                        const ok = gm.autoAssignDimensionalDeck();
                        if (ok) {
                          SoundManager.getInstance().play('equip');
                          setTurnTick(t => t + 1);
                        }
                      }}
                    >
                      <span>⚡</span>
                      <span>5인 자동 편성</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost text-xs px-3 py-1.5 text-[#ffd54f] border border-[#ffd54f55] hover:bg-[#ffd54f15] font-bold"
                      onClick={() => {
                        navigateTo('citadel');
                        gm.emit('openTavernDrawer');
                      }}
                    >
                      🍻 주점에서 영입
                    </button>
                  )}
                  <button
                    className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#00d2ff] border border-[#00d2ff44] hover:bg-[#00d2ff18] font-bold"
                    onClick={() => {
                      navigateTo('citadel');
                      gm.emit('openDimensionalBarracks');
                    }}
                  >
                    🏛️ 부대 직접 편성
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#0e1424] border border-[#1f2d47] flex flex-col gap-1.5 shadow-md">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>🌌 내 차원 5인 출격 부대</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44] font-bold">
                      ✓ 출격 가능
                    </span>
                  </div>
                  <button
                    className="text-[10px] text-[#00d2ff] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                    onClick={() => {
                      navigateTo('citadel');
                      gm.emit('openDimensionalBarracks');
                    }}
                  >
                    ⚙️ 부대 변경
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[#080d17] border border-[#172338]">
                  {dimDeck.mainHeroes.map((h, i) => (
                    <div key={h.id} className="flex flex-col items-center justify-center p-1 rounded bg-[#101728] border border-[#1e2a44] text-center min-w-0">
                      <span className="text-[8px] font-bold text-[#00d2ff]">{i === 0 ? '전열' : i === 1 ? '중열' : '후열'}</span>
                      <span className="text-[9px] font-bold text-white truncate w-full">{h.name}</span>
                      <span className="text-[8px] text-[#8b9bb4] font-mono">Lv.{h.level}</span>
                    </div>
                  ))}
                  {dimDeck.leaderHero && (
                    <div className="flex flex-col items-center justify-center p-1 rounded bg-[#1e170a] border border-[#ffd54f44] text-center min-w-0">
                      <span className="text-[8px] font-bold text-[#ffd54f]">👑리더</span>
                      <span className="text-[9px] font-bold text-[#ffe082] truncate w-full">{dimDeck.leaderHero.name}</span>
                      <span className="text-[8px] text-[#ffd54f] font-mono">Lv.{dimDeck.leaderHero.level}</span>
                    </div>
                  )}
                  {dimDeck.supporterHero && (
                    <div className="flex flex-col items-center justify-center p-1 rounded bg-[#0a181e] border border-[#80deea44] text-center min-w-0">
                      <span className="text-[8px] font-bold text-[#80deea]">🛡️서포터</span>
                      <span className="text-[9px] font-bold text-[#b2ebf2] truncate w-full">{dimDeck.supporterHero.name}</span>
                      <span className="text-[8px] text-[#80deea] font-mono">Lv.{dimDeck.supporterHero.level}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 연승 보너스 알림 카드 */}
            {streak > 0 && (
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#ff416c15] via-[#ffd54f15] to-[#ff416c15] border border-[#ff416c55] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🔥</span>
                  <span className="font-bold text-[#ffdd88]">투사의 연속 승리 특전:</span>
                  <span className="font-mono text-[#ff416c] font-bold">{streak}연승 진행 중!</span>
                </div>
                <span className="text-[10px] text-[#ffd54f] font-bold">장비 강화 보너스 & 추가 인장 획득</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#8b9bb4] px-1">
              <span>도전 가능한 경쟁 지휘관 부대 (3인 덱)</span>
              <button
                className="text-[11px] text-[#00d2ff] hover:underline flex items-center gap-1 cursor-pointer"
                onClick={refreshOpponents}
              >
                🔄 새로고침
              </button>
            </div>

            {opponents.map(opp => {
              const oppBadge = getRankBadge(opp.rating);
              const ratingGainDelta = Math.max(15, Math.floor((opp.rating - state.currentArenaRating) / 25 + 30));
              return (
                <div key={opp.id} className="panel p-3 flex flex-col gap-2.5 border border-[#1f2738] hover:border-[#00d2ff44] transition-all bg-[#0e1320] rounded-xl w-full max-w-full overflow-hidden">
                  
                  {/* 카드 상단: 지휘관 정보 & 레이팅 & 도전 버튼 */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">{opp.name}</span>
                        {opp.isBot ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] shrink-0 font-mono flex items-center gap-0.5">
                            🤖 BOT
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0 font-mono flex items-center gap-0.5">
                            🌐 지휘관
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0" style={{ background: oppBadge.bg, color: oppBadge.color, border: `1px solid ${oppBadge.border}` }}>
                          {oppBadge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8b9bb4] mt-0.5 truncate">{opp.guild} · Rank #{opp.rank}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-[#ffd54f]">{opp.rating} P</div>
                        <span className="text-[9px] text-[#38ef7d] font-mono block">+{ratingGainDelta} P</span>
                      </div>
                      <ActionButton
                        label="⚔️ 결투 시작"
                        variant={squadCheck.isReady ? 'primary' : 'ghost'}
                        size="sm"
                        className={`px-3 py-1.5 text-xs font-bold shrink-0 ${
                          squadCheck.isReady ? 'shadow-md shadow-[#00d2ff22]' : 'opacity-80 border border-[#ef535044] text-[#ff8a80]'
                        }`}
                        onClick={() => startPvpSimulation(opp)}
                      />
                    </div>
                  </div>

                  {/* 카드 하단: 방어 진형 5인 덱 칩 */}
                  <div className="grid grid-cols-5 gap-1 p-1.5 rounded-lg bg-[#141b2b] border border-[#222d42] w-full">
                    {opp.defenseDeck.map((hero, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center gap-0.5 text-[9px] text-[#cfd8dc] bg-[#1a2338] px-1 py-1 rounded border border-[#2c3b59] min-w-0 text-center">
                        <span className="text-[9px] font-bold text-[#00d2ff] shrink-0">{idx < 2 ? '전열' : idx === 2 ? '중열' : '후열'}</span>
                        <span className="font-medium truncate w-full">{hero.title}</span>
                        <span className="text-[8px] text-[#8b9bb4] font-mono shrink-0">Lv.{hero.level}</span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── 2. 클라우드 랭킹 탭 ── */}
        {tab === 'ranking' && (
          <div className="flex flex-col gap-2 w-full max-w-full">
            <div className="flex items-center justify-between text-xs text-[#8b9bb4] px-1">
              <span>'Firebase Realtime DB 실시간 시즌 랭킹'</span>
              <button
                className="text-[11px] text-[#00d2ff] hover:underline flex items-center gap-1"
                onClick={fetchLeaderboard}
                disabled={isLoadingLb}
              >
                {isLoadingLb ? '동기화 중...' : '🔄 갱신'}
              </button>
            </div>

            {/* 내 순위 핀 카드 */}
            <div className="panel-accent p-3 flex items-center gap-2.5 border-2 border-[#00d2ff] bg-[#0c1b29] w-full max-w-full">
              <div className="font-mono text-base font-bold w-8 text-center text-[#00d2ff] shrink-0">
                #{state.currentArenaRank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white truncate">'내 원정단 (지휘관)'</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold shrink-0">ME</span>
                </div>
                <div className="text-[10px] text-[#8b9bb4] truncate">'방주 성채 수호단'</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-[#ffd54f]">{state.currentArenaRating} P</div>
                <div className="text-[9px]" style={{ color: badge.color }}>{badge.label}</div>
              </div>
            </div>

            {/* 글로벌 랭킹 목록 */}
            <div className="flex flex-col gap-1.5 mt-1 w-full max-w-full">
              {leaderboard.map((entry) => {
                const rankColor = entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : entry.rank <= 10 ? '#ff7b25' : '#8b9bb4';
                const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                const entryBadge = getRankBadge(entry.rating);

                return (
                  <div
                    key={`${entry.rank}_${entry.nickname}`}
                    className={`panel p-2.5 flex items-center gap-2.5 transition-all w-full max-w-full ${entry.isPlayer ? 'border-[#00d2ff] bg-[#0d1f2d]' : 'border-[#1a2338] bg-[#0b101c]'}`}
                  >
                    <div className="font-mono text-sm font-bold w-7 text-center shrink-0" style={{ color: rankColor }}>
                      {rankIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{entry.nickname}</span>
                        <span className="text-[9px] text-[#8b9bb4] shrink-0">Lv.{entry.level}</span>
                      </div>
                      <div className="text-[10px] text-[#6e82a0] truncate">{entry.leaderTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[#ffd54f]">{entry.rating} P</div>
                      <div className="text-[9px]" style={{ color: entryBadge.color }}>{entryBadge.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. 명예의 암시장 상점 탭 ── */}
        {tab === 'shop' && (
          <div className="flex flex-col gap-2.5 w-full max-w-full">
            {/* 상점 헤더 */}
            <div className="p-2.5 rounded-xl bg-[#141d30] border border-[#23324d] flex items-center justify-between w-full">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#ffd54f] block truncate">'명예의 암시장'</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#7c4dff33] text-[#b388ff] border border-[#7c4dff66] font-mono font-bold shrink-0">
                    {`게이트 Lv.${gateLevel}`}
                  </span>
                </div>
                <span className="text-[10px] text-[#8b9bb4] block truncate">
                  '게이트 증축에 따라 상위 장비·보급함·마도석이 개방됩니다.'
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#0b101c] px-2 py-1 rounded-lg border border-[#ffd54f44] shrink-0">
                <span className="text-sm">🪙</span>
                <span className="font-mono text-xs font-bold text-[#ffd54f]">{state.arenaCoins ?? 0}</span>
              </div>
            </div>

            {/* 🏷️ 카테고리 필터 탭 */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { key: 'all', label: '전체' },
                { key: 'box', label: '🎁 장비 보급함' },
                { key: 'equip', label: '⚔️ 투사 무구' },
                { key: 'material', label: '💎 촉매/마도석' },
                { key: 'supply', label: '🍖 보급품' },
              ].map(cat => (
                <button
                  key={cat.key}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${shopCategory === cat.key ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739] shadow-sm' : 'bg-[#141a29] text-[#8b9bb4] hover:text-white border border-[#1f2b42]'}`}
                  onClick={() => setShopCategory(cat.key as any)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 아이템 목록 */}
            <div className="flex flex-col gap-2 w-full max-w-full">
              {filteredShopItems.map(item => {
                const isUnlocked = gm.isMasterAccount || gateLevel >= item.reqGateLv;
                const canAfford = (state.arenaCoins ?? 0) >= item.cost && isUnlocked;

                return (
                  <div
                    key={item.key}
                    className={`panel p-2.5 flex items-center justify-between gap-2 w-full max-w-full transition-all ${isUnlocked ? 'bg-[#0d121f] border border-[#1e293b]' : 'bg-[#090d17] border border-[#161f30] opacity-60'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-[#141b2b] border border-[#25334d] flex items-center justify-center text-lg shrink-0">
                        {isUnlocked ? item.icon : '🔒'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs truncate ${isUnlocked ? 'text-white' : 'text-[#8b9bb4]'}`}>
                            {item.name}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold shrink-0">
                            {item.tag}
                          </span>
                          {!isUnlocked && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#ef535022] text-[#ef5350] border border-[#ef535044] font-mono font-bold shrink-0">
                              게이트 Lv.{item.reqGateLv} 필요
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">{item.desc}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pl-1">
                      <div className="flex items-center gap-0.5 font-mono text-xs font-bold text-[#ffd54f]">
                        <span>🪙</span>
                        <span>{item.cost}</span>
                      </div>
                      <ActionButton
                        label={isUnlocked ? '교환' : '잠김'}
                        variant={canAfford ? 'success' : 'ghost'}
                        size="sm"
                        disabled={!canAfford}
                        className="px-2.5 py-1 text-xs font-bold"
                        onClick={() => handleBuyShopItem(item.key, item.cost, item.name)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 성채 복귀 버튼 */}
      <div className="px-3 py-2 shrink-0 w-full max-w-full">
        <ActionButton
          label="🏰 방주 성채로 귀환"
          variant="ghost"
          className="w-full py-2 text-xs"
          onClick={() => navigateTo('citadel')}
        />
      </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ⚔️ 차원 아레나 3v3 실시간 몰입형 인터랙티브 전장 모달                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeBattleOpp && (
        <div className="fixed inset-0 z-50 bg-[#070a14]/85 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 sm:p-3 animate-fade-in select-none">
          {/* 💥 최상위 VFX 오버레이 (패널과 카드 위에 완전히 노출) */}
          <BattleVFXOverlay
            vfxList={vfxList}
            onFinish={(id) => setVfxList(prev => prev.filter(v => v.id !== id))}
            className="fixed inset-0 pointer-events-none z-50"
          />

          {/* 전장 헤더 */}
          <div className="w-full max-w-[500px] flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0e1424] border border-[#1e2d48] shadow-lg shrink-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">⚔️</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>vs {activeBattleOpp.name}</span>
                  {activeBattleOpp.isBot ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] font-mono shrink-0">
                      🤖 BOT
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] font-mono shrink-0">
                      🌐 지휘관
                    </span>
                  )}
                  <span className="text-[#ffd54f] font-mono font-normal">({activeBattleOpp.rating}P)</span>
                </div>
                <span className="text-[10px] text-[#8b9bb4] truncate block">
                  3v3 차원 아레나 제{battleRound}라운드 · 속도(SPD) 턴제 교전
                </span>
              </div>
            </div>

            {/* 전투 제어 컨트롤러 (1.5x / 2.0x 배속 전환 & 스킵, 수동 버튼 제거) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#141b2c] text-[#ffd54f] border border-[#212e48] hover:border-[#ffd54f]/50 transition-all cursor-pointer"
                onClick={() => setBattleSpeed(s => (s === 1.5 ? 2 : 1.5))}
              >
                ⚡ {battleSpeed}x
              </button>
              <button
                className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#ff416c22] text-[#ff416c] border border-[#ff416c66] hover:bg-[#ff416c44] cursor-pointer"
                onClick={handleInstantSkip}
              >
                ⏭️ 스킵
              </button>
            </div>
          </div>

          {/* 👑 아군 리더 궁극기 컷인 배너 오버레이 */}
          {isLeaderUltCutin && (
            <div className="absolute inset-x-0 top-1/4 z-50 flex items-center justify-center p-3 animate-bounce pointer-events-none">
              <div className="bg-gradient-to-r from-[#b8860b] via-[#ffd700] to-[#b8860b] p-[2px] rounded-2xl shadow-[0_0_35px_rgba(255,215,0,0.8)]">
                <div className="bg-[#120e06] px-6 py-3 rounded-2xl flex items-center gap-3">
                  <span className="text-4xl animate-spin">👑</span>
                  <div>
                    <div className="text-xs font-bold text-[#ffe082]">DIMENSIONAL LEADER ULTIMATE</div>
                    <div className="text-lg font-black text-white">{playerLeader?.name || '차원 리더'}의 궁극기 폭발!</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 💀 적군 리더 궁극기 컷인 배너 오버레이 */}
          {isOppLeaderUltCutin && (
            <div className="absolute inset-x-0 top-1/4 z-50 flex items-center justify-center p-3 animate-bounce pointer-events-none">
              <div className="bg-gradient-to-r from-[#880e4f] via-[#ff1744] to-[#880e4f] p-[2px] rounded-2xl shadow-[0_0_35px_rgba(255,23,68,0.8)]">
                <div className="bg-[#1a050d] px-6 py-3 rounded-2xl flex items-center gap-3">
                  <span className="text-4xl animate-spin">💀</span>
                  <div>
                    <div className="text-xs font-bold text-[#ff80ab]">ENEMY LEADER ULTIMATE</div>
                    <div className="text-lg font-black text-white">{oppLeader?.name || '상대 리더'}의 심연 궁극기 발동!</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 1. 적 진영 (적 리더/서포터 + 적 공격자 이미지창 + 3인 필드 카드) ── */}
          <div className="w-full max-w-[500px] my-auto flex flex-col gap-1.5 relative">
            {/* 상단 적 리더 & 서포터 정보 패널 */}
            <LeaderInfoCard
              leader={oppLeader}
              blessing={oppLeaderBlessing}
              supporter={oppSupporter}
              side="enemy"
              isActing={activeCombatantId === oppLeader?.id}
              isBot={activeBattleOpp.isBot}
            />

            {/* 상단 적 공격자 이미지창 */}
            <AttackerVisualBox
              attacker={lastEnemyAttacker}
              side="enemy"
              title="상대 아레나 방어자"
              isActing={activeCombatantId === lastEnemyAttacker?.id}
            />

            {/* 적 3인 선발 필드 카드 */}
            <div className="grid grid-cols-3 gap-1.5">
              {oppTeam.map((c) => {
                const isAlive = c.currentHp > 0;
                const isTarget = c.id === targetEnemyId;
                const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
                const mpPct = Math.max(0, (c.currentMp / c.maxMp) * 100);
                const isTurn = c.id === activeCombatantId;

                return (
                  <div
                    key={c.id}
                    className={`panel p-2 flex flex-col gap-0.5 rounded-xl transition-all cursor-pointer relative ${
                      isTarget ? 'border-2 border-[#ff416c] shadow-lg shadow-[#ff416c33] bg-[#1a0f1c]' : 'border border-[#261f33] bg-[#120d1c]'
                    } ${isTurn ? 'ring-2 ring-[#ffd54f] animate-pulse' : ''} ${!isAlive ? 'opacity-40 grayscale' : ''}`}
                    onClick={() => isAlive && setTargetEnemyId(c.id)}
                  >
                    {isTarget && isAlive && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.1 rounded-full font-bold bg-[#ff416c] text-white shadow-md z-10">
                        TARGET
                      </span>
                    )}

                    {/* 버프 & 디버프 상태이상 배지 목록 */}
                    {c.statusEffects && c.statusEffects.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-0.5">
                        {c.statusEffects.map((eff, eIdx) => {
                          const meta = STATUS_EFFECT_META[eff.type];
                          const isBuff = eff.type.startsWith('buff_') || eff.type === 'shield' || eff.type === 'regen' || eff.type === 'riposte' || eff.type === 'immunity' || eff.type === 'stealth';
                          const turns = eff.duration ?? eff.turnsLeft ?? 1;
                          const label = eff.name || meta?.label || eff.type;
                          const icon = eff.icon || meta?.icon || (isBuff ? '✨' : '💀');
                          return (
                            <span
                              key={eIdx}
                              className={`text-[8px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                                isBuff
                                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                                  : 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]'
                              }`}
                              title={`${label} (${turns}턴)`}
                            >
                              <span>{icon}</span>
                              <span className="font-mono text-[7px]">{turns}T</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-base">{c.icon}</span>
                      <span className="text-[8px] font-mono text-[#ff80ab] font-bold">
                        {c.position === 'front' ? '전열' : c.position === 'mid' ? '중열' : '후열'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{c.name.split('의 ')[1] || c.name}</div>
                      <div className="text-[9px] text-[#b39ddb] truncate">{c.className} Lv.{c.level}</div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full bg-[#26152a] rounded-full h-1.5 overflow-hidden mt-0.5">
                      <div className="bg-[#ff416c] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>
                    {/* MP Bar */}
                    <div className="w-full bg-[#151f33] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#42a5f5] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                    </div>

                    <div className="text-[8px] text-right font-mono text-[#8b9bb4]">
                      {isAlive ? `${c.currentHp}/${c.maxHp}` : '💀 DEAD'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 💀 적군 피버 게이지 (적 진영 카드 바로 아래, 중앙 로그를 사이에 두고 아군 피버와 마주보도록 배치) */}
            <div className="flex flex-col gap-1 w-full mt-0.5">
              <FeverGaugeBar
                badges={oppFeverBadges}
                party={oppTeam.map(c => ({ classId: c.classId } as any))}
                label="ENEMY FEVER"
                side="enemy"
              />
            </div>

            {/* ── 2. 중앙 배틀 아레나 (액션 배너 전용) ── */}
            <div className="h-10 w-full relative flex flex-col items-center justify-center pointer-events-none my-1">
              {actionBanner && (
                <div className="px-4 py-1 rounded-full bg-[#0d1527ee] border border-[#00d2ff66] shadow-xl animate-scale-up text-center max-w-[90%] z-20">
                  <span className="text-xs font-bold block" style={{ color: actionBanner.color }}>
                    {actionBanner.text}
                  </span>
                  <span className="text-[10px] text-[#ffdd88] font-bold block mt-0.5">
                    {actionBanner.sub}
                  </span>
                </div>
              )}
            </div>

            {/* ── 🔥 아군 피버 게이지 ── */}
            <div className="flex flex-col gap-1 w-full">
              <FeverGaugeBar
                badges={feverBadges}
                party={playerTeam.map(c => ({ classId: c.classId } as any))}
                label="PLAYER FEVER"
                side="player"
              />
            </div>

            {/* ── 3. 아군 진영 (3인 필드 카드) ── */}
            <div className="grid grid-cols-3 gap-1.5">
              {playerTeam.map((c) => {
                const isAlive = c.currentHp > 0;
                const isTurn = c.id === activeCombatantId;
                const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
                const mpPct = Math.max(0, (c.currentMp / c.maxMp) * 100);

                return (
                  <div
                    key={c.id}
                    className={`panel p-2 flex flex-col gap-0.5 rounded-xl transition-all relative ${
                      isTurn ? 'border-2 border-[#00d2ff] shadow-lg shadow-[#00d2ff33] bg-[#0c1e30]' : 'border border-[#1a2d48] bg-[#0d1726]'
                    } ${!isAlive ? 'opacity-40 grayscale' : ''}`}
                  >
                    {isTurn && isAlive && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.1 rounded-full font-bold bg-[#00d2ff] text-black shadow-md animate-bounce z-10">
                        TURN
                      </span>
                    )}

                    {/* 버프 & 디버프 상태이상 배지 목록 */}
                    {c.statusEffects && c.statusEffects.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-0.5">
                        {c.statusEffects.map((eff, eIdx) => {
                          const meta = STATUS_EFFECT_META[eff.type];
                          const isBuff = eff.type.startsWith('buff_') || eff.type === 'shield' || eff.type === 'regen' || eff.type === 'riposte' || eff.type === 'immunity' || eff.type === 'stealth';
                          const turns = eff.duration ?? eff.turnsLeft ?? 1;
                          const label = eff.name || meta?.label || eff.type;
                          const icon = eff.icon || meta?.icon || (isBuff ? '✨' : '💀');
                          return (
                            <span
                              key={eIdx}
                              className={`text-[8px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                                isBuff
                                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                                  : 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]'
                              }`}
                              title={`${label} (${turns}턴)`}
                            >
                              <span>{icon}</span>
                              <span className="font-mono text-[7px]">{turns}T</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-base">{c.icon}</span>
                      <span className="text-[8px] font-mono text-[#00d2ff] font-bold">
                        {c.position === 'front' ? '전열' : c.position === 'mid' ? '중열' : '후열'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{c.name}</div>
                      <div className="text-[9px] text-[#80deea] truncate">{c.className} Lv.{c.level}</div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full bg-[#102422] rounded-full h-1.5 overflow-hidden mt-0.5">
                      <div className="bg-[#38ef7d] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>
                    {/* MP Bar */}
                    <div className="w-full bg-[#151f33] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#00d2ff] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                    </div>

                    <div className="text-[8px] text-right font-mono text-[#8b9bb4]">
                      {isAlive ? `${c.currentHp}/${c.maxHp}` : '💀 DEAD'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 아군 공격자 이미지창 */}
            <AttackerVisualBox
              attacker={lastPlayerAttacker}
              side="player"
              title="아군 차원 투사"
              isActing={activeCombatantId === lastPlayerAttacker?.id}
            />

            {/* 하단 아군 리더 & 서포터 정보 패널 */}
            <LeaderInfoCard
              leader={playerLeader}
              blessing={playerLeaderBlessing}
              supporter={playerSupporter}
              side="player"
              isActing={activeCombatantId === playerLeader?.id}
            />
          </div>

          {/* ── 4. 하단 액션 커맨드 바 (수동 플레이 시 스킬 직접 조작) ── */}
          <div className="w-full max-w-[500px] shrink-0">
            {isMyTurn && !isAuto ? (
              <div className="panel p-2.5 rounded-xl bg-[#0a1220] border border-[#00d2ff55] flex flex-col gap-2 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{activeAttacker?.icon}</span>
                    <span className="font-bold text-[#00d2ff]">{activeAttacker?.name}의 행동 선택</span>
                    <span className="text-[10px] text-[#8b9bb4] font-mono">({activeAttacker?.currentMp} MP)</span>
                  </div>
                  <span className="text-[10px] text-[#ffd54f]">타겟: {oppTeam.find(c => c.id === targetEnemyId)?.name || '상대'}</span>
                </div>

                {/* 스킬 버튼 그리드 */}
                <div className="grid grid-cols-3 gap-1.5">
                  {activeAttacker?.skills.map((skill) => {
                    const cd = activeAttacker.cooldowns[skill.id] || 0;
                    const canAfford = activeAttacker.currentMp >= skill.manaCost && cd <= 0;

                    return (
                      <button
                        key={skill.id}
                        disabled={!canAfford}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                          canAfford
                            ? 'bg-[#14233c] hover:bg-[#1a3154] border border-[#234272] text-white cursor-pointer active:scale-95'
                            : 'bg-[#0f1724] border border-[#182335] text-[#556987] opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => handleManualSkillClick(skill)}
                      >
                        <span className="text-base">{skill.icon || '⚔️'}</span>
                        <span className="text-xs font-bold truncate max-w-full">{skill.name}</span>
                        <span className="text-[9px] font-mono text-[#64b5f6]">
                          {cd > 0 ? `${cd}턴 대기` : skill.manaCost > 0 ? `${skill.manaCost} MP` : '0 MP'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── 🛡️ 하단 전술 버프 현황판: 리더 가호 + 3인 진형 시너지 + 백과사전 도감 버프 ── */
              <div className="panel p-2 rounded-xl bg-[#090e1a]/95 border border-[#1a253a] flex flex-col gap-1.5 shadow-xl">
                {/* 상단 타이틀 & 모드 인디케이터 */}
                <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#162032]">
                  <span className="font-bold text-[#cfd8e8] flex items-center gap-1">
                    <span>⚡</span> <span>아군 전술 강화 현황</span>
                  </span>
                  <span className="text-[#38ef7d] font-mono flex items-center gap-1 text-[9px] animate-pulse">
                    <span>{isAuto ? '▶️ 자동 콤보 연계' : '⏸️ 상대 행동 중'}</span>
                  </span>
                </div>

                {/* 1. 👑 리더의 가호 (영령 버프) 상세 */}
                <div className="p-1.5 rounded-lg bg-[#141006] border border-[#ffb30033] flex items-start justify-between gap-1 text-[9.5px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">👑</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#ffd54f] truncate">
                          {playerLeader ? `${playerLeader.name}의 가호` : '리더 미배치'}
                        </span>
                        {playerLeader && (
                          <span className="text-[8px] px-1 py-0.1 rounded bg-[#ffd54f22] text-[#ffe082] font-mono">
                            [{playerLeader.grade.toUpperCase()}]
                          </span>
                        )}
                      </div>
                      <div className="text-[8.5px] text-[#ffecb3] truncate mt-0.5">
                        {playerLeaderBlessing ? playerLeaderBlessing.description : '선대 영령의 영구 가호 효과 발동 중'}
                      </div>
                    </div>
                  </div>
                  {playerLeaderBlessing && (
                    <div className="flex items-center gap-1 shrink-0 text-[8.5px] font-mono text-[#ffd54f]">
                      {playerLeaderBlessing.buffs?.atkBonus && <span>공+{Math.round((playerLeaderBlessing.buffs.atkBonus - 1) * 100)}%</span>}
                      {playerLeaderBlessing.buffs?.defBonus && <span>방+{Math.round((playerLeaderBlessing.buffs.defBonus - 1) * 100)}%</span>}
                      {playerLeaderBlessing.buffs?.allStatsBonus && <span>올+{Math.round((playerLeaderBlessing.buffs.allStatsBonus - 1) * 100)}%</span>}
                    </div>
                  )}
                </div>

                {/* 2. ⚔️ 진형 & 클래스 활성 시너지 뱃지 */}
                <div className="p-1.5 rounded-lg bg-[#071322] border border-[#00d2ff26] flex flex-col gap-1 text-[9px]">
                  <div className="flex items-center justify-between text-[#80deea]">
                    <span className="font-bold flex items-center gap-1">
                      <span>⚔️</span> <span>실시간 진형 시너지</span>
                    </span>
                    <span className="text-[8px] font-mono text-[#4dd0e1]">
                      {activePartySynergies.length}개 활성
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {activePartySynergies.length > 0 ? (
                      activePartySynergies.map(syn => (
                        <span
                          key={syn.id}
                          className="px-1.5 py-0.5 rounded-md bg-[#00d2ff18] text-[#00e5ff] border border-[#00d2ff44] text-[8.5px] font-bold flex items-center gap-0.5"
                          title={syn.description}
                        >
                          <span>{syn.icon}</span>
                          <span>{syn.name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[8.5px] text-[#607d8b]">활성화된 진형 시너지 없음</span>
                    )}
                  </div>
                </div>

                {/* 3. 📜 심연의 백과 도감 영구 버프 스탯 */}
                <div className="p-1.5 rounded-lg bg-[#0e0c1a] border border-[#9c27b033] flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1 text-[#ba68c8]">
                    <span>📜</span>
                    <span className="font-bold">심연의 백과 영구 보너스</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-[#e1bee7] flex-wrap justify-end">
                    {codexBonus.atk > 0 && <span className="bg-[#4a148c33] px-1 rounded">공+{codexBonus.atk}</span>}
                    {codexBonus.def > 0 && <span className="bg-[#4a148c33] px-1 rounded">방+{codexBonus.def}</span>}
                    {codexBonus.hp > 0 && <span className="bg-[#4a148c33] px-1 rounded">체+{codexBonus.hp}</span>}
                    {codexBonus.critRate > 0 && <span className="bg-[#4a148c33] px-1 rounded text-[#ffd54f]">치명+{codexBonus.critRate}%</span>}
                    {codexBonus.dmgReduction > 0 && <span className="bg-[#4a148c33] px-1 rounded text-[#80deea]">경감+{codexBonus.dmgReduction}%</span>}
                    {codexBonus.atk === 0 && codexBonus.def === 0 && codexBonus.hp === 0 && (
                      <span className="text-[8px] text-[#8b9bb4]">도감 수집 시 영구 반영</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 🏆 아레나 결투 결과 & 등급별 장비 전리품 획득 모달                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {finalReward && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
              <div className="relative panel-accent w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-4 bg-[#0c1424] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col gap-3 text-center animate-scale-up custom-scrollbar">
                
                {/* 헤더 승패 배너 */}
                <div className={`py-2 px-3 rounded-xl border-2 ${finalReward.win ? 'bg-[#38ef7d18] border-[#38ef7d] text-[#38ef7d]' : 'bg-[#ef535018] border-[#ef5350] text-[#ef5350]'}`}>
                  <div className="text-xl font-bold font-cinzel tracking-wide">
                    {finalReward.win ? '🎉 VICTORY' : '💀 DEFEAT'}
                  </div>
                  <div className="text-xs font-mono text-white mt-0.5">
                    {finalReward.win ? '차원 결투 대승리!' : '차원 결투 패배...'}
                  </div>
                </div>

                {/* 결과 요약 스탯 카드 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">레이팅 변화</span>
                    <span className={`text-sm font-bold font-mono ${finalReward.ratingDelta > 0 ? 'text-[#38ef7d]' : 'text-[#ef5350]'}`}>
                      {finalReward.ratingDelta > 0 ? `+${finalReward.ratingDelta}` : finalReward.ratingDelta} P
                    </span>
                  </div>
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">투사의 인장</span>
                    <span className="text-sm font-bold font-mono text-[#ffd54f]">
                      +{finalReward.coins} 🪙
                    </span>
                  </div>
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">연승 기록</span>
                    <span className="text-sm font-bold font-mono text-[#ff416c]">
                      {finalReward.streak}연승 🔥
                    </span>
                  </div>
                </div>

                {/* 📊 전투 상세 리포트 (MVP 배지, 딜량 점유율, 회복/방어/회피/연계) */}
                <div className="text-left">
                  <CombatMeterTable metrics={combatMetrics} title="⚔️ 3v3 아레나 전투 리포트" />
                </div>

                {/* 🎖️ 명예 암시장 안내 카드 (인장 모아서 장비 교환) */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#121b2d] to-[#172238] border border-[#26385a] flex items-center justify-between text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">🎖️</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        '명예 암시장 오픈'
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] truncate">
                        '획득한 인장으로 등급별 장비함 및 무구를 구매하세요'
                      </div>
                    </div>
                  </div>
                  <button
                    className="px-2.5 py-1.5 rounded-lg bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff66] text-xs font-bold hover:bg-[#00d2ff44] transition-all shrink-0 ml-2"
                    onClick={() => {
                      setActiveBattleOpp(null);
                      setFinalReward(null);
                      gm.emit('arenaBattleStateChanged', false);
                      gm.emit('phaserSceneChange', 'arena');
                      setTab('shop');
                    }}
                  >
                    '상점 이동 ➔'
                  </button>
                </div>

                {/* 레벨업 알림 */}
                {finalReward.levelUps && finalReward.levelUps.length > 0 && (
                  <div className="p-2 rounded-lg bg-[#38ef7d15] border border-[#38ef7d44] text-[11px] text-[#38ef7d] font-bold">
                    🎉 영웅 레벨업 달성: {finalReward.levelUps.join(', ')}
                  </div>
                )}

                {/* 확인 및 닫기 버튼 */}
                <ActionButton
                  label="🏆 결투 결과 확인 (아레나 로비 복귀)"
                  variant="primary"
                  className="w-full py-2.5 font-bold shadow-lg shadow-[#42321955]"
                  onClick={() => {
                    setActiveBattleOpp(null);
                    setFinalReward(null);
                    gm.emit('arenaBattleStateChanged', false);
                    gm.emit('phaserSceneChange', 'arena');
                  }}
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
